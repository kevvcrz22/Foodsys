// Components/InactividadModal.jsx
// Monitor de inactividad de 5 minutos con modal de advertencia a los 30 segundos
import React, { useState, useEffect, useRef, useCallback } from "react";
import { AlertTriangle, Clock, LogOut, CheckCircle } from "lucide-react";

const ROLES_CON_TIMEOUT = [
  "Aprendiz Interno",
  "Aprendiz Externo",
  "Pasante Interno",
  "Pasante Externo"
];

const TIEMPO_TOTAL_MS = 5 * 60 * 1000; // 5 minutos = 300,000 ms
const TIEMPO_ADVERTENCIA_MS = 30 * 1000; // 30 segundos de advertencia
const TIEMPO_INACTIVIDAD_TRIGGER = TIEMPO_TOTAL_MS - TIEMPO_ADVERTENCIA_MS; // 4 min 30 s = 270,000 ms

export default function InactividadModal({ rolActivo, onCerrarSesion }) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(30);

  const timerAdvertenciaRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const tiempoFinalRef = useRef(null);

  const aplicaTimeout = rolActivo && ROLES_CON_TIMEOUT.includes(rolActivo);

  const limpiarTemporizadores = useCallback(() => {
    if (timerAdvertenciaRef.current) clearTimeout(timerAdvertenciaRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }, []);

  const forzarCierrePorInactividad = useCallback(() => {
    limpiarTemporizadores();
    setMostrarModal(false);
    if (onCerrarSesion) {
      onCerrarSesion(true); // true indica que fue por inactividad
    }
  }, [limpiarTemporizadores, onCerrarSesion]);

  const iniciarCuentaRegresiva = useCallback(() => {
    setMostrarModal(true);
    setSegundosRestantes(30);
    tiempoFinalRef.current = Date.now() + TIEMPO_ADVERTENCIA_MS;

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = setInterval(() => {
      const msRestantes = tiempoFinalRef.current - Date.now();
      const seg = Math.ceil(msRestantes / 1000);

      if (seg <= 0) {
        clearInterval(countdownIntervalRef.current);
        forzarCierrePorInactividad();
      } else {
        setSegundosRestantes(seg);
      }
    }, 1000);
  }, [forzarCierrePorInactividad]);

  const reiniciarTemporizador = useCallback(() => {
    if (!aplicaTimeout) return;
    limpiarTemporizadores();
    setMostrarModal(false);

    timerAdvertenciaRef.current = setTimeout(() => {
      iniciarCuentaRegresiva();
    }, TIEMPO_INACTIVIDAD_TRIGGER);
  }, [aplicaTimeout, limpiarTemporizadores, iniciarCuentaRegresiva]);

  // Escuchar eventos de interacción del usuario solo cuando el modal no esté visible
  useEffect(() => {
    if (!aplicaTimeout) {
      limpiarTemporizadores();
      setMostrarModal(false);
      return;
    }

    reiniciarTemporizador();

    const eventos = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];

    const manejarActividad = () => {
      if (!mostrarModal) {
        reiniciarTemporizador();
      }
    };

    eventos.forEach(ev => window.addEventListener(ev, manejarActividad, { passive: true }));

    return () => {
      limpiarTemporizadores();
      eventos.forEach(ev => window.removeEventListener(ev, manejarActividad));
    };
  }, [aplicaTimeout, mostrarModal, reiniciarTemporizador, limpiarTemporizadores]);

  if (!mostrarModal || !aplicaTimeout) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-amber-200 text-center">
        {/* Ícono de alerta pulsante */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shadow-sm animate-bounce">
          <Clock className="h-8 w-8" />
        </div>

        <h3 className="text-xl font-black text-slate-800 tracking-tight">
          ¿Sigues ahí?
        </h3>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Por motivos de seguridad para tu rol de <span className="font-bold text-slate-800">{rolActivo}</span>, tu sesión se cerrará automáticamente en:
        </p>

        {/* Contador circular / número */}
        <div className="my-6 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 border-4 border-amber-500 font-black text-3xl text-amber-600 shadow-inner">
            {segundosRestantes}s
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            type="button"
            onClick={reiniciarTemporizador}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#2E5792] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 hover:bg-[#234574] transition-all cursor-pointer active:scale-95"
          >
            <CheckCircle className="w-4 h-4" />
            Continuar sesión
          </button>
          <button
            type="button"
            onClick={forzarCierrePorInactividad}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all cursor-pointer active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            Cerrar ahora
          </button>
        </div>
      </div>
    </div>
  );
}
