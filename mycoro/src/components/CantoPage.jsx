import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import GoogleDocFormattedReader from "./GoogleDocPublicReader";

const API_KEY = "AIzaSyBMKPufX0VLfz53MbmRmd6eC-7D1eSAOL8";
const FOLDER_ID = "1l7Fr0-JyPHlrqzQZV2Z3c3YEW6nv3eUF";

const CantoPage = () => {
    const { numero } = useParams();
    const [fileId, setFileId] = useState(null);
    const [fileName, setFileName] = useState("");
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCanto = async () => {
            try {
                const query = encodeURIComponent(
                    `'${FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.document'`
                );

                const response = await fetch(
                    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&key=${API_KEY}`
                );

                const data = await response.json();

                const file = data.files.find(f => f.name.startsWith(`${numero}-`));

                if (!file) {
                    setError("Canto non trovato");
                    return;
                }

                setFileId(file.id);
                setFileName(file.name);
            } catch (err) {
                setError("Errore nel recupero file");
                console.error(err);
            }
        };

        fetchCanto();
    }, [numero]);

    if (error) return <p>{error}</p>;
    if (!fileId) return <p>Caricamento...</p>;

    return (
        <div>
            <h1>{fileName}</h1>
            <GoogleDocFormattedReader fileId={fileId} apiKey={API_KEY} />
        </div>
    );
};

export default CantoPage;