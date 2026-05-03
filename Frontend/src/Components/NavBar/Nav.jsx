import { Link } from "react-router-dom";
import NavLogo from "./NavLogo";
import NavLink from "./NavLink";
import NavRolSelector from "./NavRolSelector";
import { useNavBar } from "../CerrarSesion";
import NavAcciones from "./NavAcciones";
const NavBar = ({ usuario, roles = [], rolActivo, onCambioRol, onCerrarSesion }) => {
  const { handleCambioRol, handleCerrarSesion } = useNavBar({
    onCambioRol,
    onCerrarSesion,
  });

  return (
    <header className="sticky top-0 z-50 bg-[#0f3f80] text-white px-4 py-3 shadow-md">
      <div className="w-full flex items-center justify-center md:justify-between">
        <NavLogo />
        <nav className="hidden md:flex items-center gap-3">
          <NavLink />
          <NavRolSelector
            usuario={usuario}
            roles={roles}
            rolActivo={rolActivo}
            onCambioRol={handleCambioRol}
          />
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