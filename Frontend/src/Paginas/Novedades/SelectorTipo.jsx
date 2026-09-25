// Paginas/Novedades/SelectorTipo.jsx
// Muestra botones de seleccion para el tipo de comida en novedades (Almuerzo y Cena)
// e informa sobre los limites horarios (Almuerzo hasta 09:00 AM, Cena hasta 03:00 PM).

const HORARIOS_NOVEDAD = {
  Almuerzo: {
    limite: "Hasta 09:00 AM",
    limiteMinutos: 9 * 60, // 09:00 AM
  },
  Cena: {
    limite: "Hasta 03:00 PM",
    limiteMinutos: 15 * 60, // 15:00 PM
  },
};

const SelectorTipo = ({ Tipos_Disponibles = [], Tipo, Set_Tipo }) => {
  // Filtrar Desayuno (no aplica en novedades)
  const tiposFiltrados = Tipos_Disponibles.filter((t) => t !== "Desayuno");

  const ahora = new Date();
  const minutosActual = ahora.getHours() * 60 + ahora.getMinutes();

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-semibold text-gray-700">
          Tipo de comida
        </label>
        <span className="text-[11px] text-gray-500 font-medium">
          Límites: Almuerzo (09:00 AM) &middot; Cena (03:00 PM)
        </span>
      </div>

      {tiposFiltrados.length === 0 ? (
        <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
          No hay tipos de comida habilitados para novedades con este rol.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {tiposFiltrados.map((T) => {
            const config = HORARIOS_NOVEDAD[T];
            const estaExpirado = config ? minutosActual > config.limiteMinutos : false;
            const esSeleccionado = Tipo === T;

            return (
              <button
                key={T}
                type="button"
                disabled={estaExpirado}
                onClick={() => Set_Tipo(T)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                  estaExpirado
                    ? "bg-gray-100 border-gray-200 text-gray-400 opacity-60 cursor-not-allowed"
                    : esSeleccionado
                    ? "bg-blue-50 border-[#1861c1] text-[#1861c1] ring-2 ring-[#1861c1]/20 font-bold shadow-xs cursor-pointer"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 cursor-pointer"
                }`}
              >
                <div>
                  <p className="text-sm font-bold leading-tight">{T}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {config ? config.limite : ""}
                  </p>
                </div>

                {estaExpirado ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-100 text-red-700">
                    Cerrado
                  </span>
                ) : esSeleccionado ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-[#1861c1]">
                    Seleccionado
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-green-100 text-green-700">
                    Habilitado
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SelectorTipo;