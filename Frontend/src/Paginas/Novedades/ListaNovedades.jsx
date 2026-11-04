// Paginas/Novedades/ListaNovedades.jsx
//
// Panel derecho que muestra las reservas excepcionales del dia actual.
// Los datos vienen directamente del endpoint /api/Novedades/hoy sin transformacion.
// El campo que identifica el tipo de comida en el modelo de reserva es Tip_Reserva.
// El campo de excepcion en la base de datos es Exc_Reserva (no Res_Excepcional).
// El campo de justificacion es Jus_Reserva (no justificacion).
//
// Props:
//   Reservas         - Array de reservas excepcionales del dia (del padre).
//   Manejar_Reporte  - Funcion del padre que carga y abre el modal del reporte.
//   Cargando_Reporte - Booleano que bloquea el boton mientras se carga el reporte.

const ListaNovedades = ({ Reservas, Manejar_Reporte, Cargando_Reporte }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

    {/* Cabecera del panel con contador de novedades y boton de reporte.
        El boton llama a Manejar_Reporte definido en Novedades.jsx,
        que hace el GET a /api/Novedades/reporte/hoy y abre el modal. */}
    <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 bg-[#42b72a]/10 rounded-lg flex items-center justify-center text-[#42b72a]">
          <i className="fas fa-list text-sm"></i>
        </span>
        Novedades del dia
      </div>

      <div className="flex items-center gap-2">
        {/* Contador de novedades registradas en el dia */}
        {Reservas.length > 0 && (
          <span className="bg-[#1861c1] text-white text-xs font-bold px-3 py-1 rounded-full">
            {Reservas.length} registradas
          </span>
        )}

        {/* Boton para generar el reporte del dia.
            Solo se muestra si hay novedades registradas para evitar reportes vacios.
            Cargando_Reporte bloquea el boton mientras se espera respuesta del backend. */}
        {Reservas.length > 0 && (
          <button
            onClick={Manejar_Reporte}
            disabled={Cargando_Reporte}
            className="flex items-center gap-1.5 bg-[#1861c1]/10 hover:bg-[#1861c1]/20 text-[#1861c1] text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-60"
          >
            {Cargando_Reporte ? (
              // Indicador visual de carga mientras el backend prepara el reporte
              <div className="w-3 h-3 border-2 border-[#1861c1]/30 border-t-[#1861c1] rounded-full animate-spin"></div>
            ) : (
              <i className="fas fa-file-alt text-xs"></i>
            )}
            Generar Reporte
          </button>
        )}
      </div>
    </h2>

    {/* Lista vacia: se muestra cuando no hay novedades en el dia */}
    {Reservas.length === 0 ? (
      <div className="flex flex-col items-center justify-center h-48 text-gray-300">
        <i className="fas fa-inbox text-4xl mb-2"></i>
        <p className="text-sm">Sin novedades registradas hoy</p>
      </div>
    ) : (
      // Lista de novedades del dia con scroll interno para no expandir el panel.
      // Cada fila muestra: nombre del aprendiz, tipo de comida, fecha, estado y justificacion.
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {Reservas.map((R) => (
          <div
            key={R.Id_Reserva}
            className="flex items-start justify-between bg-gray-50 rounded-xl px-4 py-3 gap-3"
          >
            <div className="flex-1 min-w-0">
              {/* Nombre completo del aprendiz.
                  El backend retorna el objeto usuario con alias 'usuario' segun la asociacion. */}
              <p className="text-sm font-medium text-gray-700 truncate">
                {R.usuario
                  ? `${R.usuario.Nom_Usuario} ${R.usuario.Ape_Usuario}`
                  : `Usuario #${R.Id_Usuario}`}
              </p>

              {/* Tipo de comida y fecha de la reserva.
                  Tip_Reserva es el campo exacto del modelo de reserva en la base de datos. */}
              <p className="text-xs text-gray-400">
                {R.Tip_Reserva} &mdash; {R.Fec_Reserva}
              </p>

              {/* Justificacion de la novedad si existe.
                  Jus_Reserva es el campo exacto en la tabla reservas. */}
              {R.Jus_Reserva && (
                <p className="text-xs text-gray-400 italic mt-0.5 truncate">
                  {R.Jus_Reserva}
                </p>
              )}
            </div>

            {/* Estado actual de la reserva con color de fondo segun el valor.
                Los estados posibles segun el enum de la BD son:
                Generado, Verificado, Vencido, Cancelado, Consumido. */}
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-lg whitespace-nowrap ${
                R.Est_Reserva === "Consumido"
                  ? "bg-green-100 text-green-600"
                  : R.Est_Reserva === "Cancelado" || R.Est_Reserva === "Vencido"
                  ? "bg-red-100 text-red-500"
                  : R.Est_Reserva === "Verificado"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-orange-100 text-orange-600"
              }`}
            >
              {R.Est_Reserva}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default ListaNovedades;