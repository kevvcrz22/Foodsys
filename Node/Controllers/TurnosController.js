// Node/Controllers/TurnosController.js
import TurnosService from "../Services/TurnosService.js";

export const obtenerTurnoActivo = async (req, res) => {
  try {
    const turno = await TurnosService.obtenerTurnoActivo();
    return res.status(200).json({ turno });
  } catch (error) {
    console.error("Error al obtener turno activo:", error);
    return res.status(500).json({ mensaje: "Error al consultar turno activo" });
  }
};

export const iniciarTurno = async (req, res) => {
  try {
    const idUsuario = req.user?.id;
    const { observaciones } = req.body;
    const resultado = await TurnosService.iniciarTurno(idUsuario, observaciones);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("Error al iniciar turno:", error.message);
    return res.status(400).json({ mensaje: error.message });
  }
};

export const finalizarTurno = async (req, res) => {
  try {
    const idUsuario = req.user?.id;
    const { observaciones } = req.body;
    const resultado = await TurnosService.finalizarTurno(idUsuario, observaciones);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("Error al finalizar turno:", error.message);
    return res.status(400).json({ mensaje: error.message });
  }
};

export const obtenerHistorial = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const resultado = await TurnosService.obtenerHistorial(limit, offset);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("Error al obtener historial de turnos:", error);
    return res.status(500).json({ mensaje: "Error al consultar historial de turnos" });
  }
};

export default {
  obtenerTurnoActivo,
  iniciarTurno,
  finalizarTurno,
  obtenerHistorial
};
