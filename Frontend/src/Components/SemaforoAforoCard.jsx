// Frontend/src/Components/SemaforoAforoCard.jsx
// Indicador en vivo del semaforo de aforo y congestion de fila en el comedor
// Consulta GET /api/Turnos/aforo-semaforo con sondeo automatico cada 30 segundos
// Codigo comentado didacticamente sin tildes ni emojis para aprendices de primer semestre

import { useState, useEffect } from "react";
import { Users, Clock, RefreshCw, AlertCircle, Sparkles, TrendingUp, ShieldCheck } from "lucide-react";
import apiAxios from "../api/axiosConfig";

const CONFIG_COLOR = {
  VERDE: {
    bgCard: "bg-emerald-50/70 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
    dot: "bg-emerald-500",
    ping: "bg-emerald-400",
    textoTitulo: "text-emerald-950",
    iconoColor: "text-emerald-600"
  },
  AMARILLO: {
    bgCard: "bg-amber-50/70 border-amber-200",
    badge: "bg-amber-100 text-amber-800 border-amber-300",
    dot: "bg-amber-500",
    ping: "bg-amber-400",
    textoTitulo: "text-amber-950",
    iconoColor: "text-amber-600"
  },
  ROJO: {
    bgCard: "bg-rose-50/70 border-rose-200",
    badge: "bg-rose-100 text-rose-800 border-rose-300",
    dot: "bg-rose-500",
    ping: "bg-rose-400",
    textoTitulo: "text-rose-950",
    iconoColor: "text-rose-600"
  },
  GRIS: {
    bgCard: "bg-slate-50 border-slate-200",
    badge: "bg-slate-100 text-slate-700 border-slate-300",
    dot: "bg-slate-400",
    ping: "bg-slate-300",
    textoTitulo: "text-slate-800",
    iconoColor: "text-slate-500"
  }
};

const SemaforoAforoCard = () => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const consultarAforo = async () => {
    try {
      setCargando(true);
      setError(null);
      const respuesta = await apiAxios.get("/api/Turnos/aforo-semaforo");
      setDatos(respuesta.data);
    } catch (err) {
      console.warn("Nota sobre consulta de aforo:", err.message);
      setError("No se pudo sincronizar el semaforo de fila");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    consultarAforo();
    // Sondeo automatico cada 30 segundos
    const intervalo = setInterval(consultarAforo, 30000);
    return () => clearInterval(intervalo);
  }, []);

  if (error && !datos) {
    return null; // Si hay error silencioso en red no bloquea la interfaz
  }

  const colorConfig = CONFIG_COLOR[datos?.color || "GRIS"] || CONFIG_COLOR.GRIS;

  return (
    <div className={`w-full rounded-2xl border p-4 mb-6 transition-all duration-300 shadow-xs ${colorConfig.bgCard}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

        {/* Informacion principal del aforo */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="relative shrink-0 mt-0.5">
            <span className={`w-4 h-4 rounded-full flex items-center justify-center ${colorConfig.dot}`}>
              {datos?.turnoActivo && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colorConfig.ping}`} />
              )}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-slate-500">
                Aforo del Comedor en Vivo
              </span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${colorConfig.badge}`}>
                <span className={`w-2 h-2 rounded-full ${colorConfig.dot}`} />
                <span>{datos?.nivel || "Consultando..."}</span>
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {datos?.mensaje || "Actualizando estado del comedor de La Granja..."}
            </p>

            {datos?.turnoActivo && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock size={12} className={colorConfig.iconoColor} />
                  Tiempo de espera: <strong className="text-slate-700">{datos.tiempoEsperaEstimado}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp size={12} className={colorConfig.iconoColor} />
                  Ritmo: <strong className="text-slate-700">{datos.ritmoMinuto}</strong> aprendices/min
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} className={colorConfig.iconoColor} />
                  Supervisor: <strong className="text-slate-700">{datos.supervisor}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Boton de recarga rapida */}
        <div className="flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={consultarAforo}
            disabled={cargando}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-white/70 hover:bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl transition-all shadow-2xs disabled:opacity-50"
            title="Actualizar estado de fila ahora"
          >
            <RefreshCw size={12} className={cargando ? "animate-spin text-[#0f3f80]" : ""} />
            <span>Actualizar</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default SemaforoAforoCard;
