// Paginas/Novedades/BuscadorAprendiz.jsx
// Componente de busqueda de aprendices con dropdown
// Muestra resultados filtrados y permite seleccionar

const BuscadorAprendiz = ({
  Busqueda, Set_Busqueda,
  Usuarios_Filtrados, Set_UsuarioSel,
  Set_Tipo, Usuario_Seleccionado,
  Manejar_Seleccionar,
}) => (
  <div className="mb-4">
    <label className="block text-sm font-semibold text-gray-600 mb-2">
      Buscar aprendiz
    </label>
    <input
      type="text"
      placeholder="Nombre o numero de documento..."
      value={Busqueda}
      onChange={E => {
        Set_Busqueda(E.target.value);
        Set_UsuarioSel(null);
        Set_Tipo("Almuerzo");
      }}
      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#1861c1]"
    />
    {Busqueda && !Usuario_Seleccionado && (
      <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
        {Usuarios_Filtrados.length === 0 ? (
          <p className="text-sm text-gray-400 p-3 text-center">
            No se encontraron aprendices
          </p>
        ) : (
          Usuarios_Filtrados.map(U => (
            <button
              key={U.Id_Usuario}
              onClick={() => Manejar_Seleccionar(U)}
              className="w-full text-left px-4 py-3 hover:bg-[#f0f4ff] transition text-sm border-b border-gray-50 last:border-0"
            >
              <span className="font-medium text-gray-700">
                {U.Nom_Usuario} {U.Ape_Usuario}
              </span>
              <span className="text-gray-400 ml-2">
                -- {U.NumDoc_Usuario}
              </span>
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${U.roles?.includes("Aprendiz Externo") ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"}`}>
                {U.roles?.includes("Aprendiz Externo") ? "Externo" : "Interno"}
              </span>
            </button>
          ))
        )}
      </div>
    )}
  </div>
);

export default BuscadorAprendiz;
