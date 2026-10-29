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
    <header className="sticky top-0 z-50 bg-[#2E5792] text-white px-4 py-3 shadow-md">
      <div className="w-full flex items-center justify-center md:justify-between">
        <NavLogo />
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