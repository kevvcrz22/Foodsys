// Node/Jobs/VencimientoJob.js
// Cron que dispara VencimientoService al terminar cada turno y sincroniza fichas vencidas
// Desayuno -> 07:00 (cron: '0 7 * * *')
// Almuerzo  -> 13:30 (cron: '30 13 * * *')
// Cena      -> 19:00 (cron: '0 19 * * *')
// Fichas    -> 00:05 (cron: '5 0 * * *') y al arrancar el servidor
// Codigo didactico sin tildes ni emojis para aprendices de primer semestre

import cron from 'node-cron';
import VencimientoService from '../Services/VencimientoService.js';
import { sincronizarTodasLasFichasVencidas } from '../Services/FichasServices.js';

import ProgramaModel from '../Models/ProgramaModel.js';
import FichasModel from '../Models/FichasModel.js';
import UsuariosModel from '../Models/UsuariosModel.js';

/**
 * Auto-reparación preventiva para asegurar que ningún aprendiz quede sin ficha ni programa.
 * Vincula aprendices huérfanos a la FICHA GENERAL SENA (9999999).
 */
export async function repararAprendicesSinFicha() {
  try {
    const aprendicesSinFicha = await UsuariosModel.findAll({
      where: { Id_Ficha: null }
    });

    if (aprendicesSinFicha.length > 0) {
      console.log(`[AutoReparacion] Se detectaron ${aprendicesSinFicha.length} aprendices sin ficha vinculada. Resolviendo cadena institucional...`);
      
      let progGeneral = await ProgramaModel.findOne({ where: { Nom_Programa: 'PROGRAMA GENERAL' } });
      if (!progGeneral) {
        progGeneral = await ProgramaModel.create({
          Nom_Programa: 'PROGRAMA GENERAL',
          Are_Programa: 'GENERAL',
          NivFor_Programa: 'TECNOLOGO',
          Est_Programa: 'Activo'
        });
      }

      let fichaGeneral = await FichasModel.findOne({ where: { Num_Ficha: 9999999 } });
      if (!fichaGeneral) {
        const hoy = new Date();
        const unAnio = new Date(hoy.getTime() + 365 * 24 * 60 * 60 * 1000);
        fichaGeneral = await FichasModel.create({
          Num_Ficha: 9999999,
          Id_Programa: progGeneral.Id_Programa,
          FecIniLec_Ficha: hoy,
          FecFinLec_Ficha: unAnio,
          FecIniPra_Ficha: unAnio,
          FecFinPra_Ficha: new Date(hoy.getTime() + 547 * 24 * 60 * 60 * 1000)
        });
      }

      await UsuariosModel.update(
        { Id_Ficha: fichaGeneral.Id_Ficha },
        { where: { Id_Ficha: null } }
      );
      console.log(`[AutoReparacion] ¡Éxito! ${aprendicesSinFicha.length} aprendices vinculados a Ficha 9999999 (PROGRAMA GENERAL).`);
    }
  } catch (errReparacion) {
    console.warn('[AutoReparacion] Nota al reparar aprendices sin ficha:', errReparacion.message);
  }
}

/**
 * Ejecuta la sincronizacion inicial de fichas con etapa lectiva vencida.
 * Se debe invocar una vez las asociaciones de Sequelize esten inicializadas.
 */
export async function sincronizarFichasAlInicio() {
  try {
    console.log('[VencimientoJob] Sincronizando fichas con etapa lectiva vencida al iniciar...');
    await sincronizarTodasLasFichasVencidas();
    await repararAprendicesSinFicha();
  } catch (err) {
    console.warn('[VencimientoJob] Nota sobre sincronizacion de fichas al arrancar:', err.message);
  }
}

// Sincronizacion diaria de fichas vencidas a las 00:05 AM (Bogota UTC-5)
cron.schedule('5 0 * * *', async () => {
  console.log('[VencimientoJob] Ejecutando sincronizacion diaria de fichas vencidas (00:05 AM)...');
  try {
    await sincronizarTodasLasFichasVencidas();
  } catch (err) {
    console.error('[VencimientoJob] Error en sincronizacion de fichas:', err.message);
  }
}, { timezone: 'America/Bogota' });

// Desayuno: se ejecuta exactamente a las 07:00
cron.schedule('0 7 * * *', async () => {
  console.log('[VencimientoJob] Cerrando turno Desayuno...');
  try {
    await VencimientoService.vencerTurno('Desayuno');
  } catch (err) {
    console.error('[VencimientoJob] Error en Desayuno:', err.message);
  }
}, { timezone: 'America/Bogota' });

// Almuerzo: se ejecuta exactamente a las 13:30
cron.schedule('30 13 * * *', async () => {
  console.log('[VencimientoJob] Cerrando turno Almuerzo...');
  try {
    await VencimientoService.vencerTurno('Almuerzo');
  } catch (err) {
    console.error('[VencimientoJob] Error en Almuerzo:', err.message);
  }
}, { timezone: 'America/Bogota' });

// Cena: se ejecuta exactamente a las 19:00
cron.schedule('0 19 * * *', async () => {
  console.log('[VencimientoJob] Cerrando turno Cena...');
  try {
    await VencimientoService.vencerTurno('Cena');
  } catch (err) {
    console.error('[VencimientoJob] Error en Cena:', err.message);
  }
}, { timezone: 'America/Bogota' });

console.log('[VencimientoJob] Jobs de vencimiento y sincronizacion registrados (Bogota UTC-5).');