// Components/NavBar/NavRolSelector.jsx
// Selector de rol activo para el navbar.
// Si el usuario tiene un solo rol, lo muestra como texto estatico.
// Si tiene mas de uno, despliega un menu flotante para cambiar entre roles.

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

const NavRolSelector = ({ usuario, roles = [], rolActivo, onCambioRol }) => {
  const [Menu_Abierto, Set_MenuAbierto] = useState(false);
  const Ref_Contenedor = useRef(null);

  // Cierra el menu si el usuario hace clic fuera del componente
  useEffect(() => {
    const Manejar_ClickFuera = (Evento) => {
      if (
        Ref_Contenedor.current &&
        !Ref_Contenedor.current.contains(Evento.target)
      ) {
        Set_MenuAbierto(false);
      }
    };
    document.addEventListener("mousedown", Manejar_ClickFuera);
    return () => document.removeEventListener("mousedown", Manejar_ClickFuera);
  }, []);

  // No renderizar si no hay usuario autenticado
  if (!usuario) return null;

  // Eliminar roles duplicados
  const Roles_Unicos = [...new Set(roles)];

  // Con un solo rol, mostrar texto estatico sin dropdown
  if (Roles_Unicos.length <= 1) {
    return (
      <span className="px-3 py-1.5 rounded-lg bg-white/15 text-white text-sm font-semibold">
        {Roles_Unicos[0] || "Sin rol"}
      </span>
    );
  }

  // Cambiar rol activo y cerrar el menu
  const Seleccionar_Rol = (Rol) => {
    onCambioRol(Rol);
    Set_MenuAbierto(false);
  };

  return (
    <div ref={Ref_Contenedor} className="relative">
      {/* Boton que muestra el rol activo y abre el dropdown */}
      <button
        type="button"
        onClick={() => Set_MenuAbierto(!Menu_Abierto)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/15
                   hover:bg-white/25 text-white text-sm font-semibold
                   transition-colors duration-200 focus:outline-none"
        aria-haspopup="listbox"
        aria-expanded={Menu_Abierto}
      >
        <span>{rolActivo || "Seleccionar rol"}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            Menu_Abierto ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Menu flotante con la lista de roles disponibles */}
      {Menu_Abierto && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg
                     border border-gray-100 overflow-hidden z-[100]"
        >
          <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Mis Roles
          </p>
          {Roles_Unicos.map((Rol) => (
            <button
              key={Rol}
              type="button"
              role="option"
              aria-selected={Rol === rolActivo}
              onClick={() => Seleccionar_Rol(Rol)}
              className="w-full flex items-center justify-between px-3 py-2.5
                         text-sm text-left transition-colors duration-150
                         hover:bg-gray-50 focus:outline-none
                         text-gray-700"
            >
              <span className={Rol === rolActivo ? "font-semibold text-[#0f3f80]" : ""}>
                {Rol}
              </span>
              {Rol === rolActivo && (
                <Check className="w-3.5 h-3.5 text-[#0f3f80]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NavRolSelector;