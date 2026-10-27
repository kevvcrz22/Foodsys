// Components/Sidebar.jsx
// Barra lateral de navegación con estilo Liquid Glass + Claymorfismo.
// ─────────────────────────────────────────────────────────────────────────────
import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Home, User, Edit, BarChart3, LogOut, Menu, X,
  CalendarCheck, Users, FileText, GraduationCap,
  Database, ShieldCheck, Utensils, ClipboardList,
  Phone, Info, ChefHat, BookOpen, ExternalLink, MessageSquare, ArrowUpDown, Clock, Wheat
} from 'lucide-react';
import { useNavBar } from "./CerrarSesion";
import NavRolSelector from "./NavBar/NavRolSelector";

const NAV_POR_ROL = {
  Administrador: [
    { to: "/Administrador",         label: "Inicio",              icon: Home          },
    { to: "/Administrador/Perfil",  label: "Mi Perfil",           icon: User          },
    { to: "/internado-temporal",    label: "Internado Temporal",  icon: Clock         },
    { to: "/Administrador/Reportes",label: "Reportes",            icon: BarChart3     },
    { to: "/Administrador/Novedades",label: "Novedades",          icon: ClipboardList },
    { to: "/guardar-almuerzo-campo", label: "Almuerzo Campo",     icon: Wheat         },
  ],
  Instructor: [
    { to: "/guardar-almuerzo-campo", label: "Almuerzo Campo", icon: Wheat        },
    { to: "/Administrador/Perfil",  label: "Mi Perfil",      icon: User         },
    { to: "/Administrador/Reportes",label: "Reportes",       icon: BarChart3    },
  ],
  Vocero: [
    { to: "/Interno",               label: "Inicio",         icon: Home         },
    { to: "/Interno/Perfil",        label: "Mi Perfil",      icon: User         },
    { to: "/Interno/Reservar",      label: "Reservar",       icon: CalendarCheck },
    { to: "/guardar-almuerzo-campo", label: "Almuerzo Campo", icon: Wheat        },
  ],
  "SENA Empresa": [
    { to: "/guardar-almuerzo-campo", label: "Almuerzo Campo",     icon: Wheat         },
    { to: "/internado-temporal",    label: "Internado Temporal",  icon: Clock         },
    { to: "/reservas",              label: "Reservas",            icon: Database      },
    { to: "/Administrador/Perfil",  label: "Mi Perfil",           icon: User          },
    { to: "/Administrador/Reportes",label: "Reportes",            icon: BarChart3     },
  ],
  Supervisor: [
    { to: "/supervisor",            label: "Inicio",         icon: Home         },
    { to: "/supervisor/Perfil",     label: "Mi Perfil",      icon: User         },
    { to: "/supervisor/Registrar",  label: "Registrar",      icon: Edit         },
    { to: "/supervisor/Reportes",   label: "Reportes",       icon: BarChart3    },
    { to: "/guardar-almuerzo-campo", label: "Almuerzo Campo", icon: Wheat        },
  ],
  "Aprendiz Externo": [
    { to: "/Externo",               label: "Inicio",         icon: Home         },
    { to: "/Externo/Perfil",        label: "Mi Perfil",      icon: User         },
    { to: "/Externo/Reservar",      label: "Reservar",       icon: CalendarCheck },
  ],
  "Aprendiz Interno": [
    { to: "/Interno",               label: "Inicio",         icon: Home         },
    { to: "/Interno/Perfil",        label: "Mi Perfil",      icon: User         },
    { to: "/Interno/Reservar",      label: "Reservar",       icon: CalendarCheck },
  ],
  "Pasante Interno": [
    { to: "/PasanteInterno",         label: "Inicio",        icon: Home         },
    { to: "/PasanteInterno/Perfil",  label: "Mi Perfil",     icon: User         },
    { to: "/PasanteInterno/Reservar",label: "Reservar",      icon: CalendarCheck },
  ],
  "Pasante Externo": [
    { to: "/PasanteExterno",         label: "Inicio",        icon: Home         },
    { to: "/PasanteExterno/Perfil",  label: "Mi Perfil",     icon: User         },
    { to: "/PasanteExterno/Reservar",label: "Reservar",      icon: CalendarCheck },
  ],
  Coordinador: [
    { to: "/coordinador",            label: "Inicio",             icon: Home          },
    { to: "/coordinador/Perfil",     label: "Mi Perfil",          icon: User          },
    { to: "/internado-temporal",     label: "Internado Temporal", icon: Clock         },
    { to: "/coordinador/Novedades",  label: "Novedades",          icon: ClipboardList },
    { to: "/coordinador/Reportes",   label: "Reportes",           icon: BarChart3     },
    { to: "/guardar-almuerzo-campo", label: "Almuerzo Campo",     icon: Wheat         },
  ],
  Cocina: [
    { to: "/Cocina",                 label: "Inicio",        icon: Home         },
    { to: "/Cocina/Perfil",          label: "Mi Perfil",     icon: User         },
    { to: "/Cocina/Verificar",       label: "Verificar QR",  icon: ShieldCheck  },
    { to: "/Cocina/Plan",            label: "Plan del Dia",  icon: ChefHat      },
    { to: "/Cocina/Reportes",        label: "Reportes",      icon: BarChart3    },
    { to: "/guardar-almuerzo-campo", label: "Almuerzo Campo", icon: Wheat        },
  ],
  Bienestar: [
    { to: "/Bienestar",              label: "Inicio",             icon: Home          },
    { to: "/Bienestar/Perfil",       label: "Mi Perfil",          icon: User          },
    { to: "/internado-temporal",     label: "Internado Temporal", icon: Clock         },
    { to: "/Bienestar/Plan",         label: "Plan del Dia",       icon: ChefHat       },
    { to: "/Bienestar/Reportes",     label: "Reportes",           icon: BarChart3     },
    { to: "/Bienestar/Novedades",    label: "Novedades",          icon: ClipboardList },
    { to: "/guardar-almuerzo-campo", label: "Almuerzo Campo",     icon: Wheat         },
  ],
};

