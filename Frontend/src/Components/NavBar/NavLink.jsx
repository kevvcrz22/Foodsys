// Components/NavBar/NavLink.jsx
// Lista de enlaces publicos del navbar.
// Se eliminó el enlace "Inicio" según requerimiento.

import { Link } from "react-router-dom";

// Solo links publicos: Contacto y Que es FoodSys
const LINKS_NAVBAR = [
  { to: "/contacto", label: "Contacto" },
  { to: "/about", label: "Que es Foodsys" },
];

const NavLinks = () => (
  <>
    {LINKS_NAVBAR.map(({ to, label }) => (
      <Link
        key={to}
        to={to}
        className="px-4 py-2 rounded-lg text-sm font-semibold text-white
                   hover:bg-white/15 transition-colors duration-200"
      >
        {label}
      </Link>
    ))}
  </>
);

export default NavLinks;