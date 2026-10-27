// Frontend/src/Components/Admin/ControlRacionesRapido.jsx
//
// Componente de control rapido de raciones (Desayuno, Almuerzo, Cena) para Administrador.
// Permite activar o desactivar cada racion con un solo clic sin necesidad de un modulo complejo.
// Estilo suave, limpio y moderno alineado con los modulos de Reportes y Usuarios.
// Codigo sin tildes ni emojis para aprendices de ADSO.

import { useState, useEffect, useCallback } from "react";
import { Coffee, Sun, Moon, ToggleLeft, ToggleRight, RefreshCw, CheckCircle2, AlertCircle, ShieldAlert } from "lucide-react";
import apiAxios from "../../api/axiosConfig";
import toast from "react-hot-toast";

const ICONOS_COMIDA = {
  Desayuno: Coffee,
  Almuerzo: Sun,
  Cena: Moon
};

const HORARIOS_OFICIALES = {
  Desayuno: { servicio: "06:00 - 07:00 AM", limite: "10:30 PM dia anterior" },
  Almuerzo: { servicio: "11:30 AM - 01:30 PM", limite: "10:30 PM dia anterior" },
  Cena: { servicio: "06:00 - 07:30 PM", limite: "10:30 PM dia anterior" }
};

export default function ControlRacionesRapido({ onCambioEstado }) {
  const [raciones, setRaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(null);

  const cargarConfiguraciones = useCallback(async () => {
    try {
      const res = await apiAxios.get("/api/ConfigHorarios");
      if (Array.isArray(res.data) && res.data.length > 0) {
        setRaciones(res.data);
      } else {
        // Fallback por defecto si aun no hay registros
        setRaciones([
          { Id_Config: 1, Tip_Racion: "Desayuno", Racion_Activa: 1 },
          { Id_Config: 2, Tip_Racion: "Almuerzo", Racion_Activa: 1 },
          { Id_Config: 3, Tip_Racion: "Cena", Racion_Activa: 1 }
        ]);
      }
    } catch (err) {
      console.warn("Error al cargar configuracion de raciones:", err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarConfiguraciones();
  }, [cargarConfiguraciones]);

  const toggleRacion = async (racion) => {
    const id = racion.Id_Config || racion.Tip_Racion;
    setActualizando(id);
    try {
      const res = await apiAxios.patch(`/api/ConfigHorarios/${id}/toggle`);
      const nuevoEstado = res.data?.Racion_Activa;

      setRaciones((prev) =>
        prev.map((r) =>
          r.Tip_Racion === racion.Tip_Racion ? { ...r, Racion_Activa: nuevoEstado ? 1 : 0 } : r
        )
      );

      toast.success(
        nuevoEstado
          ? `Servicio de ${racion.Tip_Racion} habilitado para reservas.`
          : `Servicio de ${racion.Tip_Racion} deshabilitado temporalmente.`
      );

      if (onCambioEstado) onCambioEstado(racion.Tip_Racion, nuevoEstado);
    } catch (err) {
      console.error("Error al cambiar estado de racion:", err);
      toast.error("No se pudo cambiar el estado de la racion.");
    } finally {
      setActualizando(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-300">
      {/* Cabecera del Control Rapido */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-slate-50">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <h2 className="text-sm sm:text-base font-bold text-slate-800 m-0">
              Control de Raciones del Comedor
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 m-0">
            Habilita o deshabilita en tiempo real las reservas para cada turno de comida
          </p>
        </div>

        <button
          onClick={cargarConfiguraciones}
          disabled={cargando}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 transition border border-slate-200/60"
          title="Actualizar estado de raciones"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${cargando ? "animate-spin text-emerald-600" : ""}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Grid de Raciones con Switches Suaves */}
      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {raciones.map((racion) => {
          const Icono = ICONOS_COMIDA[racion.Tip_Racion] || Sun;
          const activa = racion.Racion_Activa === 1 || racion.Racion_Activa === true;
          const horario = HORARIOS_OFICIALES[racion.Tip_Racion] || { servicio: "Horario normal", limite: "10:30 PM" };
          const esProcesando = actualizando === (racion.Id_Config || racion.Tip_Racion);

          return (
            <div
              key={racion.Tip_Racion}
              className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                activa
                  ? "bg-slate-50/70 border-slate-200 hover:border-emerald-200"
                  : "bg-rose-50/30 border-rose-200/80"
              }`}
            >
              {/* Parte Superior: Icono, Nombre y Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      activa ? "bg-emerald-100/80 text-emerald-700" : "bg-rose-100 text-rose-600"
                    }`}
                  >
                    <Icono className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 m-0">{racion.Tip_Racion}</h3>
                    <p className="text-[11px] text-slate-500 m-0">Servicio: {horario.servicio}</p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                    activa
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {activa ? (
                    <>
                      <CheckCircle2 size={11} /> Activo
                    </>
                  ) : (
                    <>
                      <AlertCircle size={11} /> Desactivado
                    </>
                  )}
                </span>
              </div>

              {/* Parte Inferior: Horario Limite y Boton Switch */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">
                  Corte: <b className="text-slate-600">{horario.limite}</b>
                </span>

                <button
                  onClick={() => toggleRacion(racion)}
                  disabled={esProcesando}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer ${
                    activa
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  } disabled:opacity-50`}
                >
                  {esProcesando ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : activa ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      <span>Desactivar</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      <span>Activar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
