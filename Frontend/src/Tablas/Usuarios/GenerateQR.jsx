import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import apiNode from "../../api/axiosConfig";

const GenerateQR = () => {
    
    
    const [qrData, setQrData] = useState(null);

    const rolActivo = (localStorage.getItem("rolActivo") || "").trim();

const puedeGenerarQR = ["aprendiz", "aprendiz externo"].includes(
  rolActivo.toLowerCase()
);
    

    

    const generarQrBeneficio = async () => {
        try {
            console.log("TOKEN:", localStorage.getItem("token"));
            const token = localStorage.getItem("token");
            const rolActivo = localStorage.getItem("rolActivo");


            const res = await apiNode.post(
                "/api/checkin-passes/desayuno/generate-tomorrow",
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "rol": rolActivo
                    }
                }
            );

            setQrData(res.data);

        } catch (error) {
             console.error("ERROR COMPLETO:", error);
             console.log("RESPUESTA:", error.response);
           
            alert("Error al generar el QR");
        }
    };

    return (
        <>
           {puedeGenerarQR && (
                <button onClick={generarQrBeneficio}>
                    Generar QR para mañana
                </button>
            )}

            {qrData && (
                <>
                    <p>Fecha: {qrData.validDate}</p>
                    <QRCodeSVG value={qrData.qrUrl} size={250} />
                </>
            )}
        </>
    );
};

export default GenerateQR;