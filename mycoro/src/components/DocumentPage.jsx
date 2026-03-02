import { useParams } from "react-router-dom";
import GoogleDocFormattedReader from "./GoogleDocPublicReader";

const API_KEY = "AIzaSyBMKPufX0VLfz53MbmRmd6eC-7D1eSAOL8";

const DocumentPage = () => {
    const { id } = useParams();

    return (
        <div>
            <GoogleDocFormattedReader
                fileId={id}
                apiKey={API_KEY}
            />
        </div>
    );
};

export default DocumentPage;