import { useState, useEffect, useCallback, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import apiAxios from "../../api/axiosConfig.js";

const ReservaForm = () => {
  const [qrData, setQrData] = useState(null);
  const [historial, setHistorial] = useState([]);
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const headers = useMemo(() => ({ Authorization: `bearer ${usuario.token}` }), [usuario.token]);

  const cargarHistorial = useCallback(async () => {
    try {
      const res = await apiAxios.get("/api/Reservas/reservar/historial", { headers });
      setHistorial(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [headers]);

  useEffect(() => { cargarHistorial(); }, [cargarHistorial]);

  const generarQrEntrenamiento = async () => {
    try {
      const res = await apiAxios.post("/api/Reservas/reservar/generate-tomorrow",
        { Tip_Reserva: "Almuerzo", platoElegido: 2 },
        { headers }
      );
      setQrData(res.data);
      cargarHistorial(); // refresca el historial tras generar
    } catch (err) {
      alert(err);
    }
  };

  const estadoColor = {
    Generado: "bg-yellow-100 text-yellow-700",
    Usado:    "bg-green-100 text-green-700",
    Expirado: "bg-red-100 text-red-700",
  };

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">

      {/* Generador QR */}
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

      {/* Historial */}
      <div className="bg-white rounded-2xl shadow p-4 space-y-3">
        <h2 className="font-semibold text-gray-700">Mis reservas recientes</h2>

        {historial.length === 0 && (
          <p className="text-sm text-gray-400">No tienes reservas aún.</p>
        )}

        {historial.map((r) => (
          <div key={r.Id_Reserva} className="flex items-center justify-between border rounded-xl px-3 py-2 text-sm">
            <div>
              <p className="font-medium">{r.Tip_Reserva} — {r.plato?.Nom_Plato ?? "Plato"}</p>
              <p className="text-gray-400">{r.Fec_Reserva}</p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[r.Est_Reserva] ?? "bg-gray-100 text-gray-500"}`}>
              {r.Est_Reserva}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
};

export default ReservaForm;