// Paginas/Inicio/Inicio.jsx
// Pagina de Inicio del sistema FoodSys
// Muestra las vistas disponibles segun el rol activo
// Las tarjetas se obtienen del backend via API

import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig";
import EncabezadoInicio from "./EncabezadoInicio";
import TarjetaVista from "./TarjetaVista";
import { HelpCircle } from "lucide-react";

// Mapeo de rol a prefijo de ruta en el frontend
const Prefijo_Por_Rol = {
  Administrador: "/Administrador",
  Supervisor: "/supervisor",
  Coordinador: "/coordinador",
  "Aprendiz Interno": "/Interno",
  "Aprendiz Externo": "/Externo",
  Pasante: "/Pasante",
  Cocina: "/Cocina",
  Bienestar: "/Bienestar",
};

const Inicio = () => {
  const [Usuario, Set_Usuario] = useState(null);
  const [Rol_Activo, Set_RolActivo] = useState("");
  const [Vistas, Set_Vistas] = useState([]);
  const [Cargando, Set_Cargando] = useState(true);
  const [Mst_Tutorial, Set_MstTutorial] = useState(false);

  // Carga los datos del usuario y las vistas al montar
  useEffect(() => {
    const Usuario_Local = JSON.parse(
      localStorage.getItem("usuario") || "{}"
    );
    const Rol_Local =
      localStorage.getItem("rolActivo") || "";

    Set_Usuario(Usuario_Local);
    Set_RolActivo(Rol_Local);

    if (Rol_Local) {
      Cargar_Vistas(Rol_Local);
    } else {
      Set_Cargando(false);
    }
  }, []);

  // Consulta al backend las vistas del rol activo
  const Cargar_Vistas = async (Rol) => {
    Set_Cargando(true);
    try {
      const Res = await apiAxios.get(
        `/api/Inicio/vistas?rol=${encodeURIComponent(Rol)}`
      );
      Set_Vistas(Res.data.Vistas || []);
    } catch (Err) {
      console.error("Error al cargar vistas:", Err);
      Set_Vistas([]);
    } finally {
      Set_Cargando(false);
    }
  };

  // Prefijo de ruta segun el rol activo
  const Prefijo = Prefijo_Por_Rol[Rol_Activo] || "";

  return (
    <div className="min-h-screen bg-slate-50 w-full">
      <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-6">
        <EncabezadoInicio
          Usuario={Usuario}
          Rol_Activo={Rol_Activo}
        />

        {Rol_Activo === "Administrador" && (
          <div className="flex justify-end">
            <button
              onClick={() => Set_MstTutorial(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl font-semibold transition-colors shadow-sm"
            >
              <HelpCircle size={18} />
              Guía de Administrador
            </button>
          </div>
        )}

        {Cargando ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : Vistas.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm">
              No hay vistas disponibles para tu rol
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Vistas.map((Vista, Idx) => (
              <TarjetaVista
                key={Vista.Clave_Vista}
                Vista={Vista}
                Indice={Idx}
                Prefijo_Ruta={Prefijo}
              />
            ))}
          </div>
        )}

        {Mst_Tutorial && (
          <div className="fixed inset-0 bg-black/50 z-100 flex justify-end">
            <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-xl font-bold text-slate-800">Guía de Administrador</h3>
                <button onClick={() => Set_MstTutorial(false)} className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div>
                  <h4 className="font-bold text-blue-700 mb-2">1. Gestión de Usuarios y Roles</h4>
                  <p className="text-sm text-slate-600">Puedes crear, editar e inactivar usuarios. Además, puedes asignarles roles desde el submódulo correspondiente. Un usuario inactivo no podrá hacer reservas.</p>
                </div>
                <div>
                  <h4 className="font-bold text-blue-700 mb-2">2. Reservas y Novedades</h4>
                  <p className="text-sm text-slate-600">Supervisa todas las reservas hechas en el sistema. Las novedades te permiten realizar reservas forzadas saltando la restricción de 24 horas para casos excepcionales.</p>
                </div>
                <div>
                  <h4 className="font-bold text-blue-700 mb-2">3. Configuración de Menú</h4>
                  <p className="text-sm text-slate-600">Actualiza los platos disponibles y arma el menú diario. Los usuarios solo podrán reservar lo que configures en esta sección.</p>
                </div>
                <div>
                  <h4 className="font-bold text-blue-700 mb-2">4. Reportes</h4>
                  <p className="text-sm text-slate-600">Genera reportes de consumo filtrando por rangos de fecha y tipo de comida. Exporta los datos a Excel para análisis detallado.</p>
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 bg-slate-50">
                <button onClick={() => Set_MstTutorial(false)} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inicio;