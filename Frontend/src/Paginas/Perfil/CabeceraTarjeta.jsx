// Paginas/Perfil/CabeceraTarjeta.jsx
// Cabecera de tarjeta con icono de color y titulo

// eslint-disable-next-line no-unused-vars
const CabeceraTarjeta = ({ Color, Icono, Titulo }) => (
  <div className="flex items-center gap-2.5 mb-4">
    <div
      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${Color}`}
    >
      <Icono size={13} className="text-white" />
    </div>
    <h2 className="font-semibold text-slate-700 text-sm">
      {Titulo}
    </h2>
  </div>
);

export default CabeceraTarjeta;
