// Node/Services/TurnosService.js
// Servicio de gestión de turnos de supervisores en Foodsys.
// Regla de negocio estricta: Solo puede existir UN turno activo a la vez.

import TurnosModel from "../Models/TurnosModel.js";
import UsuariosModel from "../Models/UsuariosModel.js";
import ReservasModel from "../Models/ReservasModel.js";
import Servicio_Correo from "./Servicio_Correo.js";
import NotificacionesService from "./NotificacionesService.js";
import { getIO } from "./SocketService.js";
import { Op } from "sequelize";

class TurnosService {
  /**
   * Obtiene el turno activo actual, si existe
   */
  async obtenerTurnoActivo() {
    return await TurnosModel.findOne({
      where: { Estado: 'Activo' },
      include: [
        {
          model: UsuariosModel,
          as: 'supervisor',
          attributes: ['Id_Usuario', 'Nom_Usuario', 'Ape_Usuario', 'Cor_Usuario', 'NumDoc_Usuario']
        }
      ]
    });
  }

  /**
   * Inicia un nuevo turno para el supervisor.
   * Valida que no exista ningún otro turno activo en el sistema.
   */
  async iniciarTurno(idUsuario, observaciones = '') {
    const turnoActivoExistente = await this.obtenerTurnoActivo();

    if (turnoActivoExistente) {
      if (turnoActivoExistente.Id_Usuario === idUsuario) {
        return {
          mensaje: "Ya tienes un turno activo en curso.",
          turno: turnoActivoExistente,
          esNuevo: false
        };
      } else {
        const nombreOtro = turnoActivoExistente.supervisor
          ? `${turnoActivoExistente.supervisor.Nom_Usuario} ${turnoActivoExistente.supervisor.Ape_Usuario}`
          : "otro supervisor";
        throw new Error(`Ya existe un turno activo en el comedor a cargo de ${nombreOtro}. Solo puede haber un supervisor en turno a la vez.`);
      }
    }

    const supervisor = await UsuariosModel.findByPk(idUsuario);
    if (!supervisor) throw new Error("Supervisor no encontrado");

    const nuevoTurno = await TurnosModel.create({
      Id_Usuario: idUsuario,
      Fecha_Inicio: new Date(),
      Estado: 'Activo',
      Total_Consumos_Registrados: 0,
      Observaciones: observaciones || null
    });

    const turnoCompleto = await TurnosModel.findByPk(nuevoTurno.Id_Turno, {
      include: [
        {
          model: UsuariosModel,
          as: 'supervisor',
          attributes: ['Id_Usuario', 'Nom_Usuario', 'Ape_Usuario', 'Cor_Usuario', 'NumDoc_Usuario']
        }
      ]
    });

    const nombreSup = `${supervisor.Nom_Usuario || ''} ${supervisor.Ape_Usuario || ''}`.trim() || 'Supervisor';

    // 1. Notificación por correo al administrador institucional
    try {
      await Servicio_Correo.notificarInicioTurno(supervisor, turnoCompleto);
    } catch (errCorreo) {
      console.warn("[TurnosService] Nota sobre correo de inicio de turno:", errCorreo.message);
    }

    // 2. Notificación in-app (Campanita)
    await NotificacionesService.crearNotificacion({
      Id_Usuario: null,
      Rol_Destino: 'Todos',
      Titulo: 'Turno de Supervisor Iniciado',
      Mensaje: `${nombreSup} ha iniciado turno de supervisión en el comedor.`,
      Tipo: 'info'
    });

    // 3. Emisión por WebSockets en tiempo real
    const io = getIO();
    if (io) {
      io.emit('turno:iniciado', turnoCompleto);
    }

    return {
      mensaje: "Turno iniciado correctamente.",
      turno: turnoCompleto,
      esNuevo: true
    };
  }

