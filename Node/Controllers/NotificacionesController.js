// Node/Controllers/NotificacionesController.js
import NotificacionesService from "../Services/NotificacionesService.js";

export const obtenerNotificaciones = async (req, res) => {
  try {
    const idUsuario = req.user?.id;
    const roles = req.user?.roles || [];
    const resultado = await NotificacionesService.obtenerParaUsuario(idUsuario, roles);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    return res.status(500).json({ mensaje: "Error interno al obtener notificaciones" });
  }
};

export const marcarLeida = async (req, res) => {
  try {
    const { id } = req.params;
    const exito = await NotificacionesService.marcarLeida(id);
    return res.status(200).json({ ok: exito, mensaje: "Notificación marcada como leída" });
  } catch (error) {
    console.error("Error al marcar notificación:", error);
    return res.status(500).json({ mensaje: "Error interno al actualizar notificación" });
  }
};

export const marcarTodasLeidas = async (req, res) => {
  try {
    const idUsuario = req.user?.id;
    const roles = req.user?.roles || [];
    const total = await NotificacionesService.marcarTodasLeidas(idUsuario, roles);
    return res.status(200).json({ ok: true, actualizadas: total, mensaje: "Todas las notificaciones marcadas como leídas" });
  } catch (error) {
    console.error("Error al marcar todas las notificaciones:", error);
    return res.status(500).json({ mensaje: "Error interno al actualizar notificaciones" });
  }
};

export default {
  obtenerNotificaciones,
  marcarLeida,
  marcarTodasLeidas
};
