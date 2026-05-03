import { Link } from "react-router-dom";

const links = [
  { to: "/", label: "Inicio" },
  { to: "/contacto", label: "Contacto" },
  { to: "/about", label: "¿Qué es Foodsys?" },
];

const NavLinks = () => (
  <>
    {links.map(({ to, label }) => (
      <Link
        key={to}
        to={to}
        className="px-4 py-2 rounded-lg font-semibold hover:bg-white/15 transition"
      >
        {label}
      </Link>
    ))}
  </>
);

export default NavLinks;