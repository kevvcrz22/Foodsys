// Paginas/Perfil/CampoContrasena.jsx
// Campo de contrasena con icono de ojo para alternar
// la visibilidad del texto ingresado

import { Lock, Eye, EyeOff } from "lucide-react";

const CampoContrasena = ({
  Etiqueta, Valor, onChange,
  Visible, OnToggle, Placeholder,
}) => (
  <div>
    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
      {Etiqueta}
    </label>
    <div className="relative">
      <Lock
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
      <input
        type={Visible ? "text" : "password"}
        value={Valor}
        onChange={onChange}
        placeholder={Placeholder}
        className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all duration-150"
      />
      <button
        type="button"
        onClick={OnToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-0 bg-transparent"
      >
        {Visible ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  </div>
);

export default CampoContrasena;
