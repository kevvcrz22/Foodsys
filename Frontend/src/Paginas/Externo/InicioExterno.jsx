import { CalendarCheck, History, User, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function InicioExterno() {
  const navigate = useNavigate();

  const modulos = [
    {
      icon: <CalendarCheck className="w-6 h-6 text-emerald-600" />,
      bg: "bg-emerald-100",
      title: "Mis Reservas",
      desc: "Reserva tu almuerzo con anticipación. Recuerda que debes hacerlo antes de las 6:30 p.m. del día anterior.",
      acciones: [
        "Reservar tu almuerzo para el día siguiente",
        "Ver y cancelar reservas activas",
        "Obtener tu código QR para el comedor",
      ],
      ruta: "/Externo/Reservas",
      boton: "Ir a Reservas",
      color: "emerald"
    },
    {
      icon: <History className="w-6 h-6 text-blue-600" />,
      bg: "bg-blue-100",
      title: "Historial",
      desc: "Consulta el historial completo de tus reservas anteriores y su estado.",
      acciones: [
        "Ver todas tus reservas pasadas",
        "Consultar estado de cada reserva",
        "Revisar fechas y tipos de comida",
      ],
      ruta: "/Externo/Historial",
      boton: "Ver Historial",
      color: "blue"
    },
  ];

  const stats = [
    { label: "Módulos disponibles", value: "2", icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
    { label: "Tu rol", value: "Aprendiz Externo", icon: <User className="w-5 h-5 text-emerald-500" /> },
    { label: "Comida disponible", value: "Almuerzo", icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
  ];

  return (
    <div className="w-full px-6 py-8 bg-gray-50 min-h-screen space-y-8">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-3xl p-8 text-white">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <CalendarCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Panel del Aprendiz Externo</h1>
            <p className="text-emerald-200 text-sm">Centro Agropecuario La Granja — SENA Regional Tolima</p>
          </div>
        </div>
        <p className="text-emerald-100 text-sm max-w-2xl">
          Bienvenido a Foodsys. Como aprendiz externo puedes reservar tu almuerzo con anticipación y consultar tu historial de reservas. Recuerda reservar antes de las 6:30 p.m. del día anterior.
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
            {s.icon}
            <div>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="font-bold text-gray-700 text-sm">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* MÓDULOS */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Tus módulos disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modulos.map((m, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 ${m.bg} rounded-xl flex items-center justify-center`}>
                  {m.icon}
                </div>
                <h3 className="font-bold text-gray-800">{m.title}</h3>
              </div>
              <p className="text-gray-500 text-sm mb-4">{m.desc}</p>
              <ul className="space-y-2 mb-5">
                {m.acciones.map((a, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    {a}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate(m.ruta)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:brightness-110 transition"
              >
                {m.boton}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* AVISO IMPORTANTE */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
        <span className="text-2xl">⏰</span>
        <div>
          <p className="font-semibold text-amber-800 text-sm">Recuerda el horario de reservas</p>
          <p className="text-amber-700 text-sm mt-1">Las reservas deben realizarse <strong>antes de las 6:30 p.m. del día anterior</strong>. Si no alcanzaste a reservar, acércate al coordinador para registrar una novedad.</p>
        </div>
      </div>

    </div>
  );
}