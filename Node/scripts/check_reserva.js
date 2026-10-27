import db from '../Database/db.js';

async function main() {
  const [sancionados] = await db.query("SELECT Id_Usuario, Nom_Usuario, Ape_Usuario, San_Usuario FROM usuarios WHERE San_Usuario = 'Si'");
  console.log('Sancionados actualmente:', sancionados.length, sancionados);

  const [vencidosHoy] = await db.query("SELECT Id_Reserva, Id_Usuario, Tip_Reserva, Est_Reserva FROM reservas WHERE Fec_Reserva = '2026-10-27' AND Est_Reserva = 'Vencido'");
  console.log('Vencidos hoy:', vencidosHoy.length, vencidosHoy);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
