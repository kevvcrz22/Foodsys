import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import apiAxios from "../../api/axiosConfig.js";

const ReservaForm = () => {
  const [qrData, setQrData] = useState(null);

  const generarQrEntrenamiento = async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fecha = tomorrow.toISOString().split("T")[0];

    const body = {
      Tip_Reserva: "Almuerzo",
      platoElegido: 2,
      Fec_Reserva: fecha,      // intento actual
      fechaReserva: fecha,     // alternativa 1
      fecha: fecha,            // alternativa 2
      date: fecha,             // alternativa 3
    };

    console.log("📤 Body enviado:", body);

    const res = await apiAxios.post("/api/Reservas/reservar/generate-tomorrow", body);
    setQrData(res.data);
  } catch (err) {
    console.error("🔴 DATA:", JSON.stringify(err.response?.data));
    alert(err);
  }
};

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <div className="bg-white rounded-2xl shadow p-4 text-center space-y-4">
        <button
          onClick={generarQrEntrenamiento}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-xl transition"
        >
          Generar QR para mañana
        </button>

        {qrData && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-gray-500">Válido: {qrData.validDate}</p>
            <QRCodeSVG value={qrData.qrUrl} size={350} marginSize={4} level="H" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservaForm;