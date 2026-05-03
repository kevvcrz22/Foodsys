import { QrCode, BarChart3, Users, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function InicioSupervisor() {
  const navigate = useNavigate();

  const modulos = [
    {
      icon: <QrCode className="w-6 h-6 text-blue-600" />,
      bg: "bg-blue-100",
      title: "Registrador de Aprendices",
      desc: "Registra la asistencia de aprendices al comedor escaneando su código QR o ingresando su número de documento manualmente.",
      acciones: ["Escanear código QR del aprendiz", "Registro manual por número de documento", "Ver aprendices registrados hoy en tiempo real"],
      ruta: "/supervisor/Registrar",
      boton: "Ir al Registrador",
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-green-600" />,
      bg: "bg-green-100",
      title: "Reportes",
      desc: "Consulta los reportes de asistencia y estadísticas del servicio de alimentación.",
      acciones: ["Ver reportes de asistencia diaria", "Consultar histórico de registros", "Analizar estadísticas del comedor"],
      ruta: "/supervisor/Reportes",
      boton: "Ver Reportes",
    },
  ];

  const stats = [
    { label: "Módulos disponibles", value: "2", icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
    { label: "Tu rol", value: "Supervisor", icon: <Users className="w-5 h-5 text-blue-500" /> },
    { label: "Sistema", value: "Activo", icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
  ];

  return (
    <div className="w-full px-6 py-8 bg-gray-50 min-h-screen space-y-8">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-3xl p-8 text-white">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
  <QrCode className="w-8 h-8 text-white" />
</div>
          <div>
            <h1 className="text-2xl font-bold">Panel del Supervisor</h1>
            <p className="text-blue-200 text-sm">Centro Agropecuario La Granja — SENA Regional Tolima</p>
          </div>
        </div>
        <p className="text-blue-100 text-sm max-w-2xl">
          Bienvenido a Foodsys. Desde aquí puedes registrar la asistencia de aprendices al comedor usando el escáner QR o de forma manual, y consultar los reportes del servicio.
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
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:brightness-110 transition"
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
