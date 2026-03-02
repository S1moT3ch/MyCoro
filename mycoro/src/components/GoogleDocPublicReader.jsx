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
                setHtml(htmlText);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDoc();
    }, [fileId, apiKey]);

    return (
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
            {loading && <p>Caricamento...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            {!loading && !error && (
                <div
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            )}
        </div>
    );
};

export default GoogleDocFormattedReader;