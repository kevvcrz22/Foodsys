// Services/VencimientoService.js
//
// Responsabilidad: al terminar cada turno o bajo demanda en tiempo real,
// marcar como Vencido todas las reservas que quedaron en Generado o Verificado,
// y evaluar las reglas de sanción automática:
//
// 1. APRENDIZ / PASANTE INTERNO:
//    - Sanción si reservó Desayuno, Almuerzo y Cena y dejó vencer las 3 en el mismo día.
//
// 2. APRENDIZ / PASANTE EXTERNO:
//    - Sanción si acumula 3 inasistencias de Almuerzo en la misma semana (lunes a domingo).
//
// 3. REINICIO SEMANAL Y REVOCACIÓN:
//    - El conteo de inasistencias opera de lunes a domingo.
//    - Si un usuario tiene 1 o 2 inasistencias (no sancionado), al cambiar la semana su contador vuelve a 0.
//    - Si un usuario queda sancionado (San_Usuario = 'Si'), permanece sancionado hasta que
//      Bienestar, Coordinador o Admin le levante la sanción manualmente.
//    - Al levantarse la sanción (San_Usuario = 'No'), su Fec_Desancion se actualiza y su contador vuelve a 0.

import { Op } from "sequelize";
import db from "../Database/db.js";
import ReservaModel from "../Models/ReservasModel.js";
import UsuariosModel from "../Models/UsuariosModel.js";
import UsuariosRolModel from "../Models/UsuariosRolModel.js";
import RolesModel from "../Models/RolesModel.js";
import { notificarCambioReservas } from "./SocketService.js";

class VencimientoService {

  // Retorna el rango de fechas [lunes, domingo] de la semana actual (zona horaria Bogotá UTC-5)
  getRangoSemana(fechaRef = new Date()) {
    const d = new Date(fechaRef);
    const day = d.getDay(); // 0: Domingo, 1: Lunes, ..., 6: Sábado
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const lunes = new Date(d);
    lunes.setDate(d.getDate() + diffToMonday);
    lunes.setHours(0, 0, 0, 0);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    domingo.setHours(23, 59, 59, 999);

    const pad = (n) => String(n).padStart(2, '0');
    const lunesStr = `${lunes.getFullYear()}-${pad(lunes.getMonth() + 1)}-${pad(lunes.getDate())}`;
    const domingoStr = `${domingo.getFullYear()}-${pad(domingo.getMonth() + 1)}-${pad(domingo.getDate())}`;

    return {
      inicioSemanaDate: lunes,
      finSemanaDate: domingo,
      inicioSemanaStr: lunesStr,
      finSemanaStr: domingoStr
    };
  }

  // Determina si una reserva dada ya expiró según la fecha y hora actual
  esReservaExpirada(reserva, ahora = new Date()) {
    const hoyStr = ahora.toISOString().split('T')[0];

    // Si la fecha de la reserva es anterior a hoy, está definitivamente vencida
    if (reserva.Fec_Reserva < hoyStr) return true;

    // Si la fecha es hoy, comprobar la hora de cierre del servicio
    if (reserva.Fec_Reserva === hoyStr) {
      if (reserva.Vec_Reserva) {
        return new Date(reserva.Vec_Reserva) <= ahora;
      }
      // Horas límite de cada turno (Bogotá UTC-5)
      const horasCierre = {
        Desayuno: { h: 7, m: 0 },
        Almuerzo: { h: 14, m: 5 }, // 14:05 fin del servicio
        Cena: { h: 19, m: 0 }
      };
      const cierre = horasCierre[reserva.Tip_Reserva];
      if (cierre) {
        const horaCierreDate = new Date();
        horaCierreDate.setHours(cierre.h, cierre.m, 0, 0);
        return ahora >= horaCierreDate;
      }
    }

    return false;
  }

