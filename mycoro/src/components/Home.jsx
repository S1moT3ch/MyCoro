import React from "react";
import { useNavigate } from "react-router-dom";
import {
    Container, Typography, Box, Paper, Grid, Avatar, CardActionArea
} from "@mui/material";

import SearchIcon from '@mui/icons-material/Search';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ChurchIcon from '@mui/icons-material/Church';

export default function Home() {
    const navigate = useNavigate();

    const menuItems = [
        {
            title: "Indice Generale",
            subtitle: "Cerca in tutto il nostro archivio canti",
            icon: <SearchIcon fontSize="large" />,
            bgColor: '#333',
            iconColor: '#fdf6e3',
            paperBg: '#fffdf7',
            route: "/canti/elenco"
        },
        {
            title: "Nuova Raccolta",
            subtitle: "Esplora la nuova raccolta",
            icon: <QueueMusicIcon fontSize="large" />,
            bgColor: '#fff',
            iconColor: '#555',
            paperBg: '#fffdf7',
            route: "/canti/nuovo/elenco",
            border: '1px solid #ddd'
        },
        {
            title: "Il Libretto",
            subtitle: "I canti del libretto arancione",
            icon: <MenuBookIcon fontSize="large" />,
            bgColor: '#e3f2fd',
            iconColor: '#1976d2',
            paperBg: '#fffdf7',
            route: "/canti/libretto/elenco"
        },
        {
            title: "Il Fascicolo",
            subtitle: "I canti del fascicolo ad anelli",
            icon: <LibraryMusicIcon fontSize="large" />,
            bgColor: '#e0f2f1',
            iconColor: '#00695c',
            paperBg: '#fffdf7',
            route: "/canti/fascicolo/elenco"
        },
        {
            title: "Amminstrazione",
            subtitle: "Accesso consentito solo a personale autorizzato",
            icon: <AdminPanelSettingsIcon fontSize="large" />,
            bgColor: '#fce4ec',
            iconColor: '#c2185b',
            paperBg: '#fffdf7',
            route: "/admin/edit"
        }
    ];

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f8f5ec', pb: 8, pt: { xs: 5, sm: 8 } }}>
            <Container maxWidth="md">

                {/* --- HEADER PERSONALIZZATO --- */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 6 }}>
                    <Avatar sx={{ bgcolor: '#d4af37', width: 80, height: 80, mb: 3, boxShadow: 3 }}>
                        <ChurchIcon sx={{ fontSize: 40, color: '#fff' }} />
                    </Avatar>
                    <Typography variant="h3" component="h1" sx={{ fontFamily: "Georgia, serif", fontWeight: 700, color: '#333', textAlign: 'center', mb: 1, fontSize: { xs: '2.2rem', sm: '3rem' } }}>
                        Repertorio Canti
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'text.secondary', textAlign: 'center', fontWeight: 600, mt: 1 }}>
                        Parrocchia Immacolata
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', fontWeight: 400, mb: 2 }}>
                        Gioia del Colle
                    </Typography>
                </Box>

                {/* --- GRIGLIA MENU UNIFORME --- */}
                <Grid container spacing={3} justifyContent="center">
                    {menuItems.map((item, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                            <Paper
                                elevation={0}
                                sx={{
                                    // ⚠️ MODIFICA QUI: Sostituiamo height: '100%' e minHeight
                                    // con un'altezza FISSA e rigorosa per tutti!
                                    height: 240,
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                    bgcolor: item.paperBg,
                                    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                                    transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                                    border: item.border || 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    "&:hover": {
                                        transform: "translateY(-5px)",
                                        boxShadow: "0 8px 25px rgba(0,0,0,0.1)"
                                    }
                                }}
                            >
                                <CardActionArea
                                    onClick={() => navigate(item.route)}
                                    sx={{
                                        p: 3,
                                        flexGrow: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textAlign: 'center',
                                        width: '18rem'
                                    }}
                                >
                                    <Avatar sx={{
                                        bgcolor: item.bgColor,
                                        color: item.iconColor,
                                        width: 60,
                                        height: 60,
                                        mb: 2,
                                        border: item.border || 'none'
                                    }}>
                                        {item.icon}
                                    </Avatar>
                                    <Typography variant="h6" sx={{ fontFamily: "Georgia, serif", fontWeight: 600, color: '#333', mb: 1 }}>
                                        {item.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                                        {item.subtitle}
                                    </Typography>
                                </CardActionArea>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
}