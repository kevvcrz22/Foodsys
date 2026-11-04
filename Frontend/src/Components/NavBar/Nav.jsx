import { Link } from "react-router-dom";
import NavLogo from "./NavLogo";
import NavLink from "./NavLink";
import NavRolSelector from "./NavRolSelector";
import { useNavBar } from "../CerrarSesion";
import NavAcciones from "./NavAcciones";
import NavNotificaciones from "./NavNotificaciones";
import ControlRacionesRapido from "../Admin/ControlRacionesRapido";

const NavBar = ({ usuario, roles = [], rolActivo, onCambioRol, onCerrarSesion }) => {
  const { handleCambioRol, handleCerrarSesion } = useNavBar({
    onCambioRol,
    onCerrarSesion,
  });

  const esAdmin = (rolActivo || "").toLowerCase().includes("admin");

  return (
    <header className="sticky top-0 z-50 bg-[#2E5792] text-white px-3 sm:px-4 py-2.5 sm:py-3 shadow-md">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Espaciador en móvil para evitar choque con botón de hamburguesa flotante */}
          <div className="lg:hidden w-10 shrink-0" />
          <NavLogo />
        </div>

        {/* En móvil: únicamente la campana de notificaciones para mantener la barra limpia y sin colisión con el logo */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          {usuario && <NavNotificaciones usuario={usuario} />}
        </div>

        {/* Navegación Desktop */}
        <nav className="hidden md:flex items-center gap-3">
          <NavLink />
          {esAdmin && <ControlRacionesRapido compacto />}
          <NavRolSelector
            usuario={usuario}
            roles={roles}
            rolActivo={rolActivo}
            onCambioRol={handleCambioRol}
          />
          {usuario && <NavNotificaciones usuario={usuario} />}
          <NavAcciones
            usuario={usuario}
            roles={roles}
            onCerrarSesion={handleCerrarSesion}
          />
        </nav>
      </div>
    </header>
  );
};

export default NavBar;