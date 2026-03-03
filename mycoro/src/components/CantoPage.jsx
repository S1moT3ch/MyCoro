import { useParams, Link } from "react-router-dom";
import { useContext } from "react";
import { CantiContext } from "./CantiContext";
import GoogleDocFormattedReader from "./GoogleDocFormattedReader";

const API_KEY = "AIzaSyBMKPufX0VLfz53MbmRmd6eC-7D1eSAOL8";

const CantoPage = () => {
    const { numero } = useParams();
    const { cantiMap, numeriOrdinati, loading } = useContext(CantiContext);

    if (loading) return <p>Caricamento canti...</p>;

    const numeroInt = parseInt(numero, 10);
    const canto = cantiMap[numeroInt];

    if (!canto) return <h2>Canto non trovato</h2>;

    const index = numeriOrdinati.indexOf(numeroInt);
    const prev = numeriOrdinati[index - 1];
    const next = numeriOrdinati[index + 1];

    return (
        <div>
            <GoogleDocFormattedReader
                fileId={canto.id}
                apiKey={API_KEY}
            />

            <div style={{ marginTop: 40 }}>
                {prev && <Link to={`/canti/${prev}`}>⬅ Precedente</Link>}
                {"  "}
                {next && <Link to={`/canti/${next}`}>Successivo ➡</Link>}
            </div>
        </div>
    );
};

export default CantoPage;