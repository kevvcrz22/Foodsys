// Paginas/Inicio/TarjetaVista.jsx
// Componente reutilizable que representa una tarjeta
// de acceso a una vista del sistema
// Recibe nombre, descripcion, icono y ruta

import { useNavigate } from "react-router-dom";
import {
  Edit, CalendarCheck, Users, FileText,
  BarChart3, ClipboardList, UtensilsCrossed,
  GraduationCap, ChevronRight,
} from "lucide-react";

// Mapeo de nombre de icono a componente de lucide
const Mapa_Iconos = {
  Edit, CalendarCheck, Users, FileText,
  BarChart3, ClipboardList, UtensilsCrossed,
  GraduationCap,
};

// Colores alternados para cada tarjeta
const Colores_Tarjeta = [
  { Fondo: "bg-blue-50", Icono: "text-blue-600", Borde: "border-blue-100" },
  { Fondo: "bg-indigo-50", Icono: "text-indigo-600", Borde: "border-indigo-100" },
  { Fondo: "bg-violet-50", Icono: "text-violet-600", Borde: "border-violet-100" },
  { Fondo: "bg-emerald-50", Icono: "text-emerald-600", Borde: "border-emerald-100" },
  { Fondo: "bg-orange-50", Icono: "text-orange-600", Borde: "border-orange-100" },
  { Fondo: "bg-teal-50", Icono: "text-teal-600", Borde: "border-teal-100" },
  { Fondo: "bg-rose-50", Icono: "text-rose-600", Borde: "border-rose-100" },
  { Fondo: "bg-amber-50", Icono: "text-amber-600", Borde: "border-amber-100" },
];

const TarjetaVista = ({ Vista, Indice, Prefijo_Ruta }) => {
  const Navegar = useNavigate();
  const Comp_Icono = Mapa_Iconos[Vista.Icono] || FileText;
  const Color = Colores_Tarjeta[Indice % Colores_Tarjeta.length];

  // Construye la ruta completa con el prefijo del rol
  const Ruta_Completa = `${Prefijo_Ruta}${Vista.Ruta}`;

  return (
    <button
      onClick={() => Navegar(Ruta_Completa)}
      className={[
        "bg-white rounded-2xl p-4 border text-left",
        "transition-all duration-150 hover:shadow-sm",
        "hover:border-slate-200 active:scale-[0.98]",
        "border-slate-100 cursor-pointer w-full",
      ].join(" ")}
    >
      <div className={[
        "w-10 h-10 rounded-xl flex items-center",
        "justify-center mb-3",
        Color.Fondo,
      ].join(" ")}>
        <Comp_Icono size={18} className={Color.Icono} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800 mb-1">
            {Vista.Nombre}
          </p>
          <p className="text-xs text-slate-400 leading-snug">
            {Vista.Descripcion}
          </p>
        </div>
        <ChevronRight size={14} className="text-slate-300" />
      </div>
    </button>
  );
};

export default TarjetaVista;
