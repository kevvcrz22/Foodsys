// Paginas/Reportes/TarjetaEstadistica.jsx
// Tarjeta reutilizable que muestra una estadistica
// con icono, valor numerico y etiqueta

// eslint-disable-next-line no-unused-vars
const TarjetaEstadistica = ({ Etiqueta, Valor, Color, Icono: Comp_Icono }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex items-center gap-4">
    <div className={`w-10 h-10 sm:w-12 sm:h-12 ${Color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
      <Comp_Icono className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
    </div>
    <div>
      <p className="text-xl sm:text-2xl font-bold text-gray-900">
        {Valor}
      </p>
      <p className="text-xs text-gray-400">{Etiqueta}</p>
    </div>
  </div>
);

export default TarjetaEstadistica;
