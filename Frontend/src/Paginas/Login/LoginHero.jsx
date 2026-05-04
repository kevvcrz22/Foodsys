// ─────────────────────────────────────────────────────────────────────────────
// LoginHero.jsx
// Seccion visual izquierda del login. Muestra el mensaje principal,
// las tarjetas de caracteristicas del sistema y un widget de estadisticas.
// Solo se renderiza en pantallas medianas y grandes (oculto en movil).
// No recibe props; es un componente puramente visual y estatico.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';

// ─── Datos de las tarjetas de caracteristicas ────────────────────────────────
// Separar los datos del JSX permite agregar o quitar caracteristicas facilmente
// sin modificar la estructura del componente.
const Lis_Caracteristicas = [
  { Ico_Clase: 'fas fa-calendar-alt', Tex_Nombre: 'Reserva anticipada'    },
  { Ico_Clase: 'fas fa-users',        Tex_Nombre: 'Control de asistencia' },
  { Ico_Clase: 'fas fa-utensils',     Tex_Nombre: 'Gestion de raciones'   },
  { Ico_Clase: 'fas fa-seedling',     Tex_Nombre: 'Sin desperdicios'      },
];

// ─── Componente principal del Hero ───────────────────────────────────────────
const LoginHero = () => (
  /*
   * Contenedor principal del Hero.
   * "hidden lg:flex" hace que el Hero sea invisible en moviles
   * y visible solo desde pantallas grandes (lg = 1024px en adelante).
   */
  <section className="hidden lg:flex flex-col justify-between h-full min-h-[600px] bg-[#f0f4ff] rounded-2xl p-10 overflow-hidden relative">

    {/* Circulo decorativo de fondo para dar profundidad visual */}
    <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-100 rounded-full opacity-50 pointer-events-none" />
    <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-green-100 rounded-full opacity-40 pointer-events-none" />

    {/* Bloque superior: titulo y descripcion */}
    <div className="relative z-10">
      <h1 className="text-[2.6rem] font-extrabold leading-tight mb-4">
        {/* Titulo bicolor: primera linea azul, segunda linea verde */}
        <span className="text-[#1861c1]">Foodsys nos </span>
        <br />
        <span className="text-[#42b72a]">Importas tu.</span>
      </h1>
      <p className="text-[#4a5568] text-[15px] leading-relaxed max-w-sm">
        Foodsys optimiza la alimentacion de los aprendices del Centro Agropecuario La
        Granja — reservas anticipadas, control de raciones y cero desperdicios.
      </p>
    </div>

    {/* Cuadricula 2x2 de tarjetas de caracteristicas */}
    <div className="grid grid-cols-2 gap-3 my-6 relative z-10">
      {Lis_Caracteristicas.map(({ Ico_Clase, Tex_Nombre }) => (
        <div
          key={Tex_Nombre}
          className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:-translate-y-1 transition-transform duration-200"
        >
          {/* Icono envuelto en circulo de color suave */}
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <i className={`${Ico_Clase} text-[#1861c1] text-base`}></i>
          </div>
          <span className="font-semibold text-[#1a1a2e] text-sm leading-tight">{Tex_Nombre}</span>
        </div>
      ))}
    </div>
  </section>
);

export default LoginHero;