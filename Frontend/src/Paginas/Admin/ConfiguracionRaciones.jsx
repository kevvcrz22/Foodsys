// Frontend/src/Paginas/Admin/ConfiguracionRaciones.jsx
// Panel administrativo para encender/apagar raciones (ON/OFF) y configurar horarios en tiempo real
// Diseno moderno, intuitivo y 100% responsivo con colores institucionales Foodsys/SENA.
// Comentarios didacticos sin tildes ni emojis para aprendices de primer semestre.

import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig";
import toast from "react-hot-toast";
import GlobalLoader from "../../Components/GlobalLoader";
import {
  Clock, Power, Save, Calendar, CheckCircle, AlertTriangle,
  HelpCircle, Sparkles, RefreshCw, Sun, Utensils, Moon
} from "lucide-react";

const iconosTurno = {
  Desayuno: <Sun className="w-6 h-6 text-amber-500" />,
  Almuerzo: <Utensils className="w-6 h-6 text-emerald-500" />,
  Cena: <Moon className="w-6 h-6 text-indigo-500" />
};

const coloresTurno = {
  Desayuno: {
    borde: "border-amber-200",
    fondo: "bg-amber-50/50",
    badge: "bg-amber-100 text-amber-900 border-amber-300",
    glow: "shadow-amber-500/10"
  },
  Almuerzo: {
    borde: "border-emerald-200",
    fondo: "bg-emerald-50/50",
    badge: "bg-emerald-100 text-emerald-900 border-emerald-300",
    glow: "shadow-emerald-500/10"
  },
  Cena: {
    borde: "border-indigo-200",
    fondo: "bg-indigo-50/50",
    badge: "bg-indigo-100 text-indigo-900 border-indigo-300",
    glow: "shadow-indigo-500/10"
  }
};

