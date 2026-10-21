// Frontend/src/Components/GlobalLoader.jsx
// Componente de carga global reutilizable con el logo de Foodsys y anillo animado
// Muestra mensajes amigables sin exponer errores tecnicos ni tiempos de espera incomodos
// Codigo comentado didacticamente sin tildes ni emojis para aprendices de primer semestre

import React from "react";

const GlobalLoader = ({
  mensaje = "Cargando informacion del sistema...",
  submensaje = "Por favor espera unos segundos",
  tamano = "md", // 'sm', 'md', 'lg'
  pantallaCompleta = false
}) => {
  const tamanosLogo = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-28 h-28"
  };

  const tamanosAnillo = {
    sm: "w-16 h-16 border-2",
    md: "w-28 h-28 border-4",
    lg: "w-36 h-36 border-4"
  };

  const contenido = (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none">
      {/* Contenedor relativo del logo central y el anillo giratorio */}
      <div className="relative flex items-center justify-center mb-5">
        {/* Anillo exterior animado en azul institucional */}
        <div
          className={`${tamanosAnillo[tamano]} rounded-full border-gray-200 border-t-blue-600 border-r-blue-500 animate-spin`}
          style={{ animationDuration: "1s" }}
        />

        {/* Logo central de Foodsys */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/LogoFoodsys.png"
            alt="Logo Foodsys"
            className={`${tamanosLogo[tamano]} object-contain drop-shadow-md animate-pulse`}
            style={{ animationDuration: "2s" }}
            onError={(e) => {
              // Si la imagen falla por alguna razon, mantener un circulo estilizado con iniciales
              e.target.style.display = "none";
            }}
          />
        </div>
      </div>

      {/* Mensaje dinamico amigable */}
      <h3 className="text-base sm:text-lg font-bold text-gray-800 tracking-tight">
        {mensaje}
      </h3>
      {submensaje && (
        <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xs">
          {submensaje}
        </p>
      )}
    </div>
  );

  if (pantallaCompleta) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm transition-all duration-300">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 max-w-sm w-full mx-4">
          {contenido}
        </div>
      </div>
    );
  }

  return contenido;
};

export default GlobalLoader;
