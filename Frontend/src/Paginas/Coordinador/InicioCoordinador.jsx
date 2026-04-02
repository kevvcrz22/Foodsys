import { ClipboardList, Users, AlertCircle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function InicioCoordinador() {
  const navigate = useNavigate();

  const modulos = [
    {
      icon: <AlertCircle className="w-6 h-6 text-violet-600" />,
      bg: "bg-violet-100",
      title: "Módulo de Novedades",
      desc: "Registra reservas excepcionales para aprendices que no alcanzaron a reservar antes de las 6:00 p.m. del día anterior.",
      acciones: ["Buscar aprendiz por nombre o documento", "Registrar reserva excepcional", "Ver novedades del día en tiempo real"],
      ruta: "/coordinador/Novedades",
      boton: "Ir a Novedades",
      color: "violet"
    },
    {
      icon: <ClipboardList className="w-6 h-6 text-blue-600" />,
      bg: "bg-blue-100",
      title: "Reportes",
      desc: "Consulta estadísticas e informes del servicio de alimentación del centro de formación.",
      acciones: ["Ver reportes de asistencia", "Consultar estadísticas por fecha", "Analizar patrones de consumo"],
      ruta: "/coordinador/Reportes",
      boton: "Ver Reportes",
      color: "blue"
    },
  ];

  const stats = [
    { label: "Módulos disponibles", value: "2", icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
    { label: "Tu rol", value: "Coordinador", icon: <Users className="w-5 h-5 text-violet-500" /> },
    { label: "Sistema", value: "Activo", icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
  ];

  return (
    <div className="w-full px-6 py-8 bg-gray-50 min-h-screen space-y-8">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-violet-600 to-violet-400 rounded-3xl p-8 text-white">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Panel del Coordinador</h1>
            <p className="text-violet-200 text-sm">Centro Agropecuario La Granja — SENA Regional Tolima</p>
          </div>
        </div>
        <p className="text-violet-100 text-sm max-w-2xl">
          Bienvenido al módulo de coordinación de bienestar de Foodsys. Desde aquí puedes gestionar las novedades del día y consultar reportes del servicio de alimentación.
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
            {s.icon}
            <div>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="font-bold text-gray-700">{s.value}</p>
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
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:brightness-110 transition"
              >
                {m.boton}
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}