const ConfiguracionRaciones = () => {
  const [raciones, setRaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState(null);
  const [toggleandoId, setToggleandoId] = useState(null);

  useEffect(() => {
    cargarConfiguraciones();
  }, []);

  const cargarConfiguraciones = async () => {
    setCargando(true);
    try {
      const res = await apiAxios.get("/api/config-raciones");
      setRaciones(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error al cargar configuracion de raciones:", err);
      toast.error("Error al cargar los horarios de raciones");
    } finally {
      setCargando(false);
    }
  };

  const handleToggleEstado = async (racion) => {
    setToggleandoId(racion.Id_Config);
    try {
      const res = await apiAxios.patch(`/api/config-raciones/${racion.Id_Config}/toggle`);
      const nuevoEstado = res.data.Racion_Activa;

      setRaciones((prev) =>
        prev.map((r) =>
          r.Id_Config === racion.Id_Config ? { ...r, Racion_Activa: nuevoEstado } : r
        )
      );

      toast.success(
        nuevoEstado
          ? `Servicio de ${racion.Tip_Racion} ENCENDIDO (Habilitado para reservas)`
          : `Servicio de ${racion.Tip_Racion} APAGADO (Deshabilitado temporalmente)`
      );
    } catch (err) {
      console.error("Error al alternar estado de racion:", err);
      toast.error(err.response?.data?.message || "No se pudo cambiar el estado del servicio");
    } finally {
      setToggleandoId(null);
    }
  };

  const handleCambioCampo = (idConfig, campo, valor) => {
    setRaciones((prev) =>
      prev.map((r) => (r.Id_Config === idConfig ? { ...r, [campo]: valor } : r))
    );
  };

  const handleGuardarCambios = async (racion) => {
    setGuardandoId(racion.Id_Config);
    try {
      await apiAxios.put(`/api/config-raciones/${racion.Id_Config}`, {
        Hora_Inicio_Servicio: racion.Hora_Inicio_Servicio,
        Hora_Fin_Servicio: racion.Hora_Fin_Servicio,
        Hora_Inicio_Reserva_Dia_Anterior: racion.Hora_Inicio_Reserva_Dia_Anterior,
        Hora_Limite_Reserva_Normal: racion.Hora_Limite_Reserva_Normal,
        Hora_Limite_Cancelacion: racion.Hora_Limite_Cancelacion,
        Hora_Limite_Excepcional: racion.Hora_Limite_Excepcional,
        Hora_Limite_Cesion: racion.Hora_Limite_Cesion,
        Fecha_Excepcion_Temporal: racion.Fecha_Excepcion_Temporal,
        Hora_Limite_Excepcion_Temporal: racion.Hora_Limite_Excepcion_Temporal
      });
      toast.success(`Horarios de ${racion.Tip_Racion} guardados correctamente`);
    } catch (err) {
      console.error("Error al guardar cambios de racion:", err);
      toast.error(err.response?.data?.message || "Error al actualizar los horarios");
    } finally {
      setGuardandoId(null);
    }
  };

  if (cargando) return <GlobalLoader />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <Clock size={16} /> Administracion Central de Servicios
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight m-0">
            Horarios y Control de Raciones
          </h1>
          <p className="text-sm text-slate-500 mt-1 m-0">
            Enciende o apaga raciones en tiempo real y ajusta horarios limites de reserva, cancelacion y cesion.
          </p>
        </div>

        <button
          onClick={cargarConfiguraciones}
          className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2.5 rounded-2xl text-xs font-semibold border border-slate-200 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} /> Refrescar
        </button>
      </div>

      {/* Banner Informativo de Politicas */}
      <div className="bg-linear-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-3xl shadow-lg shadow-emerald-700/10 space-y-2">
        <h3 className="font-bold text-base flex items-center gap-2 m-0 text-white">
          <Sparkles size={18} className="text-amber-300" />
          Politica Oficial de Horarios en Foodsys (America/Bogota)
        </h3>
        <p className="text-xs text-emerald-100 leading-relaxed m-0">
          - <strong>Ciclo General de Reserva Normal:</strong> desde las 06:00 AM hasta las 10:30 PM (22:30) del dia anterior para manana.
          A las 10:31 PM en adelante, el sistema agenda automaticamente para pasado manana.<br />
          - <strong>Excepcion Temporal (27 de octubre de 2026):</strong> Se permite reservar Almuerzo hasta las 08:00 AM del mismo dia.<br />
          - <strong>Cesion de Reserva:</strong> Habilitada hasta las 10:30 AM del mismo dia para Almuerzo.
        </p>
      </div>

      {/* Tarjetas de Raciones: Desayuno, Almuerzo y Cena */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {raciones.map((racion) => {
          const estilo = coloresTurno[racion.Tip_Racion] || coloresTurno.Almuerzo;
          const estaActiva = Boolean(racion.Racion_Activa);
          const guardando = guardandoId === racion.Id_Config;
          const toggleando = toggleandoId === racion.Id_Config;

          return (
            <div
              key={racion.Id_Config}
              className={`bg-white rounded-3xl border-2 ${estilo.borde} shadow-md ${estilo.glow} p-6 flex flex-col justify-between space-y-6 transition-all`}
            >
              <div className="space-y-5">
                {/* Cabecera de la Racion con Switch ON/OFF */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
                      {iconosTurno[racion.Tip_Racion]}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-800 m-0">
                        {racion.Tip_Racion}
                      </h2>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5 mt-0.5 ${
                        estaActiva
                          ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                          : "bg-rose-100 text-rose-900 border-rose-300"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${estaActiva ? "bg-emerald-600" : "bg-rose-600"}`} />
                        {estaActiva ? "SERVICIO EN ON" : "SERVICIO EN OFF"}
                      </span>
                    </div>
                  </div>

                  {/* Interruptor ON/OFF */}
                  <button
                    onClick={() => handleToggleEstado(racion)}
                    disabled={toggleando}
                    className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      estaActiva ? "bg-emerald-600" : "bg-slate-300"
                    }`}
                    title={estaActiva ? "Hacer clic para APAGAR" : "Hacer clic para ENCENDER"}
                  >
                    <span
                      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                        estaActiva ? "translate-x-6 text-emerald-600" : "translate-x-0 text-slate-400"
                      }`}
                    >
                      <Power size={13} />
                    </span>
                  </button>
                </div>

                {/* Formulario de Horarios */}
                <div className="space-y-4">
                  {/* Ventana de Servicio en Comedor */}
                  <div className="p-3 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                    <label className="block text-xs font-bold text-slate-700">
                      Horario de Servicio en el Comedor
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[11px] text-slate-500 font-medium">Inicio</span>
                        <input
                          type="time"
                          step="1"
                          value={racion.Hora_Inicio_Servicio || "06:00:00"}
                          onChange={(e) =>
                            handleCambioCampo(racion.Id_Config, "Hora_Inicio_Servicio", e.target.value)
                          }
                          className="w-full text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 font-medium">Fin (Vencimiento)</span>
                        <input
                          type="time"
                          step="1"
                          value={racion.Hora_Fin_Servicio || "08:00:00"}
                          onChange={(e) =>
                            handleCambioCampo(racion.Id_Config, "Hora_Fin_Servicio", e.target.value)
                          }
                          className="w-full text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hora Limite Reserva Normal */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hora Limite Reserva Normal (Dia Anterior)
                    </label>
                    <input
                      type="time"
                      step="1"
                      value={racion.Hora_Limite_Reserva_Normal || "22:30:00"}
                      onChange={(e) =>
                        handleCambioCampo(racion.Id_Config, "Hora_Limite_Reserva_Normal", e.target.value)
                      }
                      className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-white"
                    />
                    <p className="text-[11px] text-slate-400 mt-1 m-0">
                      Por defecto: 10:30 PM (22:30). A las 22:31 pasa al dia siguiente.
                    </p>
                  </div>

                  {/* Hora Limite Cancelacion */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hora Limite de Cancelacion
                    </label>
                    <input
                      type="time"
                      step="1"
                      value={racion.Hora_Limite_Cancelacion || "21:00:00"}
                      onChange={(e) =>
                        handleCambioCampo(racion.Id_Config, "Hora_Limite_Cancelacion", e.target.value)
                      }
                      className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-white"
                    />
                    <p className="text-[11px] text-slate-400 mt-1 m-0">
                      Por defecto: 09:00 PM (21:00) de la noche anterior.
                    </p>
                  </div>

                  {/* Hora Limite Cesion */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hora Limite para Ceder Reserva
                    </label>
                    <input
                      type="time"
                      step="1"
                      value={racion.Hora_Limite_Cesion || "10:30:00"}
                      onChange={(e) =>
                        handleCambioCampo(racion.Id_Config, "Hora_Limite_Cesion", e.target.value)
                      }
                      className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-white"
                    />
                    <p className="text-[11px] text-slate-400 mt-1 m-0">
                      Ampliado para solidaridad entre aprendices (ej. 10:30 AM).
                    </p>
                  </div>

                  {/* Solo para Almuerzo: Novedades y Excepcion 27 de Octubre */}
                  {racion.Tip_Racion === "Almuerzo" && (
                    <div className="p-3 bg-amber-50/60 rounded-2xl space-y-3 border border-amber-200">
                      <div>
                        <label className="block text-xs font-bold text-amber-900 mb-1">
                          Hora Limite Novedades (Mismo Dia)
                        </label>
                        <input
                          type="time"
                          step="1"
                          value={racion.Hora_Limite_Excepcional || "09:00:00"}
                          onChange={(e) =>
                            handleCambioCampo(racion.Id_Config, "Hora_Limite_Excepcional", e.target.value)
                          }
                          className="w-full text-xs font-semibold px-3 py-1.5 border border-amber-300 rounded-xl bg-white text-amber-950"
                        />
                      </div>

                      <div className="pt-2 border-t border-amber-200/60">
                        <label className="block text-xs font-bold text-amber-900 mb-1">
                          Excepcion Temporal Unica (27 Oct 2026)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-amber-800">Fecha</span>
                            <input
                              type="date"
                              value={racion.Fecha_Excepcion_Temporal || "2026-10-27"}
                              onChange={(e) =>
                                handleCambioCampo(racion.Id_Config, "Fecha_Excepcion_Temporal", e.target.value)
                              }
                              className="w-full text-xs font-semibold px-2 py-1 border border-amber-300 rounded-xl bg-white"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-amber-800">Cierre</span>
                            <input
                              type="time"
                              step="1"
                              value={racion.Hora_Limite_Excepcion_Temporal || "08:00:00"}
                              onChange={(e) =>
                                handleCambioCampo(racion.Id_Config, "Hora_Limite_Excepcion_Temporal", e.target.value)
                              }
                              className="w-full text-xs font-semibold px-2 py-1 border border-amber-300 rounded-xl bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Boton Guardar Cambios */}
              <button
                onClick={() => handleGuardarCambios(racion)}
                disabled={guardando}
                className="w-full py-3 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {guardando ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={15} />
                )}
                <span>Guardar Horarios de {racion.Tip_Racion}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConfiguracionRaciones;
