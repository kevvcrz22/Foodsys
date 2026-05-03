import { CameraOff, CreditCard, Scan, UserPlus, KeyRound } from "lucide-react";

export default function RegistroManual({
  documentoManual,
  setDocumentoManual,
  cargandoManual,
  procesarDocumento,
  camaraActiva,
  activarCamara,
  detenerCamara,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6">

      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
          <KeyRound className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-800">Registro Manual</h2>
          <p className="text-xs text-slate-400">Ingresa el número de documento</p>
        </div>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={documentoManual}
            onChange={(e) => setDocumentoManual(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && procesarDocumento()}
            placeholder="Ej: 1234567890"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50
                       focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400
                       outline-none text-sm text-slate-800 placeholder:text-slate-400 transition-all"
          />
        </div>

        <button
          onClick={procesarDocumento}
          disabled={cargandoManual || !documentoManual.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[.98]
                     disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed
                     text-white py-3 rounded-xl font-medium text-sm transition-all
                     flex items-center justify-center gap-2 shadow-sm"
        >
          {cargandoManual ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          {cargandoManual ? "Buscando…" : "Registrar"}
        </button>
      </div>

      {/* Divisor */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-xs text-slate-400 font-medium">o usa la cámara</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      {/* Botón cámara */}
      {!camaraActiva ? (
        <button
          onClick={activarCamara}
          className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[.98]
                     text-white py-3 rounded-xl flex items-center justify-center gap-2
                     transition-all font-medium text-sm shadow-sm"
        >
          <Scan className="w-4 h-4" />
          Activar Cámara
        </button>
      ) : (
        <button
          onClick={detenerCamara}
          className="w-full bg-slate-500 hover:bg-slate-600 active:scale-[.98]
                     text-white py-3 rounded-xl flex items-center justify-center gap-2
                     transition-all font-medium text-sm shadow-sm"
        >
          <CameraOff className="w-4 h-4" />
          Detener Cámara
        </button>
      )}

    </div>
  );
}