// Paginas/Novedades/SelectorTipo.jsx
// Selector de tipo de comida con botones
// Muestra advertencia para aprendices externos

const SelectorTipo = ({
  Tipos_Disponibles, Tipo, Set_Tipo,
  Usuario_Seleccionado,
}) => {
  // Verifica si es externo para mostrar advertencia
  const Es_Externo =
    Usuario_Seleccionado?.roles?.includes("Aprendiz Externo") &&
    !Usuario_Seleccionado?.roles?.includes("Aprendiz Interno");

  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-gray-600 mb-2">
        Tipo de comida
      </label>
      <div className="flex gap-2">
        {Tipos_Disponibles.map(T => (
          <button
            key={T}
            onClick={() => Set_Tipo(T)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
              Tipo === T
                ? "bg-[#1861c1] text-white shadow-md"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {T}
          </button>
        ))}
      </div>
      {Es_Externo && (
        <p className="text-xs text-orange-500 mt-1">
          * Los aprendices externos solo pueden reservar almuerzo
        </p>
      )}
    </div>
  );
};

export default SelectorTipo;
