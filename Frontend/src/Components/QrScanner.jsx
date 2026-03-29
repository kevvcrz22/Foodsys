// Frontend/src/Components/QRScanner.jsx
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import apiAxios from "../api/axiosConfig";
import { CheckCircle, XCircle, QrCode, Camera, CameraOff } from "lucide-react";

/**
 * Escáner QR para cambiar estado de reservas.
 * El QR debe contener el Id_Reserva o un JSON con la reserva.
 * Al escanear hace PUT /api/Reservas/estado/:id con { estado: "Usada" }
 *
 * Props:
 *  - onScan(resultado): callback opcional cuando se procesa una reserva
 *  - estadoDestino: estado a asignar (default "Usada")
 */
const QRScanner = ({ onScan, estadoDestino = "Usada" }) => {
  const [escaneando,  setEscaneando]  = useState(false);
  const [resultado,   setResultado]   = useState(null); // { exito, mensaje, reserva }
  const [cargando,    setCargando]    = useState(false);
  const scannerRef  = useRef(null);
  const containerId = "qr-scanner-container";

  /* ── Iniciar cámara ── */
  const iniciarScanner = async () => {
    setResultado(null);
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => procesarQR(decodedText, scanner),
        () => {} // error silencioso por frame
      );
      setEscaneando(true);
    } catch (err) {
      setResultado({
        exito: false,
        mensaje: "No se pudo acceder a la cámara. Verifique los permisos.",
      });
    }
  };

  /* ── Detener cámara ── */
  const detenerScanner = async () => {
    if (scannerRef.current && escaneando) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (_) { /* ignorar */ }
    }
    setEscaneando(false);
  };

  /* ── Procesar QR leído ── */
  const procesarQR = async (texto, scanner) => {
    // Detener para no hacer llamadas múltiples
    try { await scanner.stop(); scanner.clear(); } catch (_) {}
    setEscaneando(false);
    setCargando(true);

    try {
      /* Intentar parsear como JSON o usar directamente como ID */
      let idReserva = null;
      try {
        const obj = JSON.parse(texto);
        // Puede contener id, Id_Reserva, etc.
        idReserva = obj.id || obj.Id_Reserva || obj.reserva;
      } catch {
        // Si no es JSON, asumir que el texto ES el id
        idReserva = texto.split("_")[0] || texto.split("//")[0].trim() || texto;
      }

      if (!idReserva || isNaN(Number(idReserva))) {
        throw new Error(`QR no reconocido: "${texto.substring(0, 60)}"`);
      }

      const res = await apiAxios.put(`/api/Reservas/estado/${idReserva}`, {
        estado: estadoDestino,
      });

      const reservaActualizada = { Id_Reserva: idReserva, Est_Reserva: estadoDestino };
      setResultado({
        exito: true,
        mensaje: res.data.message || `Reserva #${idReserva} marcada como "${estadoDestino}"`,
        reserva: reservaActualizada,
      });
      onScan?.(reservaActualizada);

    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Error al procesar QR";
      setResultado({ exito: false, mensaje: msg });
    } finally {
      setCargando(false);
    }
  };

  /* ── Limpiar al desmontar ── */
  useEffect(() => {
    return () => { detenerScanner(); };
  }, []);
  return (
    <div className="flex flex-col items-center gap-4 w-full">

      {/* Área de la cámara */}
      <div className="w-full max-w-xs">
        <div
          id={containerId}
          className={`w-full rounded-2xl overflow-hidden border-2 transition-colors ${
            escaneando ? "border-emerald-400 shadow-lg shadow-emerald-100" : "border-gray-200 bg-gray-50"
          }`}
          style={{ minHeight: escaneando ? "300px" : "0px" }}
        />

        {/* Placeholder cuando no está escaneando */}
        {!escaneando && !cargando && (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <QrCode className="w-16 h-16 mb-3 opacity-30" />
            <p className="text-sm">Presiona el botón para escanear</p>
          </div>
        )}

        {/* Cargando */}
        {cargando && (
          <div className="flex flex-col items-center justify-center py-10 text-indigo-500">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-3" />
            <p className="text-sm">Actualizando reserva...</p>
          </div>
        )}
      </div>

      {/* Botón */}
      {!escaneando ? (
        <button
          onClick={iniciarScanner}
          disabled={cargando}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors shadow-md"
        >
          <Camera className="w-4 h-4" />
          Iniciar escáner
        </button>
      ) : (
        <button
          onClick={detenerScanner}
          className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors"
        >
          <CameraOff className="w-4 h-4" />
          Detener escáner
        </button>
      )}

      {/* Resultado */}
      {resultado && (
        <div className={`w-full max-w-xs rounded-2xl p-4 flex items-start gap-3 border ${
          resultado.exito
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {resultado.exito
            ? <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            : <XCircle    className="w-5 h-5 text-red-500    flex-shrink-0 mt-0.5" />
          }
          <div>
            <p className="text-sm font-semibold">{resultado.exito ? "¡Éxito!" : "Error"}</p>
            <p className="text-xs mt-0.5">{resultado.mensaje}</p>
          </div>
        </div>
      )}

      {/* Botón para escanear otro */}
      {resultado && (
        <button
          onClick={() => { setResultado(null); iniciarScanner(); }}
          className="text-sm text-emerald-600 hover:text-emerald-800 underline font-medium"
        >
          Escanear otro código
        </button>
      )}
    </div>
  );
};

export default QRScanner;