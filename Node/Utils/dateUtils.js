// Node/Utils/dateUtils.js
// Utilidades de fecha y hora estandarizadas para Colombia (America/Bogota).
// Corrige de forma definitiva el error donde despues de las 7:00 PM (UTC-5)
// el metodo toISOString salta al dia siguiente por operar en UTC.

// Retorna la fecha actual en Colombia en formato YYYY-MM-DD
export function obtenerFechaColombia(fecha = new Date()) {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
}

// Retorna la fecha de manana en Colombia en formato YYYY-MM-DD
export function obtenerFechaMananaColombia(fecha = new Date()) {
  const hoyStr = obtenerFechaColombia(fecha);
  const [anio, mes, dia] = hoyStr.split('-').map(Number);
  const fechaMananaUtc = new Date(Date.UTC(anio, mes - 1, dia + 1, 12, 0, 0));
  return obtenerFechaColombia(fechaMananaUtc);
}

// Retorna la hora actual en Colombia en formato HH:mm:ss (00:00:00 a 23:59:59)
export function obtenerHoraColombia(fecha = new Date()) {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).format(d).replace(/^24:/, '00:');
}

// Retorna fecha y hora combinada en Colombia en formato YYYY-MM-DD HH:mm:ss
export function obtenerFechaHoraColombia(fecha = new Date()) {
  return `${obtenerFechaColombia(fecha)} ${obtenerHoraColombia(fecha)}`;
}

// Retorna la fecha de pasado manana en Colombia en formato YYYY-MM-DD
export function obtenerFechaPasadoMananaColombia(fecha = new Date()) {
  const hoyStr = obtenerFechaColombia(fecha);
  const [anio, mes, dia] = hoyStr.split('-').map(Number);
  const fechaUtc = new Date(Date.UTC(anio, mes - 1, dia + 2, 12, 0, 0));
  return obtenerFechaColombia(fechaUtc);
}

// Retorna la fecha objetivo de reserva segun el ciclo oficial de las 10:30 PM (22:30:00):
// - Si hora <= 22:30:59 -> reserva para manana
// - Si hora >= 22:31:00 -> reserva para pasado manana (hoy + 2 dias)
export function obtenerFechaObjetivoReserva(fecha = new Date()) {
  const horaStr = obtenerHoraColombia(fecha);
  const [hh, mm] = horaStr.split(':').map(Number);
  const minutos = hh * 60 + mm;
  if (minutos <= 1350) {
    return obtenerFechaMananaColombia(fecha);
  } else {
    return obtenerFechaPasadoMananaColombia(fecha);
  }
}

// Horarios oficiales de servicio y apertura de turno en Colombia (America/Bogota)
// El boton "Iniciar Turno" se habilita exactamente 10 minutos antes de cada servicio:
// - Desayuno: Turno 05:50 - 07:00 | Comida: 06:00 - 07:00
// - Almuerzo: Turno 11:20 - 13:30 | Comida: 11:30 - 13:30
// - Cena:     Turno 17:50 - 19:00 | Comida: 18:00 - 19:00
export const HORARIOS_OFICIALES = {
  Desayuno: {
    inicioTurno: '05:50',
    inicioServicio: '06:00',
    finServicio: '07:00',
    inicioTurnoMin: 5 * 60 + 50,     // 350
    inicioServicioMin: 6 * 60,       // 360
    finMin: 7 * 60,                  // 420
    rangoTexto: '06:00 - 07:00',
    ventanaTurnoTexto: '05:50 - 07:00'
  },
  Almuerzo: {
    inicioTurno: '11:20',
    inicioServicio: '11:30',
    finServicio: '13:30',
    inicioTurnoMin: 11 * 60 + 20,    // 680
    inicioServicioMin: 11 * 60 + 30, // 690
    finMin: 13 * 60 + 30,            // 810
    rangoTexto: '11:30 - 13:30',
    ventanaTurnoTexto: '11:20 - 13:30'
  },
  Cena: {
    inicioTurno: '17:50',
    inicioServicio: '18:00',
    finServicio: '19:00',
    inicioTurnoMin: 17 * 60 + 50,    // 1070
    inicioServicioMin: 18 * 60,      // 1080
    finMin: 19 * 60,                 // 1140
    rangoTexto: '18:00 - 19:00',
    ventanaTurnoTexto: '17:50 - 19:00'
  }
};

// Determina el turno actual de comida segun la hora oficial en Colombia (incluyendo los 10 min previos de apertura)
export function obtenerTurnoActualColombia(fecha = new Date()) {
  const horaStr = obtenerHoraColombia(fecha);
  const [hh, mm] = horaStr.split(':').map(Number);
  const minutosTotales = hh * 60 + mm;

  if (minutosTotales >= HORARIOS_OFICIALES.Desayuno.inicioTurnoMin && minutosTotales <= HORARIOS_OFICIALES.Desayuno.finMin) {
    return 'Desayuno';
  }
  if (minutosTotales >= HORARIOS_OFICIALES.Almuerzo.inicioTurnoMin && minutosTotales <= HORARIOS_OFICIALES.Almuerzo.finMin) {
    return 'Almuerzo';
  }
  if (minutosTotales >= HORARIOS_OFICIALES.Cena.inicioTurnoMin && minutosTotales <= HORARIOS_OFICIALES.Cena.finMin) {
    return 'Cena';
  }
  return null;
}

// Verifica si la hora actual en Colombia esta dentro de la ventana habilitada para iniciar turno (10 min antes hasta fin del turno)
export function verificarVentanaInicioTurno(fecha = new Date()) {
  const horaActual = obtenerHoraColombia(fecha).slice(0, 5);
  const turno = obtenerTurnoActualColombia(fecha);
  if (turno) {
    return {
      permitido: true,
      turno,
      horario: HORARIOS_OFICIALES[turno],
      horaActual
    };
  }
  return {
    permitido: false,
    turno: null,
    horario: null,
    horaActual,
    mensaje: `El botón "Iniciar Turno" solo se habilita 10 minutos antes de cada servicio oficial: Desayuno (05:50 - 07:00), Almuerzo (11:20 - 13:30) y Cena (17:50 - 19:00). Hora actual en Colombia: ${horaActual}.`
  };
}

export default {
  HORARIOS_OFICIALES,
  obtenerFechaColombia,
  obtenerFechaMananaColombia,
  obtenerFechaPasadoMananaColombia,
  obtenerFechaObjetivoReserva,
  obtenerHoraColombia,
  obtenerFechaHoraColombia,
  obtenerTurnoActualColombia,
  verificarVentanaInicioTurno
};
