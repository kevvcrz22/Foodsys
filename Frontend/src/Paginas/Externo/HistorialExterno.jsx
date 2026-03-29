import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig";
import { QRCodeCanvas } from "qrcode.react";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Inbox,
  QrCode,
  X,
} from "lucide-react";

/* CONFIG ESTADOS */
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

/* FIX TIMEZONE */
const parseFechaLocal = (fecha) => {
  if (!fecha) return null;
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const formatFecha = (fecha) => {
  if (!fecha) return "–";

  const f = parseFechaLocal(fecha);

  return f.toLocaleDateString("es-CO", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const HistorialExterno = () => {

  const [usuarioLogueado] = useState(() => {
    try {
      const raw = localStorage.getItem("usuario");
      if (!raw || raw === "undefined") return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  const [screen, setScreen] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setScreen(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = screen < 640;

  const [reservasDB, setReservasDB] = useState([]);
  const [loading, setLoading] = useState(false);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrTexto, setQrTexto] = useState("");

  const fetchReservas = async () => {
    if (!usuarioLogueado) return;

    setLoading(true);

    try {
      const { data } = await apiAxios.get("/api/Reservas");

      const userId =
        usuarioLogueado.Id_Usuario ||
        usuarioLogueado.id ||
        usuarioLogueado.Id;

      const misReservas = data.filter(
        (r) => String(r.Id_Usuario) === String(userId)
      );

      misReservas.sort(
        (a, b) =>
          parseFechaLocal(b.Fec_Reserva) - parseFechaLocal(a.Fec_Reserva)
      );

      setReservasDB(misReservas);
    } catch (error) {
      console.error("Error cargando reservas", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservas();
  }, []);

  /* QR SOLO DOCUMENTO */
  const verQr = () => {
    const documento = usuarioLogueado?.NumDoc_Usuario;

    if (!documento) {
      alert("No se encontró el documento");
      return;
    }

    setQrTexto(String(documento));
    setQrModalOpen(true);
  };

  return (
    <div className="w-full flex justify-center mt-6 sm:mt-10 px-3 sm:px-4 bg-slate-50 min-h-screen">
      <div className="w-full max-w-xl lg:max-w-2xl">

        <div className="bg-white/90 backdrop-blur border border-slate-200 rounded-2xl sm:rounded-3xl shadow-md sm:shadow-lg p-4 sm:p-6">

          {/* HEADER */}
          <div className={`flex ${isMobile ? "flex-col gap-3" : "items-center justify-between"} mb-5 sm:mb-6`}>
            
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2 sm:p-3 rounded-xl">
                <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              </div>

              <div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                  Mis Reservas
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400">
                  Consulta tu historial
                </p>
              </div>
            </div>

            {reservasDB.length > 0 && (
              <span className="self-start sm:self-auto bg-indigo-500 text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full">
                {reservasDB.length}
              </span>
            )}
          </div>

          {/* CONTENIDO */}
          {loading ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              Cargando...
            </div>
          ) : reservasDB.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              <Inbox className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2" />
              No tienes reservas
            </div>
          ) : (
            <div className="space-y-3">

              {reservasDB.map((reserva) => {
                const cfg = getEstado(reserva.Est_Reserva);
                const Icon = cfg.icon;

                return (
                  <div
                    key={reserva.Id_Reserva}
                    className={`border ${cfg.border} bg-white rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition`}
                  >

                    {/* FILA SUPERIOR */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">

                      <p className="font-semibold text-xs sm:text-sm text-slate-800">
                        {formatFecha(reserva.Fec_Reserva)}
                      </p>

                      <div className={`${cfg.bg} ${cfg.color} px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 w-fit`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </div>

                    </div>

                    {/* FILA INFERIOR */}
                    <div className="flex justify-between items-center">

                      {/* TIPO */}
                      <p className="text-xs sm:text-sm font-medium text-indigo-600">
                        {reserva.Tipo}
                      </p>

                      <button
                        onClick={verQr}
                        className="p-2 rounded-lg hover:bg-slate-100 transition"
                      >
                        <QrCode className="w-4 h-4 text-slate-600" />
                      </button>

                    </div>

                  </div>
                );
              })}

            </div>
          )}
        </div>
      </div>

      {/* MODAL QR */}
      {qrModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xl text-center relative w-full max-w-xs">

            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-semibold text-slate-700 mb-4">
              Código QR
            </h3>

            <QRCodeCanvas value={qrTexto} size={180} />

          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialExterno;