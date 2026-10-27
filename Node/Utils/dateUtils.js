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

// Retorna la hora actual en Colombia en formato HH:mm:ss
export function obtenerHoraColombia(fecha = new Date()) {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(d);
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

// Determina el turno actual de comida segun la hora oficial en Colombia
export function obtenerTurnoActualColombia() {
  const horaStr = obtenerHoraColombia();
  const [hh, mm] = horaStr.split(':').map(Number);
  const minutosTotales = hh * 60 + mm;

  // Desayuno: 06:00 a 09:00 (360 a 540 minutos)
  if (minutosTotales >= 360 && minutosTotales < 540) {
    return 'Desayuno';
  }
  // Almuerzo: 11:00 a 14:30 (660 a 870 minutos)
  if (minutosTotales >= 660 && minutosTotales < 870) {
    return 'Almuerzo';
  }
  // Cena: 17:30 a 20:30 (1050 a 1230 minutos)
  if (minutosTotales >= 1050 && minutosTotales < 1230) {
    return 'Cena';
  }
  // Fuera de horario estricto, retorna null o el turno mas cercano
  return null;
}

export default {
  obtenerFechaColombia,
  obtenerFechaMananaColombia,
  obtenerFechaPasadoMananaColombia,
  obtenerFechaObjetivoReserva,
  obtenerHoraColombia,
  obtenerFechaHoraColombia,
  obtenerTurnoActualColombia
};
