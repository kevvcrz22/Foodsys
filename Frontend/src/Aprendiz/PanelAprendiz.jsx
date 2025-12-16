import { Link } from "react-router-dom";

export default function PanelAprendiz() {
  return (
    <div className="container mt-4">
      <h2 className="mb-3">Panel del Aprendiz</h2>

      <div className="list-group">

        <Link className="list-group-item list-group-item-action" to="/aprendiz/perfil">
          Mi Perfil
        </Link>

        <Link className="list-group-item list-group-item-action" to="/aprendiz/confirmar-boleta">
          Confirmar Boleta
        </Link>

        <Link className="list-group-item list-group-item-action" to="/aprendiz/historial">
          Reporte Historial
        </Link>

        <Link className="list-group-item list-group-item-action" to="/aprendiz/reservas">
          Obtener Reservas
        </Link>

        <Link className="list-group-item list-group-item-action" to="/aprendiz/password">
          Cambiar Contraseña
        </Link>

        <Link className="list-group-item list-group-item-action" to="/aprendiz/qr">
          Mostrar Boleta QR
        </Link>

      </div>
    </div>
  );
}
