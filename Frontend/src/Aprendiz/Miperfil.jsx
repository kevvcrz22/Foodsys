import { Link, Outlet } from "react-router-dom";
import "./sidebar.css";

export default function MiPerfil() {
  return (
    <div style={{ display: "flex", height: "100vh" }}>

      
      <div className="sidebar">
        <h3 className="sidebar-title">Panel Aprendiz</h3>

        <ul className="sidebar-menu">
          <li><Link to="confirmar-boleta">Confirmar Boleta</Link></li>
          <li><Link to="historial">Reporte Historial</Link></li>
          <li><Link to="reservas">Obtener Reservas</Link></li>
          <li><Link to="password">Cambiar Contraseña</Link></li>
          <li><Link to="qr">Mostrar QR</Link></li>
        </ul>
      </div>

     
      <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
        <Outlet /> 
      </div>

    </div>
  );
}
