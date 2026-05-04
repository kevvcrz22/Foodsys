// Components/Sidebar.jsx
// Barra lateral de navegacion del sistema FoodSys.
// Version escritorio: fija a la izquierda, sin boton de cerrar sesion.
// Version movil: drawer deslizable con NavRolSelector, links de Contacto/About y cerrar sesion.
// El boton hamburguesa se oculta automaticamente cuando el sidebar movil esta abierto.

import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Home, User, Edit, BarChart3, LogOut, Menu, X,
  CalendarCheck, Users, FileText, GraduationCap,
  Database, ShieldCheck, Utensils, ClipboardList,
  Phone, Info,
} from "lucide-react";
import { useNavBar } from "./CerrarSesion";
import NavRolSelector from "./NavBar/NavRolSelector";

// Navegacion principal organizada por rol
const NAV_POR_ROL = {
  Administrador: [
    { to: "/Administrador", label: "Inicio", icon: Home },
    { to: "/Administrador/Perfil", label: "Mi Perfil", icon: User },
    { to: "/Administrador/Reportes", label: "Reportes", icon: BarChart3 },
    { to: "/Administrador/Reservas", label: "Reservas", icon: CalendarCheck },
    { to: "/Administrador/Novedades", label: "Novedades", icon: ClipboardList },
  ],
  Supervisor: [
    { to: "/supervisor", label: "Inicio", icon: Home },
    { to: "/supervisor/Perfil", label: "Mi Perfil", icon: User },
    { to: "/supervisor/Registrar", label: "Registrar", icon: Edit },
    { to: "/supervisor/Reportes", label: "Reportes", icon: BarChart3 },
  ],
  "Aprendiz Externo": [
    { to: "/Externo", label: "Inicio", icon: Home },
    { to: "/Externo/Perfil", label: "Mi Perfil", icon: User },
    { to: "/Externo/Reservas", label: "Reservas", icon: CalendarCheck },
  ],
  "Aprendiz Interno": [
    { to: "/Interno", label: "Inicio", icon: Home },
    { to: "/Interno/Perfil", label: "Mi Perfil", icon: User },
    { to: "/Interno/Reservas", label: "Reservas", icon: CalendarCheck },
  ],
  Coordinador: [
    { to: "/coordinador", label: "Inicio", icon: Home },
    { to: "/coordinador/Perfil", label: "Mi Perfil", icon: User },
    { to: "/coordinador/Novedades", label: "Novedades", icon: ClipboardList },
    { to: "/coordinador/Reportes", label: "Reportes", icon: BarChart3 },
  ],
  Pasante: [
    { to: "/Pasante", label: "Inicio", icon: Home },
    { to: "/Pasante/Perfil", label: "Mi Perfil", icon: User },
    { to: "/Pasante/Reservas", label: "Reservas", icon: CalendarCheck },
  ],
  Cocina: [
    { to: "/Cocina", label: "Inicio", icon: Home },
    { to: "/Cocina/Perfil", label: "Mi Perfil", icon: User },
    { to: "/Cocina/Reportes", label: "Reportes", icon: BarChart3 },
  ],
  Bienestar: [
    { to: "/Bienestar", label: "Inicio", icon: Home },
    { to: "/Bienestar/Perfil", label: "Mi Perfil", icon: User },
    { to: "/Bienestar/Reportes", label: "Reportes", icon: BarChart3 },
    { to: "/Bienestar/Novedades", label: "Novedades", icon: ClipboardList },
  ],
};

// Tablas de administracion visibles por rol
const TABLAS_POR_ROL = {
  Administrador: [
    { to: "/usuarios", label: "Usuarios", icon: Users },
    { to: "/aprendices", label: "Aprendices", icon: User },
    { to: "/UsuariosRoles", label: "Usuarios Roles", icon: ShieldCheck },
    { to: "/roles", label: "Roles", icon: ShieldCheck },
    { to: "/fichas", label: "Fichas", icon: FileText },
    { to: "/programas", label: "Programas", icon: GraduationCap },
    { to: "/reservas", label: "Reservas", icon: Database },
    { to: "/platos", label: "Platos", icon: Utensils },
    { to: "/menus", label: "Menus", icon: ClipboardList },
  ],
  Coordinador: [
    { to: "/aprendices", label: "Aprendices", icon: User },
  ],
  Bienestar: [
    { to: "/aprendices", label: "Aprendices", icon: User },
  ],
};

