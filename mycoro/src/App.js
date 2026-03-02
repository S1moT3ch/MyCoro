import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import DocumentPage from "./components/DocumentPage";
import CantoPage from "./components/CantoPage";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/doc/:id" element={<DocumentPage />} />7
                <Route path="/canti/:numero" element={<CantoPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;