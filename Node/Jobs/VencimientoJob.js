// Node/Jobs/VencimientoJob.js
// Cron que dispara VencimientoService al terminar cada turno, sincroniza fichas vencidas
// y ejecuta la limpieza semanal de inasistencias los domingos a las 23:59.
// Horarios oficiales:
// - Desayuno Lunes a Viernes -> 07:00 (cron: '0 7 * * 1-5')
// - Desayuno Sabado y Domingo -> 09:00 (cron: '0 9 * * 0,6')
// - Almuerzo -> 14:00 (cron: '0 14 * * *', se actualizo de 13:30 a 14:00)
// - Cena -> 19:00 (cron: '0 19 * * *')
// - Limpieza de inasistencias Domingo 23:59 -> (cron: '59 23 * * 0')
// - Fichas -> 00:05 (cron: '5 0 * * *') y al arrancar el servidor

import cron from 'node-cron';
import VencimientoService from '../Services/VencimientoService.js';
import { sincronizarTodasLasFichasVencidas } from '../Services/FichasServices.js';
import AsignacionSupervisorService from '../Services/AsignacionSupervisorService.js';

/**
 * Ejecuta la sincronizacion inicial de fichas con etapa lectiva vencida.
 */
export async function sincronizarFichasAlInicio() {
  try {
    console.log('[VencimientoJob] Sincronizando fichas con etapa lectiva vencida al iniciar...');
    await sincronizarTodasLasFichasVencidas();
    await AsignacionSupervisorService.revisarYRevertirVencidos();
  } catch (err) {
    console.warn('[VencimientoJob] Nota sobre sincronizacion de fichas al arrancar:', err.message);
  }
}

// Sincronizacion diaria de fichas vencidas y revision de supervisores a las 00:05 AM (Bogota UTC-5)
cron.schedule('5 0 * * *', async () => {
  console.log('[VencimientoJob] Ejecutando sincronizacion diaria de fichas y supervisores (00:05 AM)...');
  try {
    await sincronizarTodasLasFichasVencidas();
    await AsignacionSupervisorService.revisarYRevertirVencidos();
  } catch (err) {
    console.error('[VencimientoJob] Error en sincronizacion de fichas:', err.message);
  }
}, { timezone: 'America/Bogota' });

// Desayuno Lunes a Viernes: se ejecuta a las 07:00 AM
cron.schedule('0 7 * * 1-5', async () => {
  console.log('[VencimientoJob] Cerrando turno Desayuno (Lunes a Viernes 07:00 AM)...');
  try {
    await VencimientoService.vencerTurno('Desayuno');
  } catch (err) {
    console.error('[VencimientoJob] Error en Desayuno L-V:', err.message);
  }
}, { timezone: 'America/Bogota' });

// Desayuno Sabado y Domingo: se ejecuta a las 09:00 AM
cron.schedule('0 9 * * 0,6', async () => {
  console.log('[VencimientoJob] Cerrando turno Desayuno Fin de Semana (Sab-Dom 09:00 AM)...');
  try {
    await VencimientoService.vencerTurno('Desayuno');
  } catch (err) {
    console.error('[VencimientoJob] Error en Desayuno Fin de Semana:', err.message);
  }
}, { timezone: 'America/Bogota' });

// Almuerzo: se ejecuta exactamente a las 14:00 (02:00 PM)
cron.schedule('0 14 * * *', async () => {
  console.log('[VencimientoJob] Cerrando turno Almuerzo (14:00 PM)...');
  try {
    await VencimientoService.vencerTurno('Almuerzo');
  } catch (err) {
    console.error('[VencimientoJob] Error en Almuerzo:', err.message);
  }
}, { timezone: 'America/Bogota' });

// Cena: se ejecuta exactamente a las 19:00 (07:00 PM)
cron.schedule('0 19 * * *', async () => {
  console.log('[VencimientoJob] Cerrando turno Cena (19:00 PM)...');
  try {
    await VencimientoService.vencerTurno('Cena');
  } catch (err) {
    console.error('[VencimientoJob] Error en Cena:', err.message);
  }
}, { timezone: 'America/Bogota' });

// Limpieza de Inasistencias semanal: Domingo a las 23:59 PM
// Limpia inasistencias y desanciona a todos los usuarios para habilitar reservas de la nueva semana
cron.schedule('59 23 * * 0', async () => {
  console.log('[VencimientoJob] Ejecutando limpieza semanal de inasistencias (Domingo 23:59 PM)...');
  try {
    await VencimientoService.limpiarInasistenciasSemanal();
  } catch (err) {
    console.error('[VencimientoJob] Error en limpieza semanal de inasistencias:', err.message);
  }
}, { timezone: 'America/Bogota' });

console.log('[VencimientoJob] Jobs de vencimiento, horarios oficiales y limpieza dominical registrados (Bogota UTC-5).');
