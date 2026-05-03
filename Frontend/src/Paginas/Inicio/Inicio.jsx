// Paginas/Inicio/Inicio.jsx
// Pagina de Inicio del sistema FoodSys
// Muestra las vistas disponibles segun el rol activo
// Las tarjetas se obtienen del backend via API

import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig";
import EncabezadoInicio from "./EncabezadoInicio";
import TarjetaVista from "./TarjetaVista";

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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <EncabezadoInicio
          Usuario={Usuario}
          Rol_Activo={Rol_Activo}
        />

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      </div>
    </div>
  );
};

export default Inicio;