const TABLAS_POR_ROL = {
  Administrador: [
    { to: "/usuarios",           label: "Usuarios",              icon: Users         },
    { to: "/aprendices",         label: "Aprendices",            icon: User          },
    { to: "/pasantes",           label: "Pasantes",              icon: Users         },
    { to: "/internado-temporal", label: "Internado Temporal",    icon: Clock         },
    { to: "/pqrsf-admin",        label: "PQRSF Interventoria",   icon: MessageSquare },
    { to: "/sincronizacion",     label: "Sincronizacion Offline", icon: ArrowUpDown   },
    { to: "/UsuariosRoles",      label: "Asignar Roles",         icon: ShieldCheck   },
    { to: "/roles",              label: "Roles",                 icon: ShieldCheck   },
    { to: "/fichas",             label: "Fichas",                icon: FileText      },
    { to: "/programas",          label: "Programas",             icon: GraduationCap },
    { to: "/reservas",           label: "Reservas",              icon: Database      },
    { to: "/platos",             label: "Platos",                icon: Utensils      },
    { to: "/menus",              label: "Menus",                 icon: ClipboardList },
  ],
  "SENA Empresa": [
    { to: "/internado-temporal", label: "Internado Temporal",    icon: Clock         },
    { to: "/reservas",           label: "Reservas",              icon: Database      },
    { to: "/guardar-almuerzo-campo", label: "Almuerzo Campo",    icon: Wheat         },
  ],
  Coordinador: [
    { to: "/aprendices",         label: "Aprendices",            icon: User          },
    { to: "/pasantes",           label: "Pasantes",              icon: Users         },
    { to: "/internado-temporal", label: "Internado Temporal",    icon: Clock         },
  ],
  Bienestar: [
    { to: "/aprendices",         label: "Aprendices",            icon: User          },
    { to: "/pasantes",           label: "Pasantes",              icon: Users         },
    { to: "/internado-temporal", label: "Internado Temporal",    icon: Clock         },
    { to: "/pqrsf-admin",        label: "PQRSF Interventoria",   icon: MessageSquare },
  ],
  Cocina: [
    { to: "/menus",              label: "Menus",                 icon: ClipboardList },
    { to: "/platos",             label: "Platos",                icon: Utensils      },
  ],
};

