// Node/Controllers/AsignacionSupervisorController.js
import AsignacionSupervisorService from "../Services/AsignacionSupervisorService.js";

export const getAsignaciones = async (req, res) => {
  try {
    const asignaciones = await AsignacionSupervisorService.obtenerAsignaciones(req.query);
    return res.status(200).json({ asignaciones });
  } catch (error) {
    console.error("[AsignacionSupervisorController] getAsignaciones:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const crearAsignacion = async (req, res) => {
  try {
    const usuarioSolicitante = {
      id: req.user?.id || req.user?.Id_Usuario,
      rol: req.user?.rol || "Bienestar"
    };
    const nueva = await AsignacionSupervisorService.crearAsignacion(req.body, usuarioSolicitante);
    return res.status(201).json({
      message: "Supervisor asignado correctamente por el periodo establecido.",
      asignacion: nueva
    });
  } catch (error) {
    console.error("[AsignacionSupervisorController] crearAsignacion:", error.message);
    return res.status(400).json({ message: error.message });
  }
};

export const revocarAsignacion = async (req, res) => {
  try {
    const resultado = await AsignacionSupervisorService.revocarAsignacion(req.params.id);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("[AsignacionSupervisorController] revocarAsignacion:", error.message);
    return res.status(400).json({ message: error.message });
  }
};

export const revisarVencidos = async (req, res) => {
  try {
    const resultado = await AsignacionSupervisorService.revisarYRevertirVencidos();
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("[AsignacionSupervisorController] revisarVencidos:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export default {
  getAsignaciones,
  crearAsignacion,
  revocarAsignacion,
  revisarVencidos
};

