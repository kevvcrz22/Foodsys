import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import apiAxios from "../../api/axiosConfig.js";

const ReservaForm = () => {

  // Estado para los tipos de comida permitidos segun el rol del usuario logueado
  const [tiposPermitidos, setTiposPermitidos] = useState([]);

  // Estado para el tipo de comida elegido en el select
  const [tipReserva, setTipReserva] = useState("");

  // Estado para la lista de platos disponibles segun el tipo elegido
  const [platos, setPlatos] = useState([]);

  // Estado para el id del plato que el usuario selecciono
  const [platoElegido, setPlatoElegido] = useState("");

  // Estado para el objeto completo del plato elegido, se usa en el resumen
  const [platoSeleccionado, setPlatoSeleccionado] = useState(null);

  // Estado para guardar el resultado del QR despues de generar la reserva
  const [qrData, setQrData] = useState(null);

  // Estado para mostrar mensajes de error al usuario
  const [error, setError] = useState("");

  // Horas de vencimiento por tipo de comida
  // Se usan en el resumen para informar al usuario hasta cuando es valida la reserva
  const horasVencimiento = {
    Desayuno: "07:00",
    Almuerzo: "14:05",
    Cena: "19:00"
  };

  // Se calcula la fecha de manana una sola vez para usarla en todo el componente
  // Esta es la fecha que se enviara al backend como fechaReserva
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const fechaReserva = manana.toISOString().split("T")[0];

  // Al montar el componente se consultan los tipos de comida permitidos
  // segun el rol del usuario logueado (Interno ve los tres, Externo solo Almuerzo)
  useEffect(() => {
    const obtenerTipos = async () => {
      try {
        const res = await apiAxios.get("/api/Reservas/reservar/tipos-permitidos");
        setTiposPermitidos(res.data.tiposPermitidos);
      } catch (err) {
        setError(err.response?.data?.message || "No se pudieron cargar los tipos de comida");
      }
    };
    obtenerTipos();
  }, []);

  // Cuando el usuario elige el tipo de comida se limpian los estados dependientes
  // y se consultan los platos disponibles para manana con ese tipo
  const manejarCambioTipo = async (tipo) => {
    setTipReserva(tipo);
    setPlatos([]);
    setPlatoElegido("");
    setPlatoSeleccionado(null);
    setQrData(null);
    setError("");

    if (!tipo) return;

    try {
      const res = await apiAxios.get(`/api/Reservas/reservar/menu/${fechaReserva}/${tipo}`);
      setPlatos(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "No hay menu disponible para ese tipo de comida");
    }
  };

  // Cuando el usuario hace click en una tarjeta de plato se guarda el id y el objeto completo
  // El objeto completo se necesita para mostrar el nombre en el resumen
  const manejarSeleccionPlato = (plato) => {
    setPlatoElegido(plato.Id_Plato);
    setPlatoSeleccionado(plato);
    setQrData(null);
  };

  // Construye la URL completa de la imagen del plato usando la base del servidor
  // Las imagenes se sirven desde la carpeta uploads del backend
  const urlImagen = (nombreArchivo) => {
    const base = apiAxios.defaults.baseURL || "http://localhost:8000";
    return `${base}/uploads/${nombreArchivo}`;
  };

  // Envia la reserva al backend con el tipo, el plato y la fecha de manana
  const generarQrEntrenamiento = async () => {
    setError("");

    const body = {
      Tip_Reserva: tipReserva,
      platoElegido: platoElegido,
      fechaReserva: fechaReserva,
    };

    try {
      const res = await apiAxios.post("/api/Reservas/reservar/generate-tomorrow", body);
      setQrData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Error al generar la reserva");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <div className="bg-white rounded-2xl shadow p-4 space-y-4">

        {/* Mensaje de error visible cuando alguna peticion falla */}
        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        {/* Select del tipo de comida */}
        {/* Solo muestra las opciones que el rol del usuario permite */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Tipo de comida
          </label>
          <select
            value={tipReserva}
            onChange={(e) => manejarCambioTipo(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Selecciona un tipo</option>
            {tiposPermitidos.map((tipo) => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>

        {/* Tarjetas de platos con imagen */}
        {/* Se despliegan automaticamente cuando el usuario elige el tipo de comida */}
        {platos.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Elige tu plato
            </label>
            <div className="grid grid-cols-2 gap-3">
              {platos.map((plato) => (
                <div
                  key={plato.Id_Plato}
                  onClick={() => manejarSeleccionPlato(plato)}
                  className={`cursor-pointer rounded-xl border-2 p-2 transition ${
                    platoElegido === plato.Id_Plato
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  }`}
                >
                  {/* Imagen del plato traida desde la carpeta uploads del backend */}
                  {plato.Img_Plato ? (
                    <img
                      src={urlImagen(plato.Img_Plato)}
                      alt={plato.Nom_Plato}
                      className="w-full h-28 object-cover rounded-lg"
                    />
                  ) : (
                    /* Espacio gris cuando el plato no tiene imagen registrada */
                    <div className="w-full h-28 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-xs">Sin imagen</span>
                    </div>
                  )}

                  {/* Nombre del plato debajo de la imagen */}
                  <p className="text-sm font-medium text-gray-700 mt-1 text-center truncate">
                    {plato.Nom_Plato}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumen de la reserva */}
        {/* Se muestra cuando el usuario ya eligio tipo y plato, antes de confirmar */}
        {tipReserva && platoSeleccionado && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2 text-sm">
            <p className="font-semibold text-green-700 text-center text-base mb-2">
              Resumen de tu reserva
            </p>

            {/* Fecha en la que se usara la reserva */}
            <div className="flex justify-between text-gray-600">
              <span className="font-medium">Fecha de reserva</span>
              <span>{fechaReserva}</span>
            </div>

            {/* Hora exacta hasta la que la reserva es valida ese dia */}
            <div className="flex justify-between text-gray-600">
              <span className="font-medium">Vence a las</span>
              <span>{horasVencimiento[tipReserva]} del {fechaReserva}</span>
            </div>

            {/* Nombre del plato que el usuario eligio */}
            <div className="flex justify-between text-gray-600">
              <span className="font-medium">Plato elegido</span>
              <span>{platoSeleccionado.Nom_Plato}</span>
            </div>
          </div>
        )}

        {/* Boton para confirmar y generar el QR */}
        {/* Solo se muestra cuando hay tipo y plato seleccionados */}
        {tipReserva && platoElegido && (
          <div className="text-center">
            <button
              onClick={generarQrEntrenamiento}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-xl transition"
            >
              Generar QR para manana
            </button>
          </div>
        )}

        {/* Codigo QR generado despues de confirmar la reserva */}
        {qrData && (
          <div className="flex flex-col items-center gap-2 pt-2">
            <p className="text-sm text-gray-500">Valido: {qrData.validDate}</p>
            <QRCodeSVG value={qrData.qrUrl} size={350} marginSize={4} level="H" />
          </div>
        )}

      </div>
    </div>
  );
};

export default ReservaForm;