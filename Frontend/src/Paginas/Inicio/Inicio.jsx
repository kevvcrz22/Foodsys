// Paginas/Inicio/Inicio.jsx
// Dashboard principal del sistema FoodSys.
// Muestra un manual de instrucciones especifico segun el rol activo del usuario.
// El layout es completamente responsive y no tiene centrado excesivo.

import { useState, useEffect } from "react";
import {
  Users, CalendarCheck, BarChart3, ClipboardList,
  QrCode, Edit, Utensils, BookOpen, ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

// Prefijo de ruta segun el rol activo
const PREFIJO_POR_ROL = {
  Administrador: "/Administrador",
  Supervisor: "/supervisor",
  Coordinador: "/coordinador",
  "Aprendiz Interno": "/Interno",
  "Aprendiz Externo": "/Externo",
  "Pasante Interno": "/Pasante",
  "Pasante Externo": "/Pasante",
  Cocina: "/Cocina",
  Bienestar: "/Bienestar",
};

// Manual de instrucciones de uso por rol.
// Cada entrada tiene: icono, titulo, descripcion y un link de accion rapida.
const MANUAL_POR_ROL = {
  Administrador: {
    Bienvenida: "Gestion completa del sistema FoodSys.",
    Pasos: [
      {
        Icono: Users,
        Titulo: "Gestionar Usuarios",
        Descripcion: "Crea, edita o inactiva usuarios. Asigna roles desde el submodulo Usuarios Roles.",
        Link: "/usuarios",
      },
      {
        Icono: BookOpen,
        Titulo: "Gestionar Fichas y Programas",
        Descripcion: "Registra fichas academicas y programas. Vincula aprendices a sus fichas.",
        Link: "/fichas",
      },
      {
        Icono: Utensils,
        Titulo: "Gestionar Platos y Menus",
        Descripcion: "Agrega platos con imagen y descripcion. Programa los menus diarios por tipo de comida.",
        Link: "/platos",
      },
      {
        Icono: CalendarCheck,
        Titulo: "Gestionar Reservas",
        Descripcion: "Visualiza y administra todas las reservas del sistema desde la tabla de reservas.",
        Link: "/reservas",
      },
      {
        Icono: BarChart3,
        Titulo: "Ver Reportes",
        Descripcion: "Genera reportes diarios, semanales, mensuales o por aprendiz especifico.",
        Link: "/Administrador/Reportes",
      },
    ],
  },
  Supervisor: {
    Bienvenida: "Control de turnos y verificacion de reservas.",
    Pasos: [
      {
        Icono: Edit,
        Titulo: "Iniciar un Turno",
        Descripcion: "Ve al modulo Registrar, ingresa tu contrasena y selecciona el tipo de comida (Desayuno, Almuerzo o Cena).",
        Link: "/supervisor/Registrar",
      },
      {
        Icono: QrCode,
        Titulo: "Escanear Codigos QR",
        Descripcion: "Usa el escaner para verificar las reservas de los aprendices en tiempo real durante el turno activo.",
        Link: "/supervisor/Registrar",
      },
      {
        Icono: BarChart3,
        Titulo: "Finalizar y Ver Reporte",
        Descripcion: "Al finalizar el turno, el sistema genera automaticamente las estadisticas del dia.",
        Link: "/supervisor/Reportes",
      },
    ],
  },
  Coordinador: {
    Bienvenida: "Gestion de aprendices y novedades de comida.",
    Pasos: [
      {
        Icono: ClipboardList,
        Titulo: "Registrar Novedades",
        Descripcion: "Si un aprendiz no reservo el dia anterior, crea una novedad para gestionarle la comida del dia.",
        Link: "/coordinador/Novedades",
      },
      {
        Icono: Users,
        Titulo: "Ver Aprendices",
        Descripcion: "Consulta el estado de los aprendices, habilita o sanciona segun corresponda.",
        Link: "/aprendices",
      },
      {
        Icono: BarChart3,
        Titulo: "Generar Reportes",
        Descripcion: "Consulta el consumo por dia, semana o mes. Busca el historial de un aprendiz por documento.",
        Link: "/coordinador/Reportes",
      },
    ],
  },
  "Aprendiz Interno": {
    Bienvenida: "Realiza tu reserva de comida y visualiza tu historial.",
    Pasos: [
      {
        Icono: CalendarCheck,
        Titulo: "Hacer una Reserva",
        Descripcion: "Ve a Reservas, selecciona el tipo de comida (Desayuno, Almuerzo o Cena) y elige el plato disponible para hoy.",
        Link: "/Interno/Reservas",
      },
      {
        Icono: QrCode,
        Titulo: "Usar tu Codigo QR",
        Descripcion: "Tras confirmar la reserva se genera tu codigo QR. Presentalo al supervisor en la hora de tu comida.",
        Link: "/Interno/Reservas",
      },
      {
        Icono: ClipboardList,
        Titulo: "Ver Historial",
        Descripcion: "En la seccion de historial puedes ver el estado de tus reservas: Verificado, Vencido o Cancelado.",
        Link: "/Interno/Reservas",
      },
    ],
  },
  "Aprendiz Externo": {
    Bienvenida: "Reserva tu almuerzo y presenta tu codigo QR.",
    Pasos: [
      {
        Icono: CalendarCheck,
        Titulo: "Reservar Almuerzo",
        Descripcion: "Ve a Reservas, selecciona Almuerzo y elige el plato disponible segun el menu del dia.",
        Link: "/Externo/Reservas",
      },
      {
        Icono: QrCode,
        Titulo: "Codigo QR",
        Descripcion: "Despues de confirmar tu reserva se genera el codigo QR. Presentalo al supervisor durante el almuerzo.",
        Link: "/Externo/Reservas",
      },
    ],
  },
  "Pasante Interno": {
    Bienvenida: "Accede a tus reservas con estado Especial aprobado.",
    Pasos: [
      {
        Icono: ShieldCheck,
        Titulo: "Verificar Estado Especial",
        Descripcion: "Tu acceso al comedor depende del estado Especial aprobado por tu coordinador. Verifica en Mi Perfil.",
        Link: "/Pasante/Perfil",
      },
      {
        Icono: CalendarCheck,
        Titulo: "Hacer una Reserva",
        Descripcion: "Una vez habilitado, ve a Reservas para generar tu codigo QR de comida.",
        Link: "/Pasante/Reservas",
      },
    ],
  },
  "Pasante Externo": {
    Bienvenida: "Accede a tus reservas con estado Especial aprobado.",
    Pasos: [
      {
        Icono: ShieldCheck,
        Titulo: "Verificar Estado Especial",
        Descripcion: "Tu acceso al comedor depende del estado Especial aprobado por tu coordinador. Verifica en Mi Perfil.",
        Link: "/Pasante/Perfil",
      },
      {
        Icono: CalendarCheck,
        Titulo: "Reservar Almuerzo",
        Descripcion: "Una vez habilitado, ve a Reservas para generar tu codigo QR del almuerzo.",
        Link: "/Pasante/Reservas",
      },
    ],
  },
  Cocina: {
    Bienvenida: "Consulta los menus del dia y el consumo por turno.",
    Pasos: [
      {
        Icono: Utensils,
        Titulo: "Ver Menus del Dia",
        Descripcion: "Consulta que platos estan programados para cada turno: Desayuno, Almuerzo y Cena.",
        Link: "/menus",
      },
      {
        Icono: BarChart3,
        Titulo: "Reportes de Consumo",
        Descripcion: "Revisa cuantas reservas se generaron y verificaron en cada turno del dia.",
        Link: "/Cocina/Reportes",
      },
    ],
  },
  Bienestar: {
    Bienvenida: "Monitorea el estado de los aprendices y las novedades.",
    Pasos: [
      {
        Icono: ClipboardList,
        Titulo: "Ver Novedades",
        Descripcion: "Revisa las novedades de comida creadas por los coordinadores durante el dia.",
        Link: "/Bienestar/Novedades",
      },
      {
        Icono: Users,
        Titulo: "Gestionar Aprendices",
        Descripcion: "Consulta el estado de los aprendices, activa o sanciona segun corresponda.",
        Link: "/aprendices",
      },
      {
        Icono: BarChart3,
        Titulo: "Reportes",
        Descripcion: "Genera reportes de consumo para seguimiento y control del bienestar del centro.",
        Link: "/Bienestar/Reportes",
      },
    ],
  },
};

// Tarjeta individual de un paso del manual
const Tarjeta_Paso = ({ Paso, Indice }) => {
  const Icono_Comp = Paso.Icono;
  return (
    <Link
      to={Paso.Link}
      className="group bg-white rounded-xl border border-gray-200 p-5
                 hover:border-[#0f3f80]/30 hover:shadow-md transition-all duration-200
                 flex items-start gap-4"
    >
      {/* Numero de paso */}
      <div className="w-8 h-8 rounded-lg bg-[#0f3f80]/10 flex items-center justify-center flex-shrink-0">
        <Icono_Comp className="w-4 h-4 text-[#0f3f80]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-800">
            <span className="text-[#0f3f80] font-bold mr-1.5">{Indice + 1}.</span>
            {Paso.Titulo}
          </p>
          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#0f3f80] transition-colors flex-shrink-0" />
        </div>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          {Paso.Descripcion}
        </p>
      </div>
    </Link>
  );
};

const Inicio = () => {
  const [Usuario, Set_Usuario] = useState(null);
  const [Rol_Activo, Set_RolActivo] = useState("");

  // Carga los datos del usuario y el rol activo desde el localStorage al montar
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

  return (
    <div className="w-full">
      {/* Encabezado de bienvenida */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">
          Bienvenido, {Nombre}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {Rol_Activo && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0f3f80] inline-block" />
              {Rol_Activo}
            </span>
          )}
        </p>
      </div>

      {/* Manual de instrucciones */}
      {Manual ? (
        <div>
          <div className="mb-4">
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">
              Manual de uso
            </p>
            <p className="text-sm text-gray-600">{Manual.Bienvenida}</p>
          </div>

          {/* Grid de pasos responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {Manual.Pasos.map((Paso, Idx) => (
              <Tarjeta_Paso key={Paso.Titulo} Paso={Paso} Indice={Idx} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-400">
            No hay instrucciones disponibles para tu rol actual.
          </p>
        </div>
      )}
    </div>
  );
};

export default Inicio;