// Frontend/src/Paginas/Inicio/InicioExterno.jsx
//
// Panel de inicio para Aprendices Externos del Centro Agropecuario "La Granja".
// Estilo suave, moderno y homogeneo alineado con los modulos de Reportes y Usuarios.
// Codigo sin tildes ni emojis para aprendices de ADSO.

import { CalendarCheck, History, CheckCircle2, Clock, ChevronRight, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SemaforoAforoCard from "../../Components/SemaforoAforoCard.jsx";
import BolsaSolidariaCard from "../../Components/BolsaSolidariaCard.jsx";

export default function InicioExterno() {
  const navigate = useNavigate();

  const modulos = [
    {
      icon: CalendarCheck,
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      title: "Reserva de Almuerzo",
      desc: "Agenda tu almuerzo diario antes de las 10:30 PM del dia anterior seleccionando tu plato fuerte y bebida fria o caliente.",
      acciones: [
        "Reserva para manana (hasta las 10:30 PM) o pasado manana",
        "Seleccion de plato fuerte del dia y bebida preferida",
        "Generacion de codigo QR seguro para el comedor"
      ],
      ruta: "/Externo/Reservar",
      boton: "Reservar Almuerzo",
      colorBtn: "bg-emerald-600 hover:bg-emerald-700"
    },
    {
      icon: History,
      bg: "bg-blue-50 text-blue-700 border-blue-200",
      title: "Historial de Reservas y Cesion",
      desc: "Revisa tus almuerzos anteriores, cancela a tiempo si no vas a asistir o cede tu reserva a otro companero de formacion.",
      acciones: [
        "Ver estado de asistencia y reservas confirmadas",
        "Ceder almuerzo a cualquier companero interno o externo",
        "Novedades excepcionales disponibles hasta las 9:00 AM"
      ],
      ruta: "/Externo/Reservar",
      boton: "Ver Historial",
      colorBtn: "bg-blue-600 hover:bg-blue-700"
    }
  ];

  return (
    <div className="w-full space-y-6">
      {/* Encabezado Superior Suave - Estilo Reportes y Usuarios */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
              <span className="text-[11px] uppercase font-bold tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Formacion Titulada Presencial
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight m-0">
              Panel del Aprendiz Externo
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 m-0">
              Centro Agropecuario "La Granja" · SENA Regional Tolima
            </p>
          </div>
        </div>

        <div className="self-start sm:self-auto bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Aprendiz Externo
          </span>
        </div>
      </div>

      {/* Semaforo de Aforo del Comedor */}
      <SemaforoAforoCard />

      {/* Bolsa Solidaria Bienestar */}
      <BolsaSolidariaCard onCupoReclamado={() => navigate('/Externo/Reservar')} />

      {/* Tarjeta Informativa de Horarios y Procedimiento */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 m-0">
              Horario del Servicio de Almuerzo
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">Corte diario: 10:30 PM</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-1">
            <span className="font-bold text-slate-800">Servicio de Almuerzo</span>
            <p className="text-slate-600 m-0">11:30 AM a 01:30 PM</p>
          </div>
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-1">
            <span className="font-bold text-slate-800">Paso 1: Cocina</span>
            <p className="text-slate-600 m-0">Verificacion QR previa</p>
          </div>
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-1">
            <span className="font-bold text-slate-800">Paso 2: Supervisor</span>
            <p className="text-slate-600 m-0">Entrega de la racion</p>
          </div>
        </div>
      </div>

      {/* Modulos Principales */}
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