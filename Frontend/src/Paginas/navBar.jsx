import { Link } from 'react-router-dom';
import logo from './../Paginas/Login/Img/logo.png';

const NavBar = () => {

    return (
        <>
            <header className="topbar" role="banner">
                <div className="inner">
                    <a className="brand" href="#" aria-label="Foodsys - inicio">
                        <img src={logo} alt="Logo Foodsys" className="logo" />
                        <span className="brand-name">Foodsys</span>
                    </a>

                    <nav className="navlinks" role="navigation" aria-label="Enlaces principales">
                        <Link to="/" className="active">Inicio</Link>
                        <Link to="/contacto">Contacto</Link>
                        <Link to="/about">¿Qué es Foodsys?</Link>
                    </nav>
                </div>
            </header>
        </>
    )
}

export default NavBar