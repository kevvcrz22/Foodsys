import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig";
import ReservasForm from "../../Tablas/Reservas/ReservaForm";
import { QRCodeCanvas } from "qrcode.react";
import {
  UtensilsCrossed,
  CalendarCheck,
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Inbox,
  ChefHat,
  QrCode,
  X,
} from "lucide-react";

/* ───────── CONFIG ESTADOS ───────── */
const estadoConfig = {
  pendiente: {
    label: "Pendiente",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-100",
    border: "border-amber-200",
  },
  aprobado: {
    label: "Aprobado",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    border: "border-emerald-200",
  },
  rechazado: {
    label: "Rechazado",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-100",
    border: "border-red-200",
  },
};

const getEstado = (estado) =>
  estadoConfig[estado?.toLowerCase()] ?? {
    label: estado ?? "–",
    icon: AlertCircle,
    color: "text-slate-500",
    bg: "bg-slate-100",
    border: "border-slate-200",
  };

const formatFecha = (fecha) => {
  if (!fecha) return "–";
  return new Date(fecha).toLocaleDateString("es-CO", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatVencimiento = (fecha) => {
  if (!fecha) return "–";
  return new Date(fecha).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ───────── COMPONENTE PRINCIPAL ───────── */
const Reservas = ({ localMode = true }) => {
  // Obtener usuario logueado desde localStorage
  const [usuarioLogueado] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("usuario")) || null;
    } catch {
      return null;
    }
  });

  const [reservasDB, setReservasDB] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estado modal QR
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrTexto, setQrTexto] = useState("");
  const [qrFecha, setQrFecha] = useState("");

  // Cargar reservas del usuario logueado
  const fetchReservas = async () => {
    if (!usuarioLogueado) return;
    setLoading(true);
    try {
      // Trae todas las reservas y filtra por el usuario logueado
      const { data } = await apiAxios.get("/api/Reservas");
      const userId =
        usuarioLogueado.Id_Usuario ||
        usuarioLogueado.id ||
        usuarioLogueado.Id;
      const misReservas = data.filter(
        (r) => String(r.Id_Usuario) === String(userId)
      );
      // Ordenar por fecha descendente (más reciente primero)
      misReservas.sort(
        (a, b) => new Date(b.Fec_Reserva) - new Date(a.Fec_Reserva)
      );
      setReservasDB(misReservas);
    } catch (error) {
      console.error("Error cargando reservas", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localMode) {
      fetchReservas();
    }
  }, [localMode]);

  // Siempre carga al montar (modo real)
  useEffect(() => {
    fetchReservas();
  }, []);

  const verQr = (reserva) => {
    setQrTexto(reserva.Tex_Qr || "Sin QR");
    setQrFecha(reserva.Fec_Reserva);
    setQrModalOpen(true);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 px-3 py-4 md:px-6 md:py-6">

      {/* GRID PRINCIPAL */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-5 gap-5">

        {/* ── FORMULARIO (columna izquierda) ── */}
        {localMode && (
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-md p-5 md:p-6 h-fit">

            <div className="flex items-center gap-2 mb-5">
              <div className="bg-green-100 p-2 rounded-xl">
                <CalendarCheck className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-base font-semibold text-slate-700">
                Nueva Reserva
              </h2>
            </div>

            <div className="bg-blue-50 text-blue-700 text-xs rounded-xl px-3 py-2.5 mb-5 leading-relaxed">
              📌 Recuerda: puedes reservar hasta las <strong>6:30 p.m.</strong> del día anterior.
            </div>

            <ReservasForm
              usuario={usuarioLogueado}
              hideModal={() => {}}
              reload={fetchReservas}
              Edit={false}
            />
          </div>
        )}

        {/* ── LISTADO (columna derecha) ── */}
        <div className={`${localMode ? "xl:col-span-3" : "xl:col-span-5"} bg-white rounded-2xl shadow-md p-5 md:p-6`}>

          {/* Header listado */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="bg-green-100 p-2 rounded-xl">
                <ClipboardList className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-700">
                  Mis Reservas
                </h2>
                {usuarioLogueado && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {usuarioLogueado.Nom_Usuario ||
                      usuarioLogueado.nombre ||
                      usuarioLogueado.email ||
                      "Usuario"}
                  </p>
                )}
              </div>
            </div>

            {reservasDB.length > 0 && (
              <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                {reservasDB.length}
              </span>
            )}
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="w-8 h-8 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mb-3" />
              <p className="text-sm">Cargando reservas...</p>
            </div>
          ) : reservasDB.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center text-center py-16 text-slate-400">
              <Inbox className="w-12 h-12 mb-3" />
              <p className="font-semibold text-slate-500">
                No tienes reservas registradas
              </p>
              <p className="text-sm mt-1">
                Usa el formulario para crear tu primera reserva 🍽️
              </p>
            </div>
          ) : (
            /* Lista de reservas */
            <div className="space-y-3">
              {reservasDB.map((reserva) => {
                const cfg = getEstado(reserva.Est_Reserva);
                const Icon = cfg.icon;

                return (
                  <div
                    key={reserva.Id_Reserva}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border ${cfg.border} rounded-xl p-4 hover:bg-green-50/50 transition-colors`}
                  >
                    {/* Icono + info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="bg-green-100 p-2.5 rounded-xl shrink-0">
                        <UtensilsCrossed className="w-5 h-5 text-green-600" />
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-slate-700 text-sm truncate">
                          {formatFecha(reserva.Fec_Reserva)}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <ChefHat className="w-3 h-3" />
                            {reserva.Tipo || "–"}
                          </span>
                          <span className="text-xs text-slate-400">
                            Vence: {formatVencimiento(reserva.Vencimiento)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Estado + QR */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </div>

                      {reserva.Tex_Qr && (
                        <button
                          onClick={() => verQr(reserva)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                          title="Ver QR"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">QR</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL QR ── */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setQrModalOpen(false)}
          />
          <div className="bg-white rounded-2xl shadow-2xl z-10 p-6 flex flex-col items-center max-w-xs w-full">
            <div className="flex items-center justify-between w-full mb-4">
              <h3 className="font-bold text-slate-700 text-lg">Código QR</h3>
              <button
                onClick={() => setQrModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4 text-center">
              {formatFecha(qrFecha)}
            </p>

            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-inner">
              <QRCodeCanvas value={qrTexto} size={200} />
            </div>

            <p className="text-xs text-slate-400 mt-4 text-center break-all px-2">
              {qrTexto}
            </p>

            <button
              onClick={() => setQrModalOpen(false)}
              className="mt-5 w-full bg-green-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors"
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