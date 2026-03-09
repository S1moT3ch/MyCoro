import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { APPS_SCRIPTS_URL } from "./config/config";
import {
    Container, Typography, Box, CircularProgress, TextField,
    Button, Alert, Avatar, IconButton, Paper,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Tooltip,
    Snackbar, List
} from "@mui/material";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import { useContext } from "react";
import { CantiContext } from "./CantiContext";
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import SearchIcon from '@mui/icons-material/Search';
import {
    ListItem, ListItemButton, ListItemText
} from "@mui/material";

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SaveIcon from '@mui/icons-material/Save';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
// Icone Condivisione
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

import Login from "./Login";
import { useAuth } from "./AuthContext";

const generateId = () => `canto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function AdminCanti() {
    const { nomeCelebrazione } = useParams();
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

    const [canti, setCanti] = useState([]);
    const [intestazione, setIntestazione] = useState("");
    const [loadingData, setLoadingData] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [cantoToDelete, setCantoToDelete] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const [openDeleteSheetDialog, setOpenDeleteSheetDialog] = useState(false);
    const [deletingSheet, setDeletingSheet] = useState(false);

    // --- NUOVO STATO: Controllo per il pop-up di condivisione post-salvataggio ---
    const [openShareDialog, setOpenShareDialog] = useState(false);
    const [copied, setCopied] = useState(false);

    const publicLink = `${window.location.origin}/celebrazioni/${nomeCelebrazione}`;

    const { cantiMap } = useContext(CantiContext); // Recupera i canti globali
    const [openPicker, setOpenPicker] = useState(false);
    const [activeCantoIndex, setActiveCantoIndex] = useState(null);
    const [pickerSearch, setPickerSearch] = useState("");

    const handleCopyLink = () => {
        navigator.clipboard.writeText(publicLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsAppShare = () => {
        const text = `Ecco i canti per ${intestazione || nomeCelebrazione}:\n${publicLink}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const syncData = useCallback(() => {
        if (!user || !token) return;

        setLoadingData(true);
        setError("");

        fetch(APPS_SCRIPTS_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "get", sheet: nomeCelebrazione, token: token })
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    setError(data.error);
                    if (data.error.includes("scaduto") || data.error.includes("Non autorizzato")) logout();
                } else {
                    const categorie = data.values[0] || [];
                    const numeri = data.values[1] || [];

                    const rigaDettagli = data.values[3] || [];
                    let nomeOrario = rigaDettagli[0] || nomeCelebrazione;
                    nomeOrario = nomeOrario.toString().replace("-", ", ");
                    setIntestazione(nomeOrario);

                    setCanti(categorie.map((cat, idx) => ({
                        id: generateId(),
                        categoria: cat,
                        numero: numeri[idx] || "",
                        isNew: false
                    })));

                    setHasUnsavedChanges(false);
                }
            })
            .catch(() => setError("Errore nel caricamento dei canti"))
            .finally(() => setLoadingData(false));
    }, [user, token, nomeCelebrazione, logout]);

    useEffect(() => {
        syncData();
    }, [syncData]);

    const handleChange = (index, field, value) => {
        const updated = [...canti];
        updated[index][field] = value;
        setCanti(updated);
        setHasUnsavedChanges(true);
    };

    const addCanto = () => {
        setCanti([...canti, { id: generateId(), categoria: "", numero: "", isNew: true }]);
        setHasUnsavedChanges(true);
    };

    const addCantoSotto = (index) => {
        const updated = [...canti];
        updated.splice(index + 1, 0, { id: generateId(), categoria: "", numero: "", isNew: false });
        setCanti(updated);
        setHasUnsavedChanges(true);
    };

    const handleDeleteClick = (index) => {
        setCantoToDelete(index);
        setOpenDeleteDialog(true);
    };

    const confirmDelete = () => {
        if (cantoToDelete !== null) {
            setCanti(canti.filter((_, i) => i !== cantoToDelete));
            setHasUnsavedChanges(true);
        }
        setOpenDeleteDialog(false);
        setCantoToDelete(null);
    };

    const cancelDelete = () => {
        setOpenDeleteDialog(false);
        setCantoToDelete(null);
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;
        if (result.destination.index === result.source.index) return;

        const items = Array.from(canti);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setCanti(items);
        setHasUnsavedChanges(true);
    };

    const handleLogoutClick = () => {
        if (hasUnsavedChanges) {
            const confermi = window.confirm("Hai delle modifiche non salvate. Vuoi uscire comunque perdendo i dati?");
            if (!confermi) return;
        }
        logout();
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");

        let lastCategoria = "";
        const cleanedValues = canti.map(c => {
            let catToSave = c.categoria.trim();
            if (catToSave !== "" && catToSave.toLowerCase() === lastCategoria.toLowerCase()) {
                catToSave = "";
            } else if (catToSave !== "") {
                lastCategoria = catToSave;
            }
            return { categoria: catToSave, numero: c.numero };
        });

        try {
            const res = await fetch(APPS_SCRIPTS_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    action: "update",
                    sheet: nomeCelebrazione,
                    token: token,
                    values: cleanedValues
                }),
            });
            const data = await res.json();

            if (data.error) {
                if (data.error.includes("scaduto") || data.error.includes("Non autorizzato")) {
                    logout();
                    setError("Sessione scaduta. Riprova.");
                } else setError(data.error);
                setSaving(false);
            } else {
                // MODIFICA QUI: Invece dell'alert, impostiamo gli stati per il successo!
                setHasUnsavedChanges(false);
                syncData();
                setSaving(false);
                setOpenShareDialog(true); // <-- Apre il nuovo pop-up di condivisione
            }
        } catch (err) {
            setError("Errore nel salvataggio");
            setSaving(false);
        }
    };

    const handleDeleteSheet = async () => {
        setDeletingSheet(true);
        setError("");

        try {
            const res = await fetch(APPS_SCRIPTS_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    action: "deleteSheet",
                    sheet: nomeCelebrazione,
                    token: token
                }),
            });
            const data = await res.json();

            if (data.error) {
                if (data.error.includes("scaduto") || data.error.includes("Non autorizzato")) {
                    logout();
                    setError("Sessione scaduta. Riprova.");
                } else setError(data.error);
                setDeletingSheet(false);
                setOpenDeleteSheetDialog(false);
            } else {
                setHasUnsavedChanges(false);
                navigate("/admin/edit");
            }
        } catch (err) {
            setError("Errore durante l'eliminazione della celebrazione");
            setDeletingSheet(false);
            setOpenDeleteSheetDialog(false);
        }
    };

    const handleOpenPicker = (index) => {
        setActiveCantoIndex(index);
        setOpenPicker(true);
        setPickerSearch(""); // Reset ricerca ogni volta che si apre
    };

    const handleSelectFromPicker = (numero) => {
        if (activeCantoIndex !== null) {
            handleChange(activeCantoIndex, "numero", numero);
        }
        setOpenPicker(false);
    };

