// Frontend/src/Paginas/Externo/ReservasExterno.jsx
// ── Solo muestra el formulario de nueva reserva ──

import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig";
import ReservasForm from "../../Tablas/Reservas/ReservaForm";
import { CalendarCheck, Lock } from "lucide-react";

const getFechaMañana = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const TIPOS_COMIDA = ["Desayuno", "Almuerzo", "Cena"];
const TIPO_PERMITIDO_EXTERNO = "Almuerzo";
const API_URL = "http://localhost:8000";

/* ─── Selector de platos ─── */
const SelectorPlatos = ({
  platoSeleccionado, onSeleccionar,
  fecha, tipo, onTipoChange, soloTipo,
}) => {
  const [platos, setPlatos]               = useState([]);
  const [loadingPlatos, setLoadingPlatos] = useState(false);

  useEffect(() => {
    if (!fecha || !tipo) return;
    const fetchPlatos = async () => {
      setLoadingPlatos(true);
      onSeleccionar(null);
      try {
        const { data } = await apiAxios.get("/api/Menu");
        const filtrados = data.filter((m) => m.Fec_Menu === fecha && m.Tip_Menu === tipo);
        const platosArr = filtrados.map((m) => m.plato).filter(Boolean);
        const unique    = Array.from(new Map(platosArr.map((p) => [p.Id_Plato, p])).values());
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
      {/* Fecha solo lectura */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
          Fecha de reserva
        </label>
        <div className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-700">
          {fecha
            ? new Date(fecha + "T00:00:00").toLocaleDateString("es-CO", {
                weekday: "long", day: "2-digit", month: "long", year: "numeric",
              })
            : "–"}
        </div>
        <input type="hidden" value={fecha} readOnly />
      </div>

      {/* Tipo de comida */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
          Tipo de comida
        </label>
        <div className="flex gap-2">
          {TIPOS_COMIDA.map((t) => {
            const bloqueado = soloTipo && t !== soloTipo;
            const activo    = tipo === t;
            return (
              <button
                key={t}
                type="button"
                disabled={bloqueado}
                onClick={() => !bloqueado && onTipoChange(t)}
                title={bloqueado ? "No disponible para tu perfil" : ""}
                className={`
                  flex-1 py-2 rounded-xl text-xs font-semibold border transition-all duration-200
                  ${activo && !bloqueado
                    ? "bg-green-600 border-green-600 text-white"
                    : bloqueado
                      ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60"
                      : "bg-white border-gray-200 text-gray-600 hover:border-green-300"}
                `}
              >
                {bloqueado
                  ? <span className="flex items-center justify-center gap-1"><Lock className="w-3 h-3" /> {t}</span>
                  : t}
              </button>
            );
          })}
        </div>
        {soloTipo && (
          <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Los aprendices externos solo pueden reservar <strong>Almuerzo</strong>.
          </p>
        )}
      </div>

      {/* Platos */}
      {loadingPlatos ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {platos.length === 0 && (
            <p className="col-span-2 text-center text-sm text-gray-400 py-6">
              No hay platos disponibles para esta fecha.
            </p>
          )}
          {platos.map((plato) => {
            const seleccionado = platoSeleccionado === plato.Id_Plato;
            const imgSrc = plato.Img_Plato ? `${API_URL}/uploads/${plato.Img_Plato}` : null;
            return (
              <button
                key={plato.Id_Plato}
                type="button"
                onClick={() => onSeleccionar(seleccionado ? null : plato.Id_Plato)}
                className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                  seleccionado
                    ? "border-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.25)]"
                    : "border-gray-200 hover:border-green-300"
                }`}
              >
                <div className="absolute top-2 left-2 z-10">
                  <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-1 rounded-full">{tipo}</span>
                </div>
                <div className="h-24 overflow-hidden bg-gray-100">
                  {imgSrc
                    ? <img src={imgSrc} alt={plato.Nom_Plato} className="w-full h-full object-cover" />
                    : <div className="flex items-center justify-center h-full text-3xl">🍽️</div>}
                </div>
                {seleccionado && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-green-500 text-white rounded-full p-2 shadow-lg">✓</div>
                  </div>
                )}
                <div className="px-3 py-3 bg-white">
                  <p className="text-sm font-bold text-green-700">{plato.Nom_Plato}</p>
                  <p className="text-xs text-gray-400">{plato.Des_Plato || "Sin descripción"}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════════════ */
const ReservasExterno = () => {
  const [usuarioLogueado] = useState(() => {
    try { return JSON.parse(localStorage.getItem("usuario")) || null; }
    catch { return null; }
  });

  const [platoElegido, setPlatoElegido]         = useState(null);
  const [fechaSeleccionada]                     = useState(getFechaMañana());
  const [tipoSeleccionado, setTipoSeleccionado] = useState(TIPO_PERMITIDO_EXTERNO);

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full h-full p-4 md:p-6 flex flex-col items-center">

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Nueva Reserva</h1>
          <p className="text-gray-500 mt-1">Crea tu reserva para el comedor</p>
        </div>

        <div className="max-w-2xl mx-auto w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

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

            <div className="mx-5 mt-5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3.5 flex items-start gap-2.5">
              <span className="text-lg mt-0.5">📌</span>
              <p className="text-blue-700 text-sm leading-relaxed">
                Puedes reservar hasta las <strong>6:30 p.m.</strong> del día anterior.
                Solo está disponible el <strong>Almuerzo</strong> para tu perfil.
              </p>
            </div>
            

            <div className="px-8 pt-6">
              <SelectorPlatos
                platoSeleccionado={platoElegido}
                onSeleccionar={setPlatoElegido}
                fecha={fechaSeleccionada}
                tipo={tipoSeleccionado}
                onTipoChange={(t) => {
                  if (t === TIPO_PERMITIDO_EXTERNO) {
                    setTipoSeleccionado(t);
                    setPlatoElegido(null);
                  }
                }}
                soloTipo={TIPO_PERMITIDO_EXTERNO}
              />
              <div className="border-t border-dashed border-gray-200 mb-5" />
            </div>

            <div className="px-8 pb-8 pt-2">
              <ReservasForm
                usuario={usuarioLogueado}
                platoSeleccionado={platoElegido}
                fechaInicial={fechaSeleccionada}
                tipoInicial={tipoSeleccionado}
                hideModal={() => {}}
                reload={() => {}}
                Edit={false}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservasExterno;