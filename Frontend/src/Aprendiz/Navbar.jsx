import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-3">
      <div className="container-fluid">

        <Link className="navbar-brand" to="/">
          Foodsys
        </Link>

        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse show" id="navbarNav">
          <ul className="navbar-nav me-auto">

            <li className="nav-item">
              <Link className="nav-link" to="/reservas">Reservas</Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/usuarios">Usuarios</Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/fichas">Fichas</Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/programa">Programa</Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/aprendiz">Panel Aprendiz</Link>
            </li>

          </ul>
        </div>

      </div>
    </nav>
  );
}
