// Node/scripts/run_v6_migration.js
import db from '../Database/db.js';

async function run() {
  try {
    console.log('[Migracion v6] Aplicando modificacion a Est_Reserva en reservas...');
    await db.query(`ALTER TABLE reservas MODIFY COLUMN Est_Reserva VARCHAR(30) NOT NULL DEFAULT 'Generado'`);
    console.log('[Migracion v6] Est_Reserva modificado a VARCHAR(30).');

    const [updateRes] = await db.query(`
      UPDATE reservas 
      SET Est_Reserva = 'Liberado' 
      WHERE motivo_cesion LIKE 'BOLSA_SOLIDARIA%' AND (Est_Reserva = '' OR Est_Reserva = 'Cancelado')
    `);
    console.log('[Migracion v6] Reservas liberadas corregidas:', updateRes.affectedRows ?? updateRes.rowCount ?? 0);

    // Restaurar desayunos del dia si quedaron en Vencido antes de tiempo
    const fechaHoyCol = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const [desayunoRes] = await db.query(`
      UPDATE reservas
      SET Est_Reserva = 'Generado'
      WHERE Fec_Reserva = ? AND Tip_Reserva = 'Desayuno' AND Est_Reserva = 'Vencido'
    `, { replacements: [fechaHoyCol] });
    console.log(`[Migracion v6] Desayunos restaurados para ${fechaHoyCol}:`, desayunoRes.affectedRows ?? desayunoRes.rowCount ?? 0);

    console.log('[Migracion v6] Completada con exito.');
    process.exit(0);
  } catch (err) {
    console.error('[Migracion v6] Error:', err);
    process.exit(1);
  }
}

run();
