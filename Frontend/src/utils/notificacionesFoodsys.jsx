// Frontend/src/utils/notificacionesFoodsys.jsx
// Sistema Unificado de Notificaciones y Confirmaciones Institucionales de Foodsys.
// Garantiza que absolutamente todos los modulos (Tablas CRUD, Reportes, Supervisor,
// Cocina, Reservas, Login y Perfil) compartan el mismo diseno visual amigable,
// coherente y moderno del Centro Agropecuario "La Granja" - SENA.
// Comentado en espanol sin tildes ni emojis para aprendices de primer semestre.

import React from "react";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  Trash2,
  Ban,
  Undo2,
  X,
} from "lucide-react";

/**
 * Obtiene la fecha actual en zona horaria de Colombia (America/Bogota) en formato YYYY-MM-DD.
 * Evita que despues de las 7:00 PM el navegador salte al dia siguiente por usar UTC.
 */
export const obtenerFechaHoyColombia = (fecha = new Date()) => {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
};

/**
 * Notificacion de exito unificada de Foodsys
 */
export const notificarExito = (mensaje, opciones = {}) => {
  return toast.success(mensaje, {
    duration: 3600,
    ...opciones,
  });
};

/**
 * Notificacion de error o advertencia unificada de Foodsys
 */
export const notificarError = (mensaje, opciones = {}) => {
  return toast.error(mensaje, {
    duration: 4800,
    ...opciones,
  });
};

/**
 * Notificacion informativa unificada de Foodsys
 */
export const notificarInfo = (mensaje, opciones = {}) => {
  return toast(mensaje, {
    duration: 3500,
    icon: <Info size={18} className="text-[#2E5792] shrink-0" />,
    style: {
      borderLeft: "5px solid #2E5792",
    },
    ...opciones,
  });
};

/**
 * Tarjeta interactiva de confirmacion unificada de Foodsys.
 * Reemplaza a window.confirm, window.alert, Swal.fire y toasts dispares
 * para que toda la aplicacion se sienta como un unico sistema coherente.
 *
 * Retorna una Promesa que resuelve a:
 *   - "confirmado" (si pulsa el boton principal)
 *   - "secundario" (si pulsa el boton secundario opcional)
 *   - null (si cancela)
 */
export const confirmarAccionFoodsys = ({
  titulo = "¿Confirmar accion?",
  mensaje = "",
  detalle = "",
  textoConfirmar = "Confirmar",
  textoSecundario = null,
  textoCancelar = "Cancelar",
  variante = "primario", // 'primario' | 'peligro' | 'advertencia' | 'exito'
  mostrarToastCancelacion = false,
}) => {
  const estilosVariante = {
    primario: {
      bordeIzquierdo: "border-l-[#2E5792]",
      cajaIcono: "bg-blue-50 text-[#2E5792] border-blue-100",
      botonConfirmar: "bg-[#2E5792] hover:bg-[#1e3f6f] text-white",
      Icono: HelpCircle,
    },
    peligro: {
      bordeIzquierdo: "border-l-rose-600",
      cajaIcono: "bg-rose-50 text-rose-600 border-rose-100",
      botonConfirmar: "bg-rose-600 hover:bg-rose-700 text-white",
      Icono: Trash2,
    },
    advertencia: {
      bordeIzquierdo: "border-l-amber-500",
      cajaIcono: "bg-amber-50 text-amber-600 border-amber-100",
      botonConfirmar: "bg-amber-600 hover:bg-amber-700 text-white",
      Icono: Ban,
    },
    exito: {
      bordeIzquierdo: "border-l-emerald-600",
      cajaIcono: "bg-emerald-50 text-emerald-600 border-emerald-100",
      botonConfirmar: "bg-emerald-600 hover:bg-emerald-700 text-white",
      Icono: CheckCircle2,
    },
  };

  const cfg = estilosVariante[variante] || estilosVariante.primario;
  const IconoComponente = cfg.Icono;

  return new Promise((resolve) => {
    let resuelto = false;
    const finalizar = (idToast, valor) => {
      if (resuelto) return;
      resuelto = true;
      toast.dismiss(idToast);
      if (valor === null && mostrarToastCancelacion) {
        toast("Accion cancelada", {
          icon: <Undo2 size={16} className="text-slate-500" />,
          duration: 1500,
        });
      }
      resolve(valor);
    };

    toast.custom(
      (t) => (
        <div
          className={`max-w-md w-full bg-white/98 backdrop-blur-md shadow-2xl rounded-2xl p-4 sm:p-5 border border-slate-200/90 border-l-4 ${cfg.bordeIzquierdo} transition-all duration-200`}
          style={{
            fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
            boxShadow:
              "0 22px 45px -12px rgba(15, 39, 74, 0.25), 0 8px 16px -6px rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* Cabecera institucional Foodsys */}
          <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-100">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2E5792] bg-blue-50/80 px-2 py-0.5 rounded-md">
              Foodsys • SENA La Granja
            </span>
            <button
              type="button"
              onClick={() => finalizar(t.id, null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer border-0 bg-transparent"
              aria-label="Cerrar"
            >
              <X size={14} />
            </button>
          </div>

          {/* Cuerpo del mensaje */}
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${cfg.cajaIcono}`}
            >
              <IconoComponente size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-extrabold text-slate-800 m-0 leading-snug">
                {titulo}
              </h4>
              {mensaje && (
                <p className="text-xs text-slate-600 mt-1 mb-0 leading-relaxed">
                  {mensaje}
                </p>
              )}
              {detalle && (
                <p className="text-[11px] text-slate-500 mt-1.5 mb-0 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 leading-snug">
                  {detalle}
                </p>
              )}
            </div>
          </div>

          {/* Botones de accion */}
          <div className="flex flex-wrap items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => finalizar(t.id, null)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer border-0"
            >
              {textoCancelar}
            </button>

            {textoSecundario && (
              <button
                type="button"
                onClick={() => finalizar(t.id, "secundario")}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
              >
                {textoSecundario}
              </button>
            )}

            <button
              type="button"
              onClick={() => finalizar(t.id, "confirmado")}
              className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer border-0 ${cfg.botonConfirmar}`}
            >
              {textoConfirmar}
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, position: "top-center" }
    );
  });
};

export default {
  obtenerFechaHoyColombia,
  notificarExito,
  notificarError,
  notificarInfo,
  confirmarAccionFoodsys,
};
