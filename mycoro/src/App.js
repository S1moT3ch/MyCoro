import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from './components/AuthContext'; // <-- Importa il provider
import { CantiProvider } from "./components/CantiContext";
import { FascicoloLibrettoProvider} from "./components/FascicoloLibrettoContext";
import { ZoomProvider } from "./components/ZoomContext";

import Home from "./components/Home";
import Layout from "./components/Layout"
import SingoloCanto from "./components/SingoloCanto";
import ListaCanti from "./components/ListaCanti";

import AdminCanti from "./components/AdminCanti";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

import ElencoCanti from "./components/ElencoCanti";
import ElencoNuovo  from "./components/ElencoNuovo";
import ElencoLibretto from "./components/ElencoLibretto";
import ElencoFascicolo from "./components/ElencoFascicolo";

function App() {
    return (
        <AuthProvider>
            <CantiProvider>
                <FascicoloLibrettoProvider>
                    <ZoomProvider>
                        <BrowserRouter>
                            <Layout>
                                <Routes>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/canti/:numero" element={<SingoloCanto />} />
                                    <Route path="/celebrazioni/:nomeCelebrazione" element={<ListaCanti />} />
                                    <Route path="/admin/edit/:nomeCelebrazione" element={<AdminCanti />} />
                                    <Route path="/admin/login" element={<Login />} />
                                    <Route path="/admin/edit" element={<Dashboard />} />
                                    <Route path="/canti/elenco" element={<ElencoCanti />} />
                                    <Route path="/canti/nuovo/elenco" element={<ElencoNuovo />} />
                                    <Route path="/canti/libretto/elenco" element={<ElencoLibretto />} />
                                    <Route path="/canti/fascicolo/elenco" element={<ElencoFascicolo />} />
                                    <Route path="*" element={<h1>404</h1>} />
                                </Routes>
                            </Layout>
                        </BrowserRouter>
                    </ZoomProvider>
                </FascicoloLibrettoProvider>
            </CantiProvider>
        </AuthProvider>
    );
}

export default App;