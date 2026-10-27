// Frontend/src/Paginas/Inicio/InicioInterno.jsx
//
// Panel de inicio para Aprendices Internos del Centro de Convivencia.
// Estilo suave, moderno y homogeneo alineado con los modulos de Reportes y Usuarios.
// Codigo sin tildes ni emojis para aprendices de ADSO.

import { CalendarCheck, History, User, CheckCircle2, Utensils, Clock, ChevronRight, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SemaforoAforoCard from "../../Components/SemaforoAforoCard.jsx";
import BolsaSolidariaCard from "../../Components/BolsaSolidariaCard.jsx";

export default function InicioInterno() {
  const navigate = useNavigate();

  const modulos = [
    {
      icon: CalendarCheck,
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      title: "Realizar o Modificar Reservas",
      desc: "Reserva Desayuno, Almuerzo y Cena seleccionando plato y bebida. Puedes reservar hasta las 10:30 PM del dia anterior.",
      acciones: [
        "Reserva para manana (hasta las 10:30 PM) o pasado manana",
        "Seleccion de plato fuerte y bebida (fria o caliente)",
        "Generacion instantanea de codigo QR digital"
      ],
      ruta: "/Interno/Reservar",
      boton: "Ir a Reservar",
      colorBtn: "bg-emerald-600 hover:bg-emerald-700"
    },
    {
      icon: History,
      bg: "bg-blue-50 text-blue-700 border-blue-200",
      title: "Historial de Reservas y Cesion",
      desc: "Revisa tus reservas pasadas, cancela a tiempo si no vas a asistir o cede tu comida a otro aprendiz interno.",
      acciones: [
        "Historial detallado con estados (Consumido, Generado)",
        "Ceder reserva a un companero interno con aceptacion",
        "Cancelacion permitida antes del cierre de cocina"
      ],
      ruta: "/Interno/Reservar",
      boton: "Consultar Historial",
      colorBtn: "bg-blue-600 hover:bg-blue-700"
    }
  ];

  const horarios = [
    { comida: "Desayuno", servicio: "06:00 - 07:00 AM", limite: "10:30 PM anterior" },
    { comida: "Almuerzo", servicio: "11:30 AM - 01:30 PM", limite: "10:30 PM anterior" },
    { comida: "Cena", servicio: "06:00 - 07:30 PM", limite: "10:30 PM anterior" }
  ];

  return (
    <div className="w-full space-y-6">
      {/* Encabezado Superior Suave - Estilo Reportes y Usuarios */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Centro de Convivencia · Residente
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight m-0">
              Panel del Aprendiz Interno
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 m-0">
              Centro Agropecuario "La Granja" · SENA Regional Tolima
            </p>
          </div>
        </div>

        <div className="self-start sm:self-auto bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Interno Titulado
          </span>
        </div>
      </div>

      {/* Semaforo de Aforo del Comedor */}
      <SemaforoAforoCard />

      {/* Bolsa Solidaria Bienestar */}
      <BolsaSolidariaCard onCupoReclamado={() => navigate('/Interno/Reservar')} />

      {/* Tarjeta de Horarios Oficiales del Comedor */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 m-0">
              Horarios Oficiales del Casino de Alimentacion
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">Corte diario: 10:30 PM</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {horarios.map((h, i) => (
            <div key={i} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-1">
              <span className="text-xs font-bold text-slate-800">{h.comida}</span>
              <p className="text-[11px] text-slate-600 m-0">Servicio: <b>{h.servicio}</b></p>
              <p className="text-[10px] text-slate-400 m-0">Limite reserva: {h.limite}</p>
            </div>
          ))}
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