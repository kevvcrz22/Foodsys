import { NavLink } from "react-router-dom";
import { useState } from "react";
import { Home, User, Edit, BarChart3, LogOut, Menu, X } from "lucide-react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200
     ${
       isActive
         ? "bg-blue-50 text-blue-600 font-medium"
         : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
     }`;

  return (
    <>
      {/* 🔹 Botón Hamburguesa (solo móvil) */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2.5 bg-white border border-gray-200 rounded-lg shadow-md hover:bg-gray-50 transition"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5 text-green-400" />
      </button>

      {/* 🔹 Overlay */}
      <div
        onClick={() => setIsOpen(false)}
        className={`lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300
          ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
      />

      {/* 🔹 Sidebar */}
      <aside
        className={`
          fixed lg:static
          inset-y-0 left-0 z-[55]
          w-64
          bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full bg-blue-100 border-r border-blue-300">
          
          {/* 🔹 Header */}
          <div className="p-6 border-b border-blue-300 flex items-center justify-between">
            <div className="flex items-center gap-3">
              
              {/* Avatar Emoji */}
              <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-2xl shadow-sm">
                👤
              </div>

              {/* Nombre + Cargo */}
              <div className="flex flex-col">
                <span className="text-base font-bold text-gray-800">
                  Julio Cesar Santofimio
                </span>
                <span className="text-xs text-gray-500">
                  Administrador
                </span>
              </div>
            </div>

            {/* Cerrar en móvil */}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-200 rounded-lg transition"
              aria-label="Cerrar menú"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          {/* 🔹 Navegación */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <NavLink
              to="/supervisor"
              end
              className={navLinkClass}
              onClick={() => setIsOpen(false)}
            >
              <Home className="w-5 h-5" />
              Inicio
            </NavLink>

            <NavLink
              to="/supervisor/perfil"
              className={navLinkClass}
              onClick={() => setIsOpen(false)}
            >
              <User className="w-5 h-5" />
              Mi Perfil
            </NavLink>

            <NavLink
              to="/supervisor/registrar"
              className={navLinkClass}
              onClick={() => setIsOpen(false)}
            >
              <Edit className="w-5 h-5" />
              Registrar
            </NavLink>

            <NavLink
              to="/supervisor/reportes"
              className={navLinkClass}
              onClick={() => setIsOpen(false)}
            >
              <BarChart3 className="w-5 h-5" />
              Reportes
            </NavLink>
          </nav>

          {/* 🔹 Logout abajo fijo */}
          <div className="p-4 border-t border-blue-300">
            <button
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg font-semibold 
                        text-red-600 
                        hover:bg-red-600 hover:text-white 
                        active:bg-red-700 active:text-white
                        transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