  // Procesa y marca como Vencido todas las reservas abiertas que ya pasaron su hora límite,
  // y actualiza las sanciones en tiempo real en la base de datos.
  async procesarVencimientosGlobales(transaction = null) {
    const ahora = new Date();

    const ejecutar = async (t) => {
      const reservasAbiertas = await ReservaModel.findAll({
        where: {
          Est_Reserva: { [Op.in]: ['Generado', 'Verificado'] }
        },
        transaction: t
      });

      const reservasExpiradas = reservasAbiertas.filter(r => this.esReservaExpirada(r, ahora));

      if (reservasExpiradas.length > 0) {
        const idsVencidos = reservasExpiradas.map(r => r.Id_Reserva);
        await ReservaModel.update(
          { Est_Reserva: 'Vencido' },
          { where: { Id_Reserva: { [Op.in]: idsVencidos } }, transaction: t }
        );
      }

      // Evaluar sanciones para todos los usuarios con reservas que expiraron
      const idsUsuarios = [...new Set(reservasExpiradas.map(r => r.Id_Usuario))];
      const usuariosSancionados = [];

      for (const idUsuario of idsUsuarios) {
        const estado = await this.evaluarInasistenciasUsuario(idUsuario, t);
        if (estado.debeSancionar) {
          await UsuariosModel.update(
            { San_Usuario: 'Si' },
            { where: { Id_Usuario: idUsuario }, transaction: t }
          );
          usuariosSancionados.push({
            Id_Usuario: idUsuario,
            Nom_Usuario: estado.Nom_Usuario,
            motivo: estado.motivoSancion
          });
        }
      }

      return {
        vencidas: reservasExpiradas.length,
        sancionados: usuariosSancionados.length,
        usuariosSancionados
      };
    };

    if (transaction) {
      return await ejecutar(transaction);
    } else {
      return await db.transaction(async (t) => await ejecutar(t));
    }
  }

  // Procesa vencimientos específicos de un usuario antes de cualquier operación (Lazy evaluation)
  async procesarVencimientosUsuario(Id_Usuario, transaction = null) {
    const ahora = new Date();

    const ejecutar = async (t) => {
      const reservasAbiertas = await ReservaModel.findAll({
        where: {
          Id_Usuario,
          Est_Reserva: { [Op.in]: ['Generado', 'Verificado'] }
        },
        transaction: t
      });

      const reservasExpiradas = reservasAbiertas.filter(r => this.esReservaExpirada(r, ahora));

      if (reservasExpiradas.length > 0) {
        const idsVencidos = reservasExpiradas.map(r => r.Id_Reserva);
        await ReservaModel.update(
          { Est_Reserva: 'Vencido' },
          { where: { Id_Reserva: { [Op.in]: idsVencidos } }, transaction: t }
        );
      }

      // Evaluar sanción para este usuario
      const estado = await this.evaluarInasistenciasUsuario(Id_Usuario, t);
      if (estado.debeSancionar) {
        await UsuariosModel.update(
          { San_Usuario: 'Si' },
          { where: { Id_Usuario }, transaction: t }
        );
        console.log(`[VencimientoService] Sanción APLICADA a usuario #${Id_Usuario}: ${estado.motivoSancion}`);
      }

      return estado;
    };

    if (transaction) {
      return await ejecutar(transaction);
    } else {
      return await db.transaction(async (t) => await ejecutar(t));
    }
  }

