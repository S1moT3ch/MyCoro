import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { CantiContext } from "./CantiContext";
import { ZoomContext } from "./ZoomContext"; // Importa lo ZoomContext
import GoogleDocFormattedReader from "./GoogleDocFormattedReader";
import { DOCS_DRIVE_KEY, GOOGLE_SHEETS_KEY, SHEETS_ID } from "./config/config";

import {
    Container,
    Typography,
    Card,
    CardContent,
    CircularProgress,
    Box,
    Divider,
    IconButton,
} from "@mui/material";

import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const API_KEY = DOCS_DRIVE_KEY;

const processSheetData = (data) => {
    if (!data.values || data.values.length < 2) return { numeri: [], celebrazione: "" };

    const categorieRow = data.values[0];
    const numeriRow = data.values[1];
    const celebrazione = data.values[3]?.[0] || "";

    let lastCategory = "";
    const numeri = numeriRow.map((numeroStr, idx) => {
        const categoryCell = categorieRow[idx]?.trim();
        if (categoryCell) lastCategory = categoryCell;
        return {
            numero: parseInt(numeroStr, 10),
            category: lastCategory
        };
    });

    return { numeri, celebrazione };
};

export default function ListaCanti() {
    const { cantiMap, loading } = useContext(CantiContext);
    const { fontSize } = useContext(ZoomContext); // Usa il fontSize globale

    const [numeriRichiesti, setNumeriRichiesti] = useState([]);
    const [loadingSheet, setLoadingSheet] = useState(true);
    const [celebrazione, setCelebrazione] = useState("");
    const { nomeCelebrazione } = useParams();

    useEffect(() => {
        async function caricaNumeri() {
            try {
                const res = await fetch(
                    `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_ID}/values/${nomeCelebrazione}?key=${GOOGLE_SHEETS_KEY}`
                );
                const data = await res.json();
                const { numeri, celebrazione } = processSheetData(data);
                setNumeriRichiesti(numeri);
                setCelebrazione(celebrazione);
            } catch (err) {
                console.error("Errore caricamento sheet", err);
            } finally {
                setLoadingSheet(false);
            }
        }

        caricaNumeri();
    }, [nomeCelebrazione]);

    if (loading || loadingSheet)
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );

    return (
        <Box sx={{ position: "relative", minHeight: "100vh", backgroundColor: "#f8f5ec", pb: 10 }}>

            {/* L'HEADER FISSO È STATO RIMOSSO: i tasti zoom sono ora nell'AppBar globale gestita dal Layout */}

            <Container maxWidth="md" sx={{ py: 4 }}>
                {celebrazione && (
                    <Typography
                        variant="h4"
                        align="center"
                        sx={{
                            fontFamily: "Georgia, serif",
                            fontWeight: 600,
                            mb: 1,
                            color: "#333",
                            fontSize: { xs: '1.8rem', sm: '2.2rem' }
                        }}
                    >
                        {celebrazione}
                    </Typography>
                )}

                <Typography align="center" color="text.secondary" sx={{ mb: 3, fontFamily: "Georgia, serif", fontStyle: 'italic' }}>
                    Programma della celebrazione
                </Typography>

                <Divider sx={{ mb: 5, width: "40%", margin: "0 auto 40px auto" }} />

                {numeriRichiesti.map(({ numero, category }, index) => {
                    const canto = cantiMap[numero];
                    if (!canto) return null;

                    return (
                        <Box key={`${numero}-${index}`} sx={{ mb: 6 }}>
                            {/* Categoria come titolo di sezione */}
                            <Typography
                                variant="overline"
                                sx={{
                                    display: 'block',
                                    textAlign: 'center',
                                    fontWeight: 700,
                                    letterSpacing: 2,
                                    color: "#0D47A1", // Blu Mariano coerente con l'Header
                                    mb: 1
                                }}
                            >
                                {category}
                            </Typography>

                            <Card
                                elevation={0}
                                sx={{
                                    borderRadius: 4,
                                    backgroundColor: "#fffdf7",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                    border: '1px solid #eee'
                                }}
                            >
                                <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                                    <Box
                                        className="liturgical-content"
                                        sx={{
                                            fontFamily: "Georgia, serif",
                                            fontSize: `${fontSize}px`, // FontSize dinamico dal Context
                                            lineHeight: 1.9,
                                            letterSpacing: "0.3px"
                                        }}
                                    >
                                        <GoogleDocFormattedReader
                                            fileId={canto.id}
                                            apiKey={API_KEY}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Box>
                    );
                })}
            </Container>

            {/* PULSANTE WHATSAPP FISSO (Floating Action Button style) */}
            <Box sx={{ position: "fixed", bottom: 20, right: 20, zIndex: 1000 }}>
                <IconButton
                    sx={{
                        backgroundColor: "#25D366",
                        color: "white",
                        width: 56,
                        height: 56,
                        boxShadow: 3,
                        '&:hover': { backgroundColor: "#128C7E" }
                    }}
                    onClick={() => {
                        const message = `Scaletta per la celebrazione: *${celebrazione}*\n\n${window.location.href}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
                    }}
                >
                    <WhatsAppIcon fontSize="large" />
                </IconButton>
            </Box>
        </Box>
    );
}