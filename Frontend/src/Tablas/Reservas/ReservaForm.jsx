// Frontend/src/Tablas/Reservas/ReservaForm.jsx
// Formulario de reservas Foodsys con seleccion de Plato + Bebida (Fria/Caliente),
// motor de horarios oficial (ciclo 22:30 y excepcion del 27 de octubre),
// modal llamativo de confirmacion de tiempos y tarjeta informativa de politicas.
// Comentarios didacticos sin tildes ni emojis para aprendices de primer semestre.

import { useState, useEffect, useCallback, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import apiAxios from "../../api/axiosConfig.js";
import AlertaInasistencias from "./AlertaInasistencias.jsx";
import {
  UtensilsCrossed, CalendarDays, Clock, CheckCircle2, AlertCircle,
  Coffee, Snowflake, Flame, ShieldAlert, Check, X, Sparkles, HelpCircle,
  ChevronRight, Calendar
} from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

// Horarios oficiales de vencimiento del servicio en comedor
const horasVencimientoDetalle = {
  Desayuno: { horaStr: "08:00 AM", fin: "08:00:00" },
  Almuerzo: { horaStr: "01:30 PM (13:30)", fin: "13:30:00" },
  Cena:     { horaStr: "08:00 PM (20:00)", fin: "20:00:00" }
};

// Formateador de fechas legible en espanol
const formatearFechaLarga = (fechaIso) => {
  if (!fechaIso) return "";
  try {
    const [y, m, d] = fechaIso.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat("es-CO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  } catch (_) {
    return fechaIso;
  }
};

const ReservaForm = ({ hideModal, reserva, Edit, reload, mostrarQR }) => {
  const [tiposPermitidos, setTiposPermitidos] = useState([]);
  const [estadoInasistencias, setEstadoInasistencias] = useState(null);
  const [cargandoInasistencias, setCargandoInasistencias] = useState(true);

  // Tipo de comida elegido
  const [tipReserva, setTipReserva] = useState(reserva?.Tip_Reserva || reserva?.Tipo || "");

  // Lista de items del menu cargados desde la API
  const [menuItems, setMenuItems] = useState([]);

  // Seleccion de Plato Fuerte
  const [platoElegido, setPlatoElegido] = useState(reserva?.Id_Plato || "");
  const [platoSeleccionado, setPlatoSeleccionado] = useState(reserva?.plato || null);

  // Seleccion de Bebida (Fria o Caliente)
  const [bebidaElegida, setBebidaElegida] = useState(reserva?.Id_Bebida || "");
  const [bebidaSeleccionada, setBebidaSeleccionada] = useState(reserva?.bebida || null);

  // Modal interactivo de confirmacion de tiempos
  const [modalConfirmacionVisible, setModalConfirmacionVisible] = useState(false);

  // QR generado
  const [qrData, setQrData] = useState(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Calculo de fecha segun ciclo oficial (22:30) y excepcion temporal del 27 de octubre
  const { fechaObjetivoCalculada, esExcepcion27Oct } = useMemo(() => {
    const ahora = new Date();
    const hoyStr = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(ahora);
    const horaStr = new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/Bogota",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(ahora);

    const [hh, mm] = horaStr.split(":").map(Number);
    const minutos = hh * 60 + mm;

    // 1. Excepcion unica del 27 de octubre de 2026 para Almuerzo hasta las 08:00 AM
    if (hoyStr === "2026-10-26" || (hoyStr === "2026-10-27" && (hh < 8 || (hh === 8 && mm === 0)))) {
      return {
        fechaObjetivoCalculada: "2026-10-27",
        esExcepcion27Oct: true
      };
    }

    // 2. Regla General de Ciclo a las 10:30 PM (22:30 = 1350 minutos):
    const [y, m, d] = hoyStr.split("-").map(Number);
    if (minutos <= 1350) {
      // Hasta las 10:30:00 PM agenda para manana
      const manana = new Date(Date.UTC(y, m - 1, d + 1, 12, 0, 0));
      return {
        fechaObjetivoCalculada: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(manana),
        esExcepcion27Oct: false
      };
    } else {
      // A partir de las 10:31:00 PM agenda para pasado manana
      const pasadoManana = new Date(Date.UTC(y, m - 1, d + 2, 12, 0, 0));
      return {
        fechaObjetivoCalculada: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(pasadoManana),
        esExcepcion27Oct: false
      };
    }
  }, []);

  const [fechaReserva, setFechaReserva] = useState(reserva?.Fec_Reserva || fechaObjetivoCalculada);

  useEffect(() => {
    if (!reserva?.Fec_Reserva) {
      setFechaReserva(fechaObjetivoCalculada);
    }
  }, [fechaObjetivoCalculada, reserva]);

  const urlImagen = (nombreArchivo) => {
    if (!nombreArchivo) return null;
    if (nombreArchivo.startsWith("http")) return nombreArchivo;
    return `${API_URL}/uploads/${nombreArchivo}`;
  };

  const obtenerEstadoInasistencias = useCallback(async () => {
    try {
      setCargandoInasistencias(true);
      const res = await apiAxios.get("/api/Reservas/reservar/estado-inasistencias");
      setEstadoInasistencias(res.data);
    } catch (err) {
      console.error("Error al obtener estado de inasistencias:", err);
    } finally {
      setCargandoInasistencias(false);
    }
  }, []);

  useEffect(() => {
    const obtenerTipos = async () => {
      try {
        const res = await apiAxios.get("/api/Reservas/reservar/Tipos-Permitidos");
        const tipos = res.data.tiposPermitidos || ["Desayuno", "Almuerzo", "Cena"];
        setTiposPermitidos(tipos);
      } catch (err) {
        setTiposPermitidos(["Desayuno", "Almuerzo", "Cena"]);
      }
    };
    obtenerTipos();
    obtenerEstadoInasistencias();
  }, [obtenerEstadoInasistencias]);

  // Cargar menu cuando cambia fecha o tipo
  useEffect(() => {
    if (tipReserva && fechaReserva) {
      cargarMenuDelTurno(tipReserva, fechaReserva);
    }
  }, [tipReserva, fechaReserva]);

  const cargarMenuDelTurno = async (tipo, fecha) => {
    setMenuItems([]);
    setPlatoElegido("");
    setPlatoSeleccionado(null);
    setBebidaElegida("");
    setBebidaSeleccionada(null);
    setQrData(null);
    setError("");

    try {
      const res = await apiAxios.get(`/api/Reservas/reservar/Menu/${fecha}/${tipo}`);
      const lista = Array.isArray(res.data) ? res.data : [];
      setMenuItems(lista);

      // Preseleccionar primer plato si existe
      const platosF = lista.filter((it) => {
        const p = it.plato || it;
        return p.Tipo_Item !== "BEBIDA";
      });
      if (platosF.length > 0) {
        const primerPlato = platosF[0].plato || platosF[0];
        const id = platosF[0].Id_Plato || primerPlato.Id_Plato;
        setPlatoElegido(id);
        setPlatoSeleccionado(primerPlato);
      }

      // Preseleccionar primera bebida si existe
      const bebidasF = lista.filter((it) => {
        const p = it.plato || it;
        return p.Tipo_Item === "BEBIDA";
      });
      if (bebidasF.length > 0) {
        const primeraBebida = bebidasF[0].plato || bebidasF[0];
        const idBeb = bebidasF[0].Id_Plato || primeraBebida.Id_Plato;
        setBebidaElegida(idBeb);
        setBebidaSeleccionada(primeraBebida);
      }
    } catch (err) {
      setError(err.response?.data?.message || "No hay menu programado para este turno.");
    }
  };

  // Separar platos y bebidas del menu cargado
  const { platosDisponibles, bebidasDisponibles } = useMemo(() => {
    const pF = [];
    const bF = [];
    menuItems.forEach((it) => {
      const p = it.plato || it;
      if (p.Tipo_Item === "BEBIDA") {
        bF.push(p);
      } else {
        pF.push(p);
      }
    });
    return { platosDisponibles: pF, bebidasDisponibles: bF };
  }, [menuItems]);

  const abrirModalConfirmacion = () => {
    if (!tipReserva) {
      toast.error("Selecciona el tipo de comida");
      return;
    }
    if (!platoElegido) {
      toast.error("Debes seleccionar un plato de la lista");
      return;
    }
    if (bebidasDisponibles.length > 0 && !bebidaElegida) {
      toast.error("Debes seleccionar una bebida para tu reserva");
      return;
    }
    setModalConfirmacionVisible(true);
  };

  const ejecutarReservaConfirmada = async () => {
    setModalConfirmacionVisible(false);
    setGuardando(true);
    setError("");

    const body = {
      Tip_Reserva: tipReserva,
      platoElegido: platoElegido,
      Id_Bebida: bebidaElegida || null,
      idBebida: bebidaElegida || null,
      fechaReserva: fechaReserva,
    };

    try {
      const res = await apiAxios.post("/api/Reservas/reservar/generate-tomorrow", body);
      setQrData(res.data);
      toast.success("¡Reserva confirmada y generada exitosamente!");
      obtenerEstadoInasistencias();
      if (reload) reload();
      window.dispatchEvent(new Event("reservasActualizadas"));
      if (mostrarQR && res.data.Qr_Reserva) {
        mostrarQR(res.data.Qr_Reserva);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Error al procesar la reserva";
      setError(msg);
      toast.error(msg);
    } finally {
      setGuardando(false);
    }
  };

  const estaSancionado = estadoInasistencias?.estaSancionado;
  const horaFinTurno = horasVencimientoDetalle[tipReserva]?.horaStr || "13:30";

  return (
    <div className="w-full mx-auto space-y-4">
      {/* Alerta de inasistencias del aprendiz */}
      {!Edit && !hideModal && (
        <AlertaInasistencias
          estado={estadoInasistencias}
          cargando={cargandoInasistencias}
          alRecargar={obtenerEstadoInasistencias}
        />
      )}

      {/* Banner Superior Destacado: Fecha Objetivo y Excepcion */}
      <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-4 sm:p-5 rounded-2xl shadow-md space-y-1">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-200 font-bold">
          <Calendar size={15} /> Ciclo Oficial de Reservas (Cierre 10:30 PM)
        </div>
        <p className="text-sm sm:text-base font-extrabold m-0 capitalize">
          En este momento estás reservando para el día: {formatearFechaLarga(fechaReserva)}
        </p>
        {esExcepcion27Oct && (
          <p className="text-xs text-amber-200 font-medium m-0 flex items-center gap-1.5 pt-1">
            <Sparkles size={13} className="text-amber-300 shrink-0" />
            Excepción habilitada: Almuerzo del martes 27 de octubre disponible hasta las 08:00 AM.
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl p-4 sm:p-6 space-y-5 border border-slate-100 shadow-sm">
        {error && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 text-xs px-4 py-3 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {estaSancionado && !Edit ? (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-center space-y-2">
            <ShieldAlert className="w-8 h-8 text-rose-600 mx-auto" />
            <p className="text-rose-900 font-bold text-sm m-0">Módulo de Reservas Inhabilitado</p>
            <p className="text-rose-700 text-xs leading-relaxed m-0">
              No es posible programar nuevas reservas mientras tengas una sanción activa en el sistema por inasistencia.
            </p>
          </div>
        ) : (
          <>
            {/* 1. Selector de Tipo de Comida */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Selecciona tu Comida
              </label>
              <div className="grid grid-cols-3 gap-2">
                {tiposPermitidos.map((tipo) => {
                  const sel = tipReserva === tipo;
                  return (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setTipReserva(tipo)}
                      className={`py-3 px-2 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        sel
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span>{tipo === "Desayuno" ? "🍳 Desayuno" : tipo === "Almuerzo" ? "🍽️ Almuerzo" : "🌙 Cena"}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Vence {horasVencimientoDetalle[tipo]?.horaStr || "13:30"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Seleccion de Plato Fuerte */}
            {tipReserva && (
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <UtensilsCrossed size={14} className="text-emerald-600" /> 2. Elige tu Plato Fuerte
                  </label>
                  {platoSeleccionado && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      Seleccionado
                    </span>
                  )}
                </div>

                {platosDisponibles.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center text-slate-500 text-xs">
                    No hay platos programados en el menú de {tipReserva} para el {fechaReserva}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {platosDisponibles.map((p) => {
                      const isSelected = platoElegido === p.Id_Plato;
                      const imagen = p.Img_Plato;

                      return (
                        <div
                          key={p.Id_Plato}
                          onClick={() => {
                            setPlatoElegido(p.Id_Plato);
                            setPlatoSeleccionado(p);
                          }}
                          className={`cursor-pointer rounded-2xl border-2 p-3 transition-all flex flex-col justify-between ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          {imagen ? (
                            <div className="w-full h-28 rounded-xl overflow-hidden bg-slate-100 mb-2">
                              <img src={urlImagen(imagen)} alt={p.Nom_Plato} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-full h-20 bg-slate-100 rounded-xl flex items-center justify-center text-slate-300 mb-2">
                              <UtensilsCrossed size={20} />
                            </div>
                          )}

                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <p className="text-xs font-bold text-slate-800 m-0">{p.Nom_Plato}</p>
                              {p.Des_Plato && (
                                <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 m-0">{p.Des_Plato}</p>
                              )}
                            </div>
                            {isSelected && (
                              <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 text-[10px]">
                                ✓
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 3. Seleccion de Bebida (Fria o Caliente) */}
            {tipReserva && bebidasDisponibles.length > 0 && (
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <Coffee size={14} className="text-blue-600" /> 3. Elige tu Bebida (Fria o Caliente)
                  </label>
                  {bebidaSeleccionada && (
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                      Seleccionada
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {bebidasDisponibles.map((b) => {
                    const isSelected = bebidaElegida === b.Id_Plato;
                    const esCaliente = b.Subtipo_Bebida === "CALIENTE";

                    return (
                      <div
                        key={b.Id_Plato}
                        onClick={() => {
                          setBebidaElegida(b.Id_Plato);
                          setBebidaSeleccionada(b);
                        }}
                        className={`cursor-pointer rounded-2xl border-2 p-3 transition-all flex items-center gap-3 ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        {b.Img_Plato ? (
                          <img src={urlImagen(b.Img_Plato)} alt={b.Nom_Plato} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 text-blue-500">
                            <Coffee size={18} />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              esCaliente ? "bg-amber-100 text-amber-800" : "bg-cyan-100 text-cyan-800"
                            }`}>
                              {esCaliente ? "☕ Caliente" : "🧊 Fria"}
                            </span>
                            <p className="text-xs font-bold text-slate-800 truncate m-0">{b.Nom_Plato}</p>
                          </div>
                          {b.Des_Plato && <p className="text-[11px] text-slate-400 truncate m-0">{b.Des_Plato}</p>}
                        </div>

                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-[10px]">
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Resumen Previo */}
            {tipReserva && platoSeleccionado && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                <p className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Resumen de tu seleccion
                </p>
                <div className="flex justify-between text-slate-600">
                  <span>Fecha de consumo:</span>
                  <span className="font-bold text-slate-800">{formatearFechaLarga(fechaReserva)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Vencimiento del servicio:</span>
                  <span className="font-bold text-slate-800">{horaFinTurno}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                  <span>Plato fuerte:</span>
                  <span className="font-bold text-emerald-700 truncate max-w-[220px]">
                    {platoSeleccionado.Nom_Plato}
                  </span>
                </div>
                {bebidaSeleccionada && (
                  <div className="flex justify-between text-slate-600">
                    <span>Bebida:</span>
                    <span className="font-bold text-blue-700 truncate max-w-[220px]">
                      {bebidaSeleccionada.Nom_Plato} ({bebidaSeleccionada.Subtipo_Bebida === "CALIENTE" ? "Caliente" : "Fria"})
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Boton para abrir modal de confirmacion */}
            {tipReserva && platoElegido && !qrData && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={abrirModalConfirmacion}
                  disabled={guardando}
                  className="w-full text-white font-bold py-3.5 px-6 rounded-2xl transition shadow-md shadow-emerald-600/20 text-sm flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                >
                  <span>Continuar y Confirmar Reserva</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Codigo QR Generado */}
            {qrData && (
              <div className="flex flex-col items-center gap-3 pt-3 bg-slate-50 border-2 border-emerald-200 rounded-3xl p-6 shadow-sm">
                <div className="text-center">
                  <p className="text-base font-black text-emerald-800 m-0">¡Reserva Generada con Exito!</p>
                  <p className="text-xs text-slate-500 mt-1 m-0">
                    Presenta este codigo en el comedor el {formatearFechaLarga(fechaReserva)} antes de las {horaFinTurno}.
                  </p>
                </div>
                <div className="p-4 bg-white border-2 border-emerald-400 rounded-2xl shadow-md">
                  <QRCodeSVG
                    value={qrData.qrUrl || qrData.Qr_Reserva || String(qrData.Id_Reserva || "")}
                    size={220}
                    marginSize={3}
                    level="H"
                  />
                </div>
                {hideModal && (
                  <button
                    onClick={hideModal}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    Cerrar
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Tarjeta Informativa de Horarios y Politicas para los Aprendices */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 text-xs text-slate-600 space-y-2.5">
        <h4 className="font-bold text-slate-800 flex items-center gap-2 text-xs m-0">
          <HelpCircle size={15} className="text-emerald-600" />
          Guia Rapida de Horarios y Turnos en Foodsys
        </h4>
        <ul className="space-y-1.5 pl-4 list-disc text-[11px] leading-relaxed text-slate-600 m-0">
          <li><strong>Aprendices Internos:</strong> Habilitados para Desayuno, Almuerzo y Cena.</li>
          <li><strong>Aprendices Externos:</strong> Habilitados exclusivamente para Almuerzo.</li>
          <li><strong>Cierre de Reserva Normal:</strong> Tienes plazo hasta las <strong>10:30 PM (22:30)</strong> del dia anterior. A partir de las 10:31 PM se agenda para pasado manana.</li>
          <li><strong>Cancelacion Oportuna:</strong> Permitida hasta las <strong>09:00 PM (21:00)</strong> de la noche anterior.</li>
          <li><strong>Novedades de Almuerzo:</strong> Para emergencias del mismo dia hasta las <strong>09:00 AM</strong>.</li>
          <li><strong>Ceder Reserva a un Companero:</strong> Si no puedes asistir, puedes ceder tu cupo a otro aprendiz hasta las <strong>10:30 AM</strong> para Almuerzo. Tu companero debe aceptar en su aplicacion.</li>
        </ul>
      </div>

      {/* MODAL LLAMATIVO DE CONFIRMACION DE FECHA Y HORARIO */}
      {modalConfirmacionVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 m-0">
                  Confirmacion de Fecha y Horario
                </h3>
                <p className="text-xs text-slate-500 m-0">Verifica los datos antes de emitir tu codigo QR</p>
              </div>
            </div>

            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed">
              Vas a realizar una reserva de <strong>{tipReserva}</strong> para el día{" "}
              <strong>{formatearFechaLarga(fechaReserva)}</strong>. Ten en cuenta que este servicio vence a las{" "}
              <strong>{horaFinTurno}</strong> del {formatearFechaLarga(fechaReserva)}. ¿Quieres seguir con la reserva?
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-xs border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Fecha de la reserva:</span>
                <span className="font-bold text-slate-800">{formatearFechaLarga(fechaReserva)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Vencimiento del servicio:</span>
                <span className="font-bold text-slate-800">{horaFinTurno}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Plato seleccionado:</span>
                <span className="font-bold text-emerald-800 truncate max-w-[200px]">
                  {platoSeleccionado?.Nom_Plato}
                </span>
              </div>
              {bebidaSeleccionada && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Bebida seleccionada:</span>
                  <span className="font-bold text-blue-800 truncate max-w-[200px]">
                    {bebidaSeleccionada?.Nom_Plato}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModalConfirmacionVisible(false)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancelar / Cambiar
              </button>
              <button
                type="button"
                onClick={ejecutarReservaConfirmada}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check size={16} /> Sí, confirmar reserva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservaForm;
