import { Link } from 'react-router-dom';
import { LogOut } from "lucide-react";
import logo from './Img/LogoFoodsys.png';

const NavBar = () => {
    return (
        <header 
            className="sticky top-0 z-50 bg-[#0f3f80] text-white px-4 py-3 shadow-md"
            role="banner"
        >
            <div className="w-full flex items-center justify-center md:justify-between">
                
                {/* Logo */}
                <Link 
                    to="/" 
                    className="flex items-center gap-3"
                >
                    <img 
                        src={logo} 
                        alt="Logo Foodsys"
                        className="w-12 h-12"
                    />
                    <span className="font-bold text-2xl uppercase tracking-wide">
                        Foodsys
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-3">
                    
                    <Link 
                        to="/" 
                        className="px-4 py-2 rounded-lg font-semibold hover:bg-white/15 transition"
                    >
                        Inicio
                    </Link>

                    <Link 
                        to="/contacto" 
                        className="px-4 py-2 rounded-lg font-semibold hover:bg-white/15 transition"
                    >
                        Contacto
                    </Link>

                    <Link 
                        to="/about" 
                        className="px-4 py-2 rounded-lg font-semibold hover:bg-white/15 transition"
                    >
                        ¿Qué es Foodsys?
                    </Link>

                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition">
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                    </button>

                </nav>

            </div>
        </header>
    );
};

export default NavBar;
