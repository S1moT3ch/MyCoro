import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { CantiContext } from "./CantiContext";
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
    Stack
} from "@mui/material";

import TextIncreaseIcon from "@mui/icons-material/TextIncrease";
import TextDecreaseIcon from "@mui/icons-material/TextDecrease";
//import ShareIcon from "@mui/icons-material/Share";
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const API_KEY = DOCS_DRIVE_KEY;

const processSheetData = (data) => {
    if (!data.values || data.values.length < 2) return { numeri: [], celebrazione: "" };

    const categorieRow = data.values[0];
    const numeriRow = data.values[1];

    // Nome celebrazione (assumendo riga 4, colonna 0)
    const celebrazione = data.values[3]?.[0] || "";

    let lastCategory = "";
    const numeri = numeriRow.map((numeroStr, idx) => {
        const categoryCell = categorieRow[idx]?.trim();
        if (categoryCell) lastCategory = categoryCell; // aggiorna categoria solo se non vuota
        return {
            numero: parseInt(numeroStr, 10),
            category: lastCategory
        };
    });

    return { numeri, celebrazione };
};

export default function ListaCanti() {
    const { cantiMap, loading } = useContext(CantiContext);

    const [numeriRichiesti, setNumeriRichiesti] = useState([]);
    const [loadingSheet, setLoadingSheet] = useState(true);

    const [fontSize, setFontSize] = useState(18);

    const [celebrazione, setCelebrazione] = useState("");
    const { nomeCelebrazione } = useParams()

    const increaseFont = () => setFontSize(prev => Math.min(prev + 2, 32));
    const decreaseFont = () => setFontSize(prev => Math.max(prev - 2, 14));

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
    }, []);

    if (loading || loadingSheet)
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="60vh"
            >
                <CircularProgress />
            </Box>
        );

    return (
        <Box sx={{ position: "relative" }}>
            {/* HEADER FISSO */}
            <Box
                sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 1000,
                    backgroundColor: "#fdf6e3",
                    py: 1,
                    px: 2,
                    borderBottom: "1px solid #ddd",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 1
                }}
            >
                <Typography variant="subtitle1" sx={{ fontFamily: "Georgia, serif" }}>
                    Dimensione testo:
                </Typography>
                <IconButton onClick={decreaseFont} size="small">
                    <TextDecreaseIcon />
                </IconButton>
                <IconButton onClick={increaseFont} size="small">
                    <TextIncreaseIcon />
                </IconButton>
            </Box>

            {/* CONTENUTO SCORRIBILE */}
            <Container
                maxWidth="md"
                sx={{
                    py: 4,
                    backgroundColor: "#f8f5ec",
                    minHeight: "100vh"
                }}
            >
                {celebrazione && (
                    <Typography
                        variant="h5"
                        align="center"
                        sx={{
                            fontFamily: "Georgia, serif",
                            fontWeight: 500,
                            mb: 2,
                            color: "#333"
                        }}
                    >
                        Canti per la messa<br/>{celebrazione}
                    </Typography>
                )}

                <Divider sx={{ mb: 3, width: "60%", margin: "0 auto 30px auto" }} />

                {numeriRichiesti.map(({ numero, category }) => {
                    const canto = cantiMap[numero];
                    if (!canto) return null;

                    return (
                        <Card
                            key={numero}
                            elevation={0}
                            sx={{
                                mb: 5,
                                borderRadius: 4,
                                backgroundColor: "#fffdf7",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                            }}
                        >
                            <CardContent>
                                {/* Categoria sopra il numero */}
                                <Typography
                                    variant="subtitle1"
                                    sx={{
                                        mb: 1,
                                        fontFamily: "Georgia, serif",
                                        textAlign: "center",
                                        fontWeight: 600,
                                        fontSize: `${fontSize}px`,
                                        color: "#555"
                                    }}
                                >
                                    {category.toUpperCase()}
                                </Typography>

                                <Box
                                    className="liturgical-content"
                                    sx={{
                                        fontFamily: "Georgia, serif",
                                        fontSize: `${fontSize}px`,
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
                    );
                })}
            </Container>
            <Box
                sx={{
                    position: "sticky",
                    bottom: 0,
                    zIndex: 1000,
                    backgroundColor: "#fdf6e3",
                    py: 1,
                    px: 2,
                    borderBottom: "1px solid #ddd",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 1
                }}
            >
                <IconButton
                    sx={{ color: "#007700" }}
                    onClick={() => {
                        const url = encodeURIComponent(window.location.href); // link della pagina
                        window.open(`https://wa.me/?text=${url}`, "_blank");
                    }}
                >
                    <WhatsAppIcon />
                </IconButton>
            </Box>
        </Box>
    );
}