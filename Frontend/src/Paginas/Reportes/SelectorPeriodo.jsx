// Paginas/Reportes/SelectorPeriodo.jsx
// Componente de botones para seleccionar el periodo
// del reporte (diario, semanal, mensual, anual, personalizado)

const PERIODOS = [
  { Clave: "diario",  Etiqueta: "Diario" },
  { Clave: "semanal", Etiqueta: "Semanal" },
  { Clave: "mensual", Etiqueta: "Mensual" },
  { Clave: "anual",   Etiqueta: "Anual" },
  { Clave: "personalizado", Etiqueta: "Personalizado" },
];

const SelectorPeriodo = ({ Periodo, Set_Periodo, FechaInicio, Set_FechaInicio, FechaFin, Set_FechaFin, TipoAlimento, Set_TipoAlimento }) => (
  <div className="flex flex-col gap-4">
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

    {Periodo === "personalizado" && (
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha Inicio</label>
          <input 
            type="date" 
            value={FechaInicio} 
            onChange={e => Set_FechaInicio(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha Fin</label>
          <input 
            type="date" 
            value={FechaFin} 
            onChange={e => Set_FechaFin(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Alimento</label>
          <select 
            value={TipoAlimento} 
            onChange={e => Set_TipoAlimento(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="Todos">Todos</option>
            <option value="Desayuno">Desayuno</option>
            <option value="Almuerzo">Almuerzo</option>
            <option value="Cena">Cena</option>
          </select>
        </div>
      </div>
    )}
  </div>
);

export default SelectorPeriodo;
