import { useEffect, useState } from "react";
import {
    Container, Typography, Box, CircularProgress, Alert, Avatar,
    Button, Paper, List, ListItem, ListItemText, Divider,
    Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AddIcon from '@mui/icons-material/Add';
import { APPS_SCRIPTS_URL } from "./config/config";
import { useAuth } from "./AuthContext";

export default function Dashboard() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

    const [celebrazioni, setCelebrazioni] = useState([]);
    const [loadingSheets, setLoadingSheets] = useState(false);
    const [sheetsError, setSheetsError] = useState("");

    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [creating, setCreating] = useState(false);

    // --- DUE STATI SEPARATI PER NOME E ORARIO ---
    const [newCelName, setNewCelName] = useState("");
    const [newCelTime, setNewCelTime] = useState("");

    useEffect(() => {
        if (!user) {
            navigate("/admin/login");
        }
    }, [user, navigate]);

    useEffect(() => {
        if (user && token) {
            setLoadingSheets(true);
            setSheetsError("");

            fetch(APPS_SCRIPTS_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "getSheets", token: token })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.error) {
                        setSheetsError(data.error);
                        if (data.error.includes("scaduto") || data.error.includes("Non autorizzato")) logout();
                    } else if (data.sheets) {
                        // Il backend ora restituirà una lista di oggetti con { idFoglio, nomeEsteso }
                        // Adatteremo il map qui sotto per gestire questa nuova struttura
                        setCelebrazioni(data.sheets);
                    }
                })
                .catch(() => setSheetsError("Errore nel recupero delle celebrazioni. Riprova."))
                .finally(() => setLoadingSheets(false));
        }
    }, [user, token, logout]);

    const handleCreateCelebrazione = async () => {
        const nomePulito = newCelName.trim();
        const orarioPulito = newCelTime.trim();

        if (!nomePulito) return;

        // Componiamo la stringa estesa che mostreremo all'utente (es. "Domenica, 10.30")
        let nomeEsteso = nomePulito;
        if (orarioPulito) {
            nomeEsteso = `${nomePulito}, ${orarioPulito}`;
        }

        setCreating(true);
        setSheetsError("");

        try {
            const res = await fetch(APPS_SCRIPTS_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    action: "addSheet",
                    sheetName: nomeEsteso, // Passiamo il nome esteso al backend
                    token: token
                })
            });
            const data = await res.json();

            if (data.error) {
                setSheetsError(data.error);
                if (data.error.includes("scaduto") || data.error.includes("Non autorizzato")) logout();
            } else {
                setOpenAddDialog(false);
                setNewCelName("");
                setNewCelTime("");
                // Navighiamo all'ID del foglio che il backend ci ha appena restituito
                navigate(`/admin/edit/${data.sheetId}`);
            }
        } catch (err) {
            setSheetsError("Errore durante la creazione. Riprova.");
        } finally {
            setCreating(false);
        }
    };

    if (!user) return null;

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
                    <Button variant="outlined" color="error" size="small" onClick={logout} sx={{ textTransform: 'none', borderRadius: 2 }}>Esci</Button>
                </Paper>

                <Typography variant="h5" sx={{ mb: 1, fontWeight: "800", color: 'primary.main' }}>
                    Dashboard Celebrazioni
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Seleziona una celebrazione per modificare i canti, oppure creane una nuova.
                </Typography>

                {sheetsError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{sheetsError}</Alert>}

                {loadingSheets ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <Paper elevation={1} sx={{ borderRadius: 3, overflow: 'hidden', mb: 3, bgcolor: 'white' }}>
                            {celebrazioni.length === 0 ? (
                                <Typography align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                    Nessuna celebrazione trovata.
                                </Typography>
                            ) : (
                                <List disablePadding>
                                    {/* Aggiornato per leggere la nuova struttura dati (id e nome) */}
                                    {celebrazioni.map((cel, index) => (
                                        <div key={index}>
                                            <ListItem sx={{ py: 2, display: 'flex', justifyContent: 'space-between' }}>
                                                {/* Mostriamo il nome bello, ma navighiamo all'ID compatto */}
                                                <ListItemText primary={cel.nomeEsteso} primaryTypographyProps={{ fontWeight: '500', fontSize: '1.1rem' }} />
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    disableElevation
                                                    onClick={() => navigate(`/admin/edit/${cel.idFoglio}`)}
                                                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold' }}
                                                >
                                                    Modifica
                                                </Button>
                                            </ListItem>
                                            {index < celebrazioni.length - 1 && <Divider />}
                                        </div>
                                    ))}
                                </List>
                            )}
                        </Paper>

                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenAddDialog(true)}
                            fullWidth
                            sx={{ py: 1.5, borderStyle: 'dashed', borderWidth: 2, borderRadius: 3, fontWeight: 'bold' }}
                        >
                            Nuova Celebrazione
                        </Button>
                    </>
                )}

                <Dialog open={openAddDialog} onClose={() => !creating && setOpenAddDialog(false)} PaperProps={{ sx: { borderRadius: 3, minWidth: { xs: '90%', sm: 400 } } }}>
                    <DialogTitle sx={{ fontWeight: 'bold' }}>Nuova Celebrazione</DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ mb: 2 }}>
                            Inserisci i dettagli. L'orario è opzionale.
                        </DialogContentText>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <TextField
                                autoFocus
                                fullWidth
                                variant="outlined"
                                label="Nome (es. Domenica, Natale, Pasqua)"
                                value={newCelName}
                                onChange={(e) => setNewCelName(e.target.value)}
                                disabled={creating}
                            />
                            <TextField
                                fullWidth
                                variant="outlined"
                                label="Orario (es. 10.30)"
                                value={newCelTime}
                                onChange={(e) => setNewCelTime(e.target.value)}
                                disabled={creating}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newCelName.trim()) {
                                        handleCreateCelebrazione();
                                    }
                                }}
                            />
                        </Box>

                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setOpenAddDialog(false)} color="inherit" disabled={creating} sx={{ textTransform: 'none', fontWeight: 'bold' }}>
                            Annulla
                        </Button>
                        <Button onClick={handleCreateCelebrazione} color="primary" variant="contained" disabled={creating || !newCelName.trim()} disableElevation sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold' }}>
                            {creating ? "Creazione..." : "Crea e Modifica"}
                        </Button>
                    </DialogActions>
                </Dialog>

            </Container>
        </Box>
    );
}