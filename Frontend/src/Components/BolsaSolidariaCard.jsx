// Frontend/src/Components/BolsaSolidariaCard.jsx
// Componente interactivo de la Bolsa Solidaria Bienestar
// Permite a aprendices internos y externos consultar y reclamar cupos liberados en tiempo real
// Codigo comentado didacticamente sin tildes ni emojis para aprendices de primer semestre

import { useState, useEffect, useCallback } from "react";
import { HeartHandshake, Utensils, CheckCircle2, AlertCircle, Loader2, Sparkles, X, ChevronRight } from "lucide-react";
import apiAxios from "../api/axiosConfig";
import toast from "react-hot-toast";

export default function BolsaSolidariaCard({ onCupoReclamado }) {
  const [cupos, setCupos] = useState([]);
  const [totalDisponibles, setTotalDisponibles] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [reclamandoId, setReclamandoId] = useState(null);

  const cargarCupos = useCallback(async () => {
    try {
      const resp = await apiAxios.get("/api/Reservas/bolsa/disponibles");
      setCupos(resp.data?.cupos || []);
      setTotalDisponibles(resp.data?.totalDisponibles || 0);
    } catch (err) {
      console.warn("Nota sobre bolsa solidaria:", err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarCupos();
    // Sondeo ligero cada 25 segundos
    const intervalo = setInterval(cargarCupos, 25000);
    return () => clearInterval(intervalo);
  }, [cargarCupos]);

  const handleReclamar = async (idReserva, tipReserva) => {
    setReclamandoId(idReserva);
    try {
      const resp = await apiAxios.post(`/api/Reservas/bolsa/${idReserva}/reclamar`);
      toast.success(resp.data?.mensaje || `Cupo de ${tipReserva} asignado exitosamente.`);
      await cargarCupos();
      setModalAbierto(false);
      if (onCupoReclamado) onCupoReclamado();
    } catch (err) {
      console.error("Error al reclamar cupo:", err.message);
      toast.error(err.response?.data?.mensaje || err.response?.data?.message || "No se pudo tomar el cupo.");
    } finally {
      setReclamandoId(null);
    }
  };

  return (
    <>
      {/* Tarjeta Visual Suave de la Bolsa Solidaria */}
      <div className="bg-white rounded-2xl border border-emerald-200/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <HeartHandshake className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base m-0">
                Bolsa Solidaria Bienestar
              </h3>
              {cargando ? (
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                  Verificando cupos...
                </span>
              ) : totalDisponibles > 0 ? (
                <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full animate-pulse">
                  {totalDisponibles} {totalDisponibles === 1 ? "cupo disponible" : "cupos disponibles"}
                </span>
              ) : (
                <span className="text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-0.5 rounded-full">
                  Sin cupos ahora
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed m-0">
              Raciones liberadas voluntariamente por companeros que no pueden asistir hoy. Disponibles para la comunidad.
            </p>
          </div>
        </div>

        <button
          onClick={() => { cargarCupos(); setModalAbierto(true); }}
          className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
        >
          <span>Ver Bolsa Solidaria</span>
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Modal para ver y reclamar cupos de la bolsa */}
      {modalAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={(e) => { if (e.target === e.currentTarget) setModalAbierto(false); }}
        >
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Header del Modal */}
            <div className="p-5 border-b border-slate-100 bg-white relative">
              <button
                onClick={() => setModalAbierto(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-500 cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
                    Cupos de la Bolsa Solidaria
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Raciones disponibles para aprovechar hoy en el comedor
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de cupos */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {cargando ? (
                <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                  <Loader2 size={20} className="animate-spin text-emerald-600" />
                  <span>Consultando cupos en tiempo real...</span>
                </div>
              ) : cupos.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
                  <p className="text-sm font-bold text-slate-700 m-0">No hay cupos disponibles en este momento</p>
                  <p className="text-xs text-slate-500 m-0">
                    Cuando un aprendiz libere su racion a la Bolsa Solidaria, aparecera aqui inmediatamente para que puedas tomarla.
                  </p>
                </div>
              ) : (
                cupos.map((c) => (
                  <div
                    key={c.Id_Reserva}
                    className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {c.Tip_Reserva}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Fecha: {c.Fec_Reserva}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-800 text-sm truncate m-0">
                        {c.Plato}
                      </h4>

                      {c.Bebida && (
                        <p className="text-xs text-slate-500 m-0">
                          Bebida: <span className="font-medium text-slate-700">{c.Bebida}</span>
                        </p>
                      )}

                      {!c.Puede_Reclamar && c.Motivo_Bloqueo && (
                        <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1 m-0">
                          <AlertCircle size={12} className="text-rose-500 shrink-0" />
                          <span>{c.Motivo_Bloqueo}</span>
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 self-end sm:self-center">
                      {c.Puede_Reclamar ? (
                        <button
                          onClick={() => handleReclamar(c.Id_Reserva, c.Tip_Reserva)}
                          disabled={reclamandoId === c.Id_Reserva}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {reclamandoId === c.Id_Reserva ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>Asignando...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={13} />
                              <span>Tomar este Cupo</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          No disponible para ti
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <button
                onClick={() => setModalAbierto(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
