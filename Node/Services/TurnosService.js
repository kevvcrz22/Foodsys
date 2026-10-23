// Node/Services/TurnosService.js
// Servicio de gestion de turnos de supervisores en Foodsys
// Regla de negocio estricta: Solo puede existir UN turno activo a la vez
// Codigo comentado didacticamente sin tildes ni emojis para aprendices de primer semestre

import TurnosModel from "../Models/TurnosModel.js";
import UsuariosModel from "../Models/UsuariosModel.js";
import ReservasModel from "../Models/ReservasModel.js";
import FichasModel from "../Models/FichasModel.js";
import UsuariosRolModel from "../Models/UsuariosRolModel.js";
import RolesModel from "../Models/RolesModel.js";
import PlatosModels from "../Models/PlatosModels.js";
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
   * Valida que no exista ningun otro turno activo en el sistema.
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

    // 1. Notificacion por correo a fierrokkevin@gmail.com
    try {
      await Servicio_Correo.notificarInicioTurno(supervisor, turnoCompleto);
    } catch (errCorreo) {
      console.warn("[TurnosService] Nota sobre correo de inicio de turno:", errCorreo.message);
    }

    // 2. Notificaciones in-app (Campanita) para Administrador y Bienestar
    try {
      await NotificacionesService.crearNotificacion({
        Id_Usuario: null,
        Rol_Destino: 'Administrador',
        Titulo: 'Turno de Supervisor Iniciado',
        Mensaje: `${nombreSup} ha iniciado turno de supervision en el comedor.`,
        Tipo: 'info'
      });
      await NotificacionesService.crearNotificacion({
        Id_Usuario: null,
        Rol_Destino: 'Bienestar',
        Titulo: 'Turno de Supervisor Iniciado',
        Mensaje: `${nombreSup} ha iniciado turno de supervision en el comedor.`,
        Tipo: 'info'
      });
    } catch (errNotif) {
      console.warn("[TurnosService] Nota sobre notificacion in-app de inicio:", errNotif.message);
    }

    // 3. Emision por WebSockets en tiempo real
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
      throw new Error("No hay ningun turno activo para finalizar.");
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

    // 1. Notificacion por correo a fierrokkevin@gmail.com
    try {
      await Servicio_Correo.notificarFinTurno(supervisor, turnoFinalizado);
    } catch (errCorreo) {
      console.warn("[TurnosService] Nota sobre correo de cierre de turno:", errCorreo.message);
    }

    // 2. Notificaciones in-app (Campanita) para Administrador y Bienestar
    try {
      await NotificacionesService.crearNotificacion({
        Id_Usuario: null,
        Rol_Destino: 'Administrador',
        Titulo: 'Turno de Supervisor Finalizado',
        Mensaje: `${nombreSup} ha finalizado su turno con ${totalFinal} consumos registrados.`,
        Tipo: 'exito'
      });
      await NotificacionesService.crearNotificacion({
        Id_Usuario: null,
        Rol_Destino: 'Bienestar',
        Titulo: 'Turno de Supervisor Finalizado',
        Mensaje: `${nombreSup} ha finalizado su turno con ${totalFinal} consumos registrados.`,
        Tipo: 'exito'
      });
    } catch (errNotif) {
      console.warn("[TurnosService] Nota sobre notificacion in-app de cierre:", errNotif.message);
    }

    // 3. Emision por WebSockets
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
   * Obtiene el listado nominal de consumos registrados durante un turno especifico
   */
  async obtenerConsumosDeTurno(idTurno) {
    const turno = await TurnosModel.findByPk(idTurno, {
      include: [
        {
          model: UsuariosModel,
          as: 'supervisor',
          attributes: ['Id_Usuario', 'Nom_Usuario', 'Ape_Usuario', 'NumDoc_Usuario', 'Cor_Usuario']
        }
      ]
    });
    if (!turno) throw new Error("Turno no encontrado");

    const fechaInicio = turno.Fecha_Inicio;
    const fechaFin = turno.Fecha_Fin || new Date();

    const consumos = await ReservasModel.findAll({
      where: {
        Est_Reserva: 'Consumido',
        updatedAt: {
          [Op.between]: [fechaInicio, fechaFin]
        }
      },
      include: [
        {
          model: UsuariosModel,
          as: 'usuario',
          attributes: ['Id_Usuario', 'Nom_Usuario', 'Ape_Usuario', 'NumDoc_Usuario'],
          include: [
            {
              model: FichasModel,
              as: 'ficha',
              attributes: ['Num_Ficha']
            },
            {
              model: UsuariosRolModel,
              as: 'rolesUsuario',
              include: [{ model: RolesModel, as: 'rolUsuario', attributes: ['Nom_Rol'] }]
            }
          ]
        },
        {
          model: PlatosModels,
          as: 'plato',
          attributes: ['Nom_Plato']
        }
      ],
      order: [['updatedAt', 'ASC']]
    });

    return {
      turno,
      consumos: consumos.map(c => ({
        Id_Reserva: c.Id_Reserva,
        Fecha: c.Fec_Reserva,
        Hora_Consumo: c.updatedAt,
        NumDoc: c.usuario?.NumDoc_Usuario || 'N/A',
        Aprendiz: c.usuario ? `${c.usuario.Nom_Usuario} ${c.usuario.Ape_Usuario}` : 'N/A',
        Num_Ficha: c.usuario?.ficha?.Num_Ficha || 'N/A',
        Rol: c.usuario?.rolesUsuario?.map(r => r.rolUsuario?.Nom_Rol).filter(Boolean).join(', ') || 'N/A',
        Tipo_Comida: c.Tip_Reserva,
        Plato: c.plato?.Nom_Plato || 'Plato del Dia',
        Estado: c.Est_Reserva
      }))
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
   * Obtiene el historial de turnos con paginacion
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

  /**
   * Calcula el estado del semaforo de aforo del comedor en tiempo real
   * Basado en la tasa de escaneos/consumos por minuto en los ultimos 10 minutos
   */
  async obtenerAforoSemaforo() {
    const turnoActivo = await this.obtenerTurnoActivo();

    if (!turnoActivo) {
      return {
        turnoActivo: false,
        supervisor: null,
        totalConsumosTurno: 0,
        consumosUltimos10Min: 0,
        ritmoMinuto: 0,
        color: "GRIS",
        nivel: "Comedor en receso",
        icono: "⚪",
        mensaje: "No hay turno de servicio abierto en este momento.",
        tiempoEsperaEstimado: "N/A"
      };
    }

    const hace10Minutos = new Date(Date.now() - 10 * 60 * 1000);
    const fechaInicioTurno = turnoActivo.Fecha_Inicio;
    const ventanaInicio = hace10Minutos > fechaInicioTurno ? hace10Minutos : fechaInicioTurno;

    const consumosRecientes = await ReservasModel.count({
      where: {
        Est_Reserva: 'Consumido',
        updatedAt: {
          [Op.gte]: ventanaInicio
        }
      }
    });

    const minutosTranscurridos = Math.max(1, Math.round((Date.now() - new Date(ventanaInicio).getTime()) / (60 * 1000)));
    const ritmoMinuto = Math.round((consumosRecientes / minutosTranscurridos) * 10) / 10;

    let color = "VERDE";
    let nivel = "Fila fluida";
    let icono = "🟢";
    let mensaje = "Comedor con paso agil y sin esperas prolongadas.";
    let tiempoEsperaEstimado = "< 2 minutos";

    if (ritmoMinuto > 5) {
      color = "ROJO";
      nivel = "Hora pico (Alta congestion)";
      icono = "🔴";
      mensaje = "Fila con alta afluencia. Te sugerimos esperar unos minutos si no tienes prisa.";
      tiempoEsperaEstimado = "8 - 15 minutos";
    } else if (ritmoMinuto >= 2) {
      color = "AMARILLO";
      nivel = "Flujo moderado";
      icono = "🟡";
      mensaje = "Fila con flujo constante y avance rapido.";
      tiempoEsperaEstimado = "3 - 6 minutos";
    }

    const nombreSup = turnoActivo.supervisor
      ? `${turnoActivo.supervisor.Nom_Usuario || ''} ${turnoActivo.supervisor.Ape_Usuario || ''}`.trim()
      : 'Supervisor en turno';

    return {
      turnoActivo: true,
      supervisor: nombreSup,
      totalConsumosTurno: turnoActivo.Total_Consumos_Registrados || 0,
      consumosUltimos10Min: consumosRecientes,
      ritmoMinuto,
      color,
      nivel,
      icono,
      mensaje,
      tiempoEsperaEstimado
    };
  }
}

export default new TurnosService();
