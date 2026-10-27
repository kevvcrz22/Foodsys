// Frontend/src/Components/UI/FoodsysConfirmModal.jsx
// Modal de confirmacion global unificado de Foodsys (SENA La Granja).
// Diseno elegante, rounded-2xl, fondo difuminado y botones con estilo semantico.
// Codigo sin tildes ni caracteres especiales para aprendices de ADSO.

import { AlertTriangle, Trash2, CheckCircle2, Info, Loader2, X } from "lucide-react";

export default function FoodsysConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar Accion",
  description = "¿Esta seguro de realizar esta operacion?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger", // "danger" | "warning" | "success" | "info"
  loading = false
}) {
  if (!isOpen) return null;

  const variantes = {
    danger: {
      icon: Trash2,
      iconBg: "bg-rose-100 text-rose-600",
      btnConfirm: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20",
      border: "border-rose-200"
    },
    warning: {
      icon: AlertTriangle,
      iconBg: "bg-amber-100 text-amber-700",
      btnConfirm: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20",
      border: "border-amber-200"
    },
    success: {
      icon: CheckCircle2,
      iconBg: "bg-emerald-100 text-emerald-700",
      btnConfirm: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20",
      border: "border-emerald-200"
    },
    info: {
      icon: Info,
      iconBg: "bg-blue-100 text-blue-700",
      btnConfirm: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20",
      border: "border-blue-200"
    }
  };

  const cfg = variantes[variant] || variantes.danger;
  const Icono = cfg.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        {/* Cabecera con boton de cierre */}
        <div className="p-5 sm:p-6 pb-2 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${cfg.iconBg}`}>
              <Icono className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {title}
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Foodsys — Sistema de Comedor SENA
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del mensaje */}
        <div className="px-5 sm:px-6 py-3">
          <p className="text-sm text-slate-600 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Botones de accion */}
        <div className="p-5 sm:p-6 pt-3 flex items-center justify-end gap-2.5 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-200/80 bg-white border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50 ${cfg.btnConfirm}`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
