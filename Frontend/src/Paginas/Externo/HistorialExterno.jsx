// Frontend/src/Paginas/Externo/HistorialExterno.jsx
import { useState, useEffect } from "react";
import logoFoodsys from "../../Components/Img/LogoFoodsys.png";

export default function InicioExterno() {
  const [screen, setScreen] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setScreen(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isDesktop = screen >= 1024;

  const cards = [
    {
      icon: "bi-people",
      title: "Gestión de Reservas",
      desc: "Administra fácilmente tus reservas y mantén el control de asistencia en tiempo real.",
    },
    {
      icon: "bi-shield-check",
      title: "Seguridad del Sistema",
      desc: "Accesos protegidos y controlados para garantizar la integridad de la información.",
    },
    {
      icon: "bi-clock-history",
      title: "Optimización del Tiempo",
      desc: "Reduce tiempos de espera y mejora la organización del servicio de alimentación.",
    },
  ];

  /* ══════════════════════════════
     RENDER
  ══════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* CONTENIDO */}
      <div className={`flex-1 w-full ${isDesktop ? "ml-30" : ""}`}>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

          {/* HEADER */}
          <div className="mb-10 sm:mb-12">
            <div className="flex flex-col items-center text-center">

              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 flex items-center justify-center mb-4 shadow-sm shrink-0">
                <img
                  src={logoFoodsys}
                  alt="FoodSys Logo"
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover"
                />
              </div>

              <h2 className="text-xl sm:text-2xl font-semibold text-blue-600 mb-2 leading-tight">
                Bienvenido a Foodsys
              </h2>

              <p className="text-gray-500 max-w-md sm:max-w-xl text-sm leading-relaxed break-words">
                Sistema integral de gestión de alimentación para centros de formación.
                Controla, registra y optimiza el servicio de alimentación de manera
                eficiente y moderna.
              </p>
            </div>
          </div>

          {/* SECCIÓN */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-6 sm:mb-8">
              ¿Qué puedes hacer aquí?
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {cards.map((card, i) => (
                <div
                  key={i}
                  className="
                  bg-white rounded-xl
                  border border-gray-100
                  p-4 sm:p-5
                  transition-all duration-300
                  hover:shadow-md hover:-translate-y-1
                  min-w-0
                  "
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-blue-50 flex items-center justify-center mb-3 sm:mb-4">
                    <i className={`bi ${card.icon} text-blue-600 text-base sm:text-lg`}></i>
                  </div>

                  <h3 className="font-medium text-gray-800 mb-1 text-sm sm:text-base">
                    {card.title}
                  </h3>

                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed break-words">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
