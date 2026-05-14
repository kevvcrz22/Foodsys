// Services/VencimientoService.js
//
// Responsabilidad: al terminar cada turno, marcar como Vencido
// todas las reservas que quedaron en Generado o Verificado,
// y sancionar al usuario dueño de cada una (San_Usuario → 'Si').
//
// Este servicio NO tiene lógica HTTP; solo es llamado por VencimientoJob.js.

import { Op } from "sequelize";
import db from "../Database/db.js";
import ReservaModel from "../Models/ReservasModel.js";
import UsuariosModel from "../Models/UsuariosModel.js";

class VencimientoService {

  // Tipo: 'Desayuno' | 'Almuerzo' | 'Cena'
  // Retorna un resumen de cuántas reservas se vencieron y cuántos usuarios fueron sancionados.
  async vencerTurno(tipo) {
    const hoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    return await db.transaction(async (transaction) => {

      // 1. Buscar reservas del día de hoy de ese tipo que NO fueron consumidas ni canceladas
      const reservasAbiertas = await ReservaModel.findAll({
        where: {
          Fec_Reserva: hoy,
          Tip_Reserva: tipo,
          Est_Reserva: { [Op.in]: ['Generado', 'Verificado'] }
        },
        transaction
      });

      if (reservasAbiertas.length === 0) {
        return { tipo, vencidas: 0, sancionados: 0 };
      }

      // 2. Marcar todas como Vencido en un solo UPDATE (eficiente)
      const idsReservas = reservasAbiertas.map(r => r.Id_Reserva);
      await ReservaModel.update(
        { Est_Reserva: 'Vencido' },
        { where: { Id_Reserva: { [Op.in]: idsReservas } }, transaction }
      );

      // 3. Obtener IDs únicos de usuarios afectados
      const idsUsuarios = [...new Set(reservasAbiertas.map(r => r.Id_Usuario))];

      // 4. Sancionar a cada usuario (San_Usuario → 'Si')
      await UsuariosModel.update(
        { San_Usuario: 'Si' },
        { where: { Id_Usuario: { [Op.in]: idsUsuarios } }, transaction }
      );

      console.log(
        `[VencimientoService] Turno ${tipo} cerrado: ` +
        `${reservasAbiertas.length} reservas vencidas, ` +
        `${idsUsuarios.length} usuarios sancionados.`
      );

      return {
        tipo,
        vencidas: reservasAbiertas.length,
        sancionados: idsUsuarios.length,
        // Detalle para el resumen del supervisor
        detalle: reservasAbiertas.map(r => ({
          Id_Reserva: r.Id_Reserva,
          Id_Usuario: r.Id_Usuario,
          estadoAnterior: r.Est_Reserva
        }))
      };
    });
  }
}

export default new VencimientoService();