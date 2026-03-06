import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { APPS_SCRIPTS_URL, GOOGLE_CLIENT_ID } from "./config/config";
import {
    Container,
    Typography,
    Box,
    CircularProgress,
    TextField,
    Button,
    Alert,
} from "@mui/material";

export default function AdminCanti() {
    const { nomeCelebrazione } = useParams();
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [canti, setCanti] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // --- Login Google ---
    useEffect(() => {
        if (window.google && !user) {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse,
            });

            window.google.accounts.id.renderButton(
                document.getElementById("g_id_signin"),
                { theme: "outline", size: "large", width: "100%" }
            );

            window.google.accounts.id.prompt();
        }
    }, [user]);

    // --- Login Google ---
    const handleCredentialResponse = (response) => {
        // Salviamo il Token intero (la stringa criptata)
        setToken(response.credential);

        // (Opzionale) Decodifichiamo comunque per mostrare il nome/email nell'interfaccia React
        try {
            const base64Url = response.credential.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const payload = JSON.parse(
                decodeURIComponent(
                    atob(base64)
                        .split("")
                        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                        .join("")
                )
            );
            setUser(payload);
        } catch (err) {
            console.error("Errore decoding JWT", err);
        }
    };

    // --- Fetch dei canti ---
    useEffect(() => {
        // Ora blocchiamo la fetch se manca il token
        if (!token) return;
        setLoading(true);
        setError("");

        // Inviamo il TOKEN invece dell'email
        fetch(`${APPS_SCRIPTS_URL}?action=get&sheet=${nomeCelebrazione}&token=${encodeURIComponent(token)}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.error) setError(data.error);
                else {
                    const categorie = data.values[0] || [];
                    const numeri = data.values[1] || [];
                    setCanti(
                        categorie.map((cat, idx) => ({
                            categoria: cat,
                            numero: numeri[idx] || "",
                        }))
                    );
                }
            })
            .catch(() => setError("Errore nel caricamento dei canti"))
            .finally(() => setLoading(false));
    }, [token, nomeCelebrazione]);

    // --- Modifica singolo canto ---

    const handleChange = (index, field, value) => {

        const updated = [...canti];

        updated[index][field] = value;

        setCanti(updated);

    };

    // --- Salvataggio ---
    const handleSave = async () => {
        setSaving(true);
        setError("");
        try {
            const res = await fetch(APPS_SCRIPTS_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" }, // Manteniamo il text/plain per il CORS
                body: JSON.stringify({
                    action: "update",
                    sheet: nomeCelebrazione,
                    token: token, // Passiamo il TOKEN qui!
                    values: canti,
                }),
            });
            const data = await res.json();
            if (data.error) setError(data.error);
            else alert("Modifiche salvate correttamente!");
        } catch (err) {
            setError("Errore nel salvataggio");
        } finally {
            setSaving(false);
        }
    };

    // --- Rendering ---
    if (!user) {
        return (
            <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 6 } }}>
                <Typography
                    variant="h5"
                    align="center"
                    sx={{ mb: 4, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
                >
                    Effettua il login con Google per modificare i canti
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <div id="g_id_signin"></div>
                </Box>
            </Container>
        );
    }

    if (loading) {
        return (
            <Container maxWidth="sm" sx={{ py: 8, display: "flex", justifyContent: "center" }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 5 } }}>
            <Typography
                variant="h4"
                sx={{
                    mb: { xs: 3, sm: 4 },
                    fontSize: { xs: "1.75rem", sm: "2.125rem" },
                    textAlign: { xs: "center", sm: "left" },
                    fontWeight: "bold"
                }}
            >
                Modifica Canti: {nomeCelebrazione}
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2.5, sm: 2 } }}>
                {canti.map((canto, idx) => (
                    <Box
                        key={idx}
                        sx={{
                            display: "flex",
                            gap: { xs: 1.5, sm: 2 },
                            alignItems: "center"
                        }}
                    >
                        <TextField
                            label="Categoria"
                            value={canto.categoria}
                            onChange={(e) => handleChange(idx, "categoria", e.target.value)}
                            // Usa flexGrow per farle prendere tutto lo spazio residuo
                            sx={{ flexGrow: 1 }}
                            size={window.innerWidth < 600 ? "small" : "medium"}
                        />
                        <TextField
                            label="Numero"
                            value={canto.numero}
                            type="number"
                            // Leggermente più stretto su mobile, non si schiaccia grazie a flexShrink
                            sx={{ width: { xs: 75, sm: 100 }, flexShrink: 0 }}
                            onChange={(e) => handleChange(idx, "numero", e.target.value)}
                            size={window.innerWidth < 600 ? "small" : "medium"}
                        />
                    </Box>
                ))}
            </Box>

            <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={saving}
                // Fondamentale su mobile: pulsante a tutta larghezza e più alto per il dito
                fullWidth={true}
                sx={{
                    mt: { xs: 4, sm: 4 },
                    py: { xs: 1.5, sm: 1 },
                    fontSize: { xs: "1.1rem", sm: "1rem" },
                    borderRadius: 2
                }}
            >
                {saving ? "Salvando..." : "Salva modifiche"}
            </Button>
        </Container>
    );
}