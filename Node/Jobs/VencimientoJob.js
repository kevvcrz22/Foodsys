// Jobs/VencimientoJob.js
//
// Cron que dispara VencimientoService al terminar cada turno:
//   Desayuno → 07:00  (cron: '0 7 * * *')
//   Almuerzo → 13:30  (cron: '30 13 * * *')
//   Cena     → 19:00  (cron: '0 19 * * *')
//
// Importar este archivo UNA SOLA VEZ en app.js para activar los jobs.

import cron from 'node-cron';
import VencimientoService from '../Services/VencimientoService.js';

// ─── Desayuno: se ejecuta exactamente a las 07:00 ───────────────
cron.schedule('0 7 * * *', async () => {
  console.log('[VencimientoJob] Cerrando turno Desayuno...');
  try {
    await VencimientoService.vencerTurno('Desayuno');
  } catch (err) {
    console.error('[VencimientoJob] Error en Desayuno:', err.message);
  }
}, { timezone: 'America/Bogota' });

// ─── Almuerzo: se ejecuta exactamente a las 13:30 ───────────────
cron.schedule('30 13 * * *', async () => {
  console.log('[VencimientoJob] Cerrando turno Almuerzo...');
  try {
    await VencimientoService.vencerTurno('Almuerzo');
  } catch (err) {
    console.error('[VencimientoJob] Error en Almuerzo:', err.message);
  }
}, { timezone: 'America/Bogota' });

// ─── Cena: se ejecuta exactamente a las 19:00 ───────────────────
cron.schedule('0 19 * * *', async () => {
  console.log('[VencimientoJob] Cerrando turno Cena...');
  try {
    await VencimientoService.vencerTurno('Cena');
  } catch (err) {
    console.error('[VencimientoJob] Error en Cena:', err.message);
  }
}, { timezone: 'America/Bogota' });

console.log('[VencimientoJob] Jobs de vencimiento registrados (Bogotá UTC-5).');