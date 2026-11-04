// Paginas/Manuales/ManualesUsuario.jsx
// Manuales interactivos de usuario filtrados exclusivamente según el rol del usuario autenticado
import React, { useState, useMemo, useEffect } from "react";
import {
  BookOpen, Users, Utensils, QrCode, ShieldCheck,
  ClipboardList, HeartHandshake, Settings,
  HelpCircle, ExternalLink, Wheat, Info
} from "lucide-react";

const ROLES_MANUAL = [
  { id: "General", nombre: "Información General Foodsys", icono: Info, color: "text-sky-600 bg-sky-50 border-sky-200" },
  { id: "Aprendiz", nombre: "Aprendices / Visitantes / Voceros", icono: Users, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { id: "Pasante", nombre: "Pasantes", icono: ShieldCheck, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { id: "Cocina", nombre: "Cocina", icono: Utensils, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { id: "Monitor", nombre: "Monitor (Comedor)", icono: QrCode, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { id: "SenaEmpresa", nombre: "SENA Empresa / Instructor", icono: Wheat, color: "text-teal-600 bg-teal-50 border-teal-200" },
  { id: "SupervisorContrato", nombre: "Supervisor de Contrato", icono: ShieldCheck, color: "text-violet-600 bg-violet-50 border-violet-200" },
  { id: "Coordinador", nombre: "Coordinador", icono: ClipboardList, color: "text-purple-600 bg-purple-50 border-purple-200" },
  { id: "Bienestar", nombre: "Bienestar", icono: HeartHandshake, color: "text-rose-600 bg-rose-50 border-rose-200" },
  { id: "Administrador", nombre: "Administrador", icono: Settings, color: "text-slate-600 bg-slate-50 border-slate-200" },
];

const MAPA_ROL_A_MANUAL = {
  "Aprendiz Interno": "Aprendiz",
  "Aprendiz Externo": "Aprendiz",
  Visitante: "Aprendiz",
  Vocero: "Aprendiz",
  "Pasante Interno": "Pasante",
  "Pasante Externo": "Pasante",
  Cocina: "Cocina",
  Monitor: "Monitor",
  Supervisor: "Monitor",
  "SENA Empresa": "SenaEmpresa",
  Instructor: "SenaEmpresa",
  "Supervisor de Contrato": "SupervisorContrato",
  Coordinador: "Coordinador",
  Coordinacion: "Coordinador",
  Bienestar: "Bienestar",
  Administrador: "Administrador",
};

const CONTENIDO_MANUAL = {
  General: {
    titulo: "Información General del Ecosistema Foodsys",
    descripcion: "Horarios oficiales en zona horaria Colombia (America/Bogota - UTC-5), tickets de reserva y canales institucionales.",
    pasos: [
      {
        paso: 1,
        titulo: "Horarios Oficiales de Comedor",
        detalle: "Desayuno: 06:00 AM a 07:00 AM · Almuerzo: 11:30 AM a 01:30 PM · Cena: 06:00 PM a 07:00 PM. Pasada la hora de cierre de cada comida, las reservas no reclamadas pasan automáticamente a estado Vencida."
      },
      {
        paso: 2,
        titulo: "Ticket Digital y Código QR",
        detalle: "Al confirmar tu reserva puedes descargar tu Ticket de Reserva de alta resolución, que incluye el código QR ligero de lectura rápida (< 2.5s), plato elegido, bebida y acompañamiento."
      },
      {
        paso: 3,
        titulo: "Ceder Reserva a un Compañero",
        detalle: "Si no puedes asistir al servicio, puedes ceder tu reserva activa a otro compañero elegible indicando el motivo antes del cierre del turno."
      }
    ],
    faqs: [
      { p: "¿Cuál es la zona horaria oficial del sistema?", r: "Todo el sistema opera estrictamente bajo la hora oficial de Colombia (America/Bogota, UTC-5)." },
      { p: "¿Dónde gestiono los apoyos de BIENESOFT?", r: "Usa el acceso directo al Portal BIENESOFT disponible en la barra lateral y en la cabecera de esta página." }
    ]
  },
  Aprendiz: {
    titulo: "Guía para Aprendices, Voceros y Visitantes",
    descripcion: "Aprende cómo gestionar tus reservas alimentarias, horarios oficiales y código QR en el Centro Agropecuario La Granja.",
    pasos: [
      {
        paso: 1,
        titulo: "Crear tu Reserva",
        detalle: "Ingresa al módulo 'Reservar'. Los aprendices internos pueden elegir Desayuno, Almuerzo y Cena. Los externos y visitantes reservan únicamente Almuerzo."
      },
      {
        paso: 2,
        titulo: "Descargar Ticket o Ceder Reserva",
        detalle: "Desde tu historial puedes descargar el Ticket oficial con tu QR o ceder tu reserva a otro compañero si se te presenta un inconveniente."
      },
      {
        paso: 3,
        titulo: "Flujo Directo de Consumo",
        detalle: "Presenta tu código QR en el horario exacto del servicio (Desayuno 06:00-07:00, Almuerzo 11:30-13:30, Cena 18:00-19:00). En Cocina o con el Monitor tu reserva pasará a Consumido."
      },
      {
        paso: 4,
        titulo: "Estados y Sanciones",
        detalle: "Los usuarios en estado Aplazado, Cancelado o Condicionado tienen bloqueada la generación de reservas. Acumular 3 inasistencias en la semana activa sanción automática."
      }
    ],
    faqs: [
      { p: "¿Qué pasa si se me descarga el celular?", r: "El monitor o personal de cocina puede validar tu reserva activa ingresando tu número de documento." },
      { p: "¿Hasta qué hora un Vocero puede apartar almuerzo?", r: "El límite máximo para registrar Almuerzos Apartados SENA Empresa el mismo día es las 09:00 AM." }
    ]
  },
  Pasante: {
    titulo: "Guía para Pasantes (Internos y Externos)",
    descripcion: "Normativa, vigencia de pasantía y acceso al beneficio de alimentación.",
    pasos: [
      {
        paso: 1,
        titulo: "Vigencia de Pasantía (Fecha Inicio y Fin)",
        detalle: "Coordinación define tu fecha de inicio y finalización de pasantía. Al cumplirse la fecha fin, el sistema inactiva automáticamente el cupo de reservas."
      },
      {
        paso: 2,
        titulo: "Reserva de Comidas",
        detalle: "Mientras tu pasantía esté vigente, ingresa a 'Reservar' y selecciona tu plato y preferencia de bebida."
      },
      {
        paso: 3,
        titulo: "Validación con QR",
        detalle: "Presenta tu Ticket QR dentro de la franja horaria oficial de tu comida asignada."
      }
    ],
    faqs: [
      { p: "¿Puedo tener rol de Pasante y Aprendiz al mismo tiempo?", r: "No. Por regla institucional de control de accesos, el perfil de Pasante es excluyente del rol Aprendiz." }
    ]
  },
  Cocina: {
    titulo: "Guía para Personal de Cocina",
    descripcion: "Control de producción diaria, flujo directo de escaneo QR y ciclo de minuta de 28 días.",
    pasos: [
      {
        paso: 1,
        titulo: "Consultar el Plan del Día",
        detalle: "Revisa cuántas raciones de desayuno, almuerzo y cena fueron reservadas por opción de plato para alistar la producción."
      },
      {
        paso: 2,
        titulo: "Flujo Directo en Verificar QR",
        detalle: "Al escanear el QR de un usuario externo con reserva válida en el turno activo, el sistema pasa la reserva directamente de Generado a Consumido en una sola fila con alerta sonora."
      },
      {
        paso: 3,
        titulo: "Creación de Platos y Ciclo de 28 Días",
        detalle: "Puedes crear nuevos platos organizados en el ciclo de 28 días con variantes decimales (ej. 28.1, 28.2). La edición posterior es potestad de Coordinación y Supervisor de Contrato."
      }
    ],
    faqs: [
      { p: "¿Qué reportes puede consultar Cocina?", r: "Cocina tiene acceso de lectura y exportación a la Tabla 1 (Consumidos) con datos personales anonimizados." }
    ]
  },
  Monitor: {
    titulo: "Guía para Monitores de Comedor",
    descripcion: "Apertura de turno (10 min antes), concurrencia de monitores, escaneo rápido con sonido y exportación PDF.",
    pasos: [
      {
        paso: 1,
        titulo: "Ventana de Inicio de Turno (10 Minutos Antes)",
        detalle: "El botón 'Iniciar Turno' se habilita 10 minutos antes de cada servicio: Desayuno (05:50 - 07:00), Almuerzo (11:20 - 13:30) y Cena (17:50 - 19:00). Varios monitores pueden operar simultáneamente."
      },
      {
        paso: 2,
        titulo: "Escaneo en Vivo con Feedback Auditivo",
        detalle: "Escanea el QR del aprendiz (< 2.5s). Escucharás un tono agudo de éxito si es válido o una alarma grave con mensaje explícito si pertenece a otra fecha, otro horario o ya fue consumido."
      },
      {
        paso: 3,
        titulo: "Cierre de Turno y Exportación PDF",
        detalle: "Al finalizar el turno, descarga el acta de cierre en PDF o Excel con el detalle nominal de raciones entregadas."
      }
    ],
    faqs: [
      { p: "¿Pueden dos monitores escanear al mismo tiempo?", r: "Sí. El sistema permite concurrencia de múltiples monitores en el mismo turno para agilizar la fila." }
    ]
  },
  SenaEmpresa: {
    titulo: "Guía para SENA Empresa e Instructores",
    descripcion: "Gestión de Internado Temporal, Turno Rutinario Semanal y Almuerzos Apartados (límite 09:00 AM).",
    pasos: [
      {
        paso: 1,
        titulo: "Almuerzos Apartados SENA Empresa (Hasta las 09:00 AM)",
        detalle: "Consulta la ficha y selecciona los aprendices con reserva activa para apartar su almuerzo antes de las 09:00 AM del día del servicio."
      },
      {
        paso: 2,
        titulo: "Internado Temporal y Turno Rutinario Semanal",
        detalle: "Habilita temporalmente a aprendices de lunes a viernes o carga la plantilla Excel de gestores. Al buscar por documento verás la información completa del aprendiz."
      },
      {
        paso: 3,
        titulo: "Reportes de Apartados e Internado",
        detalle: "Consulta y exporta el resumen consolidado de Almuerzos Apartados e Internado Temporal."
      }
    ],
    faqs: [
      { p: "¿Qué ocurre cuando vence la fecha fin del internado temporal?", r: "El sistema revierte automáticamente al aprendiz a su estado original sin necesidad de intervención manual." }
    ]
  },
  SupervisorContrato: {
    titulo: "Guía para Supervisor de Contrato",
    descripcion: "Supervisión de minuta de 28 días, edición de platos, seguimiento SLA de PQRSF y reportes de facturación.",
    pasos: [
      {
        paso: 1,
        titulo: "Auditoría y Edición de Minuta (Ciclo 28 Días)",
        detalle: "Supervisa y edita los platos y menús programados dentro del ciclo contractual de 28 días (variantes decimales 1.1 a 28.2)."
      },
      {
        paso: 2,
        titulo: "Control de PQRSF e Interventoría",
        detalle: "Monitorea los radicados de calidad, gramaje e higiene y verifica el cumplimiento de los tiempos de respuesta (SLA)."
      },
      {
        paso: 3,
        titulo: "Reportes de Ejecución Contractual",
        detalle: "Exporta los reportes consolidados de raciones consumidas y no consumidas para soporte de actas de cobro."
      }
    ],
    faqs: [
      { p: "¿Quiénes tienen potestad para editar platos creados?", r: "Únicamente Coordinación, Administración y el Supervisor de Contrato." }
    ]
  },
  Coordinador: {
    titulo: "Guía para Coordinadores",
    descripcion: "Gestión de programas, fichas, pasantes con vigencia, instructores, novedades y asignación jerárquica de roles.",
    pasos: [
      {
        paso: 1,
        titulo: "Gestión de Pasantes e Instructores",
        detalle: "Administra el registro de pasantes definiendo su fecha de inicio y fin (inactivación automática al vencer) y gestiona el directorio de instructores."
      },
      {
        paso: 2,
        titulo: "Asignación de Roles Operativos",
        detalle: "Asigna perfiles exclusivamente para Casino/Cocina, Monitores, Bienestar y Aprendices respetando la incompatibilidad entre internos y externos."
      },
      {
        paso: 3,
        titulo: "Novedades, Sincronización y Reportes",
        detalle: "Registra novedades alimentarias, supervisa la sincronización offline y exporta las 4 tablas de reportes."
      }
    ],
    faqs: [
      { p: "¿Qué pasa cuando una Ficha supera su fecha fin lectiva o práctica?", r: "El sistema actualiza automáticamente a los aprendices a 'Etapa productiva' o 'Cancelado' según corresponda." }
    ]
  },
  Bienestar: {
    titulo: "Guía para Bienestar al Aprendiz",
    descripcion: "Seguimiento de inasistencias, gestión de sanciones, PQRSF y apoyo al aprendiz.",
    pasos: [
      {
        paso: 1,
        titulo: "Control de Aprendices y Sanciones",
        detalle: "Consulta el semáforo semanal de fallas (0/3 a 3/3). Al retirar una sanción a un aprendiz, su contador Fallas SEM se reinicia automáticamente a 0 de 3."
      },
      {
        paso: 2,
        titulo: "PQRSF Interventoría y Plan del Día",
        detalle: "Gestiona las solicitudes de PQRSF (sin eliminación física) y consulta en modo lectura el Plan del Día, Menús, Platos y Pasantes."
      }
    ],
    faqs: [
      { p: "¿Dónde consulto BIENESOFT?", r: "Accede directamente desde el botón BIENESOFT en la barra lateral o en la cabecera." }
    ]
  },
  Administrador: {
    titulo: "Guía para Administradores del Sistema",
    descripcion: "Administración global, control de raciones en barra superior, matriz de roles, sincronización Hetzner y reportes.",
    pasos: [
      {
        paso: 1,
        titulo: "Usuarios y Desanción Masiva",
        detalle: "Gestiona el catálogo oficial de 13 estados (sin eliminación física, mediante activación/inactivación lógica) y utiliza el botón 'Quitar todas las sanciones' cuando se requiera al inicio de periodo."
      },
      {
        paso: 2,
        titulo: "Menús y Reservas (Auditoría y Exportación)",
        detalle: "Consulta y exporta en PDF/Excel con filtros el histórico de Menús y Reservas en modo lectura."
      },
      {
        paso: 3,
        titulo: "Sincronización Offline Local ↔ Hetzner",
        detalle: "Supervisa la replicación por UUID y llaves naturales entre el servidor local del comedor y el VPS en Hetzner."
      }
    ],
    faqs: [
      { p: "¿Dónde ajusto el Control de Raciones y Horarios?", r: "Desde el botón desplegable 'Control de Raciones' ubicado en la barra de navegación superior." }
    ]
  }
};

export default function ManualesUsuario() {
  const rolActivo = (localStorage.getItem("rolActivo") || "").trim();
  const idManualRol = MAPA_ROL_A_MANUAL[rolActivo] || "Aprendiz";

  // Filtrar exclusivamente con la información del rol del usuario autenticado (+ Información General)
  const rolesPermitidos = useMemo(() => {
    if (!rolActivo) {
      return ROLES_MANUAL.filter((r) => r.id === "General" || r.id === "Aprendiz");
    }
    return ROLES_MANUAL.filter((r) => r.id === idManualRol || r.id === "General");
  }, [rolActivo, idManualRol]);

  const [rolSeleccionado, setRolSeleccionado] = useState(idManualRol);

  useEffect(() => {
    setRolSeleccionado(idManualRol);
  }, [idManualRol]);

  const contenido = CONTENIDO_MANUAL[rolSeleccionado] || CONTENIDO_MANUAL.General;

  return (
    <div className="w-full px-4 sm:px-6 py-8 max-w-7xl mx-auto space-y-8">
      {/* Encabezado */}
      <div className="rounded-3xl bg-gradient-to-r from-[#2E5792] to-[#1861c1] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold tracking-wider uppercase text-blue-100">
              <BookOpen className="w-4 h-4" /> Centro de Documentación
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">Manuales de Usuario Foodsys</h1>
            <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
              Consulta el paso a paso detallado, reglas de negocio y preguntas frecuentes adaptadas a cada rol operativo del Centro Agropecuario La Granja.
            </p>
          </div>
          <a
            href="https://bienesoftlagranja.com/user/login"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white text-[#2E5792] font-black text-xs uppercase tracking-wider shadow-lg hover:bg-blue-50 transition-all shrink-0 active:scale-95"
          >
            <img src="/LogoBienesoft.png" alt="BIENESOFT" className="w-5 h-5 object-contain" />
            Portal BIENESOFT <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Selector de Roles (filtrado exclusivamente con la información del rol autenticado + General) */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {rolesPermitidos.map((r) => {
          const Icono = r.icono;
          const activo = rolSeleccionado === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setRolSeleccionado(r.id)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-extrabold uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer ${
                activo
                  ? "bg-[#2E5792] text-white border-[#2E5792] shadow-md shadow-blue-900/20 scale-102"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <Icono className="w-4 h-4" />
              <span>{r.nombre}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pasos a seguir */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200">
            <h2 className="text-xl font-black text-slate-800 mb-2">{contenido.titulo}</h2>
            <p className="text-xs text-slate-500 mb-8">{contenido.descripcion}</p>

            <div className="space-y-6">
              {contenido.pasos.map((p) => (
                <div key={p.paso} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2E5792] text-white font-black text-sm shadow-md">
                    {p.paso}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-slate-800">{p.titulo}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{p.detalle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preguntas Frecuentes y Enlaces */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4 text-[#2E5792]">
              <HelpCircle className="w-5 h-5" />
              <h3 className="text-base font-extrabold text-slate-800">Preguntas Frecuentes</h3>
            </div>
            <div className="space-y-4">
              {contenido.faqs.map((faq, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <p className="text-xs font-black text-slate-800">{faq.p}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{faq.r}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-xl space-y-3">
            <h4 className="text-sm font-black text-white">¿Tienes dudas adicionales?</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Puedes enviar un mensaje directo al equipo de soporte desde el Centro de Contacto (PQRS).
            </p>
            <a
              href="/contacto"
              className="inline-block mt-2 px-4 py-2.5 rounded-xl bg-[#2E5792] hover:bg-[#234574] text-xs font-bold text-white transition-all shadow-md"
            >
              Contactar Soporte
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
