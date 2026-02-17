import { User } from "lucide-react";


export default function Inicio() {
  const cardsSuperiores = [
    {
      icon: "bi-people",
      title: "Gestión de Aprendices",
      desc: "Control total de asistencia al servicio de alimentación.",
    },
    {
      icon: "bi-graph-up-arrow",
      title: "Reportes Inteligentes",
      desc: "Visualiza métricas y patrones en tiempo real.",
    },
    {
      icon: "bi-shield-check",
      title: "Seguridad Avanzada",
      desc: "Control de accesos y protección de información.",
    },
  ];

  const funcionalidades = [
    {
      title: "Registro con QR",
      desc: "Escaneo rápido y sin fricción para registrar asistencia.",
    },
    {
      title: "Control de Turnos",
      desc: "Gestión automatizada de horarios de alimentación.",
    },
    {
      title: "Análisis de Datos",
      desc: "Insights estratégicos para toma de decisiones.",
    },
    {
      title: "Gestión de Usuarios",
      desc: "Administración segura y organizada de perfiles.",
    },
  ];

  return (
    <div className="w-full h-full px-8 py-8 space-y-12 bg-gray-50">

      {/* HERO SECTION */}
      <div className="grid md:grid-cols-2 gap-15 items-center bg-white p-8 rounded-3xl shadow-sm">
        
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Plataforma Integral de Gestión Alimentaria
          </h1>

          <p className="text-gray-500 leading-relaxed mb-6">
            Foodsys optimiza el control del servicio de alimentación en centros 
            de formación, integrando registro, monitoreo y análisis en una sola solución.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="w-40 h-40 rounded-full bg-green-100 flex items-center justify-center shadow-lg border-2 border-green-200">
            <User className="w-20 h-20 text-green-600" />
          </div>
        </div>
</div>
      {/* BENEFICIOS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cardsSuperiores.map((card, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition duration-300 hover:-translate-y-1"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <i className={`bi ${card.icon} text-blue-600 text-xl`}></i>
            </div>

            <h3 className="font-semibold text-gray-800 mb-2">
              {card.title}
            </h3>

            <p className="text-gray-500 text-sm leading-relaxed">
              {card.desc}
            </p>
          </div>
        ))}
      </div>

      {/* FUNCIONALIDADES DETALLADAS */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-3xl shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Funcionalidades Clave
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {funcionalidades.map((item, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-green-300 transition"
            >
              <h4 className="text-green-600 font-semibold mb-2">
                {item.title}
              </h4>

              <p className="text-gray-500 text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
