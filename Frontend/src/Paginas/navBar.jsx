import { Link, useNavigate } from 'react-router-dom';
import * as bootstrap from "bootstrap";
import logo from './../Paginas/Login/Img/logo.png';

const NavBar = () => {
    const navigate = useNavigate();
    const revisarOffCanvas = (ruta) => {
        const offcanvasElement = document.getElementById("offcanvasScrolling");
        const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
        if (bsOffcanvas) {
            document.getElementById('botonCerrarOffCanvas').click()
        }
        setTimeout(() =>{
            navigate(ruta)
        }, 150)
    }

    return (
        <>
            <header className="topbar" role="banner">
                <div className="container d-flex justify-content-between align-items-center">

                     <button className="btn btn-success d-lg-none"
                        type="button" data-bs-toggle="offcanvas"
                        data-bs-target="#offcanvasScrolling"
                        aria-controls="offcanvasScrolling">
                        ☰
                    </button>

                    <a className="brand" href="#" aria-label="Foodsys - inicio">
                        <img src={logo} alt="Logo Foodsys" className="logo" />
                        <span to="/" className="brand-name">Foodsys</span>
                    </a>
                   
                    <nav className="navlinks d-none d-lg-block" role="navigation" aria-label="Enlaces principales">
                        <Link to="/" className="active">Inicio</Link>
                        <Link to="https://wa.link/l90ns4">Contacto</Link>
                        <Link to="/about">¿Qué es Foodsys?</Link>
                    </nav>
                </div>

            </header>
            <div class="offcanvas offcanvas-start" data-bs-scroll="true" data-bs-backdrop="false" tabindex="-1" id="offcanvasScrolling" style={{"--bs-offcanvas-width": "250px"}} aria-labelledby="offcanvasScrollingLabel">
                <div class="offcanvas-header">
                    
                    <h5 class="offcanvas-title" id="offcanvasScrollingLabel">Foodsys</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close" id='botonCerrarOffCanvas'></button>
                </div>
                <div class="offcanvas-body">
                    <ul className="navbar-nav">
                        <li className='nav-item border-bottom'>
                            <button onClick={() => revisarOffCanvas('/')} className='nav-link text-start'>Inicio</button>
                        </li>
                        <li className='nav-item border-bottom'>
                            <button onClick={() => revisarOffCanvas('/usuario')} className='nav-link text-start'>Usuarios</button>
                        </li>
                    </ul>
                    
                </div>
            </div>
        </>
    )
}

export default NavBar