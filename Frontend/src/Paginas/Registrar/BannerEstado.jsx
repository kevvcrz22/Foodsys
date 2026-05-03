import { AlertTriangle, BadgeCheck } from "lucide-react";
import { ESTADO_OK, ESTADO_ERR, ESTADO_IDLE } from "./UseRegistro.jsx";

export default function BannerEstado({ estadoEscaneo, mensajeEstado }) {
  if (estadoEscaneo === "idle") return null;

  const esOk = estadoEscaneo === ESTADO_OK;

  return (
    <div
      className={`mb-5 rounded-2xl px-4 py-3 flex items-center gap-3 border-2 animate-slide-up
        ${esOk
          ? "bg-green-50 border-green-400 text-green-800"
          : "bg-red-50 border-red-400 text-red-800"
        }`}
    >
      {esOk
        ? <BadgeCheck className="w-5 h-5 text-green-600 shrink-0" />
        : <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
      }
      <div className="min-w-0">
        <p className="font-semibold text-sm">{esOk ? "Registro exitoso" : "Código inválido"}</p>
        <p className="text-xs opacity-75 truncate">{mensajeEstado}</p>
      </div>
    </div>
  );
}