  // Evalúa el estado de inasistencias y necesidad de sanción de un usuario en la semana actual
  async evaluarInasistenciasUsuario(Id_Usuario, transaction = null) {
    const usuario = await UsuariosModel.findByPk(Id_Usuario, { transaction });

    if (!usuario) {
      throw new Error(`Usuario con ID ${Id_Usuario} no encontrado`);
    }

    // Obtener roles del usuario de manera desacoplada y segura
    const asignacionesRol = await UsuariosRolModel.findAll({
      where: { Id_Usuario },
      transaction
    });
    const idsRoles = asignacionesRol.map(r => r.Id_Rol).filter(Boolean);

    let nombresRoles = [];
    if (idsRoles.length > 0) {
      const roles = await RolesModel.findAll({
        where: { Id_Rol: { [Op.in]: idsRoles } },
        transaction
      });
      nombresRoles = roles.map(r => r.Nom_Rol).filter(Boolean);
    }

    const esInterno = nombresRoles.some(r => r === 'Aprendiz Interno' || r === 'Pasante Interno');
    const esExterno = nombresRoles.some(r => r === 'Aprendiz Externo' || r === 'Pasante Externo');

    const { inicioSemanaDate, inicioSemanaStr, finSemanaStr } = this.getRangoSemana();

    // Consultar todas las reservas del usuario en la semana actual
    const reservasSemana = await ReservaModel.findAll({
      where: {
        Id_Usuario,
        Fec_Reserva: { [Op.between]: [inicioSemanaStr, finSemanaStr] }
      },
      order: [['Fec_Reserva', 'ASC'], ['Id_Reserva', 'ASC']],
      transaction
    });

    // Filtrar inasistencias válidas (excluir las previas a una desanción si ocurrió en esta misma semana)
    const fecDesancion = usuario.Fec_Desancion ? new Date(usuario.Fec_Desancion) : null;
    const huboDesancionEstaSemana = fecDesancion && fecDesancion >= inicioSemanaDate;

    const reservasVencidasSemana = reservasSemana.filter(reserva => {
      if (reserva.Est_Reserva !== 'Vencido') return false;

      // Si se levantó la sanción en esta semana, solo contar vencimientos posteriores a la desanción
      if (huboDesancionEstaSemana) {
        const fechaReservaDate = new Date(`${reserva.Fec_Reserva}T23:59:59`);
        if (fechaReservaDate < fecDesancion) return false;
      }
      return true;
    });

    // Validar Regla 1 (Internos): 3 comidas (Desayuno, Almuerzo, Cena) vencidas en el mismo día
    let tripleFallaMismoDia = false;
    let fechaTripleFalla = null;

    if (esInterno) {
      // Agrupar reservas por fecha
      const reservasPorFecha = {};
      reservasSemana.forEach(r => {
        if (!reservasPorFecha[r.Fec_Reserva]) reservasPorFecha[r.Fec_Reserva] = [];
        reservasPorFecha[r.Fec_Reserva].push(r);
      });

      for (const [fecha, list] of Object.entries(reservasPorFecha)) {
        if (huboDesancionEstaSemana) {
          const fechaDate = new Date(`${fecha}T23:59:59`);
          if (fechaDate < fecDesancion) continue;
        }

        const tieneDesayunoVencido = list.some(r => r.Tip_Reserva === 'Desayuno' && r.Est_Reserva === 'Vencido');
        const tieneAlmuerzoVencido = list.some(r => r.Tip_Reserva === 'Almuerzo' && r.Est_Reserva === 'Vencido');
        const tieneCenaVencida = list.some(r => r.Tip_Reserva === 'Cena' && r.Est_Reserva === 'Vencido');

        if (tieneDesayunoVencido && tieneAlmuerzoVencido && tieneCenaVencida) {
          tripleFallaMismoDia = true;
          fechaTripleFalla = fecha;
          break;
        }
      }
    }

    // Calcular inasistencias efectivas según el rol
    let inasistenciasValidas = [];
    if (esInterno) {
      inasistenciasValidas = reservasVencidasSemana;
    } else if (esExterno) {
      // Los externos solo tienen almuerzo
      inasistenciasValidas = reservasVencidasSemana.filter(r => r.Tip_Reserva === 'Almuerzo');
    } else {
      inasistenciasValidas = reservasVencidasSemana;
    }

    const totalInasistencias = inasistenciasValidas.length;
    const estaSancionado = usuario.San_Usuario === 'Si';

    // Determinar si debe sancionarse automáticamente
    let debeSancionar = false;
    let motivoSancion = null;

    if (!estaSancionado) {
      if (esInterno && tripleFallaMismoDia) {
        debeSancionar = true;
        motivoSancion = `Dejó vencer las 3 comidas (Desayuno, Almuerzo, Cena) en el mismo día (${fechaTripleFalla}).`;
      } else if (esExterno && totalInasistencias >= 3) {
        debeSancionar = true;
        motivoSancion = `Acumuló ${totalInasistencias} inasistencias de almuerzo durante la semana actual.`;
      }
    }

    return {
      Id_Usuario: usuario.Id_Usuario,
      Nom_Usuario: `${usuario.Nom_Usuario} ${usuario.Ape_Usuario}`,
      estaSancionado,
      esInterno,
      esExterno,
      inasistenciasSemana: Math.min(totalInasistencias, 3),
      totalInasistencias,
      maxInasistencias: 3,
      tripleFallaMismoDia,
      fechaTripleFalla,
      debeSancionar,
      motivoSancion,
      fecDesancion: usuario.Fec_Desancion,
      detalle: inasistenciasValidas.map(r => ({
        Id_Reserva: r.Id_Reserva,
        Fec_Reserva: r.Fec_Reserva,
        Tip_Reserva: r.Tip_Reserva,
        Est_Reserva: r.Est_Reserva
      }))
    };
  }

