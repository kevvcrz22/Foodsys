// Paginas/Perfil/EncabezadoPerfil.jsx
// Encabezado con avatar, nombre, roles y estado
// del usuario autenticado

import { Shield } from "lucide-react";

const EncabezadoPerfil = ({ Usuario, Roles }) => {
  // Genera iniciales del usuario
  const Iniciales = [
    Usuario.Nom_Usuario?.charAt(0),
    Usuario.Ape_Usuario?.charAt(0),
  ].filter(Boolean).join("").toUpperCase();

  // Cuenta activa si no esta sancionado
  const Cuenta_Activa = Usuario.San_Usuario !== "Si";

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-md flex-shrink-0">
          {Iniciales || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-slate-800">
            {Usuario.Nom_Usuario} {Usuario.Ape_Usuario}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5 truncate">
            {Roles.length > 0 ? Roles.join(" - ") : "Sin rol asignado"}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={[
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
              Cuenta_Activa ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700",
            ].join(" ")}>
              <span className={`w-1.5 h-1.5 rounded-full ${Cuenta_Activa ? "bg-green-500" : "bg-red-500"}`} />
              {Cuenta_Activa ? "Cuenta Activa" : "Cuenta Inactiva"}
            </span>
            {Usuario.San_Usuario === "Si" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 border border-orange-200 text-orange-700">
                <Shield size={10} />
                Sancionado
              </span>
            )}
          </div>
        </div>
        <div className="text-right hidden sm:block flex-shrink-0">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {Usuario.TipDoc_Usuario}
          </p>
          <p className="text-base font-bold text-slate-700 font-mono">
            {Usuario.NumDoc_Usuario}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EncabezadoPerfil;
