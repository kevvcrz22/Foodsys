// Frontend/src/Components/UI/FoodsysToast.jsx
// Sistema global unificado de notificaciones y alertas Foodsys (SENA La Granja).
// Diseno moderno, rounded-2xl, iconos claros y tipografia limpia.
// Codigo sin tildes ni caracteres especiales para aprendices de ADSO.

import toast from "react-hot-toast";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

const EstilosToast = {
  success: {
    bg: "bg-white",
    border: "border-emerald-300",
    iconBg: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle2,
    titulo: "Operacion Exitosa",
    textColor: "text-slate-900",
    subColor: "text-slate-600",
    barColor: "bg-emerald-600"
  },
  error: {
    bg: "bg-white",
    border: "border-rose-300",
    iconBg: "bg-rose-100 text-rose-700",
    icon: XCircle,
    titulo: "Atencion / Error",
    textColor: "text-slate-900",
    subColor: "text-slate-600",
    barColor: "bg-rose-600"
  },
  warning: {
    bg: "bg-white",
    border: "border-amber-300",
    iconBg: "bg-amber-100 text-amber-700",
    icon: AlertTriangle,
    titulo: "Advertencia",
    textColor: "text-slate-900",
    subColor: "text-slate-600",
    barColor: "bg-amber-500"
  },
  info: {
    bg: "bg-white",
    border: "border-blue-300",
    iconBg: "bg-blue-100 text-blue-700",
    icon: Info,
    titulo: "Informacion Foodsys",
    textColor: "text-slate-900",
    subColor: "text-slate-600",
    barColor: "bg-blue-600"
  }
};

const renderNotificacionFoodsys = (tipo, mensaje, subtitulo = "", t) => {
  const cfg = EstilosToast[tipo] || EstilosToast.info;
  const Icono = cfg.icon;

  return (
    <div
      className={`${
        t.visible ? "animate-enter" : "animate-leave"
      } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto border ${cfg.border} overflow-hidden transition-all duration-300`}
    >
      <div className={`h-1.5 w-full ${cfg.barColor}`} />
      <div className="p-4 flex items-start gap-3.5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
          <Icono className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
            {cfg.titulo}
          </p>
          <p className={`text-sm font-bold mt-0.5 leading-snug ${cfg.textColor}`}>
            {mensaje}
          </p>
          {subtitulo && (
            <p className={`text-xs mt-1 leading-relaxed ${cfg.subColor}`}>
              {subtitulo}
            </p>
          )}
        </div>

        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const foodsysToast = {
  success: (mensaje, subtitulo = "") => {
    return toast.custom((t) => renderNotificacionFoodsys("success", mensaje, subtitulo, t), {
      duration: 3500
    });
  },
  error: (mensaje, subtitulo = "") => {
    return toast.custom((t) => renderNotificacionFoodsys("error", mensaje, subtitulo, t), {
      duration: 4500
    });
  },
  warning: (mensaje, subtitulo = "") => {
    return toast.custom((t) => renderNotificacionFoodsys("warning", mensaje, subtitulo, t), {
      duration: 4000
    });
  },
  info: (mensaje, subtitulo = "") => {
    return toast.custom((t) => renderNotificacionFoodsys("info", mensaje, subtitulo, t), {
      duration: 3500
    });
  },
  dismiss: (id) => toast.dismiss(id)
};

export default foodsysToast;
