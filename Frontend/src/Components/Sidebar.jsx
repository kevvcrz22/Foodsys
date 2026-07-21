// Components/Sidebar.jsx
// Barra lateral de navegación con estilo Liquid Glass + Claymorfismo.
// ─────────────────────────────────────────────────────────────────────────────
import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Home, User, Edit, BarChart3, LogOut, Menu, X,
  CalendarCheck, Users, FileText, GraduationCap,
  Database, ShieldCheck, Utensils, ClipboardList,
  Phone, Info, ChefHat,
} from 'lucide-react';
import { useNavBar } from "./CerrarSesion";
import NavRolSelector from "./NavBar/NavRolSelector";

const NAV_POR_ROL = {
  Administrador: [
    { to: "/Administrador",         label: "Inicio",    icon: Home         },
    { to: "/Administrador/Perfil",  label: "Mi Perfil", icon: User         },
    { to: "/Administrador/Reportes",label: "Reportes",  icon: BarChart3    },
    { to: "/Administrador/Novedades",label: "Novedades",icon: ClipboardList },
  ],
  Supervisor: [
    { to: "/supervisor",            label: "Inicio",     icon: Home         },
    { to: "/supervisor/Perfil",     label: "Mi Perfil",  icon: User         },
    { to: "/supervisor/Registrar",  label: "Registrar",  icon: Edit         },
    { to: "/supervisor/Reportes",   label: "Reportes",   icon: BarChart3    },
  ],
  "Aprendiz Externo": [
    { to: "/Externo",               label: "Inicio",    icon: Home         },
    { to: "/Externo/Perfil",        label: "Mi Perfil", icon: User         },
    { to: "/Externo/Reservar",      label: "Reservar",  icon: CalendarCheck },
  ],
  "Aprendiz Interno": [
    { to: "/Interno",               label: "Inicio",    icon: Home         },
    { to: "/Interno/Perfil",        label: "Mi Perfil", icon: User         },
    { to: "/Interno/Reservar",      label: "Reservar",  icon: CalendarCheck },
  ],
  "Pasante Interno": [
    { to: "/PasanteInterno",         label: "Inicio",    icon: Home         },
    { to: "/PasanteInterno/Perfil",  label: "Mi Perfil", icon: User         },
    { to: "/PasanteInterno/Reservar",label: "Reservar",  icon: CalendarCheck },
  ],
  "Pasante Externo": [
    { to: "/PasanteExterno",         label: "Inicio",    icon: Home         },
    { to: "/PasanteExterno/Perfil",  label: "Mi Perfil", icon: User         },
    { to: "/PasanteExterno/Reservar",label: "Reservar",  icon: CalendarCheck },
  ],
  Coordinador: [
    { to: "/coordinador",            label: "Inicio",     icon: Home         },
    { to: "/coordinador/Perfil",     label: "Mi Perfil",  icon: User         },
    { to: "/coordinador/Novedades",  label: "Novedades",  icon: ClipboardList },
    { to: "/coordinador/Reportes",   label: "Reportes",   icon: BarChart3    },
  ],
  Cocina: [
    { to: '/Cocina',                 label: 'Inicio',          icon: Home         },
    { to: '/Cocina/Perfil',          label: 'Mi Perfil',       icon: User         },
    { to: '/Cocina/Verificar',       label: 'Verificar QR',    icon: ShieldCheck  },
    { to: '/Cocina/Plan',            label: 'Plan del Día',    icon: ChefHat      },
    { to: '/Cocina/Reportes',        label: 'Reportes',        icon: BarChart3    },
  ],
  Bienestar: [
    { to: "/Bienestar",              label: "Inicio",     icon: Home         },
    { to: "/Bienestar/Perfil",       label: "Mi Perfil",  icon: User         },
    { to: "/Bienestar/Reportes",     label: "Reportes",   icon: BarChart3    },
    { to: "/Bienestar/Novedades",    label: "Novedades",  icon: ClipboardList },
  ],
};

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
    { to: "/menus", label: "Menús", icon: ClipboardList },
  ],
  Coordinador: [
    { to: '/aprendices', label: 'Aprendices', icon: User },
  ],
  Bienestar: [
    { to: '/aprendices', label: 'Aprendices', icon: User },
  ],
  Cocina: [
    { to: '/menus',  label: 'Menús',  icon: ClipboardList },
    { to: '/platos', label: 'Platos', icon: Utensils      },
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
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-bold tracking-wide",
      isActive
        ? "bg-primario/10 text-primario-oscuro border border-primario/20 shadow-[inset_1px_1px_4px_rgba(255,255,255,0.7)]"
        : "text-texto-secundario hover:bg-white/60 hover:text-primario",
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
          <Icono_Comp className="w-[18px] h-[18px] flex-shrink-0" />
          <span>{Item.label}</span>
        </NavLink>
      );
    });

  const Renderizar_Interior = () => (
    <div className="flex flex-col h-full bg-white/60 backdrop-blur-xl border-r border-white/60 shadow-[4px_0_24px_rgba(74,111,165,0.08)]">
      
      {/* ── Encabezado ── */}
      <div className="p-6 border-b border-primario/10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-primario-suave to-primario-oscuro rounded-2xl text-white text-xl font-black shadow-md shadow-primario/20 shrink-0">
              {Inicial}
            </div>
            <div className="min-w-0">
              <p className="text-texto-principal font-extrabold text-sm truncate">
                {Nombre_Completo}
              </p>
              <div className="lg:hidden mt-1.5">
                <NavRolSelector
                  usuario={Usuario}
                  roles={roles}
                  rolActivo={Rol_Activo}
                  onCambioRol={Manejar_CambioRol}
                />
              </div>
              <span className="hidden lg:inline-flex mt-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primario/10 text-primario-oscuro border border-primario/20">
                {Rol_Activo || "Sin rol"}
              </span>
            </div>
          </div>
          <button
            onClick={() => Set_SidebarAbierto(false)}
            className="lg:hidden p-2 rounded-xl bg-white border border-white/60 shadow-sm text-texto-secundario hover:text-primario transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Navegación ── */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <p className="text-texto-secundario/60 text-[10px] font-bold px-2 mb-3 uppercase tracking-widest">Menú Principal</p>
        {Links.length > 0 ? Renderizar_Links(Links) : (
          <p className="text-texto-secundario text-sm px-4">Sin módulos disponibles</p>
        )}
        {Tablas.length > 0 && (
          <>
            <div className="separador-glass my-6" />
            <p className="text-texto-secundario/60 text-[10px] font-bold px-2 mb-3 uppercase tracking-widest">
              Administración
            </p>
            {Renderizar_Links(Tablas)}
          </>
        )}
      </nav>

      {/* ── Pie (Móvil) ── */}
      <div className="lg:hidden border-t border-primario/10 bg-white/40">
        <div className="px-4 py-4 space-y-1.5">
          <p className="text-texto-secundario/60 text-[10px] font-bold px-2 mb-2 uppercase tracking-widest">Información</p>
          <NavLink
            to="/contacto"
            onClick={() => Set_SidebarAbierto(false)}
            className={Obtener_Clase_Link}
          >
            <Phone className="w-[18px] h-[18px] flex-shrink-0" />
            <span>Contáctanos</span>
          </NavLink>
          <NavLink
            to="/about"
            onClick={() => Set_SidebarAbierto(false)}
            className={Obtener_Clase_Link}
          >
            <Info className="w-[18px] h-[18px] flex-shrink-0" />
            <span>¿Qué es FoodSys?</span>
          </NavLink>
        </div>
        <div className="px-5 pb-6 pt-2">
          <button
            onClick={handleCerrarSesion}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-bold text-error bg-white border border-error/20 hover:bg-error hover:text-white transition-all shadow-sm"
          >
            <LogOut size={16} />
            Cerrar sesión
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

      <aside className="hidden lg:flex flex-col w-[260px] min-h-screen flex-shrink-0 relative z-40">
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