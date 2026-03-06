import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from './components/AuthContext'; // <-- Importa il provider
import { CantiProvider } from "./components/CantiContext";
import Home from "./components/Home";
import CantoPage from "./components/CantoPage";
import ListaCanti from "./components/ListaCanti";
import AdminCanti from "./components/AdminCanti";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

function App() {
    return (
        <AuthProvider>
            <CantiProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/canti/:numero" element={<CantoPage />} />
                        <Route path="/celebrazioni/:nomeCelebrazione" element={<ListaCanti />} />
                        <Route path="/admin/edit/:nomeCelebrazione" element={<AdminCanti />} />
                        <Route path="/admin/login" element={<Login />} />
                        <Route path="/admin/edit" element={<Dashboard />} />
                        <Route path="*" element={<h1>404</h1>} />
                    </Routes>
                </BrowserRouter>
            </CantiProvider>
        </AuthProvider>
    );
}

export default App;