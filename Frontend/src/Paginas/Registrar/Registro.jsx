import { useCamara }        from "./UseCamara.jsx";
import { useRegistro }      from "./UseRegistro.jsx";
import { useCanceladas }    from "./UseCanceladas.jsx";

import StatsBar             from "./StatsBar.jsx";
import BannerEstado         from "./BannerEstado.jsx";
import EscanerQR            from "./EscanerQr.jsx";
import RegistroManual       from "./RegistroManual.jsx";
import Actividad            from "./Actividad.jsx";
import NotificacionFlotante from "./Notificaciones.jsx";

export default function Registrar() {
  const { reservasCanceladas, cancelFlash, horaDisplay } = useCanceladas();
 
  const {
    estadoEscaneo,
    mensajeEstado,
    ultimoRegistro,
    registros,
    documentoManual,
    setDocumentoManual,
    cargandoManual,
    procesarQR,
    procesarDocumento,
    mostrarError,
  } = useRegistro();
 
  const { videoRef, canvasRef, camaraActiva, escaneando, activarCamara, detenerCamara } =
    useCamara({ onQRDetectado: procesarQR, onError: mostrarError });
 
  return (
    <div className="min-h-screen bg-slate-50 px-4 sm:px-6 xl:px-10 py-8">
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cancelPulse {
          0%, 100% { background: #fef2f2; }
          50%       { background: #fee2e2; }
        }
        @keyframes scanLine {
          0%, 100% { transform: translateY(-100%); }
          50%       { transform: translateY(100%); }
        }
        .animate-slide-up   { animation: slideUp .3s ease-out; }
        .cancel-flash       { animation: cancelPulse .8s ease-in-out; }
        .scan-line          { animation: scanLine 2.4s ease-in-out infinite; }
        .custom-scroll::-webkit-scrollbar       { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 8px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
      `}</style>
 
      {/* ── HEADER ── */}
      <div className="mb-7">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
          Centro de Asistencia
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Registro de aprendices · tiempo real</p>
      </div>
 
      {/* ── STATS ── */}
      <StatsBar
        totalRegistros={registros.length}
        reservasCanceladas={reservasCanceladas}
        cancelFlash={cancelFlash}
        horaDisplay={horaDisplay}
      />
 
      {/* ── BANNER ── */}
      <BannerEstado estadoEscaneo={estadoEscaneo} mensajeEstado={mensajeEstado} />
 
      {/* ── MAIN GRID ──
          móvil  : columna única (① manual → ② escáner → ③ historial)
          lg     : 3 cols iguales
          xl     : 1fr · 2fr · 1fr  (escáner más protagonista)       */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-[1fr_2fr_1fr] gap-5 items-start">
 
        {/* ① REGISTRO MANUAL — izquierda */}
        <RegistroManual
          documentoManual={documentoManual}
          setDocumentoManual={setDocumentoManual}
          cargandoManual={cargandoManual}
          procesarDocumento={procesarDocumento}
          camaraActiva={camaraActiva}
          activarCamara={activarCamara}
          detenerCamara={detenerCamara}
        />
 
        {/* ② ESCÁNER QR — centro */}
        <EscanerQR
          videoRef={videoRef}
          canvasRef={canvasRef}
          camaraActiva={camaraActiva}
          escaneando={escaneando}
          estadoEscaneo={estadoEscaneo}
          mensajeEstado={mensajeEstado}
          activarCamara={activarCamara}
          detenerCamara={detenerCamara}
        />
 
        {/* ③ HISTORIAL — derecha */}
        <Actividad registros={registros} />
 
      </div>
 
      {/* ── TOAST FLOTANTE ── */}
      <NotificacionFlotante
        ultimoRegistro={ultimoRegistro}
        estadoEscaneo={estadoEscaneo}
      />
    </div>
  );
}