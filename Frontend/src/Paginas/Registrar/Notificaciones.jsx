import { BadgeCheck } from "lucide-react";
import { ESTADO_OK } from "./UseRegistro.jsx";


export default function NotificacionFlotante({ ultimoRegistro, estadoEscaneo }) {
  if (!ultimoRegistro || estadoEscaneo !== ESTADO_OK) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-slide-up w-72">
      <div className="bg-white border border-indigo-200 rounded-2xl shadow-xl overflow-hidden">
        {/* Barra top verde */}
        <div className="h-1 bg-gradient-to-r from-indigo-500 to-emerald-400" />

        <div className="p-4 flex items-start gap-3">
          <div className="bg-indigo-100 p-2 rounded-xl shrink-0">
            <BadgeCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-sm">Registro exitoso</p>
            <p className="text-xs text-slate-500 truncate mt-0.5">{ultimoRegistro.nombre}</p>
            {ultimoRegistro.tipo && (
              <span className="inline-block mt-1 text-xs font-medium text-indigo-600
                               bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                {ultimoRegistro.tipo}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 shrink-0 mt-0.5">{ultimoRegistro.hora}</span>
        </div>
      </div>
    </div>
  );
}