import { Link } from 'react-router-dom';
import { useState } from 'react';
import logo from './Img/LogoFoodsys.png';

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.href = "/";
  };

  const usuario = JSON.parse(localStorage.getItem("usuario"));

  return (
    <header
      className="sticky top-0 z-[1000] w-full backdrop-blur-md bg-gradient-to-r from-[#1861c1] via-[#1f6ed4] to-[#1861c1] shadow-lg border-b border-white/10"
      role="banner"
    >
      <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 text-white group"
        >
          <img
            src={logo}
            alt="Logo Foodsys"
            className="w-12 h-12 transition duration-300 group-hover:scale-110"
          />
          <span className="font-bold text-2xl tracking-wide">
            Foodsys
          </span>
        </Link>

        {/* Botón hamburguesa */}
        <button
          className="lg:hidden text-white text-3xl transition-transform duration-300 hover:scale-110"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menú"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        {/* Navegación */}
        <nav
          className={`
            absolute lg:static top-[70px] left-0 w-full lg:w-auto
            bg-[#1861c1]/95 lg:bg-transparent backdrop-blur-md
            flex flex-col lg:flex-row items-center gap-4
            px-6 lg:px-0 py-6 lg:py-0
            transition-all duration-300 ease-in-out
            ${menuOpen ? "opacity-100 visible" : "opacity-0 invisible lg:opacity-100 lg:visible"}
          `}
        >
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="px-5 py-2 rounded-full font-medium text-white transition-all duration-300 hover:bg-white/20 hover:shadow-md"
          >
            Inicio
          </Link>

          <Link
            to="/contacto"
            onClick={() => setMenuOpen(false)}
            className="px-5 py-2 rounded-full font-medium text-white transition-all duration-300 hover:bg-white/20 hover:shadow-md"
          >
            Contacto
          </Link>

          <Link
            to="/about"
            onClick={() => setMenuOpen(false)}
            className="px-5 py-2 rounded-full font-medium text-white transition-all duration-300 hover:bg-white/20 hover:shadow-md"
          >
            ¿Qué es Foodsys?
          </Link>

          {usuario && (
            <button
              onClick={cerrarSesion}
              className="px-5 py-2 rounded-full font-medium bg-white text-[#1861c1] transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              Cerrar sesión
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default NavBar;