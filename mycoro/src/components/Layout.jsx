import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    AppBar, Toolbar, IconButton, Typography, Drawer, List,
    ListItem, ListItemButton, ListItemIcon, ListItemText, Box, Divider
} from '@mui/material';

// Import Context
import { ZoomContext } from './ZoomContext';

// Import Icone
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import TextIncreaseIcon from "@mui/icons-material/TextIncrease";
import TextDecreaseIcon from "@mui/icons-material/TextDecrease";

export default function Layout({ children }) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Recuperiamo le funzioni di zoom dal contesto
    const { increaseFont, decreaseFont } = useContext(ZoomContext);

    // Determina se mostrare i tasti zoom (solo per canti e celebrazioni)
    const showZoom = location.pathname.includes('/canti/') ||
        location.pathname.includes('/celebrazioni/');

    const toggleDrawer = (open) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) return;
        setDrawerOpen(open);
    };

    const menuItems = [
        { text: 'Home', icon: <HomeIcon />, path: '/' },
        { text: 'Indice Generale', icon: <SearchIcon />, path: '/canti/elenco' },
        { text: 'Nuova Raccolta', icon: <QueueMusicIcon />, path: '/canti/nuovo/elenco' },
        { text: 'Il Libretto', icon: <MenuBookIcon />, path: '/canti/libretto/elenco' },
        { text: 'Il Fascicolo', icon: <LibraryMusicIcon />, path: '/canti/fascicolo/elenco' },
        { text: 'Amministrazione', icon: <AdminPanelSettingsIcon />, path: '/admin/edit' },
    ];

    const drawerContent = (
        <Box sx={{ width: 280 }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
            <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f8f5ec' }}>
                <Typography variant="h6" sx={{ fontFamily: "Georgia, serif", fontWeight: 700, color: '#333' }}>
                    Immacolata
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Gioia del Colle
                </Typography>
            </Box>
            <Divider />
            <List sx={{ pt: 2 }}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 1, px: 1 }}>
                            <ListItemButton
                                onClick={() => navigate(item.path)}
                                sx={{
                                    borderRadius: 2,
                                    bgcolor: isActive ? '#e3f2fd' : 'transparent',
                                    color: isActive ? '#1976d2' : '#333',
                                    '&:hover': { bgcolor: isActive ? '#bbdefb' : '#f5f5f5' }
                                }}
                            >
                                <ListItemIcon sx={{ color: isActive ? '#1976d2' : '#777', minWidth: 40 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{ fontFamily: "Georgia, serif", fontWeight: isActive ? 600 : 400 }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f8f5ec' }}>

            {/* AppBar con colore Blu Mariano */}
            <AppBar position="fixed" sx={{ bgcolor: '#f8f5ec', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                <Toolbar>
                    <IconButton edge="start" color="#ccc" aria-label="menu" onClick={toggleDrawer(true)} sx={{ mr: 2 }}>
                        <MenuIcon />
                    </IconButton>
                    <Typography
                        variant="h6"
                        component="div"
                        onClick={() => navigate('/')}
                        sx={{ fontFamily: "Georgia, serif", fontWeight: 600, flexGrow: 1, cursor: 'pointer', color:'rgba(0,0,0,0.65)' }}
                    >
                        Repertorio Canti
                    </Typography>

                    {/* Tasti Zoom dinamici */}
                    {showZoom && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton color="#ccc" onClick={decreaseFont}>
                                <TextDecreaseIcon />
                            </IconButton>
                            <IconButton color="#ccc" onClick={increaseFont}>
                                <TextIncreaseIcon />
                            </IconButton>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>

            <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
                {drawerContent}
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, pt: '64px', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ flexGrow: 1 }}>
                    {children}
                </Box>

                <Box component="footer" sx={{ py: 3, textAlign: 'center', bgcolor: '#fffdf7', borderTop: '1px solid #eee', mt: 'auto' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        © {new Date().getFullYear()} Parrocchia Immacolata - Gioia del Colle (BA)
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}