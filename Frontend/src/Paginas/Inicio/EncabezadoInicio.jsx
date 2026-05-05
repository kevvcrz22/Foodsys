// Paginas/Inicio/EncabezadoInicio.jsx
// Componente de encabezado para la pagina de Inicio
// Muestra saludo, fecha, nombre y rol del usuario

import { Clock } from "lucide-react";

// Genera el saludo segun la hora actual del dia
const Obtener_Saludo = () => {
  const Hora = new Date().getHours();
  if (Hora >= 5 && Hora < 12) return "Buenos dias";
  if (Hora >= 12 && Hora < 18) return "Buenas tardes";
  return "Buenas noches";
};

// Formatea la fecha actual en espanol legible
const Obtener_Fecha = () => {
  return new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const EncabezadoInicio = ({ Usuario, Rol_Activo }) => {
  // Nombre de pila para el saludo
  const Nombre_Pila =
    Usuario?.Nom_Usuario?.split(" ")[0] || "Usuario";

  // Iniciales para el avatar circular
  const Iniciales = [
    Usuario?.Nom_Usuario?.charAt(0),
    Usuario?.Ape_Usuario?.charAt(0),
  ]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock size={12} className="text-slate-400" />
            <span className="text-xs text-slate-400 capitalize truncate">
              {Obtener_Fecha()}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">
            {Obtener_Saludo()},
          </h1>
          <h2 className="text-xl font-bold text-blue-600 truncate">
            {Nombre_Pila}
          </h2>
          <span className="inline-block mt-2 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            {Rol_Activo || "Sin rol"}
          </span>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0 ml-4">
          {Iniciales || "U"}
        </div>
      </div>
    </div>
  );
};

export default EncabezadoInicio;