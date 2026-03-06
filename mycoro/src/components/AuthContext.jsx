import { createContext, useContext, useState, useEffect } from "react";
import { APPS_SCRIPTS_URL } from "./config/config";

const AuthContext = createContext();

const parseJwt = (token) => {
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(decodeURIComponent(atob(base64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")));
    } catch (e) {
        return null;
    }
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [authError, setAuthError] = useState("");

    // 1. AL CARICAMENTO DELLA PAGINA: Cerca il token nel "cookie"
    useEffect(() => {
        const initAuth = async () => {
            const savedToken = localStorage.getItem("google_auth_token"); // LEGGE IL COOKIE

            if (savedToken) {
                const payload = parseJwt(savedToken);
                if (payload && payload.exp * 1000 > Date.now()) {
                    try {
                        const res = await fetch(APPS_SCRIPTS_URL, {
                            method: "POST",
                            headers: { "Content-Type": "text/plain;charset=utf-8" },
                            body: JSON.stringify({ action: "verify", token: savedToken })
                        });
                        const data = await res.json();

                        if (!data.error) {
                            setToken(savedToken);
                            setUser(payload);
                        } else {
                            localStorage.removeItem("google_auth_token"); // CANCELLA SE NON VALIDO
                        }
                    } catch (err) {
                        console.error("Errore di rete auth");
                    }
                } else {
                    localStorage.removeItem("google_auth_token"); // CANCELLA SE SCADUTO
                }
            }
            setLoadingAuth(false);
        };
        initAuth();
    }, []);

    // 2. FUNZIONE DI LOGIN: Salva il token nel "cookie"
    const login = async (jwtToken) => {
        setLoadingAuth(true);
        setAuthError("");
        const payload = parseJwt(jwtToken);

        if (!payload) {
            setAuthError("Token non valido");
            setLoadingAuth(false);
            return;
        }

        try {
            const res = await fetch(APPS_SCRIPTS_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "verify", token: jwtToken })
            });
            const data = await res.json();

            if (data.error) {
                setAuthError(data.error);
            } else {
                localStorage.setItem("google_auth_token", jwtToken); // <-- SETTA IL COOKIE!
                setToken(jwtToken);
                setUser(payload);
            }
        } catch (err) {
            setAuthError("Errore di connessione al server.");
        } finally {
            setLoadingAuth(false);
        }
    };

    // 3. FUNZIONE DI LOGOUT: Distrugge il "cookie"
    const logout = () => {
        localStorage.removeItem("google_auth_token"); // <-- RIMUOVE IL COOKIE!
        setToken(null);
        setUser(null);
        setAuthError("");
    };

    return (
        <AuthContext.Provider value={{ user, token, loadingAuth, authError, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);