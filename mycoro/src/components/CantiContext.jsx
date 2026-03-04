import { createContext, useEffect, useState } from "react";
import { DOCS_DRIVE_KEY, GOOGLE_FOLDER_ID } from "./config/config";

export const CantiContext = createContext();

const API_KEY = DOCS_DRIVE_KEY;
const FOLDER_ID = GOOGLE_FOLDER_ID;

const CACHE_KEY = "canti_cache";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 ore

export const CantiProvider = ({ children }) => {
    const [cantiMap, setCantiMap] = useState({});
    const [numeriOrdinati, setNumeriOrdinati] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCanti = async () => {
            try {
                // 🔎 1️⃣ Controllo cache
                const cached = localStorage.getItem(CACHE_KEY);

                if (cached) {
                    const parsedCache = JSON.parse(cached);
                    const isValid =
                        Date.now() - parsedCache.timestamp < CACHE_DURATION;

                    if (isValid) {
                        setCantiMap(parsedCache.cantiMap);
                        setNumeriOrdinati(parsedCache.numeriOrdinati);
                        setLoading(false);
                        return;
                    }
                }

                // 🌐 2️⃣ Recupero con paginazione
                let allFiles = [];
                let pageToken = null;

                do {
                    const query = encodeURIComponent(
                        `'${FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.document'`
                    );

                    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=nextPageToken,files(id,name)&pageSize=1000&key=${API_KEY}${
                        pageToken ? `&pageToken=${pageToken}` : ""
                    }`;

                    const res = await fetch(url);
                    const data = await res.json();

                    allFiles = [...allFiles, ...data.files];
                    pageToken = data.nextPageToken;

                } while (pageToken);

                // 🧠 3️⃣ Parsing numeri
                const parsed = allFiles
                    .map(file => {
                        const cleanedName = file.name.trim();
                        const match = cleanedName.match(/^(\d+)\s*-\s*/);

                        if (!match) return null;

                        return {
                            numero: parseInt(match[1], 10),
                            id: file.id,
                            name: file.name
                        };
                    })
                    .filter(Boolean)
                    .sort((a, b) => a.numero - b.numero);

                const map = {};
                parsed.forEach(c => {
                    map[c.numero] = c;
                });

                const numeri = parsed.map(c => c.numero);

                // 💾 4️⃣ Salvataggio cache
                localStorage.setItem(
                    CACHE_KEY,
                    JSON.stringify({
                        timestamp: Date.now(),
                        cantiMap: map,
                        numeriOrdinati: numeri
                    })
                );

                setCantiMap(map);
                setNumeriOrdinati(numeri);
                setLoading(false);

            } catch (err) {
                console.error("Errore caricamento canti:", err);
                setLoading(false);
            }
        };

        loadCanti();
    }, []);

    return (
        <CantiContext.Provider
            value={{ cantiMap, numeriOrdinati, loading }}
        >
            {children}
        </CantiContext.Provider>
    );
};