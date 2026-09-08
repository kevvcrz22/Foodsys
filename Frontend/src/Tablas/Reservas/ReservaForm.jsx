import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import apiAxios from "../../api/axiosConfig.js";
import AlertaInasistencias from "./AlertaInasistencias.jsx";
import { UtensilsCrossed, CalendarDays, Clock, CheckCircle2, AlertCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";

const ReservaForm = ({ hideModal, reserva, Edit, reload, mostrarQR }) => {
  // Estado para los tipos de comida permitidos segun el rol del usuario logueado
  const [tiposPermitidos, setTiposPermitidos] = useState([]);

  // Estado para el control de inasistencias y sanciones de la semana
  const [estadoInasistencias, setEstadoInasistencias] = useState(null);
  const [cargandoInasistencias, setCargandoInasistencias] = useState(true);

  // Estado para el tipo de comida elegido en el select
  const [tipReserva, setTipReserva] = useState(reserva?.Tip_Reserva || reserva?.Tipo || "");

  // Estado para la lista de platos disponibles segun el tipo elegido
  const [platos, setPlatos] = useState([]);

  // Estado para el id del plato que el usuario selecciono
  const [platoElegido, setPlatoElegido] = useState(reserva?.Id_Plato || "");

  // Estado para el objeto completo del plato elegido, se usa en el resumen
  const [platoSeleccionado, setPlatoSeleccionado] = useState(reserva?.plato || null);

  // Estado para guardar el resultado del QR despues de generar la reserva
  const [qrData, setQrData] = useState(null);

  // Estado para mostrar mensajes de error al usuario
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Horas de vencimiento por tipo de comida
  const horasVencimiento = {
    Desayuno: "07:00",
    Almuerzo: "14:05",
    Cena: "19:00"
  };

  // Se calcula la fecha de manana una sola vez para usarla en todo el componente
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const fechaReserva = reserva?.Fec_Reserva || manana.toISOString().split("T")[0];

  // Construye la URL completa de la imagen del plato
  const urlImagen = (nombreArchivo) => {
    if (!nombreArchivo) return null;
    if (nombreArchivo.startsWith("http")) return nombreArchivo;
    return `${API_URL}/uploads/${nombreArchivo}`;
  };

  // Consulta el estado de inasistencias del usuario en la semana actual
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

  // Al montar el componente se consultan los tipos de comida permitidos
  useEffect(() => {
    const obtenerTipos = async () => {
      try {
        const res = await apiAxios.get("/api/Reservas/reservar/Tipos-Permitidos");
        const tipos = res.data.tiposPermitidos || ["Desayuno", "Almuerzo", "Cena"];
        setTiposPermitidos(tipos);
        if (tipos.length > 0 && !tipReserva) {
          manejarCambioTipo(tipos[0]);
        }
      } catch (err) {
        // Fallback para admin/coordinador o error
        const fallback = ["Desayuno", "Almuerzo", "Cena"];
        setTiposPermitidos(fallback);
        if (!tipReserva) manejarCambioTipo(fallback[0]);
      }
    };
    obtenerTipos();
    obtenerEstadoInasistencias();
  }, [obtenerEstadoInasistencias]);

  // Si viene una reserva para editar, cargar los platos de ese tipo
  useEffect(() => {
    if (reserva?.Tip_Reserva || reserva?.Tipo) {
      manejarCambioTipo(reserva.Tip_Reserva || reserva.Tipo, reserva.Id_Plato);
    }
  }, [reserva]);

  // Cuando el usuario elige el tipo de comida se consultan los platos disponibles
  const manejarCambioTipo = async (tipo, idPlatoPreseleccionado = null) => {
    setTipReserva(tipo);
    setPlatos([]);
    if (!idPlatoPreseleccionado) {
      setPlatoElegido("");
      setPlatoSeleccionado(null);
    }
    setQrData(null);
    setError("");

    if (!tipo) return;

    try {
      const res = await apiAxios.get(`/api/Reservas/reservar/Menu/${fechaReserva}/${tipo}`);
      const lista = Array.isArray(res.data) ? res.data : [];
      setPlatos(lista);

      if (idPlatoPreseleccionado) {
        const encontrado = lista.find(
          (item) => (item.Id_Plato === idPlatoPreseleccionado || item.plato?.Id_Plato === idPlatoPreseleccionado)
        );
        if (encontrado) {
          const pData = encontrado.plato || encontrado;
          setPlatoSeleccionado({ ...pData, Id_Plato: idPlatoPreseleccionado });
          setPlatoElegido(idPlatoPreseleccionado);
        }
      } else if (lista.length > 0) {
        // Pre-seleccionar el primer plato automáticamente
        const primerItem = lista[0];
        const pData = primerItem.plato || primerItem;
        const id = primerItem.Id_Plato || pData.Id_Plato;
        setPlatoElegido(id);
        setPlatoSeleccionado({ ...pData, Id_Plato: id });
      }
    } catch (err) {
      setError(err.response?.data?.message || "No hay menú programado para ese tipo de comida.");
    }
  };

  // Cuando el usuario hace click en una tarjeta de plato
  const manejarSeleccionPlato = (item) => {
    const platoData = item.plato || item;
    const idPlato = item.Id_Plato || platoData.Id_Plato;
    setPlatoElegido(idPlato);
    setPlatoSeleccionado({ ...platoData, Id_Plato: idPlato });
    setQrData(null);
  };

  // Envia la reserva al backend con el tipo, el plato y la fecha de manana
  const generarQrEntrenamiento = async () => {
    setError("");
    setGuardando(true);

    const body = {
      Tip_Reserva: tipReserva,
      platoElegido: platoElegido,
      fechaReserva: fechaReserva,
    };

    try {
      const res = await apiAxios.post("/api/Reservas/reservar/generate-tomorrow", body);
      setQrData(res.data);
      obtenerEstadoInasistencias();
      if (reload) reload();
      if (mostrarQR && res.data.Qr_Reserva) {
        mostrarQR(res.data.Qr_Reserva);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error al generar la reserva");
    } finally {
      setGuardando(false);
    }
  };

  const estaSancionado = estadoInasistencias?.estaSancionado;

  return (
    <div className="w-full mx-auto space-y-4">
      {/* Alerta de inasistencias solo si se usa en vista de aprendiz */}
      {!Edit && !hideModal && (
        <AlertaInasistencias
          estado={estadoInasistencias}
          cargando={cargandoInasistencias}
          alRecargar={obtenerEstadoInasistencias}
        />
      )}

      <div className="bg-white rounded-2xl p-4 sm:p-5 space-y-4 border border-slate-100 shadow-sm">
        {/* Mensaje de error visible cuando alguna peticion falla */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {estaSancionado && !Edit ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center space-y-2">
            <p className="text-red-800 font-semibold text-sm">
              Módulo de reservas inhabilitado
            </p>
            <p className="text-red-600 text-xs leading-relaxed">
              No es posible programar nuevas reservas mientras tengas una sanción activa en el sistema.
            </p>
          </div>
        ) : (
          <>
            {/* Select del tipo de comida */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Tipo de comida
              </label>
              <select
                value={tipReserva}
                onChange={(e) => manejarCambioTipo(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
              >
                <option value="">Selecciona un tipo</option>
                {tiposPermitidos.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            {/* Tarjetas de platos con imagen, nombre y descripción */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Elige tu plato
              </label>

              {platos.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-slate-400 text-xs">
                  <UtensilsCrossed className="w-6 h-6 mx-auto mb-1.5 opacity-40 text-slate-400" />
                  No hay menú disponible para {tipReserva || "este turno"} en la fecha seleccionada ({fechaReserva}).
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {platos.map((item) => {
                    const platoData = item.plato || item;
                    const idPlato = item.Id_Plato || platoData.Id_Plato;
                    const nombre = platoData.Nom_Plato || "Plato sin nombre";
                    const descripcion = platoData.Des_Plato || "";
                    const imagen = platoData.Img_Plato;
                    const isSelected = platoElegido === idPlato;

                    return (
                      <div
                        key={idPlato || item.Id_Menu}
                        onClick={() => manejarSeleccionPlato(item)}
                        className={`cursor-pointer rounded-2xl border-2 p-3 transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/60 shadow-sm"
                            : "border-slate-200 hover:border-blue-300 hover:bg-slate-50/80 bg-white"
                        }`}
                      >
                        {imagen ? (
                          <div className="w-full h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60 mb-2 relative">
                            <img
                              src={urlImagen(imagen)}
                              alt={nombre}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-full h-32 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-1 border border-slate-200/60 mb-2">
                            <UtensilsCrossed className="w-6 h-6 text-slate-300" />
                            <span className="text-[11px]">Sin imagen</span>
                          </div>
                        )}

                        <div className="text-left flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <p className="text-sm font-bold text-slate-800 truncate m-0">
                              {nombre}
                            </p>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                            )}
                          </div>
                          {descripcion ? (
                            <p className="text-xs text-slate-500 line-clamp-2 m-0" title={descripcion}>
                              {descripcion}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400 italic m-0">
                              Sin descripción
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resumen de la reserva */}
            {tipReserva && platoSeleccionado && (
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 space-y-2.5 text-xs">
                <p className="font-bold text-emerald-800 text-sm mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Resumen de tu reserva
                </p>

                <div className="flex justify-between text-slate-600">
                  <span className="font-semibold text-slate-500 flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5 text-slate-400" /> Fecha de reserva:
                  </span>
                  <span className="font-bold text-slate-800">{fechaReserva}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span className="font-semibold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Vence a las:
                  </span>
                  <span className="font-bold text-slate-800">
                    {horasVencimiento[tipReserva] || "14:00"} ({fechaReserva})
                  </span>
                </div>

                <div className="flex justify-between text-slate-600 pt-1 border-t border-emerald-100">
                  <span className="font-semibold text-slate-500">Plato seleccionado:</span>
                  <span className="font-bold text-emerald-700 truncate max-w-[200px]">
                    {platoSeleccionado.Nom_Plato}
                  </span>
                </div>
              </div>
            )}

            {/* Botón para confirmar y generar el QR */}
            {tipReserva && platoElegido && !qrData && (
              <div className="pt-2">
                <button
                  onClick={generarQrEntrenamiento}
                  disabled={guardando}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition cursor-pointer shadow-sm text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {guardando ? "Generando reserva..." : "Confirmar Reserva y Generar QR"}
                </button>
              </div>
            )}

            {/* Codigo QR generado despues de confirmar */}
            {qrData && (
              <div className="flex flex-col items-center gap-3 pt-3 bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <div className="text-center">
                  <p className="text-sm font-bold text-emerald-700 m-0">
                    ¡Reserva generada con éxito!
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 m-0">
                    Válido para el {qrData.validDate}
                  </p>
                </div>
                <div className="p-3.5 bg-white border-2 border-emerald-300 rounded-2xl shadow-sm">
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
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    Cerrar
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReservaForm;
