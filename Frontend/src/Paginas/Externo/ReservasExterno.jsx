// Frontend/src/Paginas/Externo/ReservasExterno.jsx
import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig";
import ReservasForm from "../../Tablas/Reservas/ReservaForm";
import { CalendarCheck } from "lucide-react";

/* ═══════════════════════════════════════════
   HELPERS DE FECHA
═══════════════════════════════════════════ */
const formatFecha = (fecha) => {
  if (!fecha) return "–";
  return new Date(fecha).toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatFechaCorta = (fecha) => {
  if (!fecha) return "–";
  return new Date(fecha).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

const getVencimientoReal = (fecReserva, tipo) => {
  const fecha = new Date(fecReserva + "T00:00:00");
  switch (tipo) {
    case "Desayuno":
      fecha.setHours(7, 0, 0);
      break;
    case "Almuerzo":
      fecha.setHours(14, 0, 0);
      break;
    case "Cena":
      fecha.setHours(19, 0, 0);
      break;
    default:
      return null;
  }
  return fecha;
};

/* ═══════════════════════════════════════════
   SELECTOR DE PLATOS
═══════════════════════════════════════════ */

const API_URL = "http://localhost:8000";

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

  useEffect(() => {
    if (!fecha || !tipo) return;

    const fetchPlatos = async () => {
      setLoadingPlatos(true);
      onSeleccionar(null);

      try {
        const { data } = await apiAxios.get("/api/Menu");

        const menusFiltrados = data.filter(
          (m) => m.Fec_Menu === fecha && m.Tip_Menu === tipo,
        );

        const platosDelDia = menusFiltrados.map((m) => m.plato).filter(Boolean);

        const unique = Array.from(
          new Map(platosDelDia.map((p) => [p.Id_Plato, p])).values(),
        );

        setPlatos(unique);
      } catch (err) {
        console.error("Error cargando platos", err);
      } finally {
        setLoadingPlatos(false);
      }
    };

    fetchPlatos();
  }, [fecha, tipo]);

  return (
    <div className="mb-6">
      {/* Fecha */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
          Fecha de reserva
        </label>

        <input
          type="date"
          value={fecha}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => onFechaChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 appearance-none"
        />
      </div>

      {/* Tipo comida */}
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
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${
                tipo === t
                  ? "bg-green-600 border-green-600 text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:border-green-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Platos */}
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
              onClick={() =>
                onSeleccionar(seleccionado ? null : plato.Id_Plato)
              }
              className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                seleccionado
                  ? "border-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.25)]"
                  : "border-gray-200 hover:border-green-300"
              }`}
            >
              {/* BADGE TIPO COMIDA */}
              <div className="absolute top-2 left-2 z-10">
                <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-1 rounded-full">
                  {tipo}
                </span>
              </div>

              {/* IMAGEN */}
              <div className="h-32 overflow-hidden bg-gray-100">
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={plato.Nom_Plato}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    🍽️
                  </div>
                )}
              </div>

              {/* CHECK VERDE */}
              {seleccionado && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-green-500 text-white rounded-full p-2 shadow-lg">
                    ✓
                  </div>
                </div>
              )}

              {/* TEXTO */}
              <div className="px-3 py-3 bg-white">
                <p className="text-sm font-bold text-green-700">
                  {plato.Nom_Plato}
                </p>

                <p className="text-xs text-gray-400">
                  {plato.Des_Plato || "Sin descripción"}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════ */

const ReservasExterno = ({ localMode = true }) => {
  const [usuarioLogueado] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("usuario")) || null;
    } catch {
      return null;
    }
  });

  const esExterno = usuarioLogueado?.rolesUsuario?.some(
    (r) => r.rol?.Nom_Rol === "Aprendiz Externo",
  );

  const [reservasDB, setReservasDB] = useState([]);
  const [loading, setLoading] = useState(false);

  const [platoElegido, setPlatoElegido] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [tipoSeleccionado, setTipoSeleccionado] = useState("Almuerzo");

  const fetchReservas = async () => {
    if (!usuarioLogueado) return;

    setLoading(true);

    try {
      const { data } = await apiAxios.get("/api/Reservas");

      const userId =
        usuarioLogueado.Id_Usuario || usuarioLogueado.id || usuarioLogueado.Id;

      const misReservas = data.filter(
        (r) => String(r.Id_Usuario) === String(userId),
      );

      misReservas.sort(
        (a, b) => new Date(b.Fec_Reserva) - new Date(a.Fec_Reserva),
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

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full h-full p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Mis Reservas
          </h1>
          <p className="text-gray-500 mt-1">
            Gestiona tus reservas del comedor
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-6">
          {localMode && (
            <div className="w-full max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-4">
                <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2.5 rounded-xl">
                      <CalendarCheck className="w-6 h-6 text-white" />
                    </div>

                    <div>
                      <h2 className="text-white font-bold text-xl">
                        Nueva Reserva
                      </h2>
                      <p className="text-green-100 text-sm mt-0.5">
                        Reserva tu almuerzo aquí
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mx-5 mt-5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3.5 flex items-start gap-2.5">
                  <span className="text-lg mt-0.5">📌</span>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    Puedes reservar hasta las <strong>6:30 p.m.</strong> del día
                    anterior.
                  </p>
                </div>

                <div className="px-6 pt-5">
                  <SelectorPlatos
                    platoSeleccionado={platoElegido}
                    onSeleccionar={setPlatoElegido}
                    fecha={fechaSeleccionada}
                    tipo={tipoSeleccionado}
                    onFechaChange={(f) => {
                      setFechaSeleccionada(f);
                      setPlatoElegido(null);
                    }}
                    onTipoChange={(t) => {
                      setTipoSeleccionado(t);
                      setPlatoElegido(null);
                    }}
                  />

                  <div className="border-t border-dashed border-gray-200 mb-5" />
                </div>

                <div className="p-6">
                  <ReservasForm
                    usuario={usuarioLogueado}
                    platoSeleccionado={platoElegido}
                    fechaInicial={fechaSeleccionada}
                    tipoInicial={tipoSeleccionado}
                    hideModal={() => {}}
                    reload={fetchReservas}
                    Edit={false}
                    soloAlmuerzo={esExterno}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservasExterno;
