import { useState, useContext, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CantiContext } from "./CantiContext";
import { FascicoloLibrettoContext } from "./FascicoloLibrettoContext";
import { APPS_SCRIPTS_URL } from "./config/config";
import {
    Container, Typography, Box, CircularProgress, Paper,
    List, ListItem, ListItemText, ListItemButton,
    TextField, InputAdornment, Avatar, Chip
} from "@mui/material";

import SearchIcon from '@mui/icons-material/Search';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';

const cleanTitle = (rawName) => {
    if (!rawName) return "Canto senza titolo";
    return rawName.replace(/\.[^/.]+$/, "").replace(/^\d+[\s\-_]*/, "").trim() || "Canto senza titolo";
};

const normalizeString = (str) => str.toLowerCase().trim();

// --- COMPONENTE: Evidenziatore Testo (Versione per Frase Esatta) ---
const HighlightedText = ({ text, query }) => {
    if (!query || !text) return <>{text}</>;

    // Al posto di dividere le parole, cerchiamo l'intera stringa esatta ignorando maiuscole/minuscole
    const exactPhrase = query.trim();
    // Facciamo "escape" dei caratteri speciali per evitare errori nella RegEx
    const escapedPhrase = exactPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedPhrase})`, 'gi');

    const parts = text.split(regex);

    return (
        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', mt: 1, mb: 1, fontSize: '0.85rem', lineHeight: 1.5, bgcolor: '#f4f4f4', p: 1.5, borderRadius: 2 }}>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    // L'evidenziatore giallo ora si applicherà a tutta la frase intera!
                    <Box component="span" key={i} sx={{ fontWeight: 'bold', bgcolor: '#fff59d', color: '#000', px: 0.5, py: 0.2, borderRadius: 1 }}>
                        {part}
                    </Box>
                ) : (
                    part
                )
            )}
        </Typography>
    );
};

export default function ElencoNuovo() {
    const { cantiMap, loading: loadingCanti } = useContext(CantiContext);
    const { librettoMap, fascicoloMap, loading: loadingLibretto } = useContext(FascicoloLibrettoContext);

    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");

    const [isSearchingText, setIsSearchingText] = useState(false);
    // ⚠️ textMatches ora è un OGGETTO in cui salviamo gli snippet: { "ID-FILE": "anteprima testo..." }
    const [textMatches, setTextMatches] = useState({});

    const unifiedCanti = useMemo(() => {
        const map = new Map();

        Object.values(cantiMap || {}).forEach(canto => {
            const titoloPulito = cleanTitle(canto.titolo || canto.name || canto.nome);
            const normTitle = normalizeString(titoloPulito);
            map.set(normTitle, { titoloDisplay: titoloPulito, normTitle: normTitle, driveData: canto, librettoData: null, fascicoloData: null });
        });

        Object.values(librettoMap || {}).forEach(canto => {
            const normTitle = normalizeString(canto.titolo);
            if (map.has(normTitle)) map.get(normTitle).librettoData = canto;
            else map.set(normTitle, { titoloDisplay: canto.titolo, normTitle: normTitle, driveData: null, librettoData: canto, fascicoloData: null });
        });

        Object.values(fascicoloMap || {}).forEach(canto => {
            const normTitle = normalizeString(canto.titolo);
            if (map.has(normTitle)) map.get(normTitle).fascicoloData = canto;
            else map.set(normTitle, { titoloDisplay: canto.titolo, normTitle: normTitle, driveData: null, librettoData: null, fascicoloData: canto });
        });

        return Array.from(map.values()).sort((a, b) => {
            if (a.driveData && b.driveData) return parseInt(a.driveData.numero) - parseInt(b.driveData.numero);
            if (a.driveData) return -1;
            if (b.driveData) return 1;
            if (a.librettoData && b.librettoData) return a.librettoData.numero - b.librettoData.numero;
            if (a.librettoData) return -1;
            if (b.librettoData) return 1;
            if (a.fascicoloData && b.fascicoloData) return a.fascicoloData.numero - b.fascicoloData.numero;
            return 0;
        });
    }, [cantiMap, librettoMap, fascicoloMap]);

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setTextMatches({});
            setIsSearchingText(false);
            return;
        }

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
                    // Costruiamo una "rubrica" in cui ogni ID ha il suo snippet
                    const matchesMap = {};
                    data.matches.forEach(m => { matchesMap[m.id] = m.snippet; });
                    setTextMatches(matchesMap);
                }
            } catch (err) {
                console.error("Errore ricerca testo:", err);
            } finally {
                setIsSearchingText(false);
            }
        }, 800);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    if (loadingCanti || loadingLibretto) {
        return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;
    }

    const filteredCanti = unifiedCanti.filter(canto => {
        const termine = searchTerm.toLowerCase().trim();
        const matchTitolo = canto.normTitle.includes(termine);
        const matchNumeroDrive = canto.driveData && String(canto.driveData.numero) === termine;
        const matchNumeroLibretto = canto.librettoData && canto.librettoData.etichetta.toLowerCase() === termine;
        const matchNumeroFascicolo = canto.fascicoloData && canto.fascicoloData.etichetta.toLowerCase() === termine;

        const matchesTitleOrNumber = matchTitolo || matchNumeroDrive || matchNumeroLibretto || matchNumeroFascicolo;

        // Se l'ID del canto di Drive si trova nella nostra rubrica degli snippet, mostralo!
        if (Object.keys(textMatches).length > 0 && canto.driveData) {
            return matchesTitleOrNumber || textMatches.hasOwnProperty(canto.driveData.id);
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
                        Elenco dei Canti
                    </Typography>
                </Box>

                <Paper elevation={0} sx={{ p: 1, mb: 4, borderRadius: 3, bgcolor: '#fffdf7', boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                    <TextField
                        fullWidth
                        placeholder="Cerca numero (15, L20) o parole..."
                        variant="outlined"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
                            endAdornment: isSearchingText ? <InputAdornment position="end"><CircularProgress size={20} color="inherit" /></InputAdornment> : null,
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
                                const hasDrive = !!canto.driveData;
                                const hasLibretto = !!canto.librettoData;
                                const hasFascicolo = !!canto.fascicoloData;

                                // Peschiamo lo snippet se esiste (e solo se la ricerca profonda non ha coinciso col titolo)
                                const snippet = hasDrive ? textMatches[canto.driveData.id] : null;
                                const showSnippet = snippet && !canto.normTitle.includes(searchTerm.toLowerCase().trim());

                                const handleClick = () => {
                                    if (hasDrive) navigate(`/canti/${canto.driveData.numero}`);
                                    else if (hasLibretto) window.open(canto.librettoData.url, "_blank");
                                    else if (hasFascicolo) window.open(canto.fascicoloData.url, "_blank");
                                };

                                let avatarText = <AudiotrackIcon fontSize="small" />;
                                let avatarColor = '#555'; let avatarBg = '#fdf6e3';

                                if (hasDrive) { avatarText = canto.driveData.numero; }
                                else if (hasLibretto) { avatarText = canto.librettoData.etichetta; avatarColor = '#1976d2'; avatarBg = '#e3f2fd'; }
                                else if (hasFascicolo) { avatarText = canto.fascicoloData.etichetta; avatarColor = '#00695c'; avatarBg = '#e0f2f1'; }

                                return (
                                    <ListItem key={canto.normTitle} disablePadding divider={index < filteredCanti.length - 1}>
                                        <ListItemButton onClick={handleClick} sx={{ py: 2, px: { xs: 2, sm: 3 }, alignItems: 'flex-start' }}>

                                            <Avatar sx={{ bgcolor: avatarBg, color: avatarColor, mr: 2, mt: 0.5, width: 45, height: 45, fontWeight: 'bold', border: '1px solid #ddd', fontSize: '1rem' }}>
                                                {avatarText}
                                            </Avatar>

                                            <ListItemText
                                                primary={canto.titoloDisplay}
                                                primaryTypographyProps={{ fontWeight: '600', fontSize: '1.1rem', color: '#333', fontFamily: "Georgia, serif" }}

                                                secondary={
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.8, mt: 1 }}>

                                                        {/* --- NUOVA SEZIONE: ANTEPRIMA DEL TESTO --- */}
                                                        {showSnippet && (
                                                            <HighlightedText text={snippet} query={searchTerm} />
                                                        )}

                                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.8, mt: showSnippet ? 1 : 0 }}>
                                                            {hasDrive && <Chip label={`Nuova Raccolta: ${canto.driveData.numero}`} size="small" sx={{ bgcolor: '#fff', border: '1px solid #ccc', color: '#555', fontWeight: 'bold', height: 22, fontSize: '0.75rem' }} />}
                                                            {hasLibretto && <Chip label={`Libretto: ${canto.librettoData.etichetta}`} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 'bold', height: 22, fontSize: '0.75rem' }} />}
                                                            {hasFascicolo && <Chip label={`Fascicolo: ${canto.fascicoloData.etichetta}`} size="small" sx={{ bgcolor: '#e0f2f1', color: '#00695c', fontWeight: 'bold', height: 22, fontSize: '0.75rem' }} />}
                                                        </Box>
                                                    </Box>
                                                }
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