import { NavLink } from "react-router-dom";
import { useState } from "react";
import { Home, User, Edit, BarChart3, LogOut, Menu, X } from "lucide-react";
import logoFoodSys from "./Img/LogoFoodsys.png";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen(!isOpen);

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group
     ${isActive
      ? "bg-blue-50 text-blue-600 font-medium"
      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    }`;

  return (
    <>
      {/* Botón abrir móvil (solo visible cuando está cerrado) */}
      {!isOpen && (
        <button
          onClick={toggleSidebar}
          className="lg:hidden fixed top-4 left-4 z-40 p-2.5 bg-white border border-gray-200 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
      )}

      {/* Overlay móvil */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 backdrop-blur-sm bg-opacity-50 z-30 transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 h-screen
          bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full bg-blue-100 border-r border-blue-300">
          {/* Header */}
          <div className="p-6 border-b border-blue-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={logoFoodSys}
                  alt="FoodSys"
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <h2 className="text-xl text-bold text-gray-700">
                  FoodSys
                </h2>
              </div>
              
              {/* Botón cerrar dentro del sidebar (solo móvil) */}
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="w-8 h-8 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Navegación */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <NavLink
              to="/supervisor"
              end
              className={navLinkClass}
              onClick={() => setIsOpen(false)}
            >
              <Home className="w-5 h-5" />
              <span>Inicio</span>
            </NavLink>

            <NavLink
              to="/supervisor/perfil"
              className={navLinkClass}
              onClick={() => setIsOpen(false)}
            >
              <User className="w-5 h-5" />
              <span>Mi Perfil</span>
            </NavLink>

            <NavLink
              to="/supervisor/registrar"
              className={navLinkClass}
              onClick={() => setIsOpen(false)}
            >
              <Edit className="w-5 h-5" />
              <span>Registrar</span>
            </NavLink>

            <NavLink
              to="/supervisor/reportes"
              className={navLinkClass}
              onClick={() => setIsOpen(false)}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Reportes</span>
            </NavLink>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-blue-300">
            <button className="
              w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
              text-red-700 bg-red-100
              hover:bg-red-200 hover:text-red-600
              border border-gray-200 hover:border-red-200
              transition-all duration-200
              group
            ">
              <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
