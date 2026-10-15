// Components/LoadingFoodsys.jsx
// Indicador de carga premium con LogoFoodsys y aro azul dinámico
import React from "react";

export default function LoadingFoodsys({ texto = "Cargando Foodsys..." }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-md">
      <div className="relative flex flex-col items-center p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-slate-800 shadow-2xl shadow-blue-500/10 max-w-xs w-full text-center">
        {/* Orbes decorativos */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-sky-400/20 rounded-full blur-2xl pointer-events-none" />

        {/* Contenedor del Logo con Aro Azul Animado */}
        <div className="relative w-28 h-28 flex items-center justify-center mb-5">
          {/* Aro giratorio exterior */}
          <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-blue-600 animate-spin" />
          
          {/* Aro pulsante interior */}
          <div className="absolute inset-2 rounded-full border border-sky-400/40 animate-ping opacity-30" />

          {/* Círculo base para el logo */}
          <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden p-2">
            <img
              src="/LogoFoodsys.png"
              alt="Logo Foodsys"
              className="w-full h-full object-contain drop-shadow-sm select-none"
            />
          </div>
        </div>

        {/* Texto elegante */}
        <h3 className="text-base font-extrabold text-slate-800 dark:text-white tracking-wide">
          Foodsys
        </h3>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 animate-pulse">
          {texto}
        </p>
      </div>
    </div>
  );
}
