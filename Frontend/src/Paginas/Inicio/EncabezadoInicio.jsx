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
    year: "numeric",
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
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-500 capitalize truncate">
              {Obtener_Fecha()}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2 flex-wrap">
            {Obtener_Saludo()}, <span className="text-blue-600">{Nombre_Pila} {Rol_Activo || ""}</span>
          </h1>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200 shrink-0 ml-4">
          {Iniciales || "U"}
        </div>
      </div>
    </div>
  );
};

export default EncabezadoInicio;
