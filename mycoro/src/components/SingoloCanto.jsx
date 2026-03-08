import { useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CantiContext } from "./CantiContext";
import { ZoomContext } from "./ZoomContext"; // Importiamo il contesto dello zoom

import GoogleDocFormattedReader from "./GoogleDocFormattedReader";
import { DOCS_DRIVE_KEY } from "./config/config";

import {
    Container, Typography, Card, CardContent, CircularProgress,
    Box, IconButton, Divider, Button
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const cleanTitle = (rawName) => {
    if (!rawName) return "";
    return rawName
        .replace(/\.[^/.]+$/, "")
        .replace(/^\d+[\s\-_]*/, "")
        .trim();
};

export default function SingoloCanto() {
    const { numero } = useParams();

    // 1. Prendi il fontSize dal contesto globale (gestito dall'header)
    const { fontSize } = useContext(ZoomContext);

    const { cantiMap, numeriOrdinati, loading } = useContext(CantiContext);
    const navigate = useNavigate();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f8f5ec">
                <CircularProgress />
            </Box>
        );
    }

    const numeroInt = parseInt(numero, 10);
    const canto = cantiMap[numeroInt];

    if (!canto) {
        return (
            <Container sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontFamily: "Georgia, serif", mb: 2 }}>
                    Canto non trovato
                </Typography>
                <Button variant="outlined" onClick={() => navigate("/canti/elenco")}>
                    Torna all'indice
                </Button>
            </Container>
        );
    }

    const index = numeriOrdinati.indexOf(numeroInt);
    const prev = index > 0 ? numeriOrdinati[index - 1] : null;
    const next = index >= 0 && index < numeriOrdinati.length - 1 ? numeriOrdinati[index + 1] : null;

    const nomeGrezzo = canto.titolo || canto.name || canto.nome || "";
    const titoloPulito = cleanTitle(nomeGrezzo) || `Canto ${numeroInt}`;

    return (
        <Box sx={{ position: "relative", minHeight: "100vh", backgroundColor: "#f8f5ec", pb: 10 }}>

            {/* 2. L'HEADER FISSO È STATO RIMOSSO: ora i tasti sono nell'AppBar globale del Layout */}

            <Container maxWidth="md" sx={{ py: 4 }}>
                <Typography
                    variant="h5"
                    align="center"
                    sx={{ fontFamily: "Georgia, serif", fontWeight: 600, mb: 1, color: "#333" }}
                >
                    {titoloPulito}
                </Typography>
                <Typography align="center" color="text.secondary" sx={{ mb: 2, fontFamily: "Georgia, serif" }}>
                    Canto N° {numeroInt}
                </Typography>

                <Divider sx={{ mb: 4, width: "60%", margin: "0 auto 30px auto" }} />

                <Card
                    elevation={0}
                    sx={{
                        borderRadius: 4,
                        backgroundColor: "#fffdf7",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                        mb: 4
                    }}
                >
                    <CardContent>
                        <Box
                            className="liturgical-content"
                            sx={{
                                fontFamily: "Georgia, serif",
                                // 3. Applichiamo il fontSize che arriva dal Context
                                fontSize: `${fontSize}px`,
                                lineHeight: 1.9,
                                letterSpacing: "0.3px"
                            }}
                        >
                            <GoogleDocFormattedReader
                                fileId={canto.id}
                                apiKey={DOCS_DRIVE_KEY}
                            />
                        </Box>
                    </CardContent>
                </Card>

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {prev ? (
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate(`/canti/${prev}`)}
                            sx={{ textTransform: 'none', borderRadius: 3, borderColor: '#ccc', color: '#555' }}
                        >
                            N° {prev}
                        </Button>
                    ) : <Box />}

                    {next && (
                        <Button
                            variant="outlined"
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => navigate(`/canti/${next}`)}
                            sx={{ textTransform: 'none', borderRadius: 3, borderColor: '#ccc', color: '#555' }}
                        >
                            N° {next}
                        </Button>
                    )}
                </Box>
            </Container>

            <Box sx={{ position: "fixed", bottom: 16, right: 16, zIndex: 1000 }}>
                <IconButton
                    sx={{
                        backgroundColor: "#25D366", color: "white",
                        boxShadow: 3, width: 56, height: 56,
                        '&:hover': { backgroundColor: "#128C7E" }
                    }}
                    onClick={() => {
                        const message = `Guarda il canto *${titoloPulito}*\n\n${window.location.href}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
                    }}
                >
                    <WhatsAppIcon fontSize="large" />
                </IconButton>
            </Box>
        </Box>
    );
}