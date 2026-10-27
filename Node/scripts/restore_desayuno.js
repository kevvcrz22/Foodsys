import db from '../Database/db.js';

async function main() {
  const [res] = await db.query(`
    UPDATE reservas 
    SET Est_Reserva = 'Generado' 
    WHERE Fec_Reserva = '2026-10-27' 
      AND Tip_Reserva = 'Desayuno' 
      AND Est_Reserva = 'Vencido'
  `);
  console.log('Reservas de desayuno de hoy restauradas a Generado:', res.affectedRows);

  // Asegurar que ningun usuario quedo sancionado por este error
  const [resSan] = await db.query(`
    UPDATE usuarios 
    SET San_Usuario = 'No' 
    WHERE San_Usuario = 'Si'
  `);
  console.log('Usuarios desancionados:', resSan.affectedRows);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
