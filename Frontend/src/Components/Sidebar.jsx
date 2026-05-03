import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Home, User, Edit, BarChart3, LogOut, Menu, X,
  CalendarCheck, Users, FileText, GraduationCap,
  Database, ShieldCheck, Utensils, ClipboardList,
} from "lucide-react";
import { useNavBar } from "./CerrarSesion";

// Navegacion principal organizada por rol segun matriz
const NAV_POR_ROL = {
  Administrador: [
    { to: "/Administrador", label: "Inicio", icon: Home },
    { to: "/Administrador/Perfil", label: "Mi Perfil", icon: User },
    { to: "/Administrador/Reservar", label: "Reservar", icon: CalendarCheck },
    { to: "/Administrador/Menu", label: "Menú", icon: Utensils },
    { to: "/Administrador/Reportes", label: "Reportes", icon: BarChart3 },
    { to: "/Administrador/Novedades", label: "Novedades", icon: ClipboardList },
    { to: "/Administrador/HistorialReservas", label: "Historial", icon: Database },
    { to: "/Administrador/Estadisticas", label: "Estadísticas", icon: BarChart3 },
  ],
  Supervisor: [
    { to: "/supervisor", label: "Inicio", icon: Home },
    { to: "/supervisor/Perfil", label: "Mi Perfil", icon: User },
    { to: "/supervisor/Reservar", label: "Reservar", icon: CalendarCheck },
    { to: "/supervisor/Menu", label: "Menú", icon: Utensils },
    { to: "/supervisor/Reportes", label: "Reportes", icon: BarChart3 },
    { to: "/supervisor/Novedades", label: "Novedades", icon: ClipboardList },
  ],
  "Aprendiz Externo": [
    { to: "/Externo", label: "Inicio", icon: Home },
    { to: "/Externo/Perfil", label: "Mi Perfil", icon: User },
    { to: "/Externo/Reservar", label: "Reservar", icon: CalendarCheck },
    { to: "/Externo/Menu", label: "Menú", icon: Utensils },
    { to: "/Externo/HistorialReservas", label: "Historial", icon: Database },
    { to: "/Externo/Estadisticas", label: "Estadísticas", icon: BarChart3 },
  ],
  "Aprendiz Interno": [
    { to: "/Interno", label: "Inicio", icon: Home },
    { to: "/Interno/Perfil", label: "Mi Perfil", icon: User },
    { to: "/Interno/Reservar", label: "Reservar", icon: CalendarCheck },
    { to: "/Interno/Menu", label: "Menú", icon: Utensils },
    { to: "/Interno/HistorialReservas", label: "Historial", icon: Database },
    { to: "/Interno/Estadisticas", label: "Estadísticas", icon: BarChart3 },
  ],
  Coordinador: [
    { to: "/coordinador", label: "Inicio", icon: Home },
    { to: "/coordinador/Perfil", label: "Mi Perfil", icon: User },
    { to: "/coordinador/Reservar", label: "Reservar", icon: CalendarCheck },
    { to: "/coordinador/Menu", label: "Menú", icon: Utensils },
    { to: "/coordinador/Reportes", label: "Reportes", icon: BarChart3 },
    { to: "/coordinador/Novedades", label: "Novedades", icon: ClipboardList },
    { to: "/coordinador/HistorialReservas", label: "Historial", icon: Database },
    { to: "/coordinador/Estadisticas", label: "Estadísticas", icon: BarChart3 },
  ],
  Pasante: [
    { to: "/Pasante", label: "Inicio", icon: Home },
    { to: "/Pasante/Perfil", label: "Mi Perfil", icon: User },
    { to: "/Pasante/Reservar", label: "Reservar", icon: CalendarCheck },
    { to: "/Pasante/Menu", label: "Menú", icon: Utensils },
    { to: "/Pasante/HistorialReservas", label: "Historial", icon: Database },
  ],
  Cocina: [
    { to: "/Cocina", label: "Inicio", icon: Home },
    { to: "/Cocina/Perfil", label: "Mi Perfil", icon: User },
    { to: "/Cocina/Menu", label: "Menú", icon: Utensils },
    { to: "/Cocina/Reportes", label: "Reportes", icon: BarChart3 },
  ],
  Bienestar: [
    { to: "/Bienestar", label: "Inicio", icon: Home },
    { to: "/Bienestar/Perfil", label: "Mi Perfil", icon: User },
    { to: "/Bienestar/Reservar", label: "Reservar", icon: CalendarCheck },
    { to: "/Bienestar/Menu", label: "Menú", icon: Utensils },
    { to: "/Bienestar/Reportes", label: "Reportes", icon: BarChart3 },
    { to: "/Bienestar/Novedades", label: "Novedades", icon: ClipboardList },
    { to: "/Bienestar/Estadisticas", label: "Estadísticas", icon: BarChart3 },
  ],
};

