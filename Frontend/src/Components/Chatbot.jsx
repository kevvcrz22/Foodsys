import { useState, useEffect, useRef } from "react";
import { 
  Building2, 
  Key, 
  Clock, 
  UtensilsCrossed, 
  Phone, 
  DollarSign, 
  Users, 
  Globe, 
  Unlock, 
  AlertTriangle, 
  UserPlus, 
  Moon, 
  AlarmClock,
  ClipboardCheck,
  Lightbulb,
  RotateCw,
  ArrowLeft,
  X,
  MessageCircle,
  ShieldCheck,
  ChefHat,
  HeartHandshake,
  FileSpreadsheet,
  QrCode,
  Send,
  HelpCircle,
  ChevronRight
} from "lucide-react";
import avatar from "./Img/avatar.png";

// Base de conocimientos para usuarios publicos (sin iniciar sesion)
const PREGUNTAS_PUBLICAS = [
  { id: "pub_1", text: "¿Que es Foodsys?", Icon: Building2 },
  { id: "pub_2", text: "¿Como inicio sesion?", Icon: Key },
  { id: "pub_3", text: "Horarios de reservas", Icon: Clock },
  { id: "pub_4", text: "Normas del comedor", Icon: ShieldCheck },
  { id: "pub_5", text: "¿Olvide mi contrasena?", Icon: Unlock },
  { id: "pub_6", text: "Contacto y Bienestar", Icon: Phone }
];

// Preguntas secundarias para modo publico
const SUBPREGUNTAS_PUBLICAS = {
  "¿Que es Foodsys?": [
    { id: "sub_pub_11", text: "¿Es un servicio gratuito?", Icon: DollarSign },
    { id: "sub_pub_12", text: "¿Quienes pueden utilizarlo?", Icon: Users },
    { id: "sub_pub_13", text: "¿Donde esta ubicado el comedor?", Icon: Globe }
  ],
  "¿Como inicio sesion?": [
    { id: "sub_pub_21", text: "Primer acceso al sistema", Icon: UserPlus },
    { id: "sub_pub_22", text: "Error en credenciales", Icon: AlertTriangle }
  ],
  "Horarios de reservas": [
    { id: "sub_pub_31", text: "¿Por que cierra a las 6:30 PM?", Icon: Moon },
    { id: "sub_pub_32", text: "Horarios de las comidas", Icon: AlarmClock }
  ]
};

// Preguntas y respuestas por rol cuando el usuario ya inicio sesion
const PREGUNTAS_POR_ROL = {
  "Aprendiz Interno": [
    { id: "apr_1", text: "¿Como hago mi reserva diaria?", Icon: UtensilsCrossed },
    { id: "apr_2", text: "Horario limite de reserva (6:30 PM)", Icon: Clock },
    { id: "apr_3", text: "Sancion por 3 inasistencias", Icon: AlertTriangle },
    { id: "apr_4", text: "¿Por que mi sesion cierra a 5 min?", Icon: Clock },
    { id: "apr_5", text: "¿Como paso por el comedor?", Icon: QrCode }
  ],
  "Aprendiz Externo": [
    { id: "ext_1", text: "¿Cual es el flujo de 2 pasos para comer?", Icon: QrCode },
    { id: "ext_2", text: "Paso 1: Cocina (Verificacion QR)", Icon: ChefHat },
    { id: "ext_3", text: "Paso 2: Supervisor (Consumo confirmado)", Icon: ShieldCheck },
    { id: "ext_4", text: "Reserva excepcional de Almuerzo (9:00 AM)", Icon: Clock },
    { id: "ext_5", text: "Sancion por 3 inasistencias", Icon: AlertTriangle }
  ],
  "Pasante Interno": [
    { id: "pas_int_1", text: "¿Como reservo mis 3 comidas diarias?", Icon: UtensilsCrossed },
    { id: "pas_int_2", text: "Horarios de atencion del comedor", Icon: AlarmClock },
    { id: "pas_int_3", text: "Reglas de convivencia y comedor", Icon: ShieldCheck },
    { id: "pas_int_4", text: "¿Que hago si mi contrato termina?", Icon: FileSpreadsheet }
  ],
  "Pasante Externo": [
    { id: "pas_ext_1", text: "Flujo obligatorio en Cocina y Supervisor", Icon: QrCode },
    { id: "pas_ext_2", text: "Horario limite de Almuerzo (6:30 PM / 9:00 AM)", Icon: Clock },
    { id: "pas_ext_3", text: "Consultar mis reservas activas", Icon: ClipboardCheck }
  ],
  Supervisor: [
    { id: "sup_1", text: "¿Como inicio y cierro mi turno?", Icon: Clock },
    { id: "sup_2", text: "Regla de Turno Unico del Supervisor", Icon: ShieldCheck },
    { id: "sup_3", text: "Modo Fila Rapida (Auto-continuar)", Icon: QrCode },
    { id: "sup_4", text: "¿Por que no valida a un externo sin cocina?", Icon: AlertTriangle },
    { id: "sup_5", text: "Exportar informe de turno a PDF y Excel", Icon: FileSpreadsheet }
  ],
  Cocina: [
    { id: "coc_1", text: "Verificar codigo QR de Externos", Icon: QrCode },
    { id: "coc_2", text: "Plan de Cocina: Regla de -5 horas", Icon: ChefHat },
    { id: "coc_3", text: "Modo Fila Rapida con sonido", Icon: AlarmClock },
    { id: "coc_4", text: "Exportar Plan del Dia en PDF y Excel", Icon: FileSpreadsheet }
  ],
  Bienestar: [
    { id: "bie_1", text: "Alerta de aprendices sin comer (Tab 3)", Icon: HeartHandshake },
    { id: "bie_2", text: "Ver aprendices por plato en Plan del Dia", Icon: ChefHat },
    { id: "bie_3", text: "Gestion de aprendices y pasantes", Icon: Users },
    { id: "bie_4", text: "Acceso seguro al portal BIENESOFT", Icon: Globe },
    { id: "bie_5", text: "Semaforo de riesgo por inasistencias", Icon: AlertTriangle }
  ],
  Coordinador: [
    { id: "coor_1", text: "Reportes Semanales ISO (1 a 52)", Icon: FileSpreadsheet },
    { id: "coor_2", text: "Control de inasistencias y desperdicio", Icon: AlertTriangle },
    { id: "coor_3", text: "Monitoreo de Fichas y Aprendices", Icon: Users },
    { id: "coor_4", text: "Exportacion consolidada a Excel y PDF", Icon: ClipboardCheck }
  ],
  Administrador: [
    { id: "adm_1", text: "Jerarquia: Programas -> Fichas -> Usuarios", Icon: Users },
    { id: "adm_2", text: "Importacion PE-04 y calculo automatico 6 meses", Icon: FileSpreadsheet },
    { id: "adm_3", text: "Asignacion de rol por Centro de Convivencia", Icon: ShieldCheck },
    { id: "adm_4", text: "Auditoria y control de turnos en tiempo real", Icon: Clock },
    { id: "adm_5", text: "Exportacion e importacion en todas las tablas", Icon: FileSpreadsheet }
  ]
};

