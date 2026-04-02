import { Users, BarChart3, CalendarCheck, Shield, Database, UtensilsCrossed, CheckCircle, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function InicioAdministrador() {
  const navigate = useNavigate();

  const modulos = [
    {
      icon: <Users className="w-6 h-6 text-indigo-600" />,
      bg: "bg-indigo-100",
      title: "Gestión de Usuarios",
      desc: "Administra los usuarios del sistema, asigna roles y controla el acceso.",
      acciones: ["Registrar nuevos usuarios", "Asignar y modificar roles", "Gestionar fichas y programas"],
      ruta: "/usuarios",
      boton: "Ir a Usuarios",
    },
    {
      icon: <CalendarCheck className="w-6 h-6 text-green-600" />,
      bg: "bg-green-100",
      title: "Reservas",
      desc: "Consulta y administra todas las reservas del sistema de alimentación.",
      acciones: ["Ver todas las reservas", "Filtrar por fecha y estado", "Gestionar reservas activas"],
      ruta: "/Administrador/Reservas",
      boton: "Ver Reservas",
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-blue-600" />,
      bg: "bg-blue-100",
      title: "Reportes",
      desc: "Genera reportes detallados del servicio de alimentación y exporta datos.",
      acciones: ["Reportes diarios y mensuales", "Estadísticas de asistencia", "Exportar datos"],
      ruta: "/Administrador/Reportes",
      boton: "Ver Reportes",
    },
    {
      icon: <UtensilsCrossed className="w-6 h-6 text-orange-600" />,
      bg: "bg-orange-100",
      title: "Menús y Platos",
      desc: "Administra el menú del comedor, los platos disponibles y las reservas de menú.",
      acciones: ["Crear y editar platos", "Programar menús por fecha", "Gestionar reservas de menú"],
      ruta: "/platos",
      boton: "Gestionar Menús",
    },
  ];

  const stats = [
    { label: "Módulos disponibles", value: "8+", icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
    { label: "Tu rol", value: "Administrador", icon: <Shield className="w-5 h-5 text-indigo-500" /> },
    { label: "Acceso", value: "Total", icon: <Settings className="w-5 h-5 text-gray-500" /> },
  ];

  return (
    <div className="w-full px-6 py-8 bg-gray-50 min-h-screen space-y-8">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-3xl p-8 text-white">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Panel del Administrador</h1>
            <p className="text-indigo-200 text-sm">Centro Agropecuario La Granja — SENA Regional Tolima</p>
          </div>
        </div>
        <p className="text-indigo-100 text-sm max-w-2xl">
          Bienvenido a Foodsys. Tienes acceso total al sistema — gestiona usuarios, roles, reservas, menús y genera reportes del servicio de alimentación.
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
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Módulos del sistema</h2>
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
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                    {a}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate(m.ruta)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:brightness-110 transition"
              >
                {m.boton}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* BASE DE DATOS */}
      <div className="bg-gray-800 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-6 h-6 text-gray-400" />
          <h3 className="font-semibold">Acceso directo a Base de Datos</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Usuarios", ruta: "/usuarios" },
            { label: "Fichas", ruta: "/fichas" },
            { label: "Programas", ruta: "/programas" },
            { label: "Roles", ruta: "/roles" },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => navigate(item.ruta)}
              className="bg-gray-700 hover:bg-gray-600 rounded-xl py-2.5 text-sm font-medium transition"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}