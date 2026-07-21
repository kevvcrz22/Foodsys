// ─────────────────────────────────────────────────────────────────────────────
// LoginHero.jsx
// Panel visual izquierdo del login con diseño Liquid Glass + Claymorfismo.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { CalendarCheck, Users, Utensils, Leaf } from 'lucide-react';

// ─── Características del sistema ─────────────────────────────────────────────
const Caracteristicas = [
  { icono: CalendarCheck, titulo: 'Reserva anticipada',    descripcion: 'Planifica tus comidas con días de anticipación' },
  { icono: Users,         titulo: 'Control de asistencia', descripcion: 'Registro preciso de todos los comensales'        },
  { icono: Utensils,      titulo: 'Gestión de raciones',   descripcion: 'Menús balanceados y planificados'                },
  { icono: Leaf,          titulo: 'Sin desperdicios',       descripcion: 'Optimización del consumo alimentario'           },
];

const LoginHero = () => (
  <section className="hidden lg:flex flex-col justify-between h-full min-h-[600px] relative overflow-hidden rounded-[24px] p-12 bg-primario-claro">
    
    {/* ── Orbes de luz decorativos (Liquid Glass background) ── */}
    <div className="absolute -top-24 -right-24 w-96 h-96 bg-acento/10 rounded-full blur-3xl mix-blend-multiply pointer-events-none" />
    <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-primario/10 rounded-full blur-3xl mix-blend-multiply pointer-events-none" />

    {/* ── Bloque superior: Título ── */}
    <div className="relative z-10">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-md border border-white/60 shadow-sm mb-6">
        <Utensils size={14} className="text-primario-oscuro" />
        <span className="text-xs font-bold text-primario-oscuro tracking-widest uppercase">
          Bienvenido a Foodsys
        </span>
      </div>

      <h1 className="text-[2.8rem] font-black leading-[1.1] text-texto-principal mb-4">
        Gestión <span className="texto-gradiente">inteligente</span><br />
        del comedor
      </h1>
      
      <p className="text-texto-secundario text-[0.95rem] leading-relaxed max-w-sm">
        Reserva tus platos con anticipación, controla tu asistencia y ayúdanos a evitar el desperdicio de alimentos.
      </p>
    </div>

    {/* ── Tarjetas de características (Clay / Glass) ── */}
    <div className="grid grid-cols-2 gap-4 my-8 relative z-10">
      {Caracteristicas.map(({ icono: Icono, titulo, descripcion }) => (
        <div
          key={titulo}
          className="panel-glass p-5 flex flex-col gap-3 transition-transform duration-300 hover:-translate-y-1"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primario-claro to-white flex items-center justify-center shadow-sm shadow-primario/10">
            <Icono size={18} className="text-primario" />
          </div>
          <div>
            <span className="block font-bold text-texto-principal text-sm mb-1">{titulo}</span>
            <span className="block text-xs text-texto-secundario leading-relaxed">{descripcion}</span>
          </div>
        </div>
      ))}
    </div>

    {/* ── Estadísticas decorativas ── */}
    <div className="relative z-10 flex gap-6 p-5 rounded-2xl bg-white/50 backdrop-blur-md border border-white/60 shadow-sm">
      <div className="flex-1 text-center">
        <p className="text-xl font-black text-primario-oscuro">98%</p>
        <p className="text-[0.7rem] font-bold text-texto-secundario uppercase tracking-wider mt-1">Satisfacción</p>
      </div>
      <div className="w-[1px] bg-primario/10" />
      <div className="flex-1 text-center">
        <p className="text-xl font-black text-acento-oscuro">0</p>
        <p className="text-[0.7rem] font-bold text-texto-secundario uppercase tracking-wider mt-1">Desperdicios</p>
      </div>
    </div>
    
  </section>
);

export default LoginHero;