// Diccionario central de respuestas completas y didacticas
const DICCIONARIO_RESPUESTAS = {
  // Respuestas publicas
  "¿Que es Foodsys?":
    "Foodsys es la plataforma oficial de gestion alimentaria del Centro Agropecuario La Granja (SENA Espinal - Tolima). Su objetivo es garantizar la alimentacion de aprendices y pasantes, optimizar los insumos de cocina y evitar el desperdicio de comida.",
  
  "¿Como inicio sesion?":
    "Ingresa a la pantalla de inicio de sesion con tu numero de documento y tu contrasena. Si es la primera vez que ingresas, tu contrasena temporal coincide con tu numero de documento. Se te pedira cambiarla por seguridad en tu primer ingreso.",
  
  "Horarios de reservas":
    "Las reservas ordinarias se realizan el dia anterior hasta las 6:30 PM para Desayuno, Almuerzo o Cena. El sistema procesa a esa hora los consolidados exactos para que el equipo de cocina comience la preparacion 5 horas antes de cada turno.",
  
  "Normas del comedor":
    "1. Asistir puntualmente dentro del horario del turno.\n2. Presentar tu codigo QR personal en tu celular o impreso.\n3. Si eres externo, recuerda validar primero en Cocina y luego con el Supervisor.\n4. Si reservas y no asistes, acumulas faltas que pueden generar sancion de 3 dias.",
  
  "¿Olvide mi contrasena?":
    "En la pantalla de acceso, haz clic en '¿Olvidaste tu contrasena?'. Ingresa tu correo institucional registrado y te enviaremos un codigo OTP de 6 digitos para restablecer tu clave en menos de 15 minutos.",
  
  "Contacto y Bienestar":
    "Puedes comunicarte directamente con la Oficina de Bienestar al Aprendiz en el Centro Agropecuario La Granja del Espinal-Tolima, o enviar tu solicitud o queja (PQRS) mediante el formulario de Contacto, el cual se remite al correo fierrokkevin@gmail.com.",
  
  "¿Es un servicio gratuito?":
    "Si, el beneficio de alimentacion es completamente gratuito para los aprendices y pasantes priorizados y autorizados por Bienestar al Aprendiz del SENA.",
  
  "¿Quienes pueden utilizarlo?":
    "Pueden usarlo Aprendices Internos (residentes en centro de convivencia), Aprendices Externos, Pasantes Internos y Externos, Personal de Cocina, Supervisores, Coordinadores y Administradores.",
  
  "¿Donde esta ubicado el comedor?":
    "En las instalaciones del Centro Agropecuario 'La Granja' del Espinal-Tolima, bloque de servicios estudiantiles y cafeteria principal.",
  
  "Primer acceso al sistema":
    "En tu primer acceso, tu usuario es tu numero de documento de identidad y tu clave inicial es el mismo documento. Una vez ingreses, actualiza tus datos y cambia tu contrasena.",
  
  "Error en credenciales":
    "Si el sistema indica datos incorrectos, verifica que no tengas espacios al inicio o final de tu documento. Si persiste, usa el enlace '¿Olvidaste tu contrasena?' o solicita a Bienestar la revision de tu estado en el sistema.",
  
  "¿Por que cierra a las 6:30 PM?":
    "Porque el equipo de cocina debe consolidar las cantidades exactas de carne, verduras y granos a preparar y comenzar su labor 5 horas antes del primer turno de la manana.",
  
  "Horarios de las comidas":
    "Los horarios oficiales de servicio son:\n- Desayuno: 06:00 AM a 07:00 AM\n- Almuerzo: 11:30 AM a 01:30 PM\n- Cena: 06:00 PM a 07:00 PM\nRecuerda llegar con suficiente tiempo para evitar aglomeraciones.",

  // Respuestas para Aprendices y Pasantes
  "¿Como hago mi reserva diaria?":
    "Ingresa a tu menu 'Reservar', selecciona el dia de manana, elige el tipo de comida y tu plato preferido. Haz clic en 'Confirmar Reserva'. Se generara tu codigo QR que podras consultar en 'Mis Reservas'.",
  
  "Horario limite de reserva (6:30 PM)":
    "Tienes plazo maximo hasta las 6:30 PM del dia anterior para reservar Desayuno, Almuerzo y Cena. Pasadas las 6:30 PM el sistema bloquea el registro para enviar el consolidado a cocina.",
  
  "Sancion por 3 inasistencias":
    "Si reservas y no asistes a comer, tu reserva pasa a estado 'Vencido'. Si acumulas 3 inasistencias en la misma semana (lunes a domingo), el sistema te sanciona automaticamente bloqueando tus reservas. Debes acudir a Bienestar para solicitar apoyo y desancion.",
  
  "¿Por que mi sesion cierra a 5 min?":
    "Por politica de seguridad en equipos publicos y celulares del centro, los aprendices y pasantes tienen un temporizador de inactividad de 5 minutos. A los 4:30 min veras un aviso; si deseas continuar, presiona 'Continuar en la sesion'.",
  
  "¿Como paso por el comedor?":
    "Como Aprendiz Interno, presentas tu codigo QR directamente al Supervisor en la entrada del comedor. El supervisor escanea tu QR y tu reserva pasa inmediatamente a 'Consumido'.",

  "¿Cual es el flujo de 2 pasos para comer?":
    "Los Aprendices Externos y Pasantes Externos tienen un flujo obligatorio de 2 pasos:\n1. Pasan primero por la ventanilla de Cocina, donde escanean su QR y la reserva pasa a 'Verificado'.\n2. Luego pasan con el Supervisor, quien escanea y cambia el estado a 'Consumido'. Si no pasas por cocina primero, el supervisor no podra registrar tu plato.",

  "Paso 1: Cocina (Verificacion QR)":
    "En Cocina se valida que seas externo autorizado y que tu reserva este activa para ese turno. Al escanear, tu reserva queda 'Verificada en Cocina'.",

  "Paso 2: Supervisor (Consumo confirmado)":
    "El Supervisor valida que ya pasaste por Cocina y entrega la autorizacion final del plato, pasando la reserva a 'Consumido'.",

  "Reserva excepcional de Almuerzo (9:00 AM)":
    "Si eres externo y tuviste una novedad, puedes solicitar o registrar reserva excepcional UNICAMENTE para el Almuerzo del mismo dia, con plazo maximo hasta las 09:00:00 AM en punto. Despues de las 9:00 AM el sistema cierra definitivamente.",

  "¿Como reservo mis 3 comidas diarias?":
    "Como Pasante Interno, tienes derecho a Desayuno, Almuerzo y Cena. Puedes reservar las tres comidas del dia siguiente antes de las 6:30 PM desde tu panel de reservas.",

  "Horarios de atencion del comedor":
    "Desayuno: 06:00 a 07:00 AM\nAlmuerzo: 11:30 AM a 01:30 PM\nCena: 06:00 PM a 07:00 PM. Por favor asiste dentro de los rangos oficiales para no perder tu turno.",

  "Reglas de convivencia y comedor":
    "El comedor es un espacio compartido. Se exige aseo, respeto por las filas, uso de bandeja individual y cuidado con el desperdicio de comida.",

  "¿Que hago si mi contrato termina?":
    "Al terminar tu pasantia o etapa practica, el sistema o el administrador actualizara tu estado. Si tienes dudas, ponte en contacto con la Oficina de Bienestar.",

  "Flujo obligatorio en Cocina y Supervisor":
    "Como pasante externo, debes presentar primero tu codigo QR en el modulo de Cocina (Verificacion QR) y enseguida con el Supervisor para registrar el consumo oficial.",

  "Horario limite de Almuerzo (6:30 PM / 9:00 AM)":
    "Reserva ordinaria: hasta las 6:30 PM del dia anterior.\nNovedad excepcional de Almuerzo: hasta las 09:00 AM del mismo dia.",

  "Consultar mis reservas activas":
    "Entra al modulo 'Reservar' o 'Mis Reservas' para ver la lista de comidas programadas, el plato elegido y descargar tu codigo QR en cualquier momento.",

  // Respuestas para Supervisor
  "¿Como inicio y cierro mi turno?":
    "Ingresa a 'Registrar Consumo'. Presiona el boton 'Iniciar Turno'. El sistema valida que no haya otro supervisor con turno abierto. Al finalizar el servicio de comidas, pulsa 'Cerrar Turno', agrega observaciones si lo deseas y descarga el informe oficial en PDF o Excel.",

  "Regla de Turno Unico del Supervisor":
    "Por control de contrato y auditoria, solo puede existir UN (1) supervisor con turno activo a la vez. Si otro companero tiene el turno abierto, el sistema te avisara y deberas esperar a que cierre su sesion de turno.",

  "Modo Fila Rapida (Auto-continuar)":
    "Al activar el interruptor 'Modo Fila Rapida', el lector de camara valida el QR, emite un sonido confirmatorio y muestra los datos del aprendiz durante 2.5 segundos, reactivando automaticamente el escaner sin que tengas que presionar botones en cada lectura.",

  "¿Por que no valida a un externo sin cocina?":
    "Porque los aprendices y pasantes externos deben pasar obligatoriamente primero por el lector de Cocina para que su reserva este en estado 'Verificado'. Si intentan pasar directo al supervisor, el sistema los rechaza para garantizar el control de insumos de cocina.",

  "Exportar informe de turno a PDF y Excel":
    "En la ventana de cierre de turno o en el modulo de Reportes, puedes presionar 'Exportar PDF' o 'Exportar Excel'. El archivo incluye los datos del supervisor, horas exactas, total de platos y la lista nominal de todos los aprendices atendidos.",

  // Respuestas para Cocina
  "Verificar codigo QR de Externos":
    "En el modulo 'Verificar QR', apunta la camara al codigo del aprendiz o pasante externo. El sistema verificara que su reserva este en 'Generado' y la cambiara a 'Verificado'.",

  "Plan de Cocina: Regla de -5 horas":
    "El Plan de Cocina calcula automaticamente el inicio de preparacion 5 horas antes de cada turno:\n- Desayuno (06:00 AM): preparacion inicia a la 01:00 AM.\n- Almuerzo (11:30 AM): preparacion inicia a las 06:30 AM.\n- Cena (06:00 PM): preparacion inicia a la 01:00 PM.",

  "Modo Fila Rapida con sonido":
    "El escaner de Cocina cuenta con feedback auditivo (tono agudo para exito y tono grave para error) y reinicio automatico cada 2.5 segundos para agilizar filas de mas de 500 personas.",

  "Exportar Plan del Dia en PDF y Excel":
    "En 'Plan del Dia', usa los botones de exportacion para descargar el consolidado de platos por comida, hora limite de preparacion (-5h) y totales para firma del personal de cocina.",

  // Respuestas para Bienestar
  "Alerta de aprendices sin comer (Tab 3)":
    "En el modulo de Reportes, la pestana 'Alerta de Bienestar' lista nominalmente a los aprendices y pasantes activos (con prioridad para residentes de Centro de Convivencia) que tienen 0 reservas o 0 consumos en el periodo, mostrando su telefono y correo para contacto preventivo.",

  "Ver aprendices por plato en Plan del Dia":
    "Como Bienestar, tienes acceso al Plan del Dia de Cocina. Al hacer clic encima de cualquier plato, se abrira una ventana con la lista nominal de los aprendices que reservaron esa opcion.",

  "Gestion de aprendices y pasantes":
    "Desde el menu de navegacion puedes ingresar tanto a 'Aprendices' como al nuevo modulo exclusivo de 'Pasantes', consultar su historial individual de reservas, semaforo de riesgo y exportar listados.",

  "Acceso seguro al portal BIENESOFT":
    "En el menu lateral y en el pie de pagina cuentas con el enlace directo al portal oficial BIENESOFT (https://bienesoftlagranja.com/user/login) identificado con su logotipo oficial.",

  "Semaforo de riesgo por inasistencias":
    "El semaforo visual te muestra:\n- 0/3: Sin faltas en la semana (Verde)\n- 1/3: 1 inasistencia acumulada (Amarillo)\n- 2/3: En riesgo de sancion (Naranja)\n- 3/3: Sancionado automaticamente (Rojo).",

  // Respuestas para Coordinador
  "Reportes Semanales ISO (1 a 52)":
    "Los reportes semanales se rigen bajo la norma internacional ISO-8601 (semanas de lunes a domingo de la 1 a la 52/53). Puedes filtrar por Ano, Mes y Semana o por rango de fechas exacto.",

  "Control de inasistencias y desperdicio":
    "Consulta la pestana 'Inasistencias' en Reportes para auditar las reservas vencidas por plato, comida y ficha, facilitando la toma de decisiones para el contrato de suministros.",

  "Monitoreo de Fichas y Aprendices":
    "Permite auditar el estado de las fichas de formacion titulada, fecha de finalizacion de etapa lectiva y aprendices asociados en tiempo real.",

  "Exportacion consolidada a Excel y PDF":
    "Todos los reportes y tablas admiten descarga completa en formato Excel (.xlsx) y PDF (.pdf) con graficos estadisticos y tabla nominal completa.",

  // Respuestas para Administrador
  "Jerarquia: Programas -> Fichas -> Usuarios":
    "El sistema Foodsys automatiza la jerarquia institucional:\n1. Programas: normaliza nombres en mayusculas, sin tildes ni signos basura.\n2. Fichas: calcula automaticamente 6 meses atras y -1 dia si vienen fechas vacias.\n3. Usuarios: enlaza Num_Ficha con Id_Ficha y asigna rol Interno o Externo segun Centro de Convivencia.",

  "Importacion PE-04 y calculo automatico 6 meses":
    "Al cargar el archivo institucional PE-04_1.xlsx, el importador filtra por defecto unicamente la formacion titulada (Tecnologo, Tecnico, Operario, Auxiliar), descartando miles de cursos especiales y deduplicando en memoria RAM.",

  "Asignacion de rol por Centro de Convivencia":
    "Si CenCon_Usuario es 'Si' o '1', se asigna 'Aprendiz Interno' (o 'Pasante Interno'). Si es 'No' o vacio, se asigna 'Aprendiz Externo' (o 'Pasante Externo'). Si la etapa lectiva ya vencio, se guarda Inactivo.",

  "Auditoria y control de turnos en tiempo real":
    "El sistema registra inicio y fin de turno con notificaciones automaticas internas a campanita y correo a fierrokkevin@gmail.com, impidiendo turnos paralelos.",

  "Exportacion e importacion en todas las tablas":
    "Todas las tablas (Programas, Fichas, Usuarios, Aprendices, Pasantes, Platos, Menus, Roles, Reservas) cuentan con botones de Exportar Excel y PDF con confirmacion inteligente si no hay filtros aplicados."
};

