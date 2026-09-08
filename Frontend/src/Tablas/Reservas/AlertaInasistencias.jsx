import React, { useState } from "react";
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle,
  Info,
  Calendar,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Clock
} from "lucide-react";

/**
 * Componente AlertaInasistencias
 * Muestra el estado del contador semanal de inasistencias (0 a 3) y el estado de sanción.
 * 
 * Reglas mostradas al usuario:
 * - 1 o 2 inasistencias: Advertencia preventiva; se reinicia automáticamente el lunes.
 * - 3 inasistencias (o 3 comidas el mismo día para internos): Sanción automática.
 * - Sancionado: Permanece sancionado hasta que Coordinación/Bienestar le levante la sanción (volviendo a 0).
 */
export default function AlertaInasistencias({ estado, cargando, alRecargar }) {
  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  if (cargando) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-gray-100 rounded w-2/3"></div>
      </div>
    );
  }

  if (!estado) return null;

  const {
    estaSancionado = false,
    inasistenciasSemana = 0,
    maxInasistencias = 3,
    esInterno = false,
    esExterno = false,
    tripleFallaMismoDia = false,
    detalle = []
  } = estado || {};

  // Determinar nivel de alerta
  const esPeligroMaximo = estaSancionado || inasistenciasSemana >= 3;
  const esAdvertenciaMedia = inasistenciasSemana === 2;
  const esAdvertenciaLeve = inasistenciasSemana === 1;
  const esOptimo = !estaSancionado && inasistenciasSemana === 0;

  // Estilos de la tarjeta según nivel
  let tema = {
    borde: "border-emerald-200",
    bg: "bg-gradient-to-r from-emerald-50 to-teal-50",
    textoTitulo: "text-emerald-900",
    textoDesc: "text-emerald-700",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
    icon: <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />,
    titulo: "Asistencia al día",
    descripcion: "No registras inasistencias en comidas reservadas esta semana. ¡Excelente!"
  };

  if (esPeligroMaximo) {
    tema = {
      borde: "border-red-300",
      bg: "bg-gradient-to-r from-red-50 to-rose-50",
      textoTitulo: "text-red-900",
      textoDesc: "text-red-700",
      badgeBg: "bg-red-100 text-red-800 border-red-300 animate-pulse",
      icon: <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />,
      titulo: estaSancionado ? "Cuenta Sancionada" : "Límite de Inasistencias Alcanzado",
      descripcion: tripleFallaMismoDia
        ? "Se aplicó sanción automática por dejar vencer las 3 comidas (Desayuno, Almuerzo y Cena) en el mismo día."
        : esExterno
        ? "Has acumulado 3 inasistencias de almuerzo en la semana. Para restablecer tus permisos, debes solicitar la revocación con Coordinación o Bienestar."
        : "Tu cuenta se encuentra sancionada. Para restablecer tus permisos, debes solicitar la revocación con Coordinación o Bienestar."
    };
  } else if (esAdvertenciaMedia) {
    tema = {
      borde: "border-orange-300",
      bg: "bg-gradient-to-r from-orange-50 to-amber-50",
      textoTitulo: "text-orange-950",
      textoDesc: "text-orange-800",
      badgeBg: "bg-orange-100 text-orange-900 border-orange-300",
      icon: <AlertOctagon className="w-5 h-5 text-orange-600 shrink-0" />,
      titulo: "¡Advertencia de Inasistencias!",
      descripcion: esExterno
        ? "Tienes 2 de 3 inasistencias de almuerzo acumuladas esta semana. Una inasistencia más ocasionará la sanción automática."
        : "Registras 2 inasistencias esta semana. Recuerda consumir tus comidas reservadas o cancelarlas con anticipación."
    };
  } else if (esAdvertenciaLeve) {
    tema = {
      borde: "border-amber-300",
      bg: "bg-gradient-to-r from-amber-50 to-yellow-50",
      textoTitulo: "text-amber-950",
      textoDesc: "text-amber-800",
      badgeBg: "bg-amber-100 text-amber-900 border-amber-300",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
      titulo: "Aviso Preventivo",
      descripcion: "Registras 1 inasistencia esta semana. Recuerda consumir tus reservas a tiempo para evitar inconvenientes."
    };
  }

  return (
    <div className={`rounded-2xl border ${tema.borde} ${tema.bg} p-4 shadow-sm transition-all duration-300 space-y-3`}>
      {/* Encabezado con estado y slots */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5">{tema.icon}</div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-semibold text-sm sm:text-base ${tema.textoTitulo}`}>
                {tema.titulo}
              </h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${tema.badgeBg}`}>
                {estaSancionado ? "SANCIONADO" : `${inasistenciasSemana}/${maxInasistencias} Inasistencias`}
              </span>
            </div>
            <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${tema.textoDesc}`}>
              {tema.descripcion}
            </p>
          </div>
        </div>
      </div>

      {/* Indicador Visual de Ranuras (Slots 1, 2, 3) */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2.5 border border-black/5 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          Inasistencias de la semana:
        </span>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((num) => {
            const ocupado = num <= inasistenciasSemana || (estaSancionado && num <= Math.max(inasistenciasSemana, 3));
            let slotColor = "bg-gray-200 text-gray-400 border-gray-200";

            if (ocupado) {
              if (esPeligroMaximo) {
                slotColor = "bg-red-500 text-white border-red-600 shadow-sm shadow-red-200";
              } else if (esAdvertenciaMedia) {
                slotColor = "bg-orange-500 text-white border-orange-600 shadow-sm shadow-orange-200";
              } else {
                slotColor = "bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-200";
              }
            }

            return (
              <div
                key={num}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all ${slotColor}`}
                title={ocupado ? `Falla #${num} registrada` : `Cupo libre (${num}/3)`}
              >
                {num}
              </div>
            );
          })}
        </div>
      </div>

      {/* Regla recordatorio y detalles */}
      <div className="pt-1 flex items-center justify-between text-[11px] text-gray-500 border-t border-black/5">
        <div className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-gray-400" />
          <span>El contador se reinicia automáticamente cada lunes.</span>
        </div>

        {detalle.length > 0 && (
          <button
            type="button"
            onClick={() => setMostrarDetalles(!mostrarDetalles)}
            className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span>{mostrarDetalles ? "Ocultar fallas" : "Ver fallas"} ({detalle.length})</span>
            {mostrarDetalles ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Desplegable de fallas de la semana */}
      {mostrarDetalles && detalle.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-2.5 space-y-1.5 text-xs text-gray-700 animate-fadeIn">
          <p className="font-semibold text-gray-800 text-[11px] uppercase tracking-wide">
            Reservas vencidas en la semana actual:
          </p>
          <ul className="divide-y divide-gray-100">
            {detalle.map((falla, idx) => (
              <li key={falla.Id_Reserva || idx} className="py-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-medium">{falla.Fec_Reserva}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{falla.Tip_Reserva}</span>
                </span>
                <span className="text-red-600 font-medium px-2 py-0.5 bg-red-50 rounded text-[10px]">
                  Vencido
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
