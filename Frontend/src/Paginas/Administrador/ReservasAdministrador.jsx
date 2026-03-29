import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig";
import ReservasForm from "../../Tablas/Reservas/ReservaForm";
import { QRCodeCanvas } from "qrcode.react";
import {
  UtensilsCrossed, CalendarCheck, ClipboardList, Clock,
  CheckCircle2, XCircle, AlertCircle, Inbox, ChefHat,
  QrCode, X, CalendarDays, Timer, Check,
} from "lucide-react";

/* ───────── CONFIG ───────── */
const API_URL = "http://localhost:8000";

/* ───────── CONFIG ESTADOS ───────── */
const estadoConfig = {
  pendiente: {
    label: "Pendiente", icon: Clock,
    color: "text-amber-700", bg: "bg-amber-50",
    border: "border-amber-300", dot: "bg-amber-400",
    headerBg: "bg-amber-100",
  },
  aprobado: {
    label: "Aprobado", icon: CheckCircle2,
    color: "text-emerald-700", bg: "bg-emerald-50",
    border: "border-emerald-300", dot: "bg-emerald-500",
    headerBg: "bg-emerald-100",
  },
  rechazado: {
    label: "Rechazado", icon: XCircle,
    color: "text-red-700", bg: "bg-red-50",
    border: "border-red-300", dot: "bg-red-400",
    headerBg: "bg-red-100",
  },
  generada: {
    label: "Generada", icon: CheckCircle2,
    color: "text-blue-700", bg: "bg-blue-50",
    border: "border-blue-300", dot: "bg-blue-400",
    headerBg: "bg-blue-100",
  },
};

const getEstado = (estado) =>
  estadoConfig[estado?.toLowerCase()] ?? {
    label: estado ?? "–", icon: AlertCircle,
    color: "text-slate-500", bg: "bg-slate-100",
    border: "border-slate-200", dot: "bg-slate-400",
    headerBg: "bg-slate-100",
  };

