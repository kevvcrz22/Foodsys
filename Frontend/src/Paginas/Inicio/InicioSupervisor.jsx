// Frontend/src/Paginas/Inicio/InicioSupervisor.jsx
//
// Panel de inicio para el rol Supervisor en Foodsys.
// Estilo suave, moderno y homogeneo alineado con los modulos de Reportes y Usuarios.
// Codigo sin tildes ni emojis para aprendices de ADSO.

import { QrCode, BarChart3, Users, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function InicioSupervisor() {
  const navigate = useNavigate();

  const modulos = [
    {
      icon: QrCode,
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      title: "Registro de Consumo (Taquilla Comedor)",
      desc: "Inicia el turno de comedor y escanea codigos QR o pistolas de codigo de barras USB con cedula para registrar comidas.",
      acciones: [
        "Apertura y cierre seguro de turno con balance",
        "Escaneo por camara web / movil y lector de barras por cedula",
        "Control automatico de doble consumo y estados de reserva"
      ],
      ruta: "/supervisor/Registrar",
      boton: "Abrir Taquilla de Registro",
      colorBtn: "bg-emerald-600 hover:bg-emerald-700"
    },
    {
      icon: BarChart3,
      bg: "bg-blue-50 text-blue-700 border-blue-200",
      title: "Reportes y Cierre de Turno",
      desc: "Revisa las raciones entregadas, inasistencias y genera el acta de cierre del servicio con estadisticas oficiales.",
      acciones: [
        "Estadisticas en tiempo real del turno actual",
        "Exportacion oficial en PDF y Excel con desglose por comida",
        "Historico de turnos y balances de entrega"
      ],
      ruta: "/supervisor/Reportes",
      boton: "Ver Reportes de Turno",
      colorBtn: "bg-blue-600 hover:bg-blue-700"
    }
  ];

  return (
    <div className="w-full space-y-6">
      {/* Encabezado Superior Suave - Estilo Reportes y Usuarios */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span className="text-xs uppercase font-semibold tracking-wider text-emerald-700">
                Operacion de Casino y Comedor
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 m-0">
              Panel del Supervisor
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 m-0">
              Centro Agropecuario "La Granja" - SENA Regional Tolima
            </p>
          </div>
        </div>

        <div className="self-start sm:self-auto bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
            Supervisor
          </span>
        </div>
      </div>

      {/* Grid de Modulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modulos.map((m, i) => {
          const Icono = m.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${m.bg}`}>
                    <Icono className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base m-0">{m.title}</h3>
                </div>

                <p className="text-xs sm:text-sm text-slate-500 mb-3 leading-relaxed m-0">{m.desc}</p>

                <ul className="space-y-1.5 mb-5 border-t border-slate-100 pt-3">
                  {m.acciones.map((a, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => navigate(m.ruta)}
                className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${m.colorBtn}`}
              >
                <span>{m.boton}</span>
                <ChevronRight size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}