// Filtro per la ricerca nel picker (Titolo o Numero)
    const filteredPickerCanti = Object.values(cantiMap || {})
        .filter(c => {
            const term = pickerSearch.toLowerCase();
            const titolo = (c.titolo || c.name || "").toLowerCase();
            return titolo.includes(term) || String(c.numero).includes(term);
        })
        .sort((a, b) => parseInt(a.numero) - parseInt(b.numero));

    if (!user) return <Login />;

    if (loadingData) {
        return (
            <Container maxWidth="sm" sx={{ py: 8, display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <CircularProgress size={60} thickness={4} />
            </Container>
        );
    }

    const cantoInCancellazione = cantoToDelete !== null ? canti[cantoToDelete] : null;

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa', pb: 8 }}>
            <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 5 } }}>

                <Paper elevation={1} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, p: 2, borderRadius: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={user.picture} alt={user.name} sx={{ width: 48, height: 48, boxShadow: 1 }} />
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>{user.name}</Typography>
                            <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                        </Box>
                    </Box>
                    <Box>
                        <Button variant="text" color="primary" size="small" onClick={() => navigate("/admin/edit")} sx={{ textTransform: 'none', mr: 1 }}>
                            Indietro
                        </Button>
                        <Button variant="outlined" color="error" size="small" onClick={handleLogoutClick} sx={{ textTransform: 'none', borderRadius: 2 }}>
                            Esci
                        </Button>
                    </Box>
                </Paper>

                <Typography variant="h5" sx={{ mb: 1, fontWeight: "800", color: 'primary.main', textAlign: { xs: "center", sm: "left" } }}>
                    {intestazione ? `Canti per ${intestazione}` : `Modifica: ${nomeCelebrazione}`}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: { xs: "center", sm: "left" } }}>
                    Tieni premuta l'icona a sinistra per riordinare i canti.
                </Typography>

                {/* Ho mantenuto anche la scheda inline in caso l'utente chiuda il popup ma voglia comunque copiare il link dopo */}
                {!hasUnsavedChanges && (
                    <Paper elevation={1} sx={{ p: 2, mb: 4, borderRadius: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 2, bgcolor: 'white' }}>
                        <Box sx={{ flexGrow: 1, width: '100%' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Link Pubblico Condivisibile
                            </Typography>
                            <Typography variant="body2" sx={{ p: 1.5, bgcolor: '#f1f3f4', borderRadius: 2, wordBreak: 'break-all', fontFamily: 'monospace', color: 'text.primary' }}>
                                {publicLink}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                            <Tooltip title={copied ? "Copiato!" : "Copia Link"}>
                                <IconButton onClick={handleCopyLink} color={copied ? "success" : "primary"} sx={{ bgcolor: copied ? '#e8f5e9' : '#e3f2fd', '&:hover': { bgcolor: copied ? '#c8e6c9' : '#bbdefb' } }}>
                                    {copied ? <CheckIcon /> : <ContentCopyIcon />}
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Condividi su WhatsApp">
                                <IconButton onClick={handleWhatsAppShare} sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', '&:hover': { bgcolor: '#c8e6c9' } }}>
                                    <WhatsAppIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Paper>
                )}

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="lista-canti">
                        {(provided) => (
                            <Box {...provided.droppableProps} ref={provided.innerRef} sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 4 }}>
                                {canti.map((canto, idx) => {
                                    const isCategoriaPrincipale = canto.categoria || canto.isNew || idx === 0;

                                    return (
                                        <Draggable key={canto.id} draggableId={canto.id} index={idx}>
                                            {(provided, snapshot) => (
                                                <Paper
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    elevation={snapshot.isDragging ? 6 : 1}
                                                    sx={{
                                                        display: "flex", gap: { xs: 1, sm: 2 }, alignItems: "center", p: { xs: 1, sm: 1.5 },
                                                        borderRadius: 2, bgcolor: 'white',
                                                        mt: isCategoriaPrincipale && idx !== 0 ? 2 : 0,
                                                        ...provided.draggableProps.style
                                                    }}
                                                >
                                                    <Box
                                                        {...provided.dragHandleProps}
                                                        sx={{ display: 'flex', alignItems: 'center', color: 'text.disabled', cursor: 'grab', '&:active': { cursor: 'grabbing' }, px: 0.5 }}
                                                    >
                                                        <DragHandleIcon />
                                                    </Box>

                                                    <Box sx={{ display: 'flex', flexGrow: 1, gap: 1, alignItems: 'center' }}>
                                                        {isCategoriaPrincipale ? (
                                                            <TextField
                                                                label="Canto per" variant="outlined" value={canto.categoria}
                                                                onChange={(e) => handleChange(idx, "categoria", e.target.value)}
                                                                sx={{ flexGrow: 1, minWidth: 0 }} size="small"
                                                            />
                                                        ) : (
                                                            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', pl: 1 }}>
                                                                <Typography color="text.secondary" sx={{ opacity: 0.5 }}>↳</Typography>
                                                            </Box>
                                                        )}

                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <TextField
                                                                label="N°"
                                                                variant="outlined"
                                                                value={canto.numero}
                                                                type="number"
                                                                sx={{ width: { xs: 60, sm: 80 }, flexShrink: 0 }}
                                                                onChange={(e) => handleChange(idx, "numero", e.target.value)}
                                                                size="small"
                                                            />
                                                            <Tooltip title="Scegli dall'elenco">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleOpenPicker(idx)}
                                                                    sx={{ bgcolor: '#f5f5f5' }}
                                                                >
                                                                    <LibraryMusicIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    </Box>

                                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 0.5 }}>
                                                        <Tooltip title="Aggiungi numero sotto">
                                                            <IconButton color="primary" size="small" onClick={() => addCantoSotto(idx)}>
                                                                <AddCircleOutlineIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Elimina">
                                                            <IconButton color="error" size="small" onClick={() => handleDeleteClick(idx)}>
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </Paper>
                                            )}
                                        </Draggable>
                                    );
                                })}
                                {provided.placeholder}
                            </Box>
                        )}
                    </Droppable>
                </DragDropContext>

                <Button variant="outlined" startIcon={<AddIcon />} onClick={addCanto} fullWidth sx={{ mb: 4, py: 1.5, borderStyle: 'dashed', borderWidth: 2, borderRadius: 3, fontWeight: 'bold' }}>
                    Nuova Categoria
                </Button>

                <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving} fullWidth sx={{ py: 1.5, fontSize: "1.1rem", borderRadius: 3, fontWeight: 'bold', boxShadow: 3 }}>
                    {saving ? "Salvataggio in corso..." : "Salva Modifiche"}
                </Button>

                <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'center' }}>
                    <Button
                        variant="text"
                        color="error"
                        startIcon={<DeleteSweepIcon />}
                        onClick={() => setOpenDeleteSheetDialog(true)}
                        sx={{ textTransform: 'none' }}
                    >
                        Elimina questa celebrazione
                    </Button>
                </Box>

                {/* Dialog Eliminazione Singolo Canto */}
                <Dialog open={openDeleteDialog} onClose={cancelDelete} PaperProps={{ sx: { borderRadius: 3 } }}>
                    <DialogTitle sx={{ fontWeight: 'bold' }}>Eliminare il canto?</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Sei sicuro di voler rimuovere
                            {cantoInCancellazione?.categoria ? ` la categoria "${cantoInCancellazione.categoria}"` : " questo numero"}
                            {cantoInCancellazione?.numero ? ` (Canto N. ${cantoInCancellazione.numero})` : ""}?
                            <br/><br/>
                            Ricorda di cliccare "Salva Modifiche" per applicare la cancellazione.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={cancelDelete} color="inherit" sx={{ textTransform: 'none', fontWeight: 'bold' }}>Annulla</Button>
                        <Button onClick={confirmDelete} color="error" variant="contained" disableElevation sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold' }}>Elimina</Button>
                    </DialogActions>
                </Dialog>

                {/* Dialog Eliminazione Intera Celebrazione */}
                <Dialog open={openDeleteSheetDialog} onClose={() => !deletingSheet && setOpenDeleteSheetDialog(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
                    <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>Attenzione: Azione irreversibile</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Sei sicuro di voler eliminare l'intera celebrazione <b>"{intestazione || nomeCelebrazione}"</b>?<br/><br/>
                            La celebrazione verrà cancellata in modo definitivo e non potrà essere recuperata.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setOpenDeleteSheetDialog(false)} color="inherit" disabled={deletingSheet} sx={{ textTransform: 'none', fontWeight: 'bold' }}>
                            Annulla
                        </Button>
                        <Button onClick={handleDeleteSheet} color="error" variant="contained" disabled={deletingSheet} disableElevation sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold' }}>
                            {deletingSheet ? "Eliminazione..." : "Sì, elimina tutto"}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* --- NUOVO DIALOG: POP-UP CONDIVISIONE POST-SALVATAGGIO --- */}
                <Dialog open={openShareDialog} onClose={() => setOpenShareDialog(false)} PaperProps={{ sx: { borderRadius: 3, minWidth: { xs: '90%', sm: 400 } } }}>
                    <DialogTitle sx={{ fontWeight: 'bold', color: 'success.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckIcon /> Salvataggio Completato
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ mb: 2 }}>
                            I canti sono stati aggiornati. Vuoi condividere il link della celebrazione?
                        </DialogContentText>

                        <Box sx={{ p: 2, bgcolor: '#f1f3f4', borderRadius: 2, mb: 3 }}>
                            <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace', color: 'text.primary', textAlign: 'center' }}>
                                {publicLink}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center' }}>
                            <Button
                                variant={copied ? "contained" : "outlined"}
                                color={copied ? "success" : "primary"}
                                startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                                onClick={handleCopyLink}
                                sx={{ textTransform: 'none', borderRadius: 2, flexGrow: 1, py: 1 }}
                            >
                                {copied ? "Link Copiato" : "Copia Link"}
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<WhatsAppIcon />}
                                onClick={handleWhatsAppShare}
                                sx={{ textTransform: 'none', borderRadius: 2, flexGrow: 1, py: 1, bgcolor: '#25D366', '&:hover': { bgcolor: '#128C7E' }, color: 'white' }}
                            >
                                Invia su WhatsApp
                            </Button>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, pt: 0, justifyContent: 'center' }}>
                        <Button onClick={() => setOpenShareDialog(false)} color="inherit" sx={{ textTransform: 'none', fontWeight: 'bold' }}>
                            Chiudi
                        </Button>
                    </DialogActions>
                </Dialog>

                <Snackbar
                    open={hasUnsavedChanges}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert
                        severity="warning"
                        variant="filled"
                        sx={{ width: '100%', alignItems: 'center', borderRadius: 2, boxShadow: 3 }}
                        action={
                            <Button color="inherit" size="small" onClick={handleSave} disabled={saving} sx={{ fontWeight: 'bold' }}>
                                SALVA ORA
                            </Button>
                        }
                    >
                        Hai modifiche non salvate!
                    </Alert>
                </Snackbar>

                {/* --- DIALOG PICKER CANTO --- */}
                <Dialog
                    open={openPicker}
                    onClose={() => setOpenPicker(false)}
                    fullWidth
                    maxWidth="xs"
                    PaperProps={{ sx: { borderRadius: 3, height: '80vh' } }}
                >
                    <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>Seleziona un Canto</DialogTitle>
                    <Box sx={{ px: 3, pb: 2 }}>
                        <TextField
                            fullWidth
                            placeholder="Cerca per titolo o numero..."
                            variant="outlined"
                            size="small"
                            value={pickerSearch}
                            onChange={(e) => setPickerSearch(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <IconButton size="small" sx={{ mr: 1 }}><SearchIcon /></IconButton>
                                ),
                            }}
                        />
                    </Box>
                    <DialogContent dividers sx={{ p: 0 }}>
                        <List>
                            {filteredPickerCanti.map((canto) => (
                                <ListItem key={canto.id} disablePadding>
                                    <ListItemButton onClick={() => handleSelectFromPicker(canto.numero)}>
                                        <Avatar sx={{ bgcolor: '#f0f0f0', color: '#555', mr: 2, width: 35, height: 35, fontSize: '0.9rem', fontWeight: 'bold' }}>
                                            {canto.numero}
                                        </Avatar>
                                        <ListItemText
                                            primary={canto.titolo || canto.name}
                                            primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                            {filteredPickerCanti.length === 0 && (
                                <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                                    Nessun canto trovato
                                </Typography>
                            )}
                        </List>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenPicker(false)} color="inherit">Annulla</Button>
                    </DialogActions>
                </Dialog>

            </Container>
        </Box>
    );
}