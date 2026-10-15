// Components/NavBar/NavNotificaciones.jsx
// Campanita de notificaciones en tiempo real con Socket.IO y badge interactivo
import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, Info, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import apiNode from "../../api/axiosConfig";
import { useSocketListener } from "../../api/socket";

export default function NavNotificaciones({ usuario }) {
  const [abierto, setAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(false);
  const panelRef = useRef(null);

  const cargarNotificaciones = async () => {
    try {
      setCargando(true);
      const res = await apiNode.get("/api/Notificaciones");
      setNotificaciones(res.data?.notificaciones || []);
      setNoLeidas(res.data?.noLeidas || 0);
    } catch (err) {
      console.warn("No se pudieron cargar notificaciones:", err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (usuario) {
      cargarNotificaciones();
    }
  }, [usuario]);

  // Escuchar notificaciones en tiempo real vía WebSockets
  useSocketListener("notificacion:nueva", (data) => {
    if (data?.notificacion) {
      setNotificaciones((prev) => [data.notificacion, ...prev]);
      setNoLeidas((prev) => prev + 1);
    }
  });

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const clickAfuera = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setAbierto(false);
      }
    };
    if (abierto) {
      document.addEventListener("mousedown", clickAfuera);
    }
    return () => document.removeEventListener("mousedown", clickAfuera);
  }, [abierto]);

  const marcarComoLeida = async (id, e) => {
    e.stopPropagation();
    try {
      await apiNode.patch(`/api/Notificaciones/${id}/leer`);
      setNotificaciones((prev) =>
        prev.map((n) => (n.Id_Notificacion === id ? { ...n, Leido: true } : n))
      );
      setNoLeidas((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error al marcar leída:", err);
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      await apiNode.patch("/api/Notificaciones/leer-todas");
      setNotificaciones((prev) => prev.map((n) => ({ ...n, Leido: true })));
      setNoLeidas(0);
    } catch (err) {
      console.error("Error al marcar todas leídas:", err);
    }
  };

  const renderIcono = (tipo) => {
    switch (tipo) {
      case "exito":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
      case "alerta":
      case "urgente":
        return <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Botón Campanita */}
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="relative p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center justify-center active:scale-95"
        title="Notificaciones"
        aria-label="Abrir notificaciones"
      >
        <Bell className="w-5 h-5" />
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-red-500 text-[11px] font-black text-white shadow-md animate-pulse">
            {noLeidas > 99 ? "99+" : noLeidas}
          </span>
        )}
      </button>

      {/* Menú Desplegable */}
      {abierto && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white text-slate-800 shadow-2xl border border-slate-200 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-800">Notificaciones</span>
              {noLeidas > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-[#2E5792]">
                  {noLeidas} nuevas
                </span>
              )}
            </div>
            {noLeidas > 0 && (
              <button
                type="button"
                onClick={marcarTodasLeidas}
                className="text-xs font-semibold text-[#2E5792] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar todas
              </button>
            )}
          </div>

          {/* Lista de Notificaciones */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {cargando ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Cargando notificaciones...
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">No tienes notificaciones pendientes</p>
              </div>
            ) : (
              notificaciones.map((n) => (
                <div
                  key={n.Id_Notificacion}
                  onClick={(e) => !n.Leido && marcarComoLeida(n.Id_Notificacion, e)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    n.Leido ? "bg-white hover:bg-slate-50 opacity-75" : "bg-blue-50/50 hover:bg-blue-50"
                  }`}
                >
                  {renderIcono(n.Tipo)}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${n.Leido ? "font-semibold text-slate-700" : "font-black text-slate-900"}`}>
                      {n.Titulo}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {n.Mensaje}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(n.Fecha_Creacion).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  {!n.Leido && (
                    <button
                      type="button"
                      onClick={(e) => marcarComoLeida(n.Id_Notificacion, e)}
                      title="Marcar como leída"
                      className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
