import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from "lucide-react";
import logo from './Img/LogoFoodsys.png';

const NavBar = () => {
    const navigate = useNavigate();

    const cerrarSesion = () => {
        localStorage.clear();
        navigate("/");
    };

    return (
        <header
            className="hidden lg:block sticky top-0 z-30 bg-[#0f3f80] text-white shadow-md lg:pl-64"
            role="banner"
        >
            <div className="w-full flex items-center justify-between px-4 py-3">

                {/* Logo */}
                <Link to="/" className="flex items-center gap-3">
                    <img
                        src={logo}
                        alt="Logo Foodsys"
                        className="w-10 h-10 object-contain"
                    />
                    <span className="font-bold text-xl uppercase tracking-wide">
                        Foodsys
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="flex items-center gap-1">
                    <Link to="/" className="px-4 py-2 rounded-lg font-semibold text-sm hover:bg-white/15 transition">
                        Inicio
                    </Link>
                    <Link to="/contacto" className="px-4 py-2 rounded-lg font-semibold text-sm hover:bg-white/15 transition">
                        Contacto
                    </Link>
                    <Link to="/about" className="px-4 py-2 rounded-lg font-semibold text-sm hover:bg-white/15 transition">
                        ¿Qué es Foodsys?
                    </Link>
                    <button
                        onClick={cerrarSesion}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-red-600/80 transition ml-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                    </button>
                </nav>

            </div>
        </header>
    );
};

export default NavBar;