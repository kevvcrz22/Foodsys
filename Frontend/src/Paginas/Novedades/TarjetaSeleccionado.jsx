// Paginas/Novedades/TarjetaSeleccionado.jsx
// Muestra la tarjeta del aprendiz seleccionado
// con opcion de deseleccionar

import { IdCard } from "lucide-react";

const TarjetaSeleccionado = ({
  Usuario, Limpiar_Seleccion,
}) => {
  if (!Usuario) return null;

  return (
    <div className="mb-4 bg-[#f0f4ff] rounded-xl px-4 py-3 flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-[#1861c1]">
          {Usuario.Nom_Usuario} {Usuario.Ape_Usuario}
        </p>
        <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
          <IdCard className="w-3.5 h-3.5 text-gray-400" />
          {Usuario.NumDoc_Usuario}
        </p>
      </div>
      <button
        onClick={Limpiar_Seleccion}
        className="text-gray-400 hover:text-red-400 transition"
      >
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

export default TarjetaSeleccionado;