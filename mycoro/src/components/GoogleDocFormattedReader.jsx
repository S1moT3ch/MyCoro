import React, { useEffect, useState } from "react";

const GoogleDocFormattedReader = ({ fileId, apiKey }) => {
    const [html, setHtml] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDoc = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(
                    `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/html&key=${apiKey}`
                );

                if (!response.ok) {
                    throw new Error("Errore nel recupero del documento");
                }

                const htmlText = await response.text();

                // 🔥 PARSING E PULIZIA
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, "text/html");

                // 1️⃣ Prendiamo solo il body
                const bodyContent = doc.body;

                // 2️⃣ Rimuoviamo attributi di stile dal body
                //bodyContent.removeAttribute("style");

                // 3️⃣ Rimuoviamo tutti i font-size inline
                bodyContent.querySelectorAll("*").forEach(el => {
                    if (el.style) {
                        el.style.fontSize = null;
                    }
                });

                setHtml(bodyContent.innerHTML);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDoc();
    }, [fileId, apiKey]);

    return (
        <>
            {loading && <p>Caricamento...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            {!loading && !error && (
                <div
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            )}
        </>
    );
};

export default GoogleDocFormattedReader;