/**
 * Componente principal: Chatbot
 * Proporciona soporte en modo publico y modo autenticado adaptado al rol activo del usuario,
 * incluyendo selector rapido de rol para usuarios con multiples roles asignados.
 */
const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [textoLibre, setTextoLibre] = useState("");
  const [preguntasActuales, setPreguntasActuales] = useState(PREGUNTAS_PUBLICAS);
  const [showWelcome, setShowWelcome] = useState(true);
  const [preguntasSeleccionadas, setPreguntasSeleccionadas] = useState(new Set());
  const [historialNavegacion, setHistorialNavegacion] = useState([]);

  // Estados de autenticacion y roles del usuario
  const [esAutenticado, setEsAutenticado] = useState(false);
  const [rolActivo, setRolActivo] = useState("");
  const [rolesDisponibles, setRolesDisponibles] = useState([]);
  const [usuarioInfo, setUsuarioInfo] = useState(null);

  const messagesEndRef = useRef(null);

  // Sincroniza la sesion actual y los roles disponibles desde localStorage
  const sincronizarSesion = () => {
    const token = localStorage.getItem("token");
    const rol = localStorage.getItem("rolActivo") || "";
    const usr = JSON.parse(localStorage.getItem("usuario") || "null");
    const rolesArray = JSON.parse(localStorage.getItem("roles") || "[]");

    const tieneAuth = Boolean(token && token !== "ok" && token.split(".").length === 3 && usr);
    setEsAutenticado(tieneAuth);
    setRolActivo(rol);
    setRolesDisponibles(rolesArray);
    setUsuarioInfo(usr);

    // Ajusta la lista de preguntas segun el estado y rol
    if (tieneAuth && rol && PREGUNTAS_POR_ROL[rol]) {
      setPreguntasActuales(PREGUNTAS_POR_ROL[rol]);
    } else {
      setPreguntasActuales(PREGUNTAS_PUBLICAS);
    }
  };

  useEffect(() => {
    sincronizarSesion();
    window.addEventListener("storage", sincronizarSesion);
    window.addEventListener("rolesActualizados", sincronizarSesion);
    return () => {
      window.removeEventListener("storage", sincronizarSesion);
      window.removeEventListener("rolesActualizados", sincronizarSesion);
    };
  }, []);

  // Mensaje de bienvenida al abrir el chat
  useEffect(() => {
    if (open && messages.length === 0) {
      setTimeout(() => {
        const nombre = usuarioInfo ? usuarioInfo.Nom_Usuario : "";
        const saludoInicial = esAutenticado && rolActivo
          ? `¡Hola ${nombre}! Soy Konnan, tu asistente en Foodsys. Veo que tienes el rol de ${rolActivo}. ¿En que puedo ayudarte hoy?`
          : "¡Hola! Soy Konnan, tu asistente virtual de Foodsys. ¿En que puedo colaborarte hoy?";

        setMessages([
          {
            text: saludoInicial,
            sender: "bot",
            id: Date.now()
          }
        ]);
      }, 250);
    }
  }, [open, messages.length, esAutenticado, rolActivo, usuarioInfo]);

  // Desplazamiento automatico al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, preguntasActuales, isTyping]);

  // Cambiar rol activo directamente desde el Chatbot
  const cambiarRolDesdeChat = (nuevoRol) => {
    if (!nuevoRol || nuevoRol === rolActivo) return;
    localStorage.setItem("rolActivo", nuevoRol);
    setRolActivo(nuevoRol);

    // Notificar al resto de la aplicacion
    window.dispatchEvent(new Event("rolesActualizados"));
    window.dispatchEvent(new Event("storage"));

    // Actualizar preguntas del chatbot
    const nuevasPreguntas = PREGUNTAS_POR_ROL[nuevoRol] || PREGUNTAS_PUBLICAS;
    setPreguntasActuales(nuevasPreguntas);
    setPreguntasSeleccionadas(new Set());
    setHistorialNavegacion([]);

    setMessages((prev) => [
      ...prev,
      {
        text: `Has cambiado tu rol activo a "${nuevoRol}". Las preguntas y recomendaciones del asistente se han actualizado.`,
        sender: "bot",
        id: Date.now()
      }
    ]);
  };

  // Obtener respuesta desde el diccionario o busqueda por palabras clave
  const getRespuesta = (textoPregunta) => {
    if (DICCIONARIO_RESPUESTAS[textoPregunta]) {
      return DICCIONARIO_RESPUESTAS[textoPregunta];
    }

    // Busqueda inteligente por palabras clave
    const textoMin = textoPregunta.toLowerCase();
    if (textoMin.includes("horario") || textoMin.includes("hora") || textoMin.includes("limite")) {
      return DICCIONARIO_RESPUESTAS["Horarios de reservas"];
    }
    if (textoMin.includes("sancion") || textoMin.includes("falta") || textoMin.includes("inasistencia")) {
      return DICCIONARIO_RESPUESTAS["Sancion por 3 inasistencias"];
    }
    if (textoMin.includes("externo") || textoMin.includes("cocina") || textoMin.includes("dos pasos")) {
      return DICCIONARIO_RESPUESTAS["¿Cual es el flujo de 2 pasos para comer?"];
    }
    if (textoMin.includes("turno") || textoMin.includes("supervisor")) {
      return DICCIONARIO_RESPUESTAS["Regla de Turno Unico del Supervisor"];
    }
    if (textoMin.includes("contraseña") || textoMin.includes("contrasena") || textoMin.includes("clave")) {
      return DICCIONARIO_RESPUESTAS["¿Olvide mi contrasena?"];
    }
    if (textoMin.includes("bienesoft")) {
      return DICCIONARIO_RESPUESTAS["Acceso seguro al portal BIENESOFT"];
    }
    if (textoMin.includes("almuerzo") || textoMin.includes("novedad") || textoMin.includes("excepcional")) {
      return DICCIONARIO_RESPUESTAS["Reserva excepcional de Almuerzo (9:00 AM)"];
    }

    return "Entiendo tu inquietud. Te invito a seleccionar una de las opciones sugeridas o a contactar a la Oficina de Bienestar al Aprendiz si requieres atencion personalizada.";
  };

  // Manejar clic en una pregunta sugerida
  const handlePreguntaClick = (pregunta) => {
    setHistorialNavegacion((prev) => [...prev, pregunta.text]);
    setPreguntasSeleccionadas((prev) => new Set(prev).add(pregunta.text));

    setMessages((prev) => [
      ...prev,
      { text: pregunta.text, sender: "user", id: Date.now() }
    ]);

    setShowWelcome(false);
    setIsTyping(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          text: getRespuesta(pregunta.text),
          sender: "bot",
          id: Date.now()
        }
      ]);

      setIsTyping(false);

      // Si tiene subpreguntas especificas
      if (SUBPREGUNTAS_PUBLICAS[pregunta.text]) {
        setPreguntasActuales(SUBPREGUNTAS_PUBLICAS[pregunta.text]);
      } else {
        const baseLista = esAutenticado && rolActivo && PREGUNTAS_POR_ROL[rolActivo]
          ? PREGUNTAS_POR_ROL[rolActivo]
          : PREGUNTAS_PUBLICAS;

        const restantes = baseLista.filter(
          (p) => !preguntasSeleccionadas.has(p.text) && p.text !== pregunta.text
        );

        if (restantes.length > 0) {
          setPreguntasActuales(restantes);
        }
      }
    }, 600);
  };

  // Enviar texto libre escrito por el usuario
  const enviarTextoLibre = (e) => {
    e.preventDefault();
    const textoLimpio = textoLibre.trim();
    if (!textoLimpio) return;

    setMessages((prev) => [
      ...prev,
      { text: textoLimpio, sender: "user", id: Date.now() }
    ]);
    setTextoLibre("");
    setShowWelcome(false);
    setIsTyping(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          text: getRespuesta(textoLimpio),
          sender: "bot",
          id: Date.now()
        }
      ]);
      setIsTyping(false);
    }, 700);
  };

  // Reiniciar la conversacion
  const resetChat = () => {
    const nombre = usuarioInfo ? usuarioInfo.Nom_Usuario : "";
    const saludoReinicio = esAutenticado && rolActivo
      ? `Conversacion reiniciada. ¿Que otra consulta tienes sobre tu rol de ${rolActivo}, ${nombre}?`
      : "Conversacion reiniciada. ¿En que puedo orientarte?";

    setMessages([
      {
        text: saludoReinicio,
        sender: "bot",
        id: Date.now()
      }
    ]);

    const listaBase = esAutenticado && rolActivo && PREGUNTAS_POR_ROL[rolActivo]
      ? PREGUNTAS_POR_ROL[rolActivo]
      : PREGUNTAS_PUBLICAS;

    setPreguntasActuales(listaBase);
    setShowWelcome(true);
    setPreguntasSeleccionadas(new Set());
    setHistorialNavegacion([]);
  };

  // Volver a la lista de opciones anterior
  const handleVolverAtras = () => {
    const listaBase = esAutenticado && rolActivo && PREGUNTAS_POR_ROL[rolActivo]
      ? PREGUNTAS_POR_ROL[rolActivo]
      : PREGUNTAS_PUBLICAS;

    if (historialNavegacion.length > 1) {
      const nuevoHistorial = [...historialNavegacion];
      nuevoHistorial.pop();
      const preguntaAnterior = nuevoHistorial[nuevoHistorial.length - 1];
      setHistorialNavegacion(nuevoHistorial);

      if (SUBPREGUNTAS_PUBLICAS[preguntaAnterior]) {
        setPreguntasActuales(SUBPREGUNTAS_PUBLICAS[preguntaAnterior]);
      } else {
        setPreguntasActuales(listaBase);
      }
    } else {
      setPreguntasActuales(listaBase);
      setPreguntasSeleccionadas(new Set());
      setHistorialNavegacion([]);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999]">
      {open && (
        <div className="bg-white/95 backdrop-blur-2xl rounded-none sm:rounded-[24px] shadow-[0_12px_45px_rgba(30,45,74,0.2)] border-0 sm:border border-white/70 w-full sm:w-[410px] h-[100dvh] sm:h-[580px] max-h-[100dvh] sm:max-h-[580px] flex flex-col overflow-hidden fixed sm:relative inset-0 sm:inset-auto bottom-0 right-0 animar-entrada">
          
          {/* Encabezado con selector de rol integrado */}
          <div className="bg-gradient-to-r from-primario to-primario-oscuro px-4 pt-6 pb-3 sm:p-4 shadow-md shrink-0 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <img
                    loading="lazy"
                    decoding="async"
                    src={avatar}
                    className="w-10 h-10 rounded-full border-2 border-white/80 shadow-md object-cover bg-white"
                    alt="Konnan"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-primario rounded-full"></span>
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-[0.95rem] truncate flex items-center gap-1.5">
                    <span>Konnan</span>
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md font-semibold uppercase tracking-wider">
                      IA Asistente
                    </span>
                  </div>
                  <div className="text-white/80 text-[11px] font-medium truncate">
                    {esAutenticado && rolActivo ? `Rol: ${rolActivo}` : "Atencion Foodsys La Granja"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {historialNavegacion.length > 0 && (
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-all active:scale-95 cursor-pointer"
                    onClick={handleVolverAtras}
                    title="Volver atras"
                    aria-label="Volver atras"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-all active:scale-95 cursor-pointer"
                  onClick={() => setOpen(false)}
                  title="Cerrar asistente"
                  aria-label="Cerrar chat"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Selector de rol dentro del Chatbot si el usuario tiene 2 o mas roles */}
            {esAutenticado && rolesDisponibles.length >= 2 && (
              <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between gap-2">
                <span className="text-[11px] text-white/90 font-semibold shrink-0">Cambiar mi rol:</span>
                <select
                  value={rolActivo}
                  onChange={(e) => cambiarRolDesdeChat(e.target.value)}
                  className="bg-white/20 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg border border-white/30 outline-none cursor-pointer hover:bg-white/30 transition-colors max-w-[200px] truncate"
                >
                  {rolesDisponibles.map((r) => (
                    <option key={r} value={r} className="text-slate-900 bg-white">
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Cuerpo de la conversacion */}
          <div className="flex-1 bg-gradient-to-b from-fondo to-white/60 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animar-entrada`}
              >
                <div
                  className={`max-w-[88%] px-4 py-2.5 text-[0.82rem] font-medium leading-relaxed whitespace-pre-wrap ${
                    msg.sender === "user"
                      ? "bg-gradient-to-br from-primario to-primario-oscuro text-white rounded-2xl rounded-br-sm shadow-md shadow-primario/20"
                      : "bg-white text-texto-principal rounded-2xl rounded-bl-sm shadow-sm border border-slate-100"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Opciones de Preguntas Sugeridas */}
            {preguntasActuales.length > 0 && (
              <div className="mt-4 space-y-2.5 animar-entrada">
                <div className="flex justify-center">
                  <span className="px-3.5 py-1 bg-acento/10 text-acento-oscuro rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 border border-acento/20">
                    <Lightbulb size={12} />
                    <span>Preguntas frecuentes para {esAutenticado && rolActivo ? rolActivo : "Usuarios"}</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {preguntasActuales.map((p) => {
                    const IconoComp = p.Icon || HelpCircle;
                    return (
                      <button
                        key={p.id}
                        className="flex items-center gap-2 p-2.5 rounded-xl border border-primario/15 bg-white/80 text-primario-oscuro hover:bg-primario hover:text-white transition-all duration-200 text-[11px] font-bold shadow-xs text-left cursor-pointer group"
                        onClick={() => handlePreguntaClick(p)}
                      >
                        <IconoComp size={15} className="shrink-0 text-primario group-hover:text-white" />
                        <span className="leading-tight flex-1">{p.text}</span>
                        <ChevronRight size={13} className="shrink-0 opacity-40 group-hover:opacity-100" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Indicador de escritura animado */}
            {isTyping && (
              <div className="flex items-center gap-2 text-texto-secundario text-[11px] font-semibold py-1">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-primario-suave rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-primario-suave rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-primario-suave rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
                <span>Konnan esta redactando la respuesta...</span>
              </div>
            )}

            <div ref={messagesEndRef}></div>
          </div>

          {/* Formulario de texto libre para preguntas abiertas */}
          <div className="p-3 bg-white border-t border-slate-100 shrink-0">
            <form onSubmit={enviarTextoLibre} className="flex items-center gap-2">
              <input
                type="text"
                value={textoLibre}
                onChange={(e) => setTextoLibre(e.target.value)}
                placeholder="Escribe tu consulta o duda..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-primario focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={!textoLibre.trim()}
                className="w-9 h-9 rounded-xl bg-primario text-white flex items-center justify-center hover:bg-primario-oscuro transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-xs"
                title="Enviar mensaje"
              >
                <Send size={15} />
              </button>
            </form>

            <div className="flex items-center justify-between pt-2 px-1">
              <span className="text-[10px] text-slate-400 font-medium">
                Centro Agropecuario La Granja
              </span>
              <button
                className="inline-flex items-center gap-1 text-[10px] font-bold text-primario hover:underline cursor-pointer"
                onClick={resetChat}
              >
                <RotateCw size={11} />
                Reiniciar chat
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Boton Flotante para abrir el asistente */}
      {!open && (
        <button
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-xl flex items-center justify-center bg-gradient-to-br from-primario to-primario-oscuro hover:shadow-primario/40 hover:-translate-y-1 transition-all duration-300 relative z-50 group border-2 border-white/40 animate-pulse cursor-pointer"
          onClick={() => setOpen(true)}
          title="Abrir asistente Konnan"
          aria-label="Abrir asistente de Foodsys"
        >
          <img
            src={avatar}
            loading="lazy"
            decoding="async"
            className="w-full h-full rounded-full object-cover p-1 bg-white/10 relative z-10"
            alt="Konnan"
          />
          <div className="absolute -top-1 -right-1 bg-acento text-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform z-20">
            <MessageCircle size={13} />
          </div>
        </button>
      )}
    </div>
  );
};

export default Chatbot;