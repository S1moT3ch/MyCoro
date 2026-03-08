import { createContext, useEffect, useState } from "react";

export const FascicoloLibrettoContext = createContext();

const LIBRETTO_URL = "https://parrocchia-immacolata-gioia.github.io/libretto/libretto/";
const CACHE_KEY = "raccolte_canti_cache"; // Cambiato nome cache per resettarla
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 ore

export const FascicoloLibrettoProvider = ({ children }) => {
    // --- DUE STATI SEPARATI PER LE DUE RACCOLTE ---
    const [librettoMap, setLibrettoMap] = useState({});
    const [numeriLibretto, setNumeriLibretto] = useState([]);

    const [fascicoloMap, setFascicoloMap] = useState({});
    const [numeriFascicolo, setNumeriFascicolo] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadRaccolte = async () => {
            try {
                // 🔎 1️⃣ Controllo cache
                const cached = localStorage.getItem(CACHE_KEY);

                if (cached) {
                    const parsedCache = JSON.parse(cached);
                    const isValid = Date.now() - parsedCache.timestamp < CACHE_DURATION;

                    if (isValid) {
                        setLibrettoMap(parsedCache.librettoMap);
                        setNumeriLibretto(parsedCache.numeriLibretto);
                        setFascicoloMap(parsedCache.fascicoloMap);
                        setNumeriFascicolo(parsedCache.numeriFascicolo);
                        setLoading(false);
                        return;
                    }
                }

                // 🌐 2️⃣ Recupero della pagina HTML
                const res = await fetch(LIBRETTO_URL);
                if (!res.ok) throw new Error(`Errore HTTP: ${res.status}`);
                const htmlString = await res.text();

                // 🧠 3️⃣ Parsing dell'HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlString, "text/html");
                const links = Array.from(doc.querySelectorAll("a"));

                // Variabili di appoggio per lo smistamento
                const mapLibrettoTemp = {};
                const mapFascicoloTemp = {};
                const numLibrettoTemp = [];
                const numFascicoloTemp = [];

                links.forEach(link => {
                    const text = link.textContent.trim();
                    const href = link.getAttribute("href");

                    // NUOVA REGEX: Il Gruppo 1 cattura la "L" (se c'è), il Gruppo 2 il numero, il Gruppo 3 il titolo
                    const match = text.match(/^(L)?\s*(\d+)[\s\-.]+(.*)$/i);

                    if (!match || !href) return; // Se non è un canto, salta al prossimo link

                    const isLibretto = !!match[1]; // Vero se il gruppo 1 (la "L") esiste
                    const numero = parseInt(match[2], 10);
                    const titolo = match[3].trim();
                    const fullUrl = href.startsWith("http") ? href : new URL(href, LIBRETTO_URL).href;

                    const cantoObj = {
                        numero: numero,
                        titolo: titolo,
                        url: fullUrl,
                        etichetta: isLibretto ? `L${numero}` : `${numero}`
                    };

                    // Smistamento nelle due mappe
                    if (isLibretto) {
                        mapLibrettoTemp[numero] = cantoObj;
                        if (!numLibrettoTemp.includes(numero)) numLibrettoTemp.push(numero);
                    } else {
                        mapFascicoloTemp[numero] = cantoObj;
                        if (!numFascicoloTemp.includes(numero)) numFascicoloTemp.push(numero);
                    }
                });

                // Ordiniamo gli array numericamente
                numLibrettoTemp.sort((a, b) => a - b);
                numFascicoloTemp.sort((a, b) => a - b);

                // 💾 4️⃣ Salvataggio cache
                localStorage.setItem(
                    CACHE_KEY,
                    JSON.stringify({
                        timestamp: Date.now(),
                        librettoMap: mapLibrettoTemp,
                        numeriLibretto: numLibrettoTemp,
                        fascicoloMap: mapFascicoloTemp,
                        numeriFascicolo: numFascicoloTemp
                    })
                );

                // Aggiorniamo gli stati
                setLibrettoMap(mapLibrettoTemp);
                setNumeriLibretto(numLibrettoTemp);
                setFascicoloMap(mapFascicoloTemp);
                setNumeriFascicolo(numFascicoloTemp);
                setLoading(false);

            } catch (err) {
                console.error("Errore caricamento raccolte:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        loadRaccolte();
    }, []);

    return (
        <FascicoloLibrettoContext.Provider
            value={{
                librettoMap, numeriLibretto,
                fascicoloMap, numeriFascicolo,
                loading, error
            }}
        >
            {children}
        </FascicoloLibrettoContext.Provider>
    );
};