// Tablas de administracion por rol segun matriz
const TABLAS_POR_ROL = {
  Administrador: [
    { to: "/usuarios", label: "Usuarios", icon: Users },
    { to: "/roles", label: "Roles", icon: ShieldCheck },
    { to: "/aprendices", label: "Aprendices", icon: User },
    { to: "/programas", label: "Programas", icon: GraduationCap },
    { to: "/platos", label: "Platos", icon: Utensils },
    { to: "/fichas", label: "Fichas", icon: FileText },
  ],
  Supervisor: [
    { to: "/usuarios", label: "Usuarios", icon: Users },
    { to: "/roles", label: "Roles", icon: ShieldCheck },
    { to: "/aprendices", label: "Aprendices", icon: User },
    { to: "/programas", label: "Programas", icon: GraduationCap },
    { to: "/platos", label: "Platos", icon: Utensils },
    { to: "/fichas", label: "Fichas", icon: FileText },
  ],
  Coordinador: [
    { to: "/usuarios", label: "Usuarios", icon: Users },
    { to: "/roles", label: "Roles", icon: ShieldCheck },
    { to: "/aprendices", label: "Aprendices", icon: User },
    { to: "/programas", label: "Programas", icon: GraduationCap },
    { to: "/platos", label: "Platos", icon: Utensils },
    { to: "/fichas", label: "Fichas", icon: FileText },
  ],
  Bienestar: [
    { to: "/usuarios", label: "Usuarios", icon: Users },
    { to: "/roles", label: "Roles", icon: ShieldCheck },
    { to: "/aprendices", label: "Aprendices", icon: User },
    { to: "/programas", label: "Programas", icon: GraduationCap },
    { to: "/platos", label: "Platos", icon: Utensils },
    { to: "/fichas", label: "Fichas", icon: FileText },
  ],
  "Aprendiz Externo": [
    { to: "/aprendices", label: "Aprendices", icon: User },
  ],
  "Aprendiz Interno": [
    { to: "/aprendices", label: "Aprendices", icon: User },
  ],
  Pasante: [
    { to: "/aprendices", label: "Aprendices", icon: User },
  ],
};

// Colores de acento por rol para el sidebar
const ACCENT_POR_ROL = {
  Administrador: {
    accent: "bg-indigo-500",
    badge: "bg-indigo-100 text-indigo-700",
    activeLink: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  Supervisor: {
    accent: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
    activeLink: "bg-blue-50 text-blue-700 border-blue-200",
  },
  "Aprendiz Externo": {
    accent: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
    activeLink: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  "Aprendiz Interno": {
    accent: "bg-teal-500",
    badge: "bg-teal-100 text-teal-700",
    activeLink: "bg-teal-50 text-teal-700 border-teal-200",
  },
  Coordinador: {
    accent: "bg-violet-500",
    badge: "bg-violet-100 text-violet-700",
    activeLink: "bg-violet-50 text-violet-700 border-violet-200",
  },
  Pasante: {
    accent: "bg-cyan-500",
    badge: "bg-cyan-100 text-cyan-700",
    activeLink: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  Cocina: {
    accent: "bg-orange-500",
    badge: "bg-orange-100 text-orange-700",
    activeLink: "bg-orange-50 text-orange-700 border-orange-200",
  },
  Bienestar: {
    accent: "bg-rose-500",
    badge: "bg-rose-100 text-rose-700",
    activeLink: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

const DEFAULT_ACCENT = {
  accent: "bg-gray-500",
  badge: "bg-gray-100 text-gray-700",
  activeLink: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [rolActivo, setRolActivo] = useState("");
  const { handleCerrarSesion } = useNavBar();

  useEffect(() => {
    const Usr = JSON.parse(localStorage.getItem("usuario"));
    const Rol = localStorage.getItem("rolActivo") || "";
    setUsuario(Usr);
    setRolActivo(Rol);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const Nombre_Completo = usuario
    ? `${usuario.Nom_Usuario ?? ""} ${usuario.Ape_Usuario ?? ""}`.trim()
    : "Usuario";

  const Inicial = Nombre_Completo.charAt(0).toUpperCase() || "U";
  const Links = NAV_POR_ROL[rolActivo] || [];
  const Tablas = TABLAS_POR_ROL[rolActivo] || [];
  const Acento = ACCENT_POR_ROL[rolActivo] || DEFAULT_ACCENT;

  const Obtener_Clase_Link = ({ isActive }) =>
    [
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium",
      isActive
        ? `${Acento.activeLink} border shadow-sm`
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-800",
    ].join(" ");

  const Renderizar_Links = (Lista) =>
    Lista.map((Item) => {
      const Icono_Comp = Item.icon;
      return (
        <NavLink
          key={Item.to}
          to={Item.to}
          end={Item.to === Lista[0]?.to}
          className={Obtener_Clase_Link}
          onClick={() => setIsOpen(false)}
        >
          <Icono_Comp className="w-5 h-5 shrink-0" />
          <span>{Item.label}</span>
        </NavLink>
      );
    });

  const Renderizar_Interior = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Encabezado del usuario */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 flex items-center justify-center ${Acento.accent} rounded-full text-white text-lg font-bold shrink-0`}>
              {Inicial}
            </div>
            <div>
              <p className="text-gray-800 font-semibold text-sm truncate">
                {Nombre_Completo}
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${Acento.badge}`}>
                {rolActivo || "Sin rol"}
              </span>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Menu de navegacion */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-gray-400 text-xs font-semibold px-4 mb-2 uppercase tracking-wider">
          Menu
        </p>
        {Links.length > 0 ? Renderizar_Links(Links) : (
          <p className="text-gray-400 text-sm px-4">Sin modulos disponibles</p>
        )}

        {Tablas.length > 0 && (
          <>
            <p className="text-gray-400 text-xs font-semibold px-4 mt-6 mb-2 uppercase tracking-wider">
              Administracion
            </p>
            {Renderizar_Links(Tablas)}
          </>
        )}
      </nav>

      {/* Cerrar sesion */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleCerrarSesion}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                     text-sm font-semibold text-red-500 border border-red-100
                     hover:bg-red-500 hover:text-white hover:border-transparent
                     transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesion
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Boton hamburguesa movil */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-70 p-2.5 bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Overlay movil */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-60"
          aria-hidden="true"
        />
      )}

      {/* Sidebar escritorio */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen shrink-0">
        {Renderizar_Interior()}
      </aside>

      {/* Sidebar movil */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-65 w-72 flex flex-col
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {Renderizar_Interior()}
      </aside>
    </>
  );
}