import { NavLink } from "react-router-dom";
import { useState } from "react";
import logoFoodSys from "./Img/LogoFoodsys.png";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300
     ${isActive
      ? "bg-blue-500 text-white font-semibold shadow-lg"
      : "text-blue-50 hover:bg-blue-600 hover:text-white hover:shadow-md"
    }`;

  return (
    <>
      {/* Botón móvil */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-green-500 text-white rounded-lg shadow-lg hover:bg-blue-800 transition-colors"
      >
        <i className={`bi ${isOpen ? "bi-x-lg" : "bi-list"} text-2xl`} />
      </button>

      {/* Overlay móvil */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-72 lg:w-64 h-screen
          bg-gradient-to-b from-blue-500 to-blue-700
          text-white shadow-2xl
          transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-blue-400">
            <div className="flex items-center justify-center">
              <img
                src={logoFoodSys}
                alt="FoodSys Logo"
                className="w-12 h-12 rounded-xl shadow-md"
              />
              <h2 className="text-2xl text-green-400 font-bold ml-4">
                FoodSys
              </h2>
            </div>
          </div>

          {/* Navegación */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <NavLink
              to="/supervisor"
              end
              className={navLinkClass}
              onClick={() => setIsOpen(false)}
            >
              <i className="bi bi-house text-xl" />
              <span>Inicio</span>
            </NavLink>

            <NavLink
              to="/supervisor/perfil"
              className={navLinkClass}
              onClick={() => setIsOpen(false)}
            >
              <i className="bi bi-person-circle text-xl" />
              <span>Mi Perfil</span>
            </NavLink>

            <NavLink
              to="/supervisor/registrar"
              className={navLinkClass}
              onClick={() => setIsOpen(false)}
            >
              <i className="bi bi-pencil-square text-xl" />
              <span>Registrar</span>
            </NavLink>

            <NavLink
              to="/supervisor/reportes"
              className={navLinkClass}
              onClick={() => setIsOpen(false)}
            >
              <i className="bi bi-bar-chart-fill text-xl" />
              <span>Reportes</span>
            </NavLink>
          </nav>
          {/* Footer */}
          <div className="p-4 border-t border-blue-600">
            <button className="
  w-full flex items-center gap-3 px-4 py-3 rounded-lg
  text-blue-50
  bg-transparent
  hover:bg-red-600 hover:text-white
  transition-all duration-300 ease-in-out
  transform hover:scale-105 hover:shadow-lg
  active:scale-95
">
              <i className="bi bi-box-arrow-left text-xl transition-transform duration-300 group-hover:-translate-x-1"></i>
              <span className="font-medium">Cerrar Sesión</span>
            </button>

          </div>
        </div>
      </aside>
    </>
  );
}
