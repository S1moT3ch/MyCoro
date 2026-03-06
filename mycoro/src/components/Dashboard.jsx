import { useEffect, useState } from "react";
import { Container, Typography, Box, CircularProgress, Alert, Avatar, Button, Paper, List, ListItem, ListItemText, Divider } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { APPS_SCRIPTS_URL } from "./config/config";
import { useAuth } from "./AuthContext";

export default function Dashboard() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

    const [celebrazioni, setCelebrazioni] = useState([]);
    const [loadingSheets, setLoadingSheets] = useState(false);
    const [sheetsError, setSheetsError] = useState("");

    // --- PROTEZIONE DELLA ROTTA ---
    // Se non c'è un utente loggato, lo cacciamo e lo rimandiamo al login
    useEffect(() => {
        if (!user) {
            navigate("/"); // <-- Sostituisci "/" con la rotta esatta del tuo login se diversa
        }
    }, [user, navigate]);

    // --- Fetch dei Fogli ---
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
                        setCelebrazioni(data.sheets);
                    }
                })
                .catch(() => setSheetsError("Errore nel recupero delle celebrazioni. Riprova."))
                .finally(() => setLoadingSheets(false));
        }
    }, [user, token, logout]);

    // Se sta per essere reindirizzato via, fermiamo il render
    if (!user) return null;

    return (
        <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 6 } }}>
            {/* Header Profilo */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, p: 2, backgroundColor: 'rgba(0, 0, 0, 0.03)', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={user.picture} alt={user.name} sx={{ width: 48, height: 48 }} />
                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>{user.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                    </Box>
                </Box>
                <Button variant="outlined" color="error" size="small" onClick={logout} sx={{ textTransform: 'none' }}>Esci</Button>
            </Box>

            <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
                Seleziona una celebrazione
            </Typography>

            {sheetsError && <Alert severity="error" sx={{ mb: 3 }}>{sheetsError}</Alert>}

            {loadingSheets ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    {celebrazioni.length === 0 ? (
                        <Typography align="center" sx={{ py: 3, color: 'text.secondary' }}>
                            Nessuna celebrazione trovata nel documento.
                        </Typography>
                    ) : (
                        <List disablePadding>
                            {celebrazioni.map((nome, index) => (
                                <div key={index}>
                                    <ListItem sx={{ py: 2, display: 'flex', justifyContent: 'space-between' }}>
                                        <ListItemText primary={nome} primaryTypographyProps={{ fontWeight: '500', fontSize: '1.1rem' }} />
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => navigate(`/admin/edit/${nome}`)}
                                            sx={{ textTransform: 'none', borderRadius: 2 }}
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
            )}
        </Container>
    );
}