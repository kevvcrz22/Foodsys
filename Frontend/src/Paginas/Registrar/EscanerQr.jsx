import { Camera, CheckCircle2, Scan, XCircle } from "lucide-react";

const ESTADO_OK  = "ok";
const ESTADO_ERR = "error";

export default function EscanerQR({
  videoRef,
  canvasRef,
  camaraActiva,
  escaneando,
  estadoEscaneo,
  mensajeEstado,
}) {
  const ringColor =
    estadoEscaneo === ESTADO_OK  ? "ring-2 ring-green-400 border-green-400" :
    estadoEscaneo === ESTADO_ERR ? "ring-2 ring-red-400 border-red-400"     :
    camaraActiva                 ? "ring-2 ring-indigo-400 border-indigo-400" :
                                   "border-slate-700";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
            <Scan className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">Escáner QR</h2>
            <p className="text-xs text-slate-400">Apunta la cámara al código</p>
          </div>
        </div>

        {escaneando && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600
                           bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            En vivo
          </span>
        )}
      </div>

      {/* Visor de cámara — compacto en desktop, full en móvil */}
      <div
        className={`relative bg-slate-900 rounded-2xl overflow-hidden border-2 transition-all duration-300
                    w-full aspect-square max-w-[260px] lg:max-w-full mx-auto ${ringColor}`}
      >
        {/* Estado: cámara inactiva */}
        {!camaraActiva && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            {estadoEscaneo === ESTADO_ERR ? (
              <>
                <XCircle className="w-12 h-12 text-red-400" />
                <p className="text-red-300 text-sm font-medium text-center px-6 leading-snug">
                  {mensajeEstado}
                </p>
              </>
            ) : estadoEscaneo === ESTADO_OK ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-green-400" />
                <p className="text-green-300 text-sm font-semibold">¡Registrado!</p>
              </>
            ) : (
              <>
                <Camera className="w-12 h-12 text-slate-500" />
                <p className="text-slate-500 text-sm">Cámara desactivada</p>
              </>
            )}
          </div>
        )}

        {/* Stream de video */}
        {camaraActiva && (
          <>
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />

            {/* Marco de escaneo animado */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Esquinas decorativas */}
              <div className="absolute top-5 left-5 w-7 h-7 border-t-[3px] border-l-[3px] border-indigo-400 rounded-tl-lg" />
              <div className="absolute top-5 right-5 w-7 h-7 border-t-[3px] border-r-[3px] border-indigo-400 rounded-tr-lg" />
              <div className="absolute bottom-5 left-5 w-7 h-7 border-b-[3px] border-l-[3px] border-indigo-400 rounded-bl-lg" />
              <div className="absolute bottom-5 right-5 w-7 h-7 border-b-[3px] border-r-[3px] border-indigo-400 rounded-br-lg" />
              {/* Área interna */}
              <div className="absolute inset-10 border border-indigo-400/40 rounded-xl overflow-hidden">
                <div className="scan-line absolute inset-x-0 h-0.5 bg-indigo-400 opacity-70" />
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}