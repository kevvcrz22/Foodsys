// Paginas/Novedades/SelectorTipo.jsx
//
// Muestra botones de seleccion para el tipo de comida disponible.
// Los tipos que se muestran aqui ya vienen filtrados desde el backend:
// el Coordinador consulto /api/Novedades/tipos-comida con los roles del aprendiz
// y el servicio determino cuales aplican. Este componente solo los renderiza.
//
// No hay logica de negocio aqui. Si el array Tipos_Disponibles tiene solo
// "Almuerzo", es porque el backend determino que el aprendiz es externo.
// Si tiene los tres tipos, es porque es interno. Este componente no lo sabe
// ni necesita saberlo.

const SelectorTipo = ({ Tipos_Disponibles, Tipo, Set_Tipo }) => (
  <div className="mb-5">
    <label className="block text-sm font-semibold text-gray-600 mb-2">
      Tipo de comida
    </label>
    <div className="flex gap-2">
      {Tipos_Disponibles.map((T) => (
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
  </div>
);

export default SelectorTipo;