  // Tipo: 'Desayuno' | 'Almuerzo' | 'Cena'
  // Cierra el turno marcando reservas como Vencido y evaluando sanciones automáticas.
  async vencerTurno(tipo) {
    const hoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const resultado = await db.transaction(async (transaction) => {

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
        return { tipo, vencidas: 0, sancionados: 0, usuariosEvaluados: 0 };
      }

      // 2. Marcar todas como Vencido en un solo UPDATE
      const idsReservas = reservasAbiertas.map(r => r.Id_Reserva);
      await ReservaModel.update(
        { Est_Reserva: 'Vencido' },
        { where: { Id_Reserva: { [Op.in]: idsReservas } }, transaction }
      );

      // 3. Obtener IDs únicos de usuarios afectados
      const idsUsuarios = [...new Set(reservasAbiertas.map(r => r.Id_Usuario))];
      const usuariosSancionados = [];

      // 4. Evaluar reglas de sanción para cada usuario afectado
      for (const idUsuario of idsUsuarios) {
        const estado = await this.evaluarInasistenciasUsuario(idUsuario, transaction);

        if (estado.debeSancionar) {
          await UsuariosModel.update(
            { San_Usuario: 'Si' },
            { where: { Id_Usuario: idUsuario }, transaction }
          );
          usuariosSancionados.push({
            Id_Usuario: idUsuario,
            Nom_Usuario: estado.Nom_Usuario,
            motivo: estado.motivoSancion
          });
          console.log(
            `[VencimientoService] Sanción AUTOMÁTICA aplicada a usuario #${idUsuario} (${estado.Nom_Usuario}): ${estado.motivoSancion}`
          );
        } else {
          console.log(
            `[VencimientoService] Usuario #${idUsuario} (${estado.Nom_Usuario}) evaluado ` +
            `(Sancionado: ${estado.estaSancionado ? 'Si' : 'No'}).`
          );
        }
      }

      console.log(
        `[VencimientoService] Turno ${tipo} cerrado: ` +
        `${reservasAbiertas.length} reservas vencidas, ` +
        `${usuariosSancionados.length} usuarios sancionados automáticamente.`
      );

      return {
        tipo,
        vencidas: reservasAbiertas.length,
        sancionados: usuariosSancionados.length,
        usuariosSancionados,
        detalle: reservasAbiertas.map(r => ({
          Id_Reserva: r.Id_Reserva,
          Id_Usuario: r.Id_Usuario,
          estadoAnterior: r.Est_Reserva
        }))
      };
    });

    if (resultado.vencidas > 0) {
      notificarCambioReservas({ accion: "turno_vencido", tipo, sancionados: resultado.sancionados });
    }

    return resultado;
  }
}

export default new VencimientoService();