// Color de acento segun el rol para personalizar la apariencia del sidebar
const ACCENT_POR_ROL = {
  Administrador: { accent: "bg-indigo-500", badge: "bg-indigo-100 text-indigo-700", activeLink: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  Supervisor: { accent: "bg-blue-500", badge: "bg-blue-100 text-blue-700", activeLink: "bg-blue-50 text-blue-700 border-blue-200" },
  "Aprendiz Externo": { accent: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700", activeLink: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "Aprendiz Interno": { accent: "bg-teal-500", badge: "bg-teal-100 text-teal-700", activeLink: "bg-teal-50 text-teal-700 border-teal-200" },
  Coordinador: { accent: "bg-violet-500", badge: "bg-violet-100 text-violet-700", activeLink: "bg-violet-50 text-violet-700 border-violet-200" },
  Pasante: { accent: "bg-cyan-500", badge: "bg-cyan-100 text-cyan-700", activeLink: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  Cocina: { accent: "bg-orange-500", badge: "bg-orange-100 text-orange-700", activeLink: "bg-orange-50 text-orange-700 border-orange-200" },
  Bienestar: { accent: "bg-rose-500", badge: "bg-rose-100 text-rose-700", activeLink: "bg-rose-50 text-rose-700 border-rose-200" },
};

const DEFAULT_ACCENT = {
  accent: "bg-gray-500",
  badge: "bg-gray-100 text-gray-700",
  activeLink: "bg-gray-100 text-gray-700 border-gray-200",
};

// Props que recibe desde LayoutConSidebar:
// - roles: lista de roles del usuario logueado
// - rolActivo: rol actualmente activo
// - onCambioRol: funcion para cambiar el rol activo
export default function Sidebar({ roles = [], rolActivo: rolActivoProp, onCambioRol }) {
  const [Sidebar_Abierto, Set_SidebarAbierto] = useState(false);
  const [Usuario, Set_Usuario] = useState(null);
  const [Rol_Activo, Set_RolActivo] = useState("");
  const { handleCerrarSesion } = useNavBar();

  // Leer datos del usuario y sincronizar el rol activo desde props o localStorage
  useEffect(() => {
    const Usr = JSON.parse(localStorage.getItem("usuario") || "null");
    Set_Usuario(Usr);
    Set_RolActivo(rolActivoProp || localStorage.getItem("rolActivo") || "");
  }, [rolActivoProp]);

  // Bloquear scroll del body cuando el drawer movil esta abierto
  useEffect(() => {
    document.body.style.overflow = Sidebar_Abierto ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [Sidebar_Abierto]);

  // Delegar el cambio de rol al manejador del padre y actualizar el estado local
  const Manejar_CambioRol = (Nuevo_Rol) => {
    Set_RolActivo(Nuevo_Rol);
    if (onCambioRol) onCambioRol(Nuevo_Rol);
    Set_SidebarAbierto(false);
  };

  const Nombre_Completo = Usuario
    ? `${Usuario.Nom_Usuario ?? ""} ${Usuario.Ape_Usuario ?? ""}`.trim()
    : "Usuario";

  const Inicial = Nombre_Completo.charAt(0).toUpperCase() || "U";
  const Links = NAV_POR_ROL[Rol_Activo] || [];
  const Tablas = TABLAS_POR_ROL[Rol_Activo] || [];
  const Acento = ACCENT_POR_ROL[Rol_Activo] || DEFAULT_ACCENT;

  // Clase CSS para los links de navegacion segun si estan activos o no
  const Obtener_Clase_Link = ({ isActive }) =>
    [
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium",
      isActive
        ? `${Acento.activeLink} border shadow-sm`
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-800",
    ].join(" ");

  // Renderiza una lista de links de navegacion
  const Renderizar_Links = (Lista) =>
    Lista.map((Item) => {
      const Icono_Comp = Item.icon;
      return (
        <NavLink
          key={Item.to}
          to={Item.to}
          end={Item.to === Lista[0]?.to}
          className={Obtener_Clase_Link}
          onClick={() => Set_SidebarAbierto(false)}
        >
          <Icono_Comp className="w-5 h-5 flex-shrink-0" />
          <span>{Item.label}</span>
        </NavLink>
      );
    });

  // Contenido interior compartido entre la version escritorio y movil del sidebar
  const Renderizar_Interior = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">

      {/* Encabezado del usuario */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar con la inicial del nombre */}
            <div className={`w-11 h-11 flex items-center justify-center ${Acento.accent} rounded-full text-white text-lg font-bold`}>
              {Inicial}
            </div>
            <div className="min-w-0">
              <p className="text-gray-800 font-semibold text-sm truncate">
                {Nombre_Completo}
              </p>
              {/* En movil: muestra NavRolSelector para cambiar de rol */}
              {/* En escritorio: muestra solo el badge del rol activo */}
              <div className="lg:hidden mt-1">
                <NavRolSelector
                  usuario={Usuario}
                  roles={roles}
                  rolActivo={Rol_Activo}
                  onCambioRol={Manejar_CambioRol}
                />
              </div>
              <span className={`hidden lg:inline-flex text-xs px-2 py-0.5 rounded-full ${Acento.badge}`}>
                {Rol_Activo || "Sin rol"}
              </span>
            </div>
          </div>
          {/* Boton de cerrar el drawer (solo visible en movil) */}
          <button
            onClick={() => Set_SidebarAbierto(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Cerrar menu"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Menu de navegacion con scroll si hay muchos items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-gray-400 text-xs font-semibold px-4 mb-2">Menu</p>
        {Links.length > 0 ? Renderizar_Links(Links) : (
          <p className="text-gray-400 text-sm px-4">Sin modulos disponibles</p>
        )}
        {Tablas.length > 0 && (
          <>
            <p className="text-gray-400 text-xs font-semibold px-4 mt-4">
              Administracion
            </p>
            {Renderizar_Links(Tablas)}
          </>
        )}
      </nav>

      {/* Links publicos y cerrar sesion — solo en movil */}
      <div className="lg:hidden border-t border-gray-100">
        <div className="px-3 py-3 space-y-1">
          <p className="text-gray-400 text-xs font-semibold px-4 mb-1">Informacion</p>
          <NavLink
            to="/contacto"
            onClick={() => Set_SidebarAbierto(false)}
            className={Obtener_Clase_Link}
          >
            <Phone className="w-5 h-5 flex-shrink-0" />
            <span>Contactanos</span>
          </NavLink>
          <NavLink
            to="/about"
            onClick={() => Set_SidebarAbierto(false)}
            className={Obtener_Clase_Link}
          >
            <Info className="w-5 h-5 flex-shrink-0" />
            <span>Que es FoodSys</span>
          </NavLink>
        </div>
        <div className="px-4 pb-4">
          <button
            onClick={handleCerrarSesion}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                       text-sm font-semibold text-red-500 border border-red-200
                       hover:bg-red-500 hover:text-white hover:border-transparent
                       transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesion
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Boton hamburguesa: solo visible en movil y cuando el sidebar esta cerrado */}
      {!Sidebar_Abierto && (
        <button
          onClick={() => Set_SidebarAbierto(true)}
          className="lg:hidden fixed top-4 left-4 z-[70] p-2.5 bg-white border border-gray-200
                     rounded-xl shadow-md hover:shadow-lg transition-shadow"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
      )}

      {/* Overlay oscuro del drawer movil */}
      {Sidebar_Abierto && (
        <div
          onClick={() => Set_SidebarAbierto(false)}
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
          aria-hidden="true"
        />
      )}

      {/* Sidebar version escritorio: siempre visible, sin boton de cerrar sesion */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen flex-shrink-0">
        {Renderizar_Interior()}
      </aside>

      {/* Sidebar version movil: drawer deslizable */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-[65] w-72 flex flex-col
                    transform transition-transform duration-300 ease-in-out
                    ${Sidebar_Abierto ? "translate-x-0" : "-translate-x-full"}`}
      >
        {Renderizar_Interior()}
      </aside>
    </>
  );
}