// Frontend/src/Components/UI/ImageZoomModal.jsx
// Modal interactivo para visualizar y hacer Zoom sobre imágenes de platos, menús y recetas.
// Soporta acercar (+), alejar (-), reiniciar escala (100%), rotar y cerrar con ESC o clic fuera.

import { useState, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCw, RefreshCw, X, Maximize2 } from "lucide-react";

export default function ImageZoomModal({ isOpen, onClose, src, alt = "Imagen", titulo = "" }) {
  const [escala, setEscala] = useState(1);
  const [rotacion, setRotacion] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setEscala(1);
      setRotacion(0);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, escala]);

  if (!isOpen || !src) return null;

  const handleZoomIn = () => setEscala((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setEscala((prev) => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setEscala(1);
    setRotacion(0);
  };
  const handleRotate = () => setRotacion((prev) => (prev + 90) % 360);

  return (
    <div
      className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Barra Superior con Controles */}
      <div
        className="w-full max-w-4xl flex items-center justify-between gap-4 p-3 mb-2 bg-slate-900/90 text-white rounded-2xl border border-white/10 shadow-2xl shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 truncate">
          <Maximize2 size={16} className="text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-bold truncate">
            {titulo || alt || "Visor de Imagen"}
          </span>
          <span className="text-[11px] font-mono bg-white/10 px-2 py-0.5 rounded-md text-emerald-300">
            {Math.round(escala * 100)}%
          </span>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 hover:bg-white/15 rounded-xl transition text-white"
            title="Acercar (+)"
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 hover:bg-white/15 rounded-xl transition text-white"
            title="Alejar (-)"
          >
            <ZoomOut size={16} />
          </button>
          <button
            type="button"
            onClick={handleRotate}
            className="p-2 hover:bg-white/15 rounded-xl transition text-white"
            title="Rotar 90°"
          >
            <RotateCw size={16} />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-2 hover:bg-white/15 rounded-xl transition text-white"
            title="Restablecer (100%)"
          >
            <RefreshCw size={16} />
          </button>
          <div className="w-px h-5 bg-white/20 mx-1" />
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-rose-500/80 rounded-xl transition text-white"
            title="Cerrar (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Contenedor de la Imagen con Zoom y Paneo */}
      <div
        className="w-full max-w-4xl h-[75vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black/40 border border-white/5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          style={{
            transform: `scale(${escala}) rotate(${rotacion}deg)`,
            transition: "transform 0.2s cubic-bezier(0.2, 0, 0, 1)"
          }}
          className="max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing rounded-xl shadow-2xl"
          draggable={false}
        />
      </div>

      <p className="text-[11px] text-slate-400 mt-2">
        Usa los botones para acercar/alejar, o presiona <strong>ESC</strong> para salir.
      </p>
    </div>
  );
}