const formatFecha = (fecha) => {
  if (!fecha) return "–";
  return new Date(fecha).toLocaleDateString("es-CO", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
};

const formatFechaCorta = (fecha) => {
  if (!fecha) return "–";
  return new Date(fecha).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const formatVencimiento = (fecha) => {
  if (!fecha) return "–";
  return new Date(fecha).toLocaleString("es-CO", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
};

/* ───────── SELECTOR DE PLATOS (con datos reales) ───────── */
const SelectorPlatos = ({
  platoSeleccionado,
  onSeleccionar,
  fecha,
  tipo,
  onFechaChange,
  onTipoChange,
}) => {
  const [platos, setPlatos] = useState([]);
  const [loadingPlatos, setLoadingPlatos] = useState(false);
  const [errorPlatos, setErrorPlatos] = useState(null);

  /* Fetch menus → platos para la fecha y tipo seleccionados */
  useEffect(() => {
    if (!fecha || !tipo) return;

    const fetchPlatos = async () => {
      setLoadingPlatos(true);
      setErrorPlatos(null);
      onSeleccionar(null); // reset selección al cambiar filtros

      try {
        const { data } = await apiAxios.get("/api/menu");

        /* Filtramos por fecha y tipo, y extraemos el plato relacionado */
        const menusFiltrados = data.filter(
          (m) => m.Fec_Menu === fecha && m.Tip_Menu === tipo
        );

        /* Cada menú debe traer la relación "plato" (include en el controller) */
        const platosDelDia = menusFiltrados
          .map((m) => m.plato)          // relación MenuModel → PlatosModel (as: 'plato')
          .filter(Boolean);             // descarta nulos

        /* Quitar duplicados por Id_Plato */
        const unique = Array.from(
          new Map(platosDelDia.map((p) => [p.Id_Plato, p])).values()
        );

        setPlatos(unique);
      } catch (err) {
        console.error("Error cargando platos del menú", err);
        setErrorPlatos("No se pudieron cargar los platos disponibles.");
      } finally {
        setLoadingPlatos(false);
      }
    };

    fetchPlatos();
  }, [fecha, tipo]);

  return (
    <div className="mb-6">
      {/* ── Fecha ── */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
          Fecha de reserva
        </label>
        <input
          type="date"
          value={fecha}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => onFechaChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
        />
      </div>

      {/* ── Tipo de comida ── */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
          Tipo de comida
        </label>
        <div className="flex gap-2">
          {["Desayuno", "Almuerzo", "Cena"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTipoChange(t)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                tipo === t
                  ? "bg-green-600 border-green-600 text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:border-green-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Platos disponibles ── */}
      <div className="flex items-center gap-2 mb-3">
        <ChefHat className="w-4 h-4 text-green-600" />
        <p className="text-sm font-semibold text-gray-700">
          Selecciona tu plato
          <span className="ml-2 text-xs font-normal text-gray-400">(máximo 1)</span>
        </p>
      </div>

      {/* Estado: cargando */}
      {loadingPlatos && (
        <div className="flex items-center justify-center py-8 gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-green-200 border-t-green-500 rounded-full animate-spin" />
          <span className="text-sm">Cargando platos disponibles…</span>
        </div>
      )}

      {/* Estado: error */}
      {!loadingPlatos && errorPlatos && (
        <div className="py-4 text-center text-sm text-red-500 bg-red-50 rounded-xl border border-red-100">
          {errorPlatos}
        </div>
      )}

      {/* Estado: sin platos */}
      {!loadingPlatos && !errorPlatos && platos.length === 0 && fecha && tipo && (
        <div className="py-6 text-center text-sm text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          No hay platos disponibles para esta fecha y tipo de comida.
        </div>
      )}

      {/* Grid de platos */}
      {!loadingPlatos && !errorPlatos && platos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {platos.map((plato) => {
            const seleccionado = platoSeleccionado === plato.Id_Plato;
            const imgSrc = plato.Img_Plato
              ? `${API_URL}/uploads/${plato.Img_Plato}`
              : null;

            return (
              <button
                key={plato.Id_Plato}
                type="button"
                onClick={() => onSeleccionar(seleccionado ? null : plato.Id_Plato)}
                className={`
                  relative rounded-2xl overflow-hidden border-2 text-left transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2
                  ${seleccionado
                    ? "border-green-500 shadow-lg shadow-green-100 scale-[1.02]"
                    : "border-gray-200 hover:border-green-300 hover:shadow-md"
                  }
                `}
              >
                {/* Imagen */}
                <div className="relative h-32 overflow-hidden bg-gray-100">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={plato.Nom_Plato}
                      className={`w-full h-full object-cover transition-transform duration-300 ${
                        seleccionado ? "scale-110" : "hover:scale-105"
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <ChefHat className="w-10 h-10 text-gray-300" />
                    </div>
                  )}

                  {/* Overlay de selección */}
                  {seleccionado && (
                    <div className="absolute inset-0 bg-green-600/20 flex items-center justify-center">
                      <div className="bg-green-500 rounded-full p-1.5 shadow-lg">
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </div>
                    </div>
                  )}

                  {/* Tag tipo */}
                  <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    {plato.Tip_Plato}
                  </span>
                </div>

                {/* Info */}
                <div className={`px-3 py-2.5 transition-colors duration-200 ${
                  seleccionado ? "bg-green-50" : "bg-white"
                }`}>
                  <p className={`text-sm font-bold leading-tight transition-colors ${
                    seleccionado ? "text-green-700" : "text-gray-800"
                  }`}>
                    {plato.Nom_Plato}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed line-clamp-2">
                    {plato.Des_Plato || "Sin descripción"}
                  </p>
                </div>

                {/* Borde activo */}
                {seleccionado && (
                  <div className="absolute inset-0 rounded-2xl border-2 border-green-500 pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Píldora de confirmación */}
      <div className={`mt-3 text-center transition-all duration-300 ${
        platoSeleccionado ? "opacity-100" : "opacity-0"
      }`}>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
          <Check className="w-3 h-3" strokeWidth={3} />
          {platos.find((p) => p.Id_Plato === platoSeleccionado)?.Nom_Plato} seleccionado
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSeleccionar(null); }}
            className="ml-1 text-green-500 hover:text-red-500 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      </div>
    </div>
  );
};

/* ───────── COMPONENTE PRINCIPAL ───────── */
const Reservas = ({ localMode = true }) => {
  const [usuarioLogueado] = useState(() => {
    try { return JSON.parse(localStorage.getItem("usuario")) || null; }
    catch { return null; }
  });

  const [reservasDB,   setReservasDB]   = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [verTodas,     setVerTodas]     = useState(false);
  const [qrModalOpen,  setQrModalOpen]  = useState(false);
  const [qrTexto,      setQrTexto]      = useState("");
  const [qrFecha,      setQrFecha]      = useState("");
  const [qrTipo,       setQrTipo]       = useState("");

  /* ── Estado compartido fecha / tipo / plato ── */
  const [platoElegido,     setPlatoElegido]     = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [tipoSeleccionado,  setTipoSeleccionado]  = useState("Almuerzo");

  /* ── Fetch reservas ── */
  const fetchReservas = async () => {
    if (!usuarioLogueado) return;
    setLoading(true);
    try {
      const { data } = await apiAxios.get("/api/Reservas");
      const userId = usuarioLogueado.Id_Usuario || usuarioLogueado.id || usuarioLogueado.Id;
      const misReservas = data.filter((r) => String(r.Id_Usuario) === String(userId));
      misReservas.sort((a, b) => new Date(b.Fec_Reserva) - new Date(a.Fec_Reserva));
      setReservasDB(misReservas);
    } catch (error) {
      console.error("Error cargando reservas", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReservas(); }, []);

  const verQr = (reserva) => {
    setQrTexto(reserva.Tex_Qr || "Sin QR");
    setQrFecha(reserva.Fec_Reserva);
    setQrTipo(reserva.Tipo || "");
    setQrModalOpen(true);
  };

  const reservasMostradas = verTodas ? reservasDB : reservasDB.slice(0, 5);

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full h-full p-4 md:p-6">

        {/* ── TÍTULO ── */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Mis Reservas</h1>
          <p className="text-gray-500 mt-1">Gestiona tus reservas del comedor</p>
        </div>

        {/* ── GRID PRINCIPAL ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* ── FORMULARIO ── */}
          {localMode && (
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-4">

                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2.5 rounded-xl">
                      <CalendarCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-xl">Nueva Reserva</h2>
                      <p className="text-green-100 text-sm mt-0.5">Reserva tu almuerzo aquí</p>
                    </div>
                  </div>
                </div>

                {/* Aviso */}
                <div className="mx-5 mt-5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3.5 flex items-start gap-2.5">
                  <span className="text-lg mt-0.5">📌</span>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    Puedes reservar hasta las <strong>6:30 p.m.</strong> del día anterior.
                  </p>
                </div>

                {/* ── SELECTOR DE PLATOS ── */}
                <div className="px-6 pt-5">
                  <SelectorPlatos
                    platoSeleccionado={platoElegido}
                    onSeleccionar={setPlatoElegido}
                    fecha={fechaSeleccionada}
                    tipo={tipoSeleccionado}
                    onFechaChange={(f) => { setFechaSeleccionada(f); setPlatoElegido(null); }}
                    onTipoChange={(t)  => { setTipoSeleccionado(t);  setPlatoElegido(null); }}
                  />
                  <div className="border-t border-dashed border-gray-200 mb-5" />
                </div>

                {/* ReservasForm — recibe fecha, tipo y plato seleccionado */}
                <div className="px-6 pb-6">
                  <ReservasForm
                    usuario={usuarioLogueado}
                    platoSeleccionado={platoElegido}
                    fechaInicial={fechaSeleccionada}
                    tipoInicial={tipoSeleccionado}
                    hideModal={() => {}}
                    reload={fetchReservas}
                    Edit={false}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── LISTADO ── */}
          <div className={localMode ? "lg:col-span-3" : "lg:col-span-5"}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

              {/* Header listado */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2.5 rounded-xl">
                    <ClipboardList className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-gray-800 font-bold text-xl">Historial de Reservas</h2>
                    {usuarioLogueado && (
                      <p className="text-gray-400 text-sm mt-0.5">
                        {usuarioLogueado.Nom_Usuario || "Usuario"}
                      </p>
                    )}
                  </div>
                </div>

                {reservasDB.length > 0 && (
                  <span className="bg-green-600 text-white text-sm font-bold px-4 py-1.5 rounded-full">
                    {reservasDB.length} reserva{reservasDB.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Contenido */}
              <div className="p-5">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                    <div className="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mb-4" />
                    <p className="text-base font-medium">Cargando reservas...</p>
                  </div>

                ) : reservasDB.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="bg-gray-100 rounded-2xl p-6 mb-5">
                      <Inbox className="w-14 h-14 text-gray-400" />
                    </div>
                    <p className="font-bold text-gray-600 text-xl">Sin reservas aún</p>
                    <p className="text-gray-400 text-base mt-2 max-w-sm">
                      Usa el formulario para crear tu primera reserva 🍽️
                    </p>
                  </div>

                ) : (
                  <div className="space-y-4">
                    {reservasMostradas.map((reserva) => {
                      const cfg = getEstado(reserva.Est_Reserva);
                      const Icon = cfg.icon;

                      return (
                        <div
                          key={reserva.Id_Reserva}
                          className={`border-2 ${cfg.border} rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200`}
                        >
                          {/* Card header */}
                          <div className={`${cfg.headerBg} px-5 py-3 flex items-center justify-between`}>
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                              <span className={`text-sm font-semibold ${cfg.color} flex items-center gap-1.5`}>
                                <Icon className="w-4 h-4" />
                                {cfg.label}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 font-medium">
                              #{reserva.Id_Reserva}
                            </span>
                          </div>

                          {/* Card body */}
                          <div className="bg-white px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="bg-green-100 p-4 rounded-2xl shrink-0 self-start sm:self-center">
                              <UtensilsCrossed className="w-8 h-8 text-green-600" />
                            </div>

                            <div className="flex-1 min-w-0 space-y-2">
                              <p className="font-bold text-gray-800 text-base md:text-lg capitalize">
                                {formatFecha(reserva.Fec_Reserva)}
                              </p>
                              <div className="flex flex-wrap gap-4">
                                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                                  <ChefHat className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium text-gray-700">{reserva.Tipo || "–"}</span>
                                </span>
                                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                                  <Timer className="w-4 h-4 text-gray-400" />
                                  Vence: <span className="font-medium text-gray-700">{formatVencimiento(reserva.Vencimiento)}</span>
                                </span>
                                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                                  <CalendarDays className="w-4 h-4 text-gray-400" />
                                  {formatFechaCorta(reserva.Fec_Reserva)}
                                </span>
                              </div>
                            </div>

                            {reserva.Tex_Qr && (
                              <div className="shrink-0 self-start sm:self-center">
                                <button
                                  onClick={() => verQr(reserva)}
                                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                                >
                                  <QrCode className="w-4 h-4" />
                                  Ver QR
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {reservasDB.length > 5 && (
                      <button
                        onClick={() => setVerTodas(!verTodas)}
                        className="w-full py-3.5 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 text-sm font-semibold hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-all duration-200"
                      >
                        {verTodas
                          ? "Mostrar menos ↑"
                          : `Ver todas las reservas (${reservasDB.length - 5} más) ↓`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL QR ── */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setQrModalOpen(false)}
          />
          <div className="bg-white rounded-3xl shadow-2xl z-10 p-8 flex flex-col items-center w-full max-w-sm">

            <div className="flex items-center justify-between w-full mb-2">
              <div>
                <h3 className="font-bold text-gray-800 text-2xl">Código QR</h3>
                {qrTipo && (
                  <span className="inline-block mt-1 text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full">
                    {qrTipo}
                  </span>
                )}
              </div>
              <button
                onClick={() => setQrModalOpen(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl p-2.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-5 self-start capitalize">
              {formatFecha(qrFecha)}
            </p>

            <div className="bg-gray-50 p-5 rounded-2xl border-2 border-gray-200">
              <QRCodeCanvas value={qrTexto} size={230} />
            </div>

            <p className="text-xs text-gray-400 mt-4 text-center break-all px-2 max-w-xs">
              {qrTexto}
            </p>

            <button
              onClick={() => setQrModalOpen(false)}
              className="mt-6 w-full bg-green-600 text-white py-3.5 rounded-2xl font-bold text-base hover:bg-green-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservas;