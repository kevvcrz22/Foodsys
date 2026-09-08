// ─────────────────────────────────────────────────────────────────────────────
// InicioLanding.jsx
// Pantalla de inicio pública (Landing Page) optimizada para alto rendimiento móvil.
// Fondo acelerado por hardware (GPU), diseño limpio y estático, navegación fluida.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  HelpCircle,
  Phone,
  FileText,
  X,
  BookOpen,
  ShieldCheck,
  Award,
  ChevronRight,
} from "lucide-react";

import casinoImg from "../../Components/Img/Casino.jpeg";
import logoFoodsys from "../../Components/Img/LogoFoodsys.png";

const InicioLanding = () => {
  const navigate = useNavigate();
  const [mostrarModalDocumentos, setMostrarModalDocumentos] = useState(false);

  // Documentos de consulta rápida para el modal
  const listaDocumentos = [
    {
      titulo: "Guía de Reserva de Raciones",
      descripcion: "Pasos para consultar el menú diario y realizar reservas anticipadas.",
      tipo: "PDF / Guía",
      icono: BookOpen,
    },
    {
      titulo: "Reglamento del Casino de Alimentación",
      descripcion: "Normativa de uso del comedor en el Centro Agropecuario 'La Granja'.",
      tipo: "Reglamento",
      icono: ShieldCheck,
    },
    {
      titulo: "Manual para Aprendices e Internos",
      descripcion: "Instrucciones de cancelación de reservaciones y reporte de asistencia.",
      tipo: "Manual de Usuario",
      icono: Award,
    },
  ];

  return (
    <div className="relative h-[100dvh] min-h-[100dvh] w-full flex flex-col justify-between overflow-hidden bg-slate-100 font-sans select-none">
      {/* ── 1. Fondo de Casino.jpeg optimizado con aceleración GPU ──────────── */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none transform-gpu will-change-transform opacity-90"
        style={{
          backgroundImage: `url(${casinoImg})`,
          filter: "blur(2px)",
          transform: "scale(1.02) translateZ(0)",
        }}
      />

      {/* Capa blanca traslúcida optimizada sin filtros dinámicos pesados */}
      <div className="absolute inset-0 bg-white/75 pointer-events-none" />

      {/* ── 2. Encabezado de Navegación Superior Claro ─────────────────────── */}
      <header className="relative z-20 bg-white/90 border-b border-gray-200/80 px-4 sm:px-8 py-2.5 shadow-xs shrink-0">
        {/* Contenedor del header */}
        <div className="w-full flex items-center justify-between">
          {/* Logo - IZQUIERDA */}
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src={logoFoodsys}
              alt="Logo Foodsys"
              className="h-11 sm:h-13 w-auto object-contain"
              loading="eager"
              decoding="async"
            />
          </Link>

          {/* Enlaces y acciones - DERECHA */}
          <nav className="flex items-center gap-2 sm:gap-6">
            <Link
              to="/about"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1861c1] hover:text-[#0f3d7a] transition-colors py-1.5 px-2"
            >
              <HelpCircle size={17} className="text-[#1861c1]" />
              <span>¿Quiénes Somos?</span>
            </Link>

            <Link
              to="/contacto"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1861c1] hover:text-[#0f3d7a] transition-colors py-1.5 px-2"
            >
              <Phone size={17} className="text-[#1861c1]" />
              <span>Contacto</span>
            </Link>

            <button
              onClick={() => setMostrarModalDocumentos(true)}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1861c1] hover:text-[#0f3d7a] transition-colors py-1.5 px-2 cursor-pointer"
            >
              <FileText size={17} className="text-[#1861c1]" />
              <span>Documentos</span>
            </button>
          </nav>
        </div>
      </header>

      {/* ── 3. Sección Central Héroe ───────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-4">
        <div className="w-full max-w-2xl mx-auto text-center">
          {/* Logo Central de Foodsys */}
          <div className="mb-4 sm:mb-6 flex justify-center">
            <img
              src={logoFoodsys}
              alt="Foodsys Logo"
              className="h-24 sm:h-32 md:h-36 w-auto object-contain drop-shadow-md"
              loading="eager"
              decoding="async"
            />
          </div>

          {/* Título Principal */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-3xl font-semibold text-[#1a1a2e] mb-2 sm:mb-3 tracking-tight">
            Gestión de Alimentación
          </h1>

          {/* Subtítulo */}
          <p className="text-gray-700 text-sm sm:text-base md:text-lg max-w-lg mx-auto font-normal leading-relaxed mb-6 sm:mb-8">
            agiliza tus reservas en el centro Agropecuario La Granja.
          </p>

          {/* Botón Principal: Ingresar a Foodsys */}
          <div className="flex justify-center">
            <button
              id="btn-ingresar-foodsys"
              onClick={() => navigate("/login")}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base text-white bg-green-600 hover:bg-green-700 shadow-md transition-colors cursor-pointer active:scale-98"
            >
              <span>Ingresar a Foodsys</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </main>

      {/* ── 4. Pie de Página Claro ─────────────────────────────────────────── */}
      <footer className="relative z-20 bg-white/85 border-t border-gray-200/60 px-4 py-2.5 text-center shrink-0">
        <p className="text-xs text-gray-500 font-medium">
          Foodsys © {new Date().getFullYear()} — Centro Agropecuario La Granja
        </p>
      </footer>

      {/* ── 5. Modal de Documentos (Tema Claro) ────────────────────────────── */}
      {mostrarModalDocumentos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-entrada">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg p-6 sm:p-7 shadow-2xl relative text-left">
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#e5eff9] text-[#1861c1]">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1a1a2e]">Documentos e Información</h3>
                  <p className="text-xs text-gray-500">Recursos de consulta del sistema Foodsys</p>
                </div>
              </div>
              <button
                onClick={() => setMostrarModalDocumentos(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Lista de Documentos */}
            <div className="space-y-3 mb-6">
              {listaDocumentos.map((doc, idx) => {
                const IconoDoc = doc.icono;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-gray-50 border border-gray-150 hover:border-[#1861c1]/40 transition-colors flex items-start gap-3"
                  >
                    <div className="p-2 rounded-lg bg-white text-[#1861c1] shadow-2xs">
                      <IconoDoc size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h4 className="text-sm font-bold text-[#1a1a2e] truncate">{doc.titulo}</h4>
                        <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-[#e5eff9] text-[#1861c1] font-semibold">
                          {doc.tipo}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{doc.descripcion}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setMostrarModalDocumentos(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setMostrarModalDocumentos(false);
                  navigate("/login");
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1861c1] hover:bg-[#0f3d7a] transition-all cursor-pointer shadow-xs"
              >
                Ir a Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InicioLanding;
