// Components/NavBar/NavNotificaciones.jsx
// Campanita de notificaciones en tiempo real con Socket.IO, filtro por categorias y ventanas emergentes
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, Check, CheckCheck, Info, AlertCircle, CheckCircle2,
  Clock, Gift, ArrowRightLeft, X, ExternalLink, Sparkles, Filter
} from "lucide-react";
import apiNode from "../../api/axiosConfig";
import { useSocketListener } from "../../api/socket";

export default function NavNotificaciones({ usuario }) {
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState("todas");
  const [popupsEmergentes, setPopupsEmergentes] = useState([]);
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

  // Agrega una ventana emergente que desaparece sola a los 8 segundos
  const dispararEmergente = (notif) => {
    const idEmergente = Date.now() + Math.random();
    const nuevoPopup = { ...notif, _popupId: idEmergente };

    setPopupsEmergentes((prev) => [nuevoPopup, ...prev.slice(0, 2)]);

    setTimeout(() => {
      setPopupsEmergentes((prev) => prev.filter((p) => p._popupId !== idEmergente));
    }, 8500);
  };

  const cerrarEmergente = (popupId) => {
    setPopupsEmergentes((prev) => prev.filter((p) => p._popupId !== popupId));
  };

  // Escuchar notificaciones en tiempo real vía WebSockets
  useSocketListener("notificacion:nueva", (data) => {
    if (data?.notificacion) {
      const notif = data.notificacion;
      setNotificaciones((prev) => [notif, ...prev]);
      setNoLeidas((prev) => prev + 1);

      // Si es relevante, mostrar ventana emergente
      if (notif.Tipo === "bolsa_solidaria" || notif.Tipo === "cesion" || notif.Tipo === "urgente") {
        dispararEmergente(notif);
      }
    }
  });

  useSocketListener("notificacion:bolsa_solidaria", (data) => {
    if (data?.notificacion) {
      const notif = data.notificacion;
      setNotificaciones((prev) => {
        if (prev.some((n) => n.Id_Notificacion === notif.Id_Notificacion)) return prev;
        return [notif, ...prev];
      });
      dispararEmergente(notif);
    }
  });

  useSocketListener("notificacion:cesion", (data) => {
    if (data?.notificacion) {
      const notif = data.notificacion;
      setNotificaciones((prev) => {
        if (prev.some((n) => n.Id_Notificacion === notif.Id_Notificacion)) return prev;
        return [notif, ...prev];
      });
      dispararEmergente(notif);
    }
  });

  // Cerrar cajon al hacer clic fuera
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
    if (e) e.stopPropagation();
    try {
      await apiNode.patch(`/api/Notificaciones/${id}/leer`);
      setNotificaciones((prev) =>
        prev.map((n) => (n.Id_Notificacion === id ? { ...n, Leido: true } : n))
      );
      setNoLeidas((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error al marcar leida:", err);
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      await apiNode.patch("/api/Notificaciones/leer-todas");
      setNotificaciones((prev) => prev.map((n) => ({ ...n, Leido: true })));
      setNoLeidas(0);
    } catch (err) {
      console.error("Error al marcar todas leidas:", err);
    }
  };

  // Clasificador de categoria
  const esBolsa = (n) =>
    n.Tipo === "bolsa_solidaria" ||
    (n.Titulo && n.Titulo.toLowerCase().includes("bolsa solidaria")) ||
    (n.Mensaje && n.Mensaje.toLowerCase().includes("bolsa solidaria"));

  const esCesion = (n) =>
    n.Tipo === "cesion" ||
    (n.Titulo && (n.Titulo.toLowerCase().includes("ced") || n.Titulo.toLowerCase().includes("cesi"))) ||
    (n.Mensaje && (n.Mensaje.toLowerCase().includes("ced") || n.Mensaje.toLowerCase().includes("cesi")));

  const notificacionesFiltradas = notificaciones.filter((n) => {
    if (categoriaActiva === "todas") return true;
    if (categoriaActiva === "bolsa") return esBolsa(n);
    if (categoriaActiva === "cesiones") return esCesion(n);
    if (categoriaActiva === "sistema") return !esBolsa(n) && !esCesion(n);
    return true;
  });

  const contarBolsa = notificaciones.filter(esBolsa).length;
  const contarCesiones = notificaciones.filter(esCesion).length;
  const contarSistema = notificaciones.filter((n) => !esBolsa(n) && !esCesion(n)).length;

  const renderIcono = (notif) => {
    if (esBolsa(notif)) {
      return (
        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <Gift className="w-4 h-4" />
        </div>
      );
    }
    if (esCesion(notif)) {
      return (
        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
          <ArrowRightLeft className="w-4 h-4" />
        </div>
      );
    }
    switch (notif.Tipo) {
      case "exito":
        return (
          <div className="w-8 h-8 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      case "alerta":
      case "urgente":
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#2E5792] flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
        );
    }
  };

  const irADestino = (notif) => {
    if (notif.Id_Notificacion && !notif.Leido) {
      marcarComoLeida(notif.Id_Notificacion);
    }
    setAbierto(false);

    const rol = localStorage.getItem("rolActivo") || "";
    if (esBolsa(notif)) {
      if (rol.includes("Interno")) navigate("/Interno/Reservar");
      else if (rol.includes("Externo")) navigate("/Externo/Reservar");
      else navigate("/reservas");
    } else if (esCesion(notif)) {
      if (rol.includes("Interno")) navigate("/Interno/Reservar");
      else if (rol.includes("Externo")) navigate("/Externo/Reservar");
      else navigate("/reservas");
    }
  };

  return (
    <>
      {/* Ventanas Emergentes Flotantes (Toasts / Pop-ups en vivo) */}
      <div className="fixed top-18 right-4 sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {popupsEmergentes.map((popup) => {
          const esDeBolsa = esBolsa(popup);
          const esDeCesion = esCesion(popup);

          return (
            <div
              key={popup._popupId}
              className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-4 flex items-start gap-3.5 ${
                esDeBolsa
                  ? "bg-white/95 border-emerald-300 text-slate-800 shadow-emerald-500/20"
                  : esDeCesion
                  ? "bg-white/95 border-indigo-300 text-slate-800 shadow-indigo-500/20"
                  : "bg-white/95 border-blue-200 text-slate-800 shadow-blue-500/15"
              }`}
            >
              {renderIcono(popup)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    esDeBolsa
                      ? "bg-emerald-100 text-emerald-800"
                      : esDeCesion
                      ? "bg-indigo-100 text-indigo-800"
                      : "bg-blue-100 text-[#2E5792]"
                  }`}>
                    {esDeBolsa ? "Bolsa Solidaria" : esDeCesion ? "Cesion de Racion" : "Aviso de Sistema"}
                  </span>
                  <button
                    type="button"
                    onClick={() => cerrarEmergente(popup._popupId)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h4 className="text-xs font-black text-slate-900 mt-1 leading-snug">
                  {popup.Titulo}
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  {popup.Mensaje}
                </p>
                <div className="flex items-center gap-2 mt-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      cerrarEmergente(popup._popupId);
                      irADestino(popup);
                    }}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg text-white transition-all cursor-pointer flex items-center gap-1 ${
                      esDeBolsa
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : esDeCesion
                        ? "bg-indigo-600 hover:bg-indigo-700"
                        : "bg-[#2E5792] hover:bg-[#203e68]"
                    }`}
                  >
                    <span>Ver detalle</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => cerrarEmergente(popup._popupId)}
                    className="text-[11px] text-slate-500 hover:text-slate-700 font-medium px-2 py-1 rounded"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Campanita y Boton del Cajon */}
      <div className="relative" ref={panelRef}>
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

        {/* Cajon Desplegable Mejorado */}
        {abierto && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white text-slate-800 shadow-2xl border border-slate-200 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[560px]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-800">Centro de Notificaciones</span>
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

            {/* Pestañas de Filtro por Categoria */}
            <div className="flex items-center gap-1 p-2 bg-slate-100/70 border-b border-slate-200 overflow-x-auto shrink-0 text-xs font-medium">
              <button
                type="button"
                onClick={() => setCategoriaActiva("todas")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  categoriaActiva === "todas"
                    ? "bg-white text-slate-900 font-bold shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <span>Todas</span>
                <span className="text-[10px] px-1 py-0.2 rounded-full bg-slate-200 font-semibold">
                  {notificaciones.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setCategoriaActiva("bolsa")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  categoriaActiva === "bolsa"
                    ? "bg-emerald-600 text-white font-bold shadow-sm"
                    : "text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                <Gift className="w-3 h-3" />
                <span>Bolsa</span>
                {contarBolsa > 0 && (
                  <span className={`text-[10px] px-1 rounded-full font-semibold ${
                    categoriaActiva === "bolsa" ? "bg-emerald-800 text-white" : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {contarBolsa}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setCategoriaActiva("cesiones")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  categoriaActiva === "cesiones"
                    ? "bg-indigo-600 text-white font-bold shadow-sm"
                    : "text-indigo-700 hover:bg-indigo-50"
                }`}
              >
                <ArrowRightLeft className="w-3 h-3" />
                <span>Cesiones</span>
                {contarCesiones > 0 && (
                  <span className={`text-[10px] px-1 rounded-full font-semibold ${
                    categoriaActiva === "cesiones" ? "bg-indigo-800 text-white" : "bg-indigo-100 text-indigo-800"
                  }`}>
                    {contarCesiones}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setCategoriaActiva("sistema")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  categoriaActiva === "sistema"
                    ? "bg-blue-600 text-white font-bold shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <span>Sistema</span>
                {contarSistema > 0 && (
                  <span className={`text-[10px] px-1 rounded-full font-semibold ${
                    categoriaActiva === "sistema" ? "bg-blue-800 text-white" : "bg-slate-200 text-slate-700"
                  }`}>
                    {contarSistema}
                  </span>
                )}
              </button>
            </div>

            {/* Lista de Notificaciones */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {cargando ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Cargando notificaciones...
                </div>
              ) : notificacionesFiltradas.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-medium">No hay notificaciones en esta seccion</p>
                </div>
              ) : (
                notificacionesFiltradas.map((n) => (
                  <div
                    key={n.Id_Notificacion}
                    onClick={() => irADestino(n)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50 ${
                      n.Leido ? "bg-white opacity-80" : "bg-blue-50/40"
                    }`}
                  >
                    {renderIcono(n)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs ${n.Leido ? "font-semibold text-slate-700" : "font-black text-slate-900"}`}>
                          {n.Titulo}
                        </p>
                        {!n.Leido && (
                          <span className="w-2 h-2 rounded-full bg-[#2E5792] shrink-0"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.Mensaje}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-1">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(n.Fecha_Creacion).toLocaleDateString("es-CO", {
                              day: "2-digit",
                              month: "short"
                            })}{" "}
                            {new Date(n.Fecha_Creacion).toLocaleTimeString("es-CO", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {!n.Leido && (
                          <button
                            type="button"
                            onClick={(e) => marcarComoLeida(n.Id_Notificacion, e)}
                            title="Marcar como leida"
                            className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer con accion rápida */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
              <span>{notificacionesFiltradas.length} notificaciones visibles</span>
              <button
                type="button"
                onClick={cargarNotificaciones}
                className="text-[#2E5792] hover:underline font-semibold cursor-pointer"
              >
                Actualizar lista
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
