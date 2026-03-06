import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CantiProvider } from "./components/CantiContext";
import Home from "./components/Home";
import CantoPage from "./components/CantoPage";
import ListaCanti from "./components/ListaCanti";
import AdminCanti from "./components/AdminCanti";

function App() {
    return (
        <CantiProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/canti/:numero" element={<CantoPage />} />
                    <Route path="/celebrazioni/:nomeCelebrazione" element={<ListaCanti />} />
                    <Route path="/admin/:nomeCelebrazione" element={<AdminCanti />} />
                    <Route path="*" element={<h1>404</h1>} />
                </Routes>
            </BrowserRouter>
        </CantiProvider>
    );
}

export default App;