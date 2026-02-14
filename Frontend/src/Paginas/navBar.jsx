import { Link } from 'react-router-dom';
import logo from './../Paginas/Login/Img/logo.png';

const NavBar = () => {
    return (
        <>
            <header 
                className="sticky top-0 z-[1000] bg-[#1861c1] text-white px-[22px] py-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.08)]" 
                role="banner"
            >
                <div className="max-w-[1150px] mx-auto flex items-center gap-5">
                    <a 
                        className="flex items-center gap-3 no-underline text-white group" 
                        href="#" 
                        aria-label="Foodsys - inicio"
                    >
                        <img 
                            src={logo} 
                            alt="Logo Foodsys" 
                            className="w-14 h-14 transition-all duration-[350ms] ease-in-out group-hover:rotate-[5deg] group-hover:scale-105" 
                        />
                        <span className="font-bold text-[26px] text-white uppercase tracking-[0.5px]">
                            Foodsys
                        </span>
                    </a>
                    <nav 
                        className="ml-auto flex gap-[10px]" 
                        role="navigation" 
                        aria-label="Enlaces principales"
                    >
                        <Link 
                            to="/" 
                            className="relative text-white no-underline font-semibold px-[14px] py-[10px] rounded-lg transition-all duration-[350ms] ease-in-out overflow-hidden hover:bg-white/15 hover:-translate-y-[2px] bg-white/20 after:content-[''] after:absolute after:bottom-0 after:left-[10%] after:w-[80%] after:h-[2px] after:bg-[#42b72a]"
                        >
                            Inicio
                        </Link>
                        <Link 
                            to="/contacto" 
                            className="relative text-white no-underline font-semibold px-[14px] py-[10px] rounded-lg transition-all duration-[350ms] ease-in-out overflow-hidden hover:bg-white/15 hover:-translate-y-[2px]"
                        >
                            Contacto
                        </Link>
                        <Link 
                            to="/about" 
                            className="relative text-white no-underline font-semibold px-[14px] py-[10px] rounded-lg transition-all duration-[350ms] ease-in-out overflow-hidden hover:bg-white/15 hover:-translate-y-[2px]"
                        >
                            ¿Qué es Foodsys?
                        </Link>
                    </nav>
                </div>
            </header>
        </>
    )
}

export default NavBar