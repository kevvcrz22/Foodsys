export default function Reportes() {
  return (
    <div className="col-md-8">
      <h2 className="mb-4">Reportes</h2>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="btn-group mb-4">
            <button className="btn btn-success">Diario</button>
            <button className="btn btn-outline-secondary">Semanal</button>
            <button className="btn btn-outline-secondary">Mensual</button>
          </div>

          <p><strong>Desayuno:</strong> Asistieron 5 / No asistieron 3</p>
          <p><strong>Almuerzo:</strong> Asistieron 8 / No asistieron 1</p>
          <p><strong>Cena:</strong> Asistieron 4 / No asistieron 2</p>

          <button className="btn btn-success mt-3">
            Descargar Reporte
          </button>
        </div>
      </div>
    </div>
  );
}
