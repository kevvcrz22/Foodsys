// Paginas/Manuales/ManualesUsuario.jsx
// Manuales interactivos de usuario por rol para Foodsys
import React, { useState } from "react";
import {
  BookOpen, Users, Utensils, QrCode, ShieldCheck,
  ClipboardList, HeartHandshake, Settings, CheckCircle2,
  AlertTriangle, Clock, HelpCircle, ExternalLink
} from "lucide-react";

const ROLES_MANUAL = [
  { id: "Aprendiz", nombre: "Aprendices", icono: Users, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { id: "Pasante", nombre: "Pasantes", icono: ShieldCheck, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { id: "Cocina", nombre: "Cocina", icono: Utensils, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { id: "Supervisor", nombre: "Supervisor", icono: QrCode, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { id: "Coordinador", nombre: "Coordinador", icono: ClipboardList, color: "text-purple-600 bg-purple-50 border-purple-200" },
  { id: "Bienestar", nombre: "Bienestar", icono: HeartHandshake, color: "text-rose-600 bg-rose-50 border-rose-200" },
  { id: "Administrador", nombre: "Administrador", icono: Settings, color: "text-slate-600 bg-slate-50 border-slate-200" },
];

const CONTENIDO_MANUAL = {
  Aprendiz: {
    titulo: "Guía para Aprendices (Internos y Externos)",
    descripcion: "Aprende cómo gestionar tus reservas alimentarias, horarios y código QR en el Centro Agropecuario La Granja.",
    pasos: [
      {
        paso: 1,
        titulo: "Crear tu Reserva",
        detalle: "Ingresa al módulo 'Reservar'. Los aprendices internos pueden elegir Desayuno, Almuerzo y Cena. Los externos reservan Almuerzo. Las reservas se realizan el día anterior antes de los horarios límite."
      },
      {
        paso: 2,
        titulo: "Regla de Cancelación (9 Horas)",
        detalle: "Si no vas a consumir tu alimento, puedes cancelarlo desde tu historial con al menos 9 horas de anticipación al inicio del servicio. Así evitas sanciones automáticas."
      },
      {
        paso: 3,
        titulo: "Flujo de Consumo",
        detalle: "Los aprendices externos se presentan primero en Cocina para verificar su reserva. Luego, pasan al puesto del Supervisor para escanear su código QR y recibir la comida. Los internos pasan directo al supervisor."
      },
      {
        paso: 4,
        titulo: "Sanciones por Inasistencia",
        detalle: "Si generas una reserva y no asistes sin haber cancelado, el sistema registrará una inasistencia. Dos inasistencias pueden generar suspensión temporal del servicio."
      }
    ],
    faqs: [
      { p: "¿Qué pasa si se me descarga el celular?", r: "El supervisor puede registrar tu consumo de forma manual buscando tu número de documento en el sistema." },
      { p: "¿Cuánto tiempo dura mi sesión abierta?", r: "Por seguridad, tu sesión expira tras 5 minutos de inactividad, con una advertencia en pantalla a los 30 segundos restantes." }
    ]
  },
  Pasante: {
    titulo: "Guía para Pasantes (Internos y Externos)",
    descripcion: "Normativa y procedimientos de acceso al beneficio de alimentación para pasantes.",
    pasos: [
      {
        paso: 1,
        titulo: "Habilitación de Estado Especial",
        detalle: "Para poder reservar, tu coordinador debe asignarte el estado 'Especial' en el sistema, el cual tiene una vigencia estándar de 30 días renovables."
      },
      {
        paso: 2,
        titulo: "Reserva de Comidas",
        detalle: "Una vez habilitado, dirígete al módulo Reservar y escoge el plato disponible según el menú publicado."
      },
      {
        paso: 3,
        titulo: "Consumo Simplificado",
        detalle: "Con estado Especial activo, puedes acudir directamente al Supervisor sin necesidad de validación previa en cocina."
      }
    ],
    faqs: [
      { p: "¿Cómo sé si mi estado Especial sigue vigente?", r: "En la sección 'Mi Perfil' puedes consultar tu estado actual y la fecha de expiración." }
    ]
  },
  Cocina: {
    titulo: "Guía para Personal de Cocina",
    descripcion: "Control de producción diaria, verificación de presencia y planificación de raciones.",
    pasos: [
      {
        paso: 1,
        titulo: "Consultar el Plan del Día",
        detalle: "Revisa cuántas raciones de desayuno, almuerzo y cena fueron reservadas con 5 horas de antelación para calcular las cantidades exactas de ingredientes."
      },
      {
        paso: 2,
        titulo: "Verificar Código QR de Externos",
        detalle: "Cuando un aprendiz externo llegue, escanea su código QR en el módulo 'Verificar QR' para confirmar su asistencia física y habilitarlo para el comedor."
      },
      {
        paso: 3,
        titulo: "Gestión de Menús",
        detalle: "Programa los platos diarios con su nombre, descripción nutricional e imagen representativa."
      }
    ],
    faqs: [
      { p: "¿Por qué los internos no pasan por cocina?", r: "Los internos ya residen en la granja y su ración está garantizada contractualmente." }
    ]
  },
  Supervisor: {
    titulo: "Guía para Supervisores de Comedor",
    descripcion: "Apertura de turno, control de entrega de alimentos y cierre con reporte automático.",
    pasos: [
      {
        paso: 1,
        titulo: "Iniciar Turno",
        detalle: "Al llegar al comedor, haz clic en 'Iniciar Turno' en tu panel. Solo un supervisor puede estar en turno activo a la vez en la granja. El sistema notificará automáticamente por correo a la administración."
      },
      {
        paso: 2,
        titulo: "Registrar Consumos por QR",
        detalle: "Apunta la cámara al código QR del aprendiz. La pantalla mostrará en grande el nombre del aprendiz, su documento y el plato que le corresponde."
      },
      {
        paso: 3,
        titulo: "Registro Manual Alternativo",
        detalle: "Si el aprendiz no tiene el código QR disponible, ingresa su número de documento en la pestaña 'Manual' para validar y registrar su consumo."
      },
      {
        paso: 4,
        titulo: "Finalizar Turno",
        detalle: "Al terminar el servicio, presiona 'Finalizar Turno'. El sistema generará el consolidado de raciones entregadas y enviará el reporte por correo a fierrokkevin@gmail.com."
      }
    ],
    faqs: [
      { p: "¿Qué pasa si otro supervisor intenta abrir turno?", r: "El sistema le advertirá que ya existe un turno activo y le impedirá registrar hasta que tú finalices." }
    ]
  },
  Coordinador: {
    titulo: "Guía para Coordinadores",
    descripcion: "Gestión de novedades alimentarias, asignación de estado Especial y reportes.",
    pasos: [
      {
        paso: 1,
        titulo: "Registrar Novedades",
        detalle: "Si un aprendiz requiere alimentación de urgencia y no reservó el día anterior, crea una Novedad seleccionando el aprendiz, el tipo de comida y la justificación institucional."
      },
      {
        paso: 2,
        titulo: "Habilitar Estado Especial",
        detalle: "Otorga estado Especial a aprendices o pasantes que requieran facilidades temporales por prácticas o proyectos en la granja."
      },
      {
        paso: 3,
        titulo: "Consultar Reportes",
        detalle: "Exporta reportes en formato PDF y Excel con datos reales de consumo (filtrados exclusivamente por reservas consumidas)."
      }
    ],
    faqs: [
      { p: "¿Cuánto tiempo dura una novedad?", r: "La novedad aplica únicamente para el servicio de comida seleccionado en esa fecha específica." }
    ]
  },
  Bienestar: {
    titulo: "Guía para Bienestar al Aprendiz",
    descripcion: "Acompañamiento, monitoreo de inasistencias y equidad en el beneficio de alimentación.",
    pasos: [
      {
        paso: 1,
        titulo: "Monitoreo de Asistencia",
        detalle: "Revisa diariamente los aprendices que registraron reservas pero no consumieron su alimento para contactarlos y conocer las causas."
      },
      {
        paso: 2,
        titulo: "Gestión de Novedades Humanitarias",
        detalle: "Crea novedades alimentarias para aprendices en condiciones prioritarias o casos fortuitos de bienestar."
      }
    ],
    faqs: [
      { p: "¿Dónde consulto BIENESOFT?", r: "Puedes acceder a BIENESOFT directamente desde el botón en la barra lateral o footer para gestionar los apoyos de sostenimiento." }
    ]
  },
  Administrador: {
    titulo: "Guía para Administradores del Sistema",
    descripcion: "Mantenimiento integral, gestión de usuarios, roles, fichas y despliegue en Hetzner.",
    pasos: [
      {
        paso: 1,
        titulo: "Importación Masiva de Aprendices",
        detalle: "Descarga la plantilla de Excel oficial desde 'Importar Aprendices', diligencia los datos y cárgala con validación automática de documentos y fichas."
      },
      {
        paso: 2,
        titulo: "Asignación de Roles y Fichas",
        detalle: "Crea programas de formación, fichas asociadas y vincula a los aprendices y funcionarios con sus roles correspondientes."
      },
      {
        paso: 3,
        titulo: "Seguridad y Sesión Única",
        detalle: "El backend implementa tokenVersion para asegurar que cada usuario mantenga solo una sesión activa y protección contra asignación masiva."
      }
    ],
    faqs: [
      { p: "¿Cómo realizar el mantenimiento en el servidor Hetzner?", r: "Consulta la documentación técnica en el repositorio con comandos para PM2, MySQL, Nginx y renovación de certificados SSL." }
    ]
  }
};

export default function ManualesUsuario() {
  const [rolSeleccionado, setRolSeleccionado] = useState("Aprendiz");
  const contenido = CONTENIDO_MANUAL[rolSeleccionado];

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

      {/* Selector de Roles */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {ROLES_MANUAL.map((r) => {
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
