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
  obtenerHoraColombia,
  obtenerFechaHoraColombia,
  obtenerTurnoActualColombia
};
