// Paginas/Perfil/CampoEntrada.jsx
// Campo de texto reutilizable con icono a la izquierda
// Acepta modo deshabilitado para campos de solo lectura

const CampoEntrada = ({
  // eslint-disable-next-line no-unused-vars
  Icono,
  Etiqueta,
  Valor,
  onChange,
  Deshabilitado = false,
  Tipo = "text",
  Placeholder = "",
}) => (
  <div>
    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
      {Etiqueta}
    </label>
    <div className="relative">
      <Icono
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
      <input
        type={Tipo}
        value={Valor}
        disabled={Deshabilitado}
        onChange={onChange}
        placeholder={Placeholder}
        className={[
          "w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border outline-none transition-all duration-150",
          Deshabilitado
            ? "bg-slate-100 border-transparent text-slate-500 cursor-not-allowed"
            : "bg-white border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10",
        ].join(" ")}
      />
    </div>
  </div>
);

export default CampoEntrada;
