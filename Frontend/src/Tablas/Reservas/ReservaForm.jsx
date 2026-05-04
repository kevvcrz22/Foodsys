import { useState, useEffect, useCallback, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import apiAxios from "../../api/axiosConfig.js";

const ReservaForm = () => {
  const [qrData, setQrData] = useState(null);
  const [historial, setHistorial] = useState([]);
  
  // Estados para el formulario
  const [fechaReserva, setFechaReserva] = useState("");
  const [tipoReserva, setTipoReserva] = useState("Almuerzo");
  const [platosDisponibles, setPlatosDisponibles] = useState([]);
  const [platoElegido, setPlatoElegido] = useState("");
  const [errorReserva, setErrorReserva] = useState("");
  const [cargandoPlatos, setCargandoPlatos] = useState(false);

  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const headers = useMemo(() => ({ Authorization: `bearer ${usuario.token}` }), [usuario.token]);

  // Al montar, establecer fecha predeterminada a mañana
  useEffect(() => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    setFechaReserva(manana.toISOString().split("T")[0]);
  }, []);

  const cargarHistorial = useCallback(async () => {
    try {
      const res = await apiAxios.get("/api/Reservas/reservar/historial", { headers });
      setHistorial(res.data);
    } catch (err) {
      console.error("Error al cargar historial:", err);
    }
  }, [headers]);

  const cargarPlatos = useCallback(async () => {
    if (!fechaReserva) return;
    setCargandoPlatos(true);
    try {
      const res = await apiAxios.get(`/api/Menus/fecha/${fechaReserva}`, { headers });
      setPlatosDisponibles(res.data || []);
      setPlatoElegido(""); // Resetear plato al cambiar fecha
    } catch (err) {
      console.error("Error al cargar menú", err);
      setPlatosDisponibles([]);
    } finally {
      setCargandoPlatos(false);
    }
  }, [fechaReserva, headers]);

  useEffect(() => { cargarHistorial(); }, [cargarHistorial]);
  useEffect(() => { cargarPlatos(); }, [cargarPlatos]);

  const generarReserva = async () => {
    try {
      setErrorReserva("");
      if (!platoElegido) {
        setErrorReserva("Debe seleccionar un plato disponible.");
        return;
      }
      
      const res = await apiAxios.post("/api/Reservas/reservar/generate-tomorrow",
        { Tip_Reserva: tipoReserva, platoElegido: parseInt(platoElegido), fechaReserva },
        { headers }
      );
      
      setQrData(res.data);
      cargarHistorial(); // Refrescar el historial
      
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Error al realizar la reserva";
      setErrorReserva(msg);
    }
  };

  const estadoColor = {
    Generado: "bg-yellow-100 text-yellow-700",
    Usado:    "bg-green-100 text-green-700",
    Expirado: "bg-red-100 text-red-700",
  };
  
  const platosFiltrados = platosDisponibles.filter(m => m.Tip_Menu === tipoReserva);

  return (
    <div className="max-w-4xl mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Columna Izquierda: Formulario de Reserva */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-lg border-b pb-2">Realizar Reserva</h2>
          
          {errorReserva && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl border border-red-200">
              {errorReserva}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Reserva</label>
              <input 
                type="date" 
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={fechaReserva}
                onChange={(e) => setFechaReserva(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Comida</label>
              <select 
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={tipoReserva}
                onChange={(e) => {
                  setTipoReserva(e.target.value);
                  setPlatoElegido("");
                }}
              >
                <option value="Desayuno">Desayuno</option>
                <option value="Almuerzo">Almuerzo</option>
                <option value="Cena">Cena</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plato Disponible (Menú)</label>
              {cargandoPlatos ? (
                <div className="text-sm text-gray-500 py-2">Cargando menú...</div>
              ) : platosFiltrados.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {platosFiltrados.map((m) => (
                    <label key={m.Id_Menu} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${platoElegido === String(m.plato?.Id_Plato) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input 
                        type="radio" 
                        name="platoElegido"
                        value={m.plato?.Id_Plato}
                        checked={platoElegido === String(m.plato?.Id_Plato)}
                        onChange={(e) => setPlatoElegido(e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{m.plato?.Nom_Plato || 'Plato sin nombre'}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{m.plato?.Des_Plato || 'Sin descripción'}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-200 text-center">
                  No hay menú programado para esta fecha y tipo de comida.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={generarReserva}
            disabled={!platoElegido || cargandoPlatos}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition"
          >
            Confirmar Reserva
          </button>
        </div>

        {/* QR Generado */}
        {qrData && (
          <div className="bg-white rounded-2xl shadow p-5 text-center space-y-4">
            <h3 className="font-semibold text-green-700 text-lg">¡Reserva Exitosa!</h3>
            <p className="text-sm text-gray-500">
              Válido para: {qrData.validDate} <br/>
              Expira: {new Date(qrData.expiresAt).toLocaleString("es-CO")}
            </p>
            <div className="flex justify-center">
              <QRCodeSVG value={qrData.qrUrl} size={250} marginSize={2} level="H" />
            </div>
            <p className="text-xs text-gray-400">Presenta este QR al reclamar tu comida.</p>
          </div>
        )}
      </div>

      {/* Columna Derecha: Historial */}
      <div className="bg-white rounded-2xl shadow p-5 flex flex-col h-[calc(100vh-140px)] min-h-[400px]">
        <h2 className="font-semibold text-gray-800 text-lg border-b pb-2 mb-4 shrink-0">
          Mis reservas recientes
        </h2>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {historial.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              <p className="text-sm">No tienes reservas aún.</p>
            </div>
          ) : (
            historial.map((r) => (
              <div key={r.Id_Reserva} className="flex flex-col gap-1 border border-gray-100 rounded-xl px-4 py-3 text-sm hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <p className="font-semibold text-gray-800">{r.Tip_Reserva}</p>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide ${estadoColor[r.Est_Reserva] ?? "bg-gray-100 text-gray-500"}`}>
                    {r.Est_Reserva}
                  </span>
                </div>
                <p className="text-gray-600 font-medium">{r.plato?.Nom_Plato ?? "Plato"}</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-400">Fecha de servicio: {r.Fec_Reserva}</p>
                  <p className="text-[10px] text-gray-400">ID: {r.Id_Reserva}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default ReservaForm;