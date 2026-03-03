import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CantiProvider } from "./components/CantiContext";
import Home from "./components/Home";
import CantoPage from "./components/CantoPage";

function App() {
    return (
        <CantiProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/canti/:numero" element={<CantoPage />} />
                    <Route path="*" element={<h1>404</h1>} />
                </Routes>
            </BrowserRouter>
        </CantiProvider>
    );
}

export default App;