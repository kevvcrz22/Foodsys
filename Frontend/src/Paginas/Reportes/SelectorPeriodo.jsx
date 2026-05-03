// Paginas/Reportes/SelectorPeriodo.jsx
// Componente de botones para seleccionar el periodo
// del reporte (diario, semanal, mensual, anual)

const PERIODOS = [
  { Clave: "diario",  Etiqueta: "Diario" },
  { Clave: "semanal", Etiqueta: "Semanal" },
  { Clave: "mensual", Etiqueta: "Mensual" },
  { Clave: "anual",   Etiqueta: "Anual" },
];

const SelectorPeriodo = ({ Periodo, Set_Periodo }) => (
  <div className="flex gap-2 flex-wrap">
    {PERIODOS.map(({ Clave, Etiqueta }) => (
      <button
        key={Clave}
        onClick={() => Set_Periodo(Clave)}
        className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-colors border ${
          Periodo === Clave
            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200"
            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
        }`}
      >
        {Etiqueta}
      </button>
    ))}
  </div>
);

export default SelectorPeriodo;
