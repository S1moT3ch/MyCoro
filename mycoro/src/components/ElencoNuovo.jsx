import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CantiContext } from "./CantiContext";
import { APPS_SCRIPTS_URL } from "./config/config";
import {
    Container, Typography, Box, CircularProgress, Paper,
    List, ListItem, ListItemText, ListItemButton,
    TextField, InputAdornment, Avatar
} from "@mui/material";

import SearchIcon from '@mui/icons-material/Search';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';

const cleanTitle = (rawName) => {
    if (!rawName) return "Canto senza titolo";
    return rawName
        .replace(/\.[^/.]+$/, "")
        .replace(/^\d+[\s\-_]*/, "")
        .trim() || "Canto senza titolo";
};

export default function ElencoNuovo() {
    const { cantiMap, loading } = useContext(CantiContext);
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState("");

    // --- STATI PER LA RICERCA AUTOMATICA NEL TESTO ---
    const [isSearchingText, setIsSearchingText] = useState(false);
    const [textMatchedIds, setTextMatchedIds] = useState(null);

    // --- EFFETTO DEBOUNCE (Parte in automatico quando scrivi) ---
    useEffect(() => {
        // Se il campo è vuoto, resettiamo la ricerca profonda
        if (searchTerm.trim() === "") {
            setTextMatchedIds(null);
            setIsSearchingText(false);
            return;
        }

        // Aspetta 800ms prima di interrogare Google Drive (per non intasare il server mentre digiti)
        const delayDebounceFn = setTimeout(async () => {
            setIsSearchingText(true);
            try {
                const res = await fetch(APPS_SCRIPTS_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({ action: "searchCantiText", query: searchTerm })
                });
                const data = await res.json();

                if (data.success) {
                    setTextMatchedIds(data.matches);
                }
            } catch (err) {
                console.error("Errore ricerca testo:", err);
            } finally {
                setIsSearchingText(false);
            }
        }, 800);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]); // <--- Rimosso searchInText, ora osserva solo la parola cercata

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    const cantiArray = Object.keys(cantiMap).map(numero => ({
        numero: numero,
        ...cantiMap[numero]
    })).sort((a, b) => parseInt(a.numero) - parseInt(b.numero));

    // --- LOGICA DI FILTRAGGIO (Titolo + Testo combinati) ---
    const filteredCanti = cantiArray.filter(canto => {
        // Aggiungiamo .trim() per evitare che uno spazio inserito per sbaglio rovini la ricerca
        const termine = searchTerm.toLowerCase().trim();
        const nomeGrezzo = canto.titolo || canto.name || canto.nome || "";
        const titoloPulito = cleanTitle(nomeGrezzo).toLowerCase();

        // 1. Ricerca sul TITOLO (Parziale: basta che lo contenga)
        const matchTitolo = titoloPulito.includes(termine);

        // 2. Ricerca sul NUMERO (Esatta: deve essere identico)
        const matchNumeroEsatto = canto.numero && String(canto.numero) === termine;

        const matchesTitleOrNumber = matchTitolo || matchNumeroEsatto;

        // 3. Ricerca Profonda: Se Google Drive ha risposto, aggiunge i risultati
        if (textMatchedIds !== null) {
            return matchesTitleOrNumber || textMatchedIds.includes(canto.id);
        }

        return matchesTitleOrNumber;
    });

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f8f5ec', pb: 8, pt: { xs: 3, sm: 5 } }}>
            <Container maxWidth="sm">

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                    <Avatar sx={{ bgcolor: '#333', width: 64, height: 64, mb: 2, boxShadow: 2 }}>
                        <LibraryMusicIcon fontSize="large" sx={{ color: '#fdf6e3' }} />
                    </Avatar>
                    <Typography variant="h4" sx={{ fontFamily: "Georgia, serif", fontWeight: 600, color: '#333', textAlign: 'center' }}>
                        Indice dei Canti
                    </Typography>
                </Box>

                <Paper elevation={0} sx={{ p: 1, mb: 4, borderRadius: 3, bgcolor: '#fffdf7', boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                    <TextField
                        fullWidth
                        placeholder="Cerca per numero, titolo o parole del testo..."
                        variant="outlined"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                            // Rotellina di caricamento automatica
                            endAdornment: isSearchingText ? (
                                <InputAdornment position="end">
                                    <CircularProgress size={20} color="inherit" />
                                </InputAdornment>
                            ) : null,
                            sx: { borderRadius: 2, bgcolor: '#f1f3f4', '& fieldset': { border: 'none' } }
                        }}
                    />
                </Paper>

                <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', bgcolor: '#fffdf7', boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                    {filteredCanti.length === 0 ? (
                        <Typography align="center" sx={{ py: 6, color: 'text.secondary', fontFamily: "Georgia, serif" }}>
                            {isSearchingText ? "Ricerca approfondita in corso..." : "Nessun canto trovato."}
                        </Typography>
                    ) : (
                        <List disablePadding>
                            {filteredCanti.map((canto, index) => {
                                const titoloPulito = cleanTitle(canto.titolo || canto.name || canto.nome);

                                return (
                                    <ListItem key={canto.id} disablePadding divider={index < filteredCanti.length - 1}>
                                        <ListItemButton
                                            onClick={() => navigate(`/canti/${canto.numero}`)}
                                            sx={{ py: 2, px: { xs: 2, sm: 3 } }}
                                        >
                                            <Avatar sx={{ bgcolor: '#fdf6e3', color: '#555', mr: 2, width: 45, height: 45, fontWeight: 'bold', border: '1px solid #ddd' }}>
                                                {canto.numero ? canto.numero : <AudiotrackIcon fontSize="small" />}
                                            </Avatar>
                                            <ListItemText
                                                primary={titoloPulito}
                                                primaryTypographyProps={{ fontWeight: '600', fontSize: '1.1rem', color: '#333', fontFamily: "Georgia, serif" }}
                                                secondary={`Canto N° ${canto.numero}`}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                )
                            })}
                        </List>
                    )}
                </Paper>

            </Container>
        </Box>
    );
}