import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Home,
  User,
  Edit,
  BarChart3,
  LogOut,
  Menu,
  X,
  CalendarCheck,
  BookOpen,
  Users,
  FileText,
  GraduationCap,
  Database,
  ShieldCheck,
  Utensils,      // 🍽️ NUEVO
  ClipboardList  // 📋 NUEVO
} from "lucide-react";

// ─── Navegación principal por rol ──────────────────────────────────────────
const NAV_POR_ROL = {
  Administrador: [
    { to: "/Administrador",           label: "Inicio",    icon: Home          },
    { to: "/Administrador/Perfil",    label: "Mi Perfil", icon: User          },
    { to: "/Administrador/Registrar", label: "Registrar", icon: Edit          },
    { to: "/Administrador/Reportes",  label: "Reportes",  icon: BarChart3     },
    { to: "/Administrador/Reservas",  label: "Reservas",  icon: CalendarCheck },
  ],
  Supervisor: [
    { to: "/supervisor",           label: "Inicio",    icon: Home      },
    { to: "/supervisor/Perfil",    label: "Mi Perfil", icon: User      },
    { to: "/supervisor/Registrar", label: "Registrar", icon: Edit      },
    { to: "/supervisor/Reportes",  label: "Reportes",  icon: BarChart3 },
  ],
  "Aprendiz Externo": [
    { to: "/Externo",          label: "Inicio",    icon: Home          },
    { to: "/Externo/Perfil",   label: "Mi Perfil", icon: User          },
    { to: "/Externo/Reservas", label: "Reservas",  icon: CalendarCheck },
    { to: "/Externo/Historial", label: "Historial",  icon: CalendarCheck },
  ],
  "Aprendiz Interno": [
    { to: "/interno",          label: "Inicio",    icon: Home          },
    { to: "/interno/Perfil",   label: "Mi Perfil", icon: User          },
    { to: "/interno/Reservas", label: "Reservas",  icon: CalendarCheck },
  ],
  Coordinador: [
    { to: "/coordinador",           label: "Inicio",    icon: Home      },
    { to: "/coordinador/Perfil",    label: "Mi Perfil", icon: User      },
    { to: "/coordinador/Novedades",   label: "Novedades",  icon: ClipboardList },
    { to: "/coordinador/Reportes",  label: "Reportes",  icon: BarChart3 },
    { to: "/coordinador/Programas", label: "Programas", icon: BookOpen  },
  ],
};

// ─── TABLAS (ADMIN TOTAL) ───────────────────────────────────────────────────
const TABLAS_POR_ROL = {
  Administrador: [
    { to: "/usuarios",        label: "Usuarios",        icon: Users         },
    { to: "/UsuariosRoles",   label: "Usuarios Roles",  icon: User          },
    { to: "/roles",           label: "Roles",           icon: ShieldCheck   },
    { to: "/fichas",          label: "Fichas",          icon: FileText      },
    { to: "/programas",       label: "Programas",       icon: GraduationCap },
    { to: "/reservas",        label: "Reservas",        icon: Database      },

    // 🔥 NUEVO SISTEMA RESTAURANTE
    { to: "/platos",          label: "Platos",          icon: Utensils      },
    { to: "/menus",           label: "Menús",           icon: ClipboardList },
    { to: "/reservasmenu",   label: "Reservas Menú",   icon: CalendarCheck },
  ],
};

// ─── COLORES POR ROL ────────────────────────────────────────────────────────
const ACCENT_POR_ROL = {
  Administrador:      { accent: "bg-indigo-500", badge: "bg-indigo-100 text-indigo-700", activeLink: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  Supervisor:         { accent: "bg-blue-500",   badge: "bg-blue-100 text-blue-700",     activeLink: "bg-blue-50 text-blue-700 border-blue-200"       },
  "Aprendiz Externo": { accent: "bg-emerald-500",badge: "bg-emerald-100 text-emerald-700", activeLink: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "Aprendiz Interno": { accent: "bg-teal-500",   badge: "bg-teal-100 text-teal-700",     activeLink: "bg-teal-50 text-teal-700 border-teal-200"       },
  Coordinador:        { accent: "bg-violet-500", badge: "bg-violet-100 text-violet-700", activeLink: "bg-violet-50 text-violet-700 border-violet-200" },
};

const DEFAULT_ACCENT = {
  accent: "bg-gray-500",
  badge: "bg-gray-100 text-gray-700",
  activeLink: "bg-gray-100 text-gray-700 border-gray-200",
};

// ─── COMPONENTE ────────────────────────────────────────────────────────────
export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [rolActivo, setRolActivo] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const usuarioStorage = JSON.parse(localStorage.getItem("usuario"));
    const rolActivoStorage = localStorage.getItem("rolActivo") || "";
    setUsuario(usuarioStorage);
    setRolActivo(rolActivoStorage);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleCerrarSesion = () => {
    localStorage.clear();
    navigate("/");
  };

  const nombreCompleto = usuario
    ? `${usuario.Nom_Usuario ?? ""} ${usuario.Ape_Usuario ?? ""}`.trim()
    : "Usuario";

  const inicial  = nombreCompleto.charAt(0).toUpperCase() || "U";
  const links    = NAV_POR_ROL[rolActivo]    || [];
  const tablas   = TABLAS_POR_ROL[rolActivo] || [];
  const acento   = ACCENT_POR_ROL[rolActivo] || DEFAULT_ACCENT;

  const getLinkClass = ({ isActive }) =>
    [
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium",
      isActive
        ? `${acento.activeLink} border shadow-sm`
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-800",
    ].join(" ");

  const renderLinks = (list) =>
    list.map((item) => {
      const IconComponent = item.icon;
      return (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === list[0].to}
          className={getLinkClass}
          onClick={() => setIsOpen(false)}
        >
          <IconComponent className="w-5 h-5 flex-shrink-0" />
          <span>{item.label}</span>
        </NavLink>
      );
    });

  const renderInterior = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">

      {/* Usuario */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 flex items-center justify-center ${acento.accent} rounded-full text-white text-lg font-bold`}>
              {inicial}
            </div>
            <div>
              <p className="text-gray-800 font-semibold text-sm truncate">
                {nombreCompleto}
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${acento.badge}`}>
                {rolActivo || "Sin rol"}
              </span>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Menú */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">

        <p className="text-gray-400 text-xs font-semibold px-4 mb-2">
          Menú
        </p>
        {links.length > 0 ? renderLinks(links) : (
          <p className="text-gray-400 text-sm px-4">Sin módulos disponibles</p>
        )}

        {tablas.length > 0 && (
          <>
            <p className="text-gray-400 text-xs font-semibold px-4 mt-4">
              Base de Datos
            </p>
            {renderLinks(tablas)}
          </>
        )}
      </nav>

      {/* Cerrar sesión */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleCerrarSesion}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                     text-sm font-semibold text-red-500 border border-red-200
                     hover:bg-red-500 hover:text-white hover:border-transparent
                     transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[70] p-2.5 bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
          aria-hidden="true"
        />
      )}

      <aside className="hidden lg:flex flex-col w-64 min-h-screen flex-shrink-0">
        {renderInterior()}
      </aside>

      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-[65] w-72 flex flex-col
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {renderInterior()}
      </aside>
    </>
  );
}