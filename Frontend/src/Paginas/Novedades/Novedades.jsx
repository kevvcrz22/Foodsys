// Paginas/Novedades/Novedades.jsx
// Pagina principal del modulo de Novedades
// Orquesta los sub-componentes y la logica de API
// La logica de fechas y tipos se movio al backend

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
  const [Tipo, Set_Tipo] = useState("Almuerzo");
  const [Tipos_Disp, Set_TiposDisp] = useState(["Desayuno", "Almuerzo", "Cena"]);
  const [Cargando, Set_Cargando] = useState(false);
  const [Mensaje, Set_Mensaje] = useState(null);
  const [Reservas_Exc, Set_ResExc] = useState([]);

  useEffect(() => {
    Cargar_Usuarios();
    Cargar_Excepcionales();
  }, []);

  // Carga aprendices desde el backend
  const Cargar_Usuarios = async () => {
    try {
      const Res = await apiAxios.get("/api/Usuarios/aprendices");
      Set_Usuarios(Res.data);
    } catch (Err) { console.error(Err); }
  };

  // Obtiene las excepcionales del dia desde el backend
  // La logica de fecha se ejecuta en el servidor
  const Cargar_Excepcionales = async () => {
    try {
      const Res = await apiAxios.get("/api/Novedades/excepcionales");
      Set_ResExc(Res.data);
    } catch (Err) { console.error(Err); }
  };

  // Filtra usuarios localmente para el buscador
  const Usuarios_Filtrados = Usuarios.filter(U =>
    `${U.Nom_Usuario} ${U.Ape_Usuario}`
      .toLowerCase().includes(Busqueda.toLowerCase()) ||
    String(U.NumDoc_Usuario).includes(Busqueda)
  );

  const Manejar_Seleccionar = (U) => {
    Set_UsuarioSel(U);
    Set_Busqueda(`${U.Nom_Usuario} ${U.Ape_Usuario}`);
    Set_Tipo("Almuerzo");
    // Obtiene los tipos permitidos desde el backend
    Cargar_Tipos_Permitidos();
  };

  // Consulta al backend los tipos de comida permitidos
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
  };

  const Manejar_Registrar = async () => {
    if (!Usuario_Sel) {
      Set_Mensaje({ tipo: "error", texto: "Selecciona un aprendiz primero" });
      return;
    }
    try {
      Set_Cargando(true);
      await apiAxios.post("/api/Reservas/excepcional", {
        Id_Usuario: Usuario_Sel.Id_Usuario,
        Tipo: Tipo,
        Tex_Qr: JSON.stringify({
          Id_Usuario: Usuario_Sel.Id_Usuario,
          Tipo, Excepcional: true,
        }),
      });
      Set_Mensaje({
        tipo: "exito",
        texto: `Reserva registrada para ${Usuario_Sel.Nom_Usuario} ${Usuario_Sel.Ape_Usuario}`,
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

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1861c1]">Modulo de Novedades</h1>
        <p className="text-gray-500 text-sm mt-1">
          Registra reservas excepcionales para aprendices
        </p>
      </div>

      {Mensaje && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${Mensaje.tipo === "exito" ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"}`}>
          {Mensaje.texto}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
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

          <SelectorTipo
            Tipos_Disponibles={Tipos_Disp}
            Tipo={Tipo} Set_Tipo={Set_Tipo}
            Usuario_Seleccionado={Usuario_Sel}
          />

          <button
            onClick={Manejar_Registrar}
            disabled={Cargando}
            className="w-full py-3 rounded-xl font-semibold bg-[#42b72a] text-white hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {Cargando
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              : "Registrar Novedad"
            }
          </button>
        </div>

        <ListaNovedades Reservas={Reservas_Exc} />
      </div>
    </div>
  );
};

export default Novedades;