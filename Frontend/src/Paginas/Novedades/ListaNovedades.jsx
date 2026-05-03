// Paginas/Novedades/ListaNovedades.jsx
// Panel derecho: lista de reservas excepcionales
// del dia actual obtenidas desde el backend

const ListaNovedades = ({ Reservas }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 bg-[#42b72a]/10 rounded-lg flex items-center justify-center text-[#42b72a]">
          <i className="fas fa-list text-sm"></i>
        </span>
        Novedades del dia
      </div>
      {Reservas.length > 0 && (
        <span className="bg-[#1861c1] text-white text-xs font-bold px-3 py-1 rounded-full">
          {Reservas.length} registradas
        </span>
      )}
    </h2>

    {Reservas.length === 0 ? (
      <div className="flex flex-col items-center justify-center h-48 text-gray-300">
        <i className="fas fa-inbox text-4xl mb-2"></i>
        <p className="text-sm">Sin novedades registradas</p>
      </div>
    ) : (
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {Reservas.map(R => (
          <div key={R.Id_Reserva} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-700">
                {R.usuario
                  ? `${R.usuario.Nom_Usuario} ${R.usuario.Ape_Usuario}`
                  : `Usuario #${R.Id_Usuario}`}
              </p>
              <p className="text-xs text-gray-400">
                {R.Tipo} -- {R.Fec_Reserva}
              </p>
            </div>
            <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-2 py-1 rounded-lg">
              Excepcional
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default ListaNovedades;
