// Paginas/About/QueEsFoodsys.jsx
// Sección ¿Quiénes Somos? - Carrusel interactivo del equipo de desarrollo de Foodsys
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Users,
  ShieldCheck,
  Award,
  Sparkles,
  Code
} from "lucide-react";
import logoFoodsys from "../../Components/Img/LogoFoodsys.png";

// Lista de los 6 desarrolladores con sus fotos, nombres y cargos
const DESARROLLADORES = [
  {
    id: 1,
    nombre: "Kevin Steven Cruz Fierro",
    cargo: "Gerente",
    foto: "/Desarrolladores/Kevin.jpeg",
    descripcion: "Líder general y dirección del proyecto Foodsys, supervisión de la arquitectura, toma de decisiones estratégicas y coordinación del equipo.",
    especialidad: "Dirección de Proyecto & Arquitectura",
    colorInsignia: "bg-blue-600 text-white"
  },
  {
    id: 2,
    nombre: "Karol Jimena Gómez Alba",
    cargo: "Subgerente",
    foto: "/Desarrolladores/Karol.jpeg",
    descripcion: "Gestión y articulación operativa del desarrollo, control de entregables, aseguramiento de estándares y apoyo en la toma de decisiones.",
    especialidad: "Gestión Operativa & Coordinación",
    colorInsignia: "bg-indigo-600 text-white"
  },
  {
    id: 3,
    nombre: "Diana Carolina Peña Rodríguez",
    cargo: "Analista y Desarrollador",
    foto: "/Desarrolladores/Diana.png",
    descripcion: "Levantamiento y análisis riguroso de requerimientos, diseño de experiencia de usuario y desarrollo de componentes modulares.",
    especialidad: "Análisis de Requisitos & Frontend",
    colorInsignia: "bg-emerald-600 text-white"
  },
  {
    id: 4,
    nombre: "Diego Julio Santofimio",
    cargo: "Analista y Desarrollador",
    foto: "/Desarrolladores/Diego.jpeg",
    descripcion: "Análisis y construcción de soluciones tecnológicas, implementación de flujos de negocio y validación funcional del sistema.",
    especialidad: "Desarrollo de Software & Lógica",
    colorInsignia: "bg-emerald-600 text-white"
  },
  {
    id: 5,
    nombre: "Estefania Otalvaro Botero",
    cargo: "Analista y Desarrollador",
    foto: "/Desarrolladores/Estefania.jpeg",
    descripcion: "Modelado de estructuras de datos, desarrollo de lógica de negocio, pruebas continuas y optimización de rendimiento.",
    especialidad: "Desarrollo Full Stack & Base de Datos",
    colorInsignia: "bg-emerald-600 text-white"
  },
  {
    id: 6,
    nombre: "Santiago Grijalba Cárdenas",
    cargo: "Analista y Desarrollador",
    foto: "/Desarrolladores/Santiago.png",
    descripcion: "Análisis de procesos, diseño de interfaces intuitivas e integración de funcionalidades para la optimización del servicio.",
    especialidad: "Análisis Funcional & UI/UX",
    colorInsignia: "bg-emerald-600 text-white"
  }
];

