import { useContext, useState } from "react";
import { FascicoloLibrettoContext } from "./FascicoloLibrettoContext";
import {
    Container, Typography, Box, CircularProgress, Paper,
    List, ListItem, ListItemText, ListItemButton, Avatar, Alert,
    TextField, InputAdornment
} from "@mui/material";
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import SearchIcon from '@mui/icons-material/Search';

export default function ElencoFascicolo() {
    const { fascicoloMap, numeriFascicolo, loading, error } = useContext(FascicoloLibrettoContext);
    const [searchTerm, setSearchTerm] = useState("");

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="sm" sx={{ py: 5 }}>
                <Alert severity="error">Errore nel caricamento del fascicolo: {error}</Alert>
            </Container>
        );
    }

    // Filtriamo i canti in base alla ricerca
    const filteredNumeri = numeriFascicolo.filter(numero => {
        const canto = fascicoloMap[numero];
        const termine = searchTerm.toLowerCase().trim();
        return (
            canto.titolo.toLowerCase().includes(termine) ||
            canto.etichetta.toLowerCase().includes(termine)
        );
    });

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f8f5ec', pb: 8, pt: { xs: 3, sm: 5 } }}>
            <Container maxWidth="sm">

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                    <Avatar sx={{ bgcolor: '#00695c', width: 64, height: 64, mb: 2, boxShadow: 2 }}>
                        <LibraryMusicIcon fontSize="large" sx={{ color: '#fff' }} />
                    </Avatar>
                    <Typography variant="h4" sx={{ fontFamily: "Georgia, serif", fontWeight: 600, color: '#333', textAlign: 'center' }}>
                        Canti del Fascicolo
                    </Typography>
                </Box>

                {/* Barra di ricerca */}
                <Paper elevation={0} sx={{ p: 1, mb: 4, borderRadius: 3, bgcolor: '#fffdf7', boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                    <TextField
                        fullWidth
                        placeholder="Cerca per numero (es. 238) o titolo..."
                        variant="outlined"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                            sx: { borderRadius: 2, bgcolor: '#f1f3f4', '& fieldset': { border: 'none' } }
                        }}
                    />
                </Paper>

                <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', bgcolor: '#fffdf7', boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                    {filteredNumeri.length === 0 ? (
                        <Typography align="center" sx={{ py: 6, color: 'text.secondary', fontFamily: "Georgia, serif" }}>
                            Nessun canto trovato nel fascicolo.
                        </Typography>
                    ) : (
                        <List disablePadding>
                            {filteredNumeri.map((numero, index) => {
                                const canto = fascicoloMap[numero];
                                return (
                                    <ListItem key={numero} disablePadding divider={index < filteredNumeri.length - 1}>
                                        <ListItemButton
                                            onClick={() => window.open(canto.url, "_blank")}
                                            sx={{ py: 2, px: { xs: 2, sm: 3 } }}
                                        >
                                            <Avatar sx={{ bgcolor: '#e0f2f1', color: '#00695c', mr: 2, width: 55, height: 55, fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                {canto.etichetta}
                                            </Avatar>
                                            <ListItemText
                                                primary={canto.titolo}
                                                primaryTypographyProps={{ fontWeight: '600', fontSize: '1.1rem', color: '#333', fontFamily: "Georgia, serif" }}
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