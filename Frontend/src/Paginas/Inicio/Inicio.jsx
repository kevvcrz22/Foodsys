// Frontend/src/Paginas/Inicio/Inicio.jsx
//
// Dashboard principal de inicio segun el rol activo en Foodsys.
// Estilo suave, moderno y homogeneo alineado con los modulos de Reportes y Usuarios.
// Incluye el Control Rapido de Raciones para Administradores y guias interactivas por rol.
// Codigo sin tildes ni emojis para aprendices de ADSO.

import { useState, useEffect } from "react";
import {
  Users, CalendarCheck, BarChart3, ClipboardList,
  QrCode, Edit, Utensils, BookOpen, ShieldCheck,
  ArrowRight, Wheat, ChefHat, Sparkles, MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";
import SemaforoAforoCard from "../../Components/SemaforoAforoCard.jsx";
import BolsaSolidariaCard from "../../Components/BolsaSolidariaCard.jsx";

const MANUAL_POR_ROL = {
  Administrador: {
    Bienvenida: "Gestión integral, auditoría y parametrización del sistema Foodsys.",
    Pasos: [
      {
        Icono: Users,
        Titulo: "Gestión de Usuarios",
        Descripcion: "Crea, edita y administra los usuarios del sistema con activación/inactivación lógica.",
        Link: "/usuarios",
      },
      {
        Icono: ShieldCheck,
        Titulo: "Asignar Roles",
        Descripcion: "Asigna roles respetando la jerarquía estricta del sistema sin duplicidades.",
        Link: "/UsuariosRoles",
      },
      {
        Icono: ClipboardList,
        Titulo: "Consultar Menús",
        Descripcion: "Modo solo lectura de minutas oficiales y exportación en PDF y Excel con filtros.",
        Link: "/menus",
      },
      {
        Icono: CalendarCheck,
        Titulo: "Consultar Reservas",
        Descripcion: "Visualiza reservas generales y descarga reportes oficiales en PDF y Excel.",
        Link: "/reservas",
      },
      {
        Icono: MessageSquare,
        Titulo: "PQRSF Interventoría",
        Descripcion: "Gestiona peticiones, quejas, reclamos y sugerencias de los usuarios del comedor.",
        Link: "/pqrsf-admin",
      },
      {
        Icono: BarChart3,
        Titulo: "Módulo de Reportes",
        Descripcion: "Acceso total a las métricas de consumo, inasistencias y auditoría nutricional.",
        Link: "/Administrador/Reportes",
      },
    ],
  },
  Instructor: {
    Bienvenida: "Solicitud y seguimiento de Almuerzos Apartados SENA Empresa.",
    Pasos: [
      {
        Icono: Wheat,
        Titulo: "Almuerzos Apartados SENA Empresa",
        Descripcion: "Selecciona tu ficha y aparta almuerzos para aprendices en práctica hasta las 09:00 AM.",
        Link: "/guardar-almuerzo-campo",
      },
    ],
  },
  Vocero: {
    Bienvenida: "Gestión de reservas y solicitudes de Almuerzos Apartados SENA Empresa.",
    Pasos: [
      {
        Icono: CalendarCheck,
        Titulo: "Reservar Almuerzo",
        Descripcion: "Agenda tu almuerzo diario antes de las 10:30 PM del día anterior.",
        Link: "/Vocero/Reservar",
      },
      {
        Icono: Wheat,
        Titulo: "Almuerzos Apartados SENA Empresa",
        Descripcion: "Solicita el apartado grupal de almuerzos cuando tu ficha tenga práctica hasta las 09:00 AM.",
        Link: "/guardar-almuerzo-campo",
      },
    ],
  },
  "SENA Empresa": {
    Bienvenida: "Coordinación de raciones, internado temporal y alimentación en unidades productivas.",
    Pasos: [
      {
        Icono: Users,
        Titulo: "Internado Temporal y Turno Rutinario",
        Descripcion: "Asigna turnos temporales o rutinarios (Lunes a Viernes) sin eliminar registros históricos.",
        Link: "/internado-temporal",
      },
      {
        Icono: Wheat,
        Titulo: "Almuerzos Apartados SENA Empresa",
        Descripcion: "Gestiona y valida los vales de almuerzos apartados SENA Empresa asignados a unidades productivas.",
        Link: "/guardar-almuerzo-campo",
      },
      {
        Icono: BarChart3,
        Titulo: "Reportes de SENA Empresa",
        Descripcion: "Monitorea el resumen exclusivo de Alimentos Apartados e Internado Temporal.",
        Link: "/sena-empresa/Reportes",
      },
    ],
  },
  Monitor: {
    Bienvenida: "Control de turnos concurrentes y registro de consumo en comedor.",
    Pasos: [
      {
        Icono: Edit,
        Titulo: "Iniciar Turno de Comedor",
        Descripcion: "Abre el turno desde 10 minutos antes del servicio con soporte multi-monitor.",
        Link: "/supervisor/Registrar",
      },
      {
        Icono: QrCode,
        Titulo: "Verificar QR y Registrar",
        Descripcion: "Registra consumos mediante cámara de lectura rápida (<2.5s) o lector USB con feedback sonoro.",
        Link: "/Cocina/Verificar",
      },
    ],
  },
  Supervisor: {
    Bienvenida: "Control de turnos concurrentes y registro de consumo en comedor.",
    Pasos: [
      {
        Icono: Edit,
        Titulo: "Iniciar Turno de Comedor",
        Descripcion: "Abre el turno desde 10 minutos antes del servicio con soporte multi-monitor.",
        Link: "/supervisor/Registrar",
      },
      {
        Icono: QrCode,
        Titulo: "Verificar QR y Registrar",
        Descripcion: "Registra consumos mediante cámara de lectura rápida (<2.5s) o lector USB con feedback sonoro.",
        Link: "/Cocina/Verificar",
      },
    ],
  },
  "Supervisor de Contrato": {
    Bienvenida: "Supervisión contractual, interventoría de minuta de 28 días, PQRSF y auditoría.",
    Pasos: [
      {
        Icono: ShieldCheck,
        Titulo: "Panel de Supervisor de Contrato",
        Descripcion: "Audita raciones servidas, cumplimiento de minuta, alertas de PQRSF y métricas de contrato.",
        Link: "/supervisor-contrato",
      },
      {
        Icono: Utensils,
        Titulo: "Edicion de Platos y Minuta (Ciclo 28 dias)",
        Descripcion: "Autoriza y edita platos dentro de la minuta oficial de 28 dias con variantes decimales.",
        Link: "/platos",
      },
      {
        Icono: BarChart3,
        Titulo: "Reportes de Interventoria",
        Descripcion: "Exporta reportes oficiales de consumo nominal, no consumidos y seguimiento.",
        Link: "/Administrador/Reportes",
      },
    ],
  },
  Visitante: {
    Bienvenida: "Acceso de reserva de almuerzo para visitantes autorizados del centro.",
    Pasos: [
      {
        Icono: CalendarCheck,
        Titulo: "Reservar Almuerzo",
        Descripcion: "Agenda tu almuerzo seleccionando plato y bebida dentro del horario habilitado.",
        Link: "/Visitante/Reservar",
      },
      {
        Icono: QrCode,
        Titulo: "Presentar Ticket QR",
        Descripcion: "Descarga tu comprobante de reserva con codigo QR ligero para ingreso al comedor.",
        Link: "/Visitante/Reservar",
      },
    ],
  },
  Coordinador: {
    Bienvenida: "Gestion formativa, novedades y seguimiento de aprendices.",
    Pasos: [
      {
        Icono: ClipboardList,
        Titulo: "Registrar Novedad",
        Descripcion: "Autoriza reservas excepcionales hasta las 9:00 AM para aprendices que requieran comida.",
        Link: "/coordinador/Novedades",
      },
      {
        Icono: Users,
        Titulo: "Seguimiento de Aprendices",
        Descripcion: "Consulta estados de matricula, semaforo semanal de fallas y registro de sanciones.",
        Link: "/aprendices",
      },
      {
        Icono: BarChart3,
        Titulo: "Reportes Estadisticos",
        Descripcion: "Analiza el comportamiento nutricional y asistencia de las distintas fichas del centro.",
        Link: "/coordinador/Reportes",
      },
    ],
  },
  "Aprendiz Interno": {
    Bienvenida: "Reserva de alimentacion para residentes del Centro de Convivencia.",
    Pasos: [
      {
        Icono: CalendarCheck,
        Titulo: "Hacer una Reserva",
        Descripcion: "Reserva Desayuno, Almuerzo y Cena seleccionando tu plato y bebida antes de las 10:30 PM.",
        Link: "/Interno/Reservar",
      },
      {
        Icono: QrCode,
        Titulo: "Codigo QR y Turnos",
        Descripcion: "Presenta tu codigo QR digital en el comedor en los horarios oficiales de cada servicio.",
        Link: "/Interno/Reservar",
      },
      {
        Icono: ClipboardList,
        Titulo: "Ceder o Cancelar",
        Descripcion: "Si no vas a consumir, cancela a tiempo o cede tu comida a otro companero interno.",
        Link: "/Interno/Reservar",
      },
    ],
  },
  "Aprendiz Externo": {
    Bienvenida: "Reserva diaria de almuerzo para aprendices externos.",
    Pasos: [
      {
        Icono: CalendarCheck,
        Titulo: "Reservar Almuerzo",
        Descripcion: "Agenda tu almuerzo antes de las 10:30 PM del dia anterior eligiendo tu plato y bebida.",
        Link: "/Externo/Reservar",
      },
      {
        Icono: QrCode,
        Titulo: "Verificacion y Consumo",
        Descripcion: "Valida primero en Cocina y luego reclama tu plato escaneando tu QR con el Supervisor.",
        Link: "/Externo/Reservar",
      },
    ],
  },
  "Pasante Interno": {
    Bienvenida: "Acceso al comedor para pasantes en convenio interno.",
    Pasos: [
      {
        Icono: CalendarCheck,
        Titulo: "Reservar Comidas",
        Descripcion: "Accede a Desayuno, Almuerzo y Cena segun tu autorizacion de pasantia aprobada.",
        Link: "/PasanteInterno/Reservar",
      },
      {
        Icono: QrCode,
        Titulo: "Codigo QR de Consumo",
        Descripcion: "Presenta tu comprobante digital en cada comida dentro de la ventana de servicio.",
        Link: "/PasanteInterno/Reservar",
      },
    ],
  },
  "Pasante Externo": {
    Bienvenida: "Acceso al almuerzo para pasantes externos.",
    Pasos: [
      {
        Icono: CalendarCheck,
        Titulo: "Reservar Almuerzo",
        Descripcion: "Agenda tu almuerzo antes de las 10:30 PM del dia anterior para asegurar tu racion.",
        Link: "/PasanteExterno/Reservar",
      },
    ],
  },
  Cocina: {
    Bienvenida: "Verificacion de reservas y plan de preparacion culinaria.",
    Pasos: [
      {
        Icono: QrCode,
        Titulo: "Verificar en Cocina",
        Descripcion: "Escanea el QR o busca por cedula al aprendiz externo antes de servir su racion.",
        Link: "/Cocina/Verificar",
      },
      {
        Icono: ChefHat,
        Titulo: "Plan Diario de Cocina",
        Descripcion: "Revisa con 5 horas de antelacion las cantidades exactas a cocinar de platos y bebidas.",
        Link: "/Cocina/Plan",
      },
      {
        Icono: Utensils,
        Titulo: "Gestionar Platos y Bebidas",
        Descripcion: "Actualiza el catalogo de preparaciones de la minuta diaria para cada turno.",
        Link: "/platos",
      },
    ],
  },
  Bienestar: {
    Bienvenida: "Monitoreo psicosocial, seguimiento de asistencias y novedades.",
    Pasos: [
      {
        Icono: BarChart3,
        Titulo: "Alerta y Seguimiento",
        Descripcion: "Identifica a aprendices internos con cero consumos para prevencion y acompanamiento.",
        Link: "/Bienestar/Reportes",
      },
      {
        Icono: Users,
        Titulo: "Gestion de Aprendices",
        Descripcion: "Revisa fallas acumuladas y administra habilitaciones especiales en el casino.",
        Link: "/aprendices",
      },
    ],
  },
};

const Tarjeta_Paso = ({ Paso, Indice }) => {
  const Icono_Comp = Paso.Icono;
  return (
    <Link
      to={Paso.Link}
      className="group bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5
                 hover:border-emerald-300 hover:shadow-sm transition-all duration-200
                 flex items-start gap-3.5"
    >
      <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-emerald-50 text-slate-600 group-hover:text-emerald-700 flex items-center justify-center shrink-0 transition-colors">
        <Icono_Comp className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs sm:text-sm font-bold text-slate-800 m-0">
            <span className="text-emerald-600 font-bold mr-1.5">{Indice + 1}.</span>
            {Paso.Titulo}
          </p>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors shrink-0" />
        </div>
        <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed m-0">
          {Paso.Descripcion}
        </p>
      </div>
    </Link>
  );
};

const Inicio = () => {
  const [Usuario, Set_Usuario] = useState(null);
  const [Rol_Activo, Set_RolActivo] = useState("");

  useEffect(() => {
    const Usr = JSON.parse(localStorage.getItem("usuario") || "null");
    const Rol = localStorage.getItem("rolActivo") || "";
    Set_Usuario(Usr);
    Set_RolActivo(Rol);
  }, []);

  const Manual = MANUAL_POR_ROL[Rol_Activo];
  const Nombre = Usuario
    ? `${Usuario.Nom_Usuario ?? ""} ${Usuario.Ape_Usuario ?? ""}`.trim()
    : "Usuario";

  const rolNormalizado = (Rol_Activo || "").toLowerCase();
  const puedeVerSemaforo = [
    "aprendiz",
    "pasante",
    "bienestar",
    "admin",
    "administrador",
    "coordinador",
    "monitor",
    "supervisor",
    "visitante"
  ].some((r) => rolNormalizado.includes(r));

  return (
    <div className="w-full space-y-6">
      {/* Grilla de 2 Columnas (50% / 50% en escritorio, apilados en movil): Banner de Bienvenida + Aforo del Comedor */}
      <div className={puedeVerSemaforo ? "grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch" : "w-full"}>
        {/* Encabezado Superior Suave - Estilo Reportes y Usuarios */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 h-full">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span className="text-xs uppercase font-semibold tracking-wider text-emerald-700">
                  Sistema de Gestion Nutricional
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 m-0">
                Bienvenido, {Nombre}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 m-0">
                Centro Agropecuario "La Granja" - SENA Regional Tolima
              </p>
            </div>
          </div>

          {Rol_Activo && (
            <div className="self-start sm:self-auto bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full flex items-center gap-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                {Rol_Activo}
              </span>
            </div>
          )}
        </div>

        {/* Semaforo de Aforo del Comedor (50% derecha en escritorio) */}
        {puedeVerSemaforo && <SemaforoAforoCard />}
      </div>

      {/* Bolsa Solidaria Bienestar (Aprendices y Pasantes) */}
      {(rolNormalizado.includes("aprendiz") || rolNormalizado.includes("pasante")) && (
        <BolsaSolidariaCard />
      )}

      {/* Manual Interactivo de Uso por Rol */}
      {Manual ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider m-0">
                Modulo de Operacion
              </p>
              <h2 className="text-sm sm:text-base font-bold text-slate-800 m-0 mt-0.5">
                {Manual.Bienvenida}
              </h2>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/80">
              {Manual.Pasos.length} accesos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {Manual.Pasos.map((Paso, Idx) => (
              <Tarjeta_Paso key={Paso.Titulo} Paso={Paso} Indice={Idx} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
          <p className="text-sm font-medium">Instrucciones disponibles en el menu de navegacion lateral.</p>
        </div>
      )}
    </div>
  );
};

export default Inicio;