const QueEsFoodsys = () => {
  const [indiceActual, setIndiceActual] = useState(0);
  const [pausarAuto, setPausarAuto] = useState(false);

  // Transición automática cada 5 segundos
  useEffect(() => {
    if (pausarAuto) return;
    const temporizador = setInterval(() => {
      setIndiceActual((prev) => (prev + 1) % DESARROLLADORES.length);
    }, 5000);
    return () => clearInterval(temporizador);
  }, [pausarAuto]);

  const irAnterior = () => {
    setPausarAuto(true);
    setIndiceActual((prev) => (prev - 1 + DESARROLLADORES.length) % DESARROLLADORES.length);
  };

  const irSiguiente = () => {
    setPausarAuto(true);
    setIndiceActual((prev) => (prev + 1) % DESARROLLADORES.length);
  };

  const devActual = DESARROLLADORES[indiceActual];

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8">
      {/* Elementos visuales de fondo */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Contenedor Superior / Barra de Retorno y Título */}
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#1861c1] hover:text-[#0f3d7a] bg-white border border-gray-200/80 px-4 py-2 rounded-xl shadow-xs transition-all hover:shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Volver al Inicio</span>
          </Link>

          <img
            src={logoFoodsys}
            alt="Logo Foodsys"
            className="h-9 sm:h-10 w-auto object-contain"
          />
        </div>

        {/* Encabezado Principal */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1861c1] text-xs font-bold uppercase tracking-wider mb-2">
            <Users size={14} />
            <span>Equipo de Desarrollo</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#1a1a2e] tracking-tight">
            ¿Quiénes Somos?
          </h1>
          <p className="mt-2 text-gray-600 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Conoce al equipo encargado del análisis, diseño, desarrollo y gestión de la plataforma <strong className="text-[#1861c1]">Foodsys</strong> para el Centro Agropecuario "La Granja".
          </p>
        </div>
      </div>

      {/* ── Tarjeta Principal del Carrusel ────────────────────────────── */}
      <div className="max-w-4xl mx-auto w-full my-auto">
        <div
          className="relative bg-white border border-gray-200/90 rounded-3xl shadow-xl overflow-hidden transition-all duration-300 p-6 sm:p-8 md:p-10 pl-10 pr-14 sm:pl-12 sm:pr-16 md:pl-14 md:pr-20"
          onMouseEnter={() => setPausarAuto(true)}
          onMouseLeave={() => setPausarAuto(false)}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Foto del Desarrollador a tamaño completo */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-full max-w-[260px] h-[300px] sm:h-[340px] rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-slate-900/5 ring-2 ring-[#1861c1]/20 flex items-center justify-center p-1.5">
                <img
                  src={devActual.foto}
                  alt={devActual.nombre}
                  className="w-full h-full object-contain rounded-xl transition-all duration-300 hover:scale-[1.02]"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(devActual.nombre)}&background=1861c1&color=fff&size=256&bold=true`;
                  }}
                />
              </div>

              {/* Indicador de posición */}
              <div className="mt-3.5 flex items-center gap-2">
                <span className="text-[0.7rem] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {indiceActual + 1} de {DESARROLLADORES.length}
                </span>
              </div>
            </div>

            {/* Información del Desarrollador */}
            <div className="md:col-span-7 flex flex-col justify-between text-center md:text-left space-y-4">
              <div>
                <span className={`inline-block text-xs font-extrabold px-3 py-1 rounded-lg uppercase tracking-wide mb-2 shadow-xs ${devActual.colorInsignia}`}>
                  {devActual.cargo}
                </span>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#1a1a2e] leading-snug">
                  {devActual.nombre}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-[#1861c1] mt-1 flex items-center justify-center md:justify-start gap-1.5">
                  <Code size={15} />
                  <span>{devActual.especialidad}</span>
                </p>
              </div>

              {/* Descripción */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-gray-200/80 text-gray-700 text-xs sm:text-sm leading-relaxed shadow-inner">
                "{devActual.descripcion}"
              </div>

              {/* Distintivos SENA / Foodsys */}
              <div className="pt-1 flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold px-2.5 py-1 rounded-md bg-green-50 text-green-700 border border-green-200">
                  <ShieldCheck size={13} /> Centro Agropecuario
                </span>
                <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  <Sparkles size={13} /> SENA La Granja
                </span>
              </div>
            </div>

          </div>

          {/* Botón Anterior */}
          <button
            onClick={irAnterior}
            aria-label="Anterior desarrollador"
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full bg-white/95 border border-gray-200 text-gray-700 hover:bg-[#1861c1] hover:text-white hover:border-[#1861c1] transition-all shadow-md active:scale-95 cursor-pointer z-10"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Botón Siguiente con suficiente separación del texto */}
          <button
            onClick={irSiguiente}
            aria-label="Siguiente desarrollador"
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full bg-white/95 border border-gray-200 text-gray-700 hover:bg-[#1861c1] hover:text-white hover:border-[#1861c1] transition-all shadow-md active:scale-95 cursor-pointer z-10"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Indicadores de puntos interactivos */}
        <div className="flex justify-center items-center gap-2.5 mt-5">
          {DESARROLLADORES.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setPausarAuto(true);
                setIndiceActual(index);
              }}
              aria-label={`Ir al desarrollador ${index + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                index === indiceActual
                  ? "w-8 bg-[#1861c1]"
                  : "w-2.5 bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Miniaturas del equipo abajo (Selección directa) ─────────── */}
      <div className="max-w-4xl mx-auto w-full mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        {DESARROLLADORES.map((dev, idx) => (
          <button
            key={dev.id}
            onClick={() => {
              setPausarAuto(true);
              setIndiceActual(idx);
            }}
            className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              idx === indiceActual
                ? "bg-blue-50/90 border-[#1861c1] shadow-sm ring-1 ring-[#1861c1]"
                : "bg-white/90 border-gray-200/80 hover:bg-gray-50 hover:border-gray-300"
            }`}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 shadow-2xs">
              <img
                src={dev.foto}
                alt={dev.nombre}
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(dev.nombre)}&background=1861c1&color=fff&size=64&bold=true`;
                }}
              />
            </div>
            <p className="text-[0.7rem] font-bold text-gray-800 truncate w-full">
              {dev.nombre.split(" ")[0]} {dev.nombre.split(" ")[2] || ""}
            </p>
            <span className="text-[0.6rem] text-gray-500 truncate w-full font-medium">
              {dev.cargo}
            </span>
          </button>
        ))}
      </div>

      {/* Pie de página sutil */}
      <div className="text-center mt-6 text-gray-400 text-xs font-medium">
        Foodsys © {new Date().getFullYear()} — Centro Agropecuario La Granja
      </div>
    </div>
  );
};

export default QueEsFoodsys;