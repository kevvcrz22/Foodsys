import { Link, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import logo from "./Img/LogoFoodsys.png";

// ✅ Recibe estado reactivo desde App en vez de leer localStorage directamente
const NavBar = ({ usuario, roles = [], rolActivo, onCambioRol, onCerrarSesion }) => {
  const navigate = useNavigate();

  const handleCambioRol = (e) => {
  const nuevoRol = e.target.value;
  localStorage.setItem("rolActivo", nuevoRol);
  onCambioRol?.(nuevoRol); // App ya navega dentro de onCambioRol
};

  const handleCerrarSesion = () => {
    localStorage.clear();
    onCerrarSesion?.();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0f3f80] text-white px-4 py-3 shadow-md">
      <div className="w-full flex items-center justify-center md:justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Logo Foodsys" className="w-12 h-12" />
          <span className="font-bold text-2xl uppercase tracking-wide">Foodsys</span>
        </Link>

        {/* Menú */}
        <nav className="hidden md:flex items-center gap-3">
          <Link to="/" className="px-4 py-2 rounded-lg font-semibold hover:bg-white/15 transition">
            Inicio
          </Link>
          <Link to="/contacto" className="px-4 py-2 rounded-lg font-semibold hover:bg-white/15 transition">
            Contacto
          </Link>
          <Link to="/about" className="px-4 py-2 rounded-lg font-semibold hover:bg-white/15 transition">
            ¿Qué es Foodsys?
          </Link>

          {/* Selector de rol — solo visible si tiene más de uno */}
          {usuario && roles.length > 1 && (
            <select
          value={rolActivo || ""}
          onChange={handleCambioRol}
          className="
          bg-transparent
          text-white
          font-semibold
          px-2 py-1
          cursor-pointer
          appearance-none
          border-none
          outline-none
          hover:text-gray-300
          transition-colors duration-200
          "
          >
    {[...new Set(roles)]
  .filter(r => r !== "Aprendiz Interno")
  .map((r) => (
  <option key={r} value={r} className="text-black">
    {r}
  </option>
))}
      
          
        </select>
          )}

            {
  usuario && Array.isArray(roles) && roles.includes("Aprendiz Externo") && (
    <div>
      <Link 
        to="/generate-qr"
        className="px-4 py-2 rounded-lg font-semibold hover:bg-white/15 transition"
      >
        Generar QR para mañana
      </Link>
    </div>
  )}
    
              


          {/* Logout */}
          {usuario && (
            <button
              onClick={handleCerrarSesion}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default NavBar;