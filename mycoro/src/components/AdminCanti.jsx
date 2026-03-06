import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { APPS_SCRIPTS_URL } from "./config/config";
import {
    Container, Typography, Box, CircularProgress, TextField,
    Button, Alert, Avatar, IconButton, Paper,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Tooltip,
    Snackbar
} from "@mui/material";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SaveIcon from '@mui/icons-material/Save';
import DragHandleIcon from '@mui/icons-material/DragHandle';

import Login from "./Login";
import { useAuth } from "./AuthContext";

const generateId = () => `canto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function AdminCanti() {
    const { nomeCelebrazione } = useParams();
    const { user, token, logout } = useAuth();

    const [canti, setCanti] = useState([]);
    const [intestazione, setIntestazione] = useState("");
    const [loadingData, setLoadingData] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [cantoToDelete, setCantoToDelete] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
                alert("Modifiche salvate con successo!");
                setHasUnsavedChanges(false);
                syncData();
                setSaving(false);
            }
        } catch (err) {
            setError("Errore nel salvataggio");
            setSaving(false);
        }
    };

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
                    <Button variant="outlined" color="error" size="small" onClick={handleLogoutClick} sx={{ textTransform: 'none', borderRadius: 2 }}>
                        Esci
                    </Button>
                </Paper>

                <Typography variant="h5" sx={{ mb: 1, fontWeight: "800", color: 'primary.main', textAlign: { xs: "center", sm: "left" } }}>
                    {intestazione ? `Canti per ${intestazione}` : `Modifica: ${nomeCelebrazione}`}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: { xs: "center", sm: "left" } }}>
                    Tieni premuta l'icona a sinistra per riordinare i canti.
                </Typography>

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
                                                        // RIMOSSO il margine sinistro, ora TUTTE le card sono allineate a sinistra in colonna perfetta
                                                        ...provided.draggableProps.style
                                                    }}
                                                >
                                                    <Box
                                                        {...provided.dragHandleProps}
                                                        sx={{ display: 'flex', alignItems: 'center', color: 'text.disabled', cursor: 'grab', '&:active': { cursor: 'grabbing' }, px: 0.5 }}
                                                    >
                                                        <DragHandleIcon />
                                                    </Box>

                                                    {/* Invece di avere i campi sciolti, li mettiamo in un Box che gestisce gli spazi */}
                                                    <Box sx={{ display: 'flex', flexGrow: 1, gap: 1, alignItems: 'center' }}>
                                                        {isCategoriaPrincipale ? (
                                                            <TextField
                                                                label="Categoria" variant="outlined" value={canto.categoria}
                                                                onChange={(e) => handleChange(idx, "categoria", e.target.value)}
                                                                sx={{ flexGrow: 1, minWidth: 0 }} size="small"
                                                            />
                                                        ) : (
                                                            // SPAZIATORE: Occupa lo stesso spazio del TextField "Categoria", mantenendo il campo "N°" perfettamente in colonna!
                                                            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', pl: 1 }}>
                                                                <Typography color="text.secondary" sx={{ opacity: 0.5 }}>↳</Typography>
                                                            </Box>
                                                        )}

                                                        <TextField
                                                            label="N°" variant="outlined" value={canto.numero} type="number"
                                                            sx={{ width: { xs: 60, sm: 80 }, flexShrink: 0 }}
                                                            onChange={(e) => handleChange(idx, "numero", e.target.value)} size="small"
                                                        />
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

            </Container>
        </Box>
    );
}