export default function Sidebar({ roles = [], rolActivo: rolActivoProp, onCambioRol, onCerrarSesion }) {
  const [Sidebar_Abierto, Set_SidebarAbierto] = useState(false);
  const [Usuario, Set_Usuario] = useState(null);
  const [Rol_Activo, Set_RolActivo] = useState("");
  const { handleCerrarSesion } = useNavBar({ onCerrarSesion });

  useEffect(() => {
    const Usr = JSON.parse(localStorage.getItem("usuario") || "null");
    Set_Usuario(Usr);
    Set_RolActivo(rolActivoProp || localStorage.getItem("rolActivo") || "");
  }, [rolActivoProp]);

  useEffect(() => {
    document.body.style.overflow = Sidebar_Abierto ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [Sidebar_Abierto]);

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

  const Obtener_Clase_Link = ({ isActive }) =>
    [
      "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-xs sm:text-sm font-semibold",
      isActive
        ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs"
        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
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
          onClick={() => Set_SidebarAbierto(false)}
        >
          <Icono_Comp className="w-4 h-4 flex-shrink-0 text-slate-500 group-hover:text-slate-700" />
          <span>{Item.label}</span>
        </NavLink>
      );
    });

  const Renderizar_Interior = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 shadow-xs">
      
      {/* ── Encabezado ── */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50">
        {/* Fila superior: Avatar, Nombre y Boton X de salir */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl text-white text-base sm:text-lg font-bold shadow-sm shrink-0">
              {Inicial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-slate-800 font-bold text-sm truncate" title={Nombre_Completo}>
                {Nombre_Completo}
              </p>
              <span className="hidden lg:inline-flex mt-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {Rol_Activo || "Sin rol"}
              </span>
            </div>
          </div>
          <button
            onClick={() => Set_SidebarAbierto(false)}
            className="lg:hidden p-2 rounded-xl bg-white border border-slate-200 shadow-xs text-slate-500 hover:text-slate-800 transition-colors shrink-0 cursor-pointer"
            aria-label="Cerrar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fila inferior exclusiva para el selector de rol en moviles */}
        <div className="lg:hidden mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rol:</span>
          <NavRolSelector
            usuario={Usuario}
            roles={roles}
            rolActivo={Rol_Activo}
            onCambioRol={Manejar_CambioRol}
          />
        </div>
      </div>

      {/* ── Navegacion ── */}
      <nav className="flex-1 px-3.5 py-4 space-y-1 overflow-y-auto">
        <p className="text-slate-400 text-[10px] font-bold px-2 mb-2 uppercase tracking-wider">Menu Principal</p>
        {Links.length > 0 ? Renderizar_Links(Links) : (
          <p className="text-slate-400 text-xs px-3">Sin modulos disponibles</p>
        )}
        {Tablas.length > 0 && (
          <>
            <div className="h-px bg-slate-100 my-3" />
            <p className="text-slate-400 text-[10px] font-bold px-2 mb-2 uppercase tracking-wider">
              Administracion
            </p>
            {Renderizar_Links(Tablas)}
          </>
        )}

        <div className="h-px bg-slate-100 my-3" />
        <p className="text-slate-400 text-[10px] font-bold px-2 mb-2 uppercase tracking-wider">
          Recursos y Ayuda
        </p>
        <NavLink
          to="/manuales"
          className={Obtener_Clase_Link}
          onClick={() => Set_SidebarAbierto(false)}
        >
          <BookOpen className="w-4 h-4 flex-shrink-0 text-slate-500" />
          <span>Manuales</span>
        </NavLink>
        <a
          href="https://bienesoftlagranja.com/user/login"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-800 border border-sky-100/80 bg-sky-50/30 group shadow-xs"
          title="Abrir portal oficial BIENESOFT en nueva pestana"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/LogoBienesoft.png"
              alt="Logo BIENESOFT"
              className="w-4 h-4 object-contain rounded bg-white p-0.5 border border-sky-200 flex-shrink-0 group-hover:scale-105 transition-transform"
            />
            <span className="font-bold text-xs uppercase tracking-wider text-sky-900 group-hover:text-sky-700">BIENESOFT</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-sky-600 opacity-70 group-hover:opacity-100 transition-opacity" />
        </a>
      </nav>

      {/* ── Pie (Movil) ── */}
      <div className="lg:hidden border-t border-slate-100 bg-slate-50/50">
        <div className="px-4 py-3 space-y-1">
          <p className="text-slate-400 text-[10px] font-bold px-2 mb-1.5 uppercase tracking-wider">Informacion</p>
          <NavLink
            to="/contacto"
            onClick={() => Set_SidebarAbierto(false)}
            className={Obtener_Clase_Link}
          >
            <Phone className="w-4 h-4 flex-shrink-0 text-slate-500" />
            <span>Contactanos</span>
          </NavLink>
          <NavLink
            to="/about"
            onClick={() => Set_SidebarAbierto(false)}
            className={Obtener_Clase_Link}
          >
            <Info className="w-4 h-4 flex-shrink-0 text-slate-500" />
            <span>Que es Foodsys</span>
          </NavLink>
        </div>
        <div className="px-4 pb-5 pt-1">
          <button
            onClick={handleCerrarSesion}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 transition shadow-xs"
          >
            <LogOut size={15} />
            Cerrar sesion
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {!Sidebar_Abierto && (
        <button
          onClick={() => Set_SidebarAbierto(true)}
          className="lg:hidden fixed top-4 left-4 z-[70] p-3 panel-glass hover:shadow-lg transition-all text-primario-oscuro"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
      )}

      {Sidebar_Abierto && (
        <div
          onClick={() => Set_SidebarAbierto(false)}
          className="lg:hidden fixed inset-0 bg-texto-principal/30 backdrop-blur-sm z-[60] transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside className="hidden lg:flex flex-col w-[260px] h-[calc(100vh-58px)] flex-shrink-0 sticky top-[58px] z-40">
        {Renderizar_Interior()}
      </aside>

      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-[65] w-[280px] flex flex-col transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
          Sidebar_Abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {Renderizar_Interior()}
      </aside>
    </>
  );
}