// Frontend/src/Components/DescripcionExpandible.jsx
// Componente reutilizable para descripciones de platos, bebidas y menus
// Permite desplegar texto largo con "Ver mas" / "Ver menos" sin disparar la seleccion del elemento

import { useState } from "react";

const DescripcionExpandible = ({ texto, limite = 55, color = "emerald", className = "" }) => {
  const [expandido, setExpandido] = useState(false);

  if (!texto) return null;
  const esLargo = texto.length > limite;

  const colorClase =
    color === "blue"
      ? "text-blue-600 hover:text-blue-800"
      : "text-emerald-600 hover:text-emerald-800";

  return (
    <span className={`text-[11px] text-slate-500 leading-relaxed block ${className}`}>
      {expandido || !esLargo ? texto : `${texto.slice(0, limite)}...`}
      {esLargo && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpandido((prev) => !prev);
          }}
          className={`text-[11px] font-bold underline ml-1 cursor-pointer inline-block ${colorClase}`}
        >
          {expandido ? "Ver menos" : "Ver más"}
        </button>
      )}
    </span>
  );
};

export default DescripcionExpandible;