  /**
   * Finaliza el turno activo del supervisor
   */
  async finalizarTurno(idUsuario, observaciones = '') {
    const turnoActivo = await this.obtenerTurnoActivo();

    if (!turnoActivo) {
      throw new Error("No hay ningún turno activo para finalizar.");
    }

    // Calcular cantidad de consumos registrados durante este turno
    const totalConsumosEnVentana = await ReservasModel.count({
      where: {
        Est_Reserva: 'Consumido',
        updatedAt: {
          [Op.gte]: turnoActivo.Fecha_Inicio
        }
      }
    });

    const totalFinal = Math.max(turnoActivo.Total_Consumos_Registrados || 0, totalConsumosEnVentana);

    const obsFinal = observaciones
      ? (turnoActivo.Observaciones ? `${turnoActivo.Observaciones} | Cierre: ${observaciones}` : observaciones)
      : turnoActivo.Observaciones;

    await TurnosModel.update(
      {
        Estado: 'Finalizado',
        Fecha_Fin: new Date(),
        Total_Consumos_Registrados: totalFinal,
        Observaciones: obsFinal
      },
      { where: { Id_Turno: turnoActivo.Id_Turno } }
    );

    const turnoFinalizado = await TurnosModel.findByPk(turnoActivo.Id_Turno, {
      include: [
        {
          model: UsuariosModel,
          as: 'supervisor',
          attributes: ['Id_Usuario', 'Nom_Usuario', 'Ape_Usuario', 'Cor_Usuario', 'NumDoc_Usuario']
        }
      ]
    });

    const supervisor = turnoFinalizado.supervisor || await UsuariosModel.findByPk(turnoActivo.Id_Usuario);
    const nombreSup = supervisor ? `${supervisor.Nom_Usuario} ${supervisor.Ape_Usuario}` : 'Supervisor';

    // 1. Notificación por correo con resumen del turno
    try {
      await Servicio_Correo.notificarFinTurno(supervisor, turnoFinalizado);
    } catch (errCorreo) {
      console.warn("[TurnosService] Nota sobre correo de cierre de turno:", errCorreo.message);
    }

    // 2. Notificación in-app (Campanita)
    await NotificacionesService.crearNotificacion({
      Id_Usuario: null,
      Rol_Destino: 'Todos',
      Titulo: 'Turno de Supervisor Finalizado',
      Mensaje: `${nombreSup} ha finalizado su turno con ${totalFinal} consumos registrados.`,
      Tipo: 'exito'
    });

    // 3. Emisión por WebSockets
    const io = getIO();
    if (io) {
      io.emit('turno:finalizado', turnoFinalizado);
    }

    return {
      mensaje: "Turno finalizado exitosamente.",
      turno: turnoFinalizado
    };
  }

  /**
   * Incrementa el contador de consumos del turno activo cuando se registra un consumo
   */
  async incrementarConsumoTurnoActivo() {
    try {
      const turnoActivo = await TurnosModel.findOne({ where: { Estado: 'Activo' } });
      if (turnoActivo) {
        await TurnosModel.increment('Total_Consumos_Registrados', {
          by: 1,
          where: { Id_Turno: turnoActivo.Id_Turno }
        });
      }
    } catch (err) {
      console.warn("[TurnosService] No se pudo incrementar consumo en turno activo:", err.message);
    }
  }

  /**
   * Obtiene el historial de turnos con paginación
   */
  async obtenerHistorial(limit = 20, offset = 0) {
    const { count, rows } = await TurnosModel.findAndCountAll({
      include: [
        {
          model: UsuariosModel,
          as: 'supervisor',
          attributes: ['Id_Usuario', 'Nom_Usuario', 'Ape_Usuario', 'NumDoc_Usuario']
        }
      ],
      order: [['Fecha_Inicio', 'DESC']],
      limit: Number(limit) || 20,
      offset: Number(offset) || 0
    });

    return {
      total: count,
      turnos: rows
    };
  }
}

export default new TurnosService();
