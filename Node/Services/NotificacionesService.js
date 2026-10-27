// Node/Services/NotificacionesService.js
// Servicio de notificaciones en tiempo real para Foodsys

import { Op } from "sequelize";
import NotificacionesModel from "../Models/NotificacionesModel.js";
import { getIO } from "./SocketService.js";

class NotificacionesService {
  /**
   * Crea una nueva notificación en BD y la emite por WebSockets en tiempo real
   */
  async crearNotificacion({ Id_Usuario = null, Rol_Destino = 'Todos', Titulo, Mensaje, Tipo = 'info' }) {
    try {
      const notif = await NotificacionesModel.create({
        Id_Usuario,
        Rol_Destino,
        Titulo,
        Mensaje,
        Tipo,
        Leido: false,
        Fecha_Creacion: new Date()
      });

      const io = getIO();
      if (io) {
        const payload = notif.toJSON ? notif.toJSON() : notif;
        io.emit('notificacion:nueva', { notificacion: payload });

        if (Tipo === 'bolsa_solidaria') {
          io.emit('notificacion:bolsa_solidaria', { notificacion: payload });
        } else if (Tipo === 'cesion') {
          io.emit('notificacion:cesion', { notificacion: payload });
        }
      }

      return notif;
    } catch (err) {
      console.error("[NotificacionesService] Error al crear notificación:", err.message);
      return null;
    }
  }

  /**
   * Obtiene las notificaciones dirigidas al usuario o a sus roles activos
   */
  async obtenerParaUsuario(idUsuario, roles = []) {
    const rolesArray = Array.isArray(roles) ? roles : [roles].filter(Boolean);

    const condiciones = [
      { Rol_Destino: 'Todos' }
    ];

    if (idUsuario) {
      condiciones.push({ Id_Usuario: idUsuario });
    }

    if (rolesArray.length > 0) {
      condiciones.push({ Rol_Destino: { [Op.in]: rolesArray } });
    }

    const notificaciones = await NotificacionesModel.findAll({
      where: {
        [Op.or]: condiciones
      },
      order: [['Fecha_Creacion', 'DESC']],
      limit: 50
    });

    const noLeidas = notificaciones.filter(n => !n.Leido).length;

    return {
      notificaciones,
      noLeidas
    };
  }

  /**
   * Marca una notificación específica como leída
   */
  async marcarLeida(idNotificacion) {
    const [afectados] = await NotificacionesModel.update(
      { Leido: true },
      { where: { Id_Notificacion: idNotificacion } }
    );
    return afectados > 0;
  }

  /**
   * Marca todas las notificaciones relevantes del usuario como leídas
   */
  async marcarTodasLeidas(idUsuario, roles = []) {
    const rolesArray = Array.isArray(roles) ? roles : [roles].filter(Boolean);

    const condiciones = [
      { Rol_Destino: 'Todos' }
    ];

    if (idUsuario) {
      condiciones.push({ Id_Usuario: idUsuario });
    }

    if (rolesArray.length > 0) {
      condiciones.push({ Rol_Destino: { [Op.in]: rolesArray } });
    }

    const [afectados] = await NotificacionesModel.update(
      { Leido: true },
      {
        where: {
          Leido: false,
          [Op.or]: condiciones
        }
      }
    );
    return afectados;
  }
}

export default new NotificacionesService();
