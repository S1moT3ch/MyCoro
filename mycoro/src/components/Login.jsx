import { useEffect } from "react";
import { Container, Typography, Box, CircularProgress, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom"; // <-- Importiamo navigate
import { GOOGLE_CLIENT_ID } from "./config/config";
import { useAuth } from "./AuthContext";

export default function Login() {
    const { user, login, loadingAuth, authError } = useAuth();
    const navigate = useNavigate();

    // --- REINDIRIZZAMENTO AUTOMATICO ---
    // Se l'utente risulta loggato, lo mandiamo subito alla dashboard
    useEffect(() => {
        if (user) {
            navigate("/admin/edit");
        }
    }, [user, navigate]);

    // --- Inizializzazione Google Login ---
    useEffect(() => {
        if (window.google && !loadingAuth && !user) {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: (response) => login(response.credential),
            });

            window.google.accounts.id.renderButton(
                document.getElementById("g_id_signin"),
                { theme: "outline", size: "large", width: "100%" }
            );
        }
    }, [login, loadingAuth, user]);

    // Se stiamo già reindirizzando, evitiamo di far "sfarfallare" la UI
    if (user) return null;

    return (
        <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 6 } }}>
            <Typography variant="h5" align="center" sx={{ mb: 4, fontSize: { xs: "1.25rem", sm: "1.5rem" }, fontWeight: 'bold' }}>
                Area Riservata
            </Typography>

            {authError && <Alert severity="error" sx={{ mb: 3 }}>{authError}</Alert>}

            <Box sx={{ display: loadingAuth ? "none" : "flex", justifyContent: "center" }}>
                <div id="g_id_signin"></div>
            </Box>

            {loadingAuth && (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, mt: 2 }}>
                    <CircularProgress />
                    <Typography variant="body2" color="text.secondary">
                        Verifica autorizzazioni in corso...
                    </Typography>
                </Box>
            )}
        </Container>
    );
}