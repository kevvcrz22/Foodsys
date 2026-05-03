// Paginas/Novedades/Novedades.jsx
// Pagina principal del modulo de Novedades
import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig";
import BuscadorAprendiz from "./BuscadorAprendiz";
import TarjetaSeleccionado from "./TarjetaSeleccionado";
import SelectorTipo from "./SelectorTipo";
import ListaNovedades from "./ListaNovedades";

const Novedades = () => {
  const [Usuarios, Set_Usuarios] = useState([]);
  const [Busqueda, Set_Busqueda] = useState("");
  const [Usuario_Sel, Set_UsuarioSel] = useState(null);
  
  // Campos del formulario
  const [Tipo, Set_Tipo] = useState("Almuerzo");
  const [Fecha, Set_Fecha] = useState(new Date().toISOString().split("T")[0]);
  const [Plato, Set_Plato] = useState("");
  const [Justificacion, Set_Justificacion] = useState("");
  
  const [Tipos_Disp, Set_TiposDisp] = useState(["Desayuno", "Almuerzo", "Cena"]);
  const [PlatosDisp, Set_PlatosDisp] = useState([]);
  const [Cargando, Set_Cargando] = useState(false);
  const [Mensaje, Set_Mensaje] = useState(null);
  const [Reservas_Exc, Set_ResExc] = useState([]);

  useEffect(() => {
    Cargar_Usuarios();
    Cargar_Excepcionales();
  }, []);

  useEffect(() => {
    Cargar_Platos();
  }, [Fecha]);

  const Cargar_Usuarios = async () => {
    try {
      const Res = await apiAxios.get("/api/Usuarios/aprendices");
      Set_Usuarios(Res.data);
    } catch (Err) { console.error(Err); }
  };

  const Cargar_Excepcionales = async () => {
    try {
      const Res = await apiAxios.get("/api/Novedades/excepcionales");
      Set_ResExc(Res.data);
    } catch (Err) { console.error(Err); }
  };

  const Cargar_Platos = async () => {
    if (!Fecha) return;
    try {
      const Res = await apiAxios.get(`/api/Menus/fecha/${Fecha}`);
      Set_PlatosDisp(Res.data || []);
      Set_Plato("");
    } catch (Err) { 
      console.error(Err); 
      Set_PlatosDisp([]);
    }
  };

  const Usuarios_Filtrados = Usuarios.filter(U =>
    `${U.Nom_Usuario} ${U.Ape_Usuario}`.toLowerCase().includes(Busqueda.toLowerCase()) ||
    String(U.NumDoc_Usuario).includes(Busqueda)
  );

  const Manejar_Seleccionar = (U) => {
    Set_UsuarioSel(U);
    Set_Busqueda(`${U.Nom_Usuario} ${U.Ape_Usuario}`);
    Set_Tipo("Almuerzo");
    Cargar_Tipos_Permitidos();
  };

  const Cargar_Tipos_Permitidos = async () => {
    try {
      const Res = await apiAxios.get("/api/Novedades/tipos");
      Set_TiposDisp(Res.data.Tipos || []);
    } catch (Err) { console.error(Err); }
  };

  const Limpiar_Seleccion = () => {
    Set_UsuarioSel(null);
    Set_Busqueda("");
    Set_Tipo("Almuerzo");
    Set_Plato("");
    Set_Justificacion("");
  };

  const Manejar_Registrar = async () => {
    if (!Usuario_Sel) {
      Set_Mensaje({ tipo: "error", texto: "Selecciona un aprendiz primero" });
      return;
    }
    if (!Plato || !Justificacion.trim()) {
      Set_Mensaje({ tipo: "error", texto: "Debes seleccionar un plato y escribir una justificación" });
      return;
    }
    
    try {
      Set_Cargando(true);
      await apiAxios.post("/api/Reservas/excepcional", {
        Id_Usuario: Usuario_Sel.Id_Usuario,
        Tip_Reserva: Tipo,
        platoElegido: parseInt(Plato),
        fechaReserva: Fecha,
        justificacion: Justificacion
      });
      Set_Mensaje({
        tipo: "exito",
        texto: `Reserva por novedad registrada para ${Usuario_Sel.Nom_Usuario} ${Usuario_Sel.Ape_Usuario}`,
      });
      Limpiar_Seleccion();
      Cargar_Excepcionales();
    } catch (Err) {
      Set_Mensaje({ tipo: "error", texto: Err.response?.data?.message || "Error al registrar" });
    } finally {
      Set_Cargando(false);
      setTimeout(() => Set_Mensaje(null), 4000);
    }
  };

  const Platos_Filtrados = PlatosDisp.filter(m => m.Tip_Menu === Tipo);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1861c1]">Módulo de Novedades</h1>
        <p className="text-gray-500 text-sm mt-1">
          Registra reservas excepcionales para aprendices sin restricción de 24 horas
        </p>
      </div>

      {Mensaje && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${Mensaje.tipo === "exito" ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"}`}>
          {Mensaje.texto}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2 border-b pb-3">
            <span className="w-8 h-8 bg-[#1861c1]/10 rounded-lg flex items-center justify-center text-[#1861c1]">
              <i className="fas fa-plus text-sm"></i>
            </span>
            Registrar Reserva Excepcional
          </h2>

          <BuscadorAprendiz
            Busqueda={Busqueda} Set_Busqueda={Set_Busqueda}
            Usuarios_Filtrados={Usuarios_Filtrados}
            Set_UsuarioSel={Set_UsuarioSel} Set_Tipo={Set_Tipo}
            Usuario_Seleccionado={Usuario_Sel}
            Manejar_Seleccionar={Manejar_Seleccionar}
          />

          <TarjetaSeleccionado
            Usuario={Usuario_Sel}
            Limpiar_Seleccion={Limpiar_Seleccion}
          />

          {Usuario_Sel && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Fecha de Reserva</label>
                  <input 
                    type="date"
                    value={Fecha}
                    onChange={(e) => Set_Fecha(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Tipo de Comida</label>
                  <select
                    value={Tipo}
                    onChange={(e) => { Set_Tipo(e.target.value); Set_Plato(""); }}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {Tipos_Disp.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Plato (Menú del día)</label>
                {Platos_Filtrados.length > 0 ? (
                  <select
                    value={Plato}
                    onChange={(e) => Set_Plato(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- Seleccione un plato --</option>
                    {Platos_Filtrados.map(m => (
                      <option key={m.Id_Menu} value={m.plato?.Id_Plato}>
                        {m.plato?.Nom_Plato}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded-xl border text-center">
                    No hay menú programado
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Justificación</label>
                <textarea
                  value={Justificacion}
                  onChange={(e) => Set_Justificacion(e.target.value)}
                  placeholder="Explique el motivo de esta novedad..."
                  rows="2"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <button
                onClick={Manejar_Registrar}
                disabled={Cargando || !Plato || !Justificacion.trim()}
                className="w-full py-3 rounded-xl font-semibold bg-[#42b72a] text-white hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {Cargando
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  : "Registrar Novedad"
                }
              </button>
            </div>
          )}
        </div>

        <ListaNovedades Reservas={Reservas_Exc} />
      </div>
    </div>
  );
};

export default Novedades;