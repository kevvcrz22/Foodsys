import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";

const NavAcciones = ({ usuario, roles = [], onCerrarSesion }) => {
    usuario && Array.isArray(roles) && roles.includes("Aprendiz Externo");

  return (
    <>
      {usuario && (
        <button
          onClick={onCerrarSesion}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      )}
    </>
  );
};

export default NavAcciones;