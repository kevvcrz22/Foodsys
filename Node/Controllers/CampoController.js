// Node/Controllers/CampoController.js
// Controlador para el modulo de Jornada de Campo y Almuerzos Guardados (SENA Empresa)

import CampoService from "../Services/CampoService.js";

export const obtenerAprendicesFicha = async (req, res) => {
  try {
    const { numFicha } = req.params;
    const { fecha } = req.query;
    const resultado = await CampoService.obtenerAprendicesFichaAlmuerzo(numFicha, fecha);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("[CampoController] Error en obtenerAprendicesFicha:", error);
    return res.status(400).json({ message: error.message || "Error al consultar aprendices de la ficha" });
  }
};

export const crearSolicitudCampo = async (req, res) => {
  try {
    const usuarioSolicitante = {
      Id_Usuario: req.user?.id || req.user?.Id_Usuario,
      Rol_Activo: req.user?.rol || req.user?.Rol || "Instructor"
    };

    if (!usuarioSolicitante.Id_Usuario) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const resultado = await CampoService.crearSolicitudGuardadoCampo(req.body, usuarioSolicitante);
    return res.status(201).json(resultado);
  } catch (error) {
    console.error("[CampoController] Error en crearSolicitudCampo:", error);
    return res.status(400).json({ message: error.message || "Error al crear la solicitud de campo" });
  }
};

export const listarSolicitudesCampo = async (req, res) => {
  try {
    const filtros = {
      fecha: req.query.fecha,
      fechaInicio: req.query.fechaInicio,
      fechaFin: req.query.fechaFin,
      unidad: req.query.unidad,
      estado: req.query.estado,
      numFicha: req.query.numFicha
    };
    const solicitudes = await CampoService.obtenerSolicitudes(filtros);
    return res.status(200).json(solicitudes);
  } catch (error) {
    console.error("[CampoController] Error en listarSolicitudesCampo:", error);
    return res.status(500).json({ message: error.message || "Error al listar solicitudes" });
  }
};

export const detalleSolicitudCampo = async (req, res) => {
  try {
    const { id } = req.params;
    const detalle = await CampoService.obtenerDetalleSolicitud(id);
    return res.status(200).json(detalle);
  } catch (error) {
    console.error("[CampoController] Error en detalleSolicitudCampo:", error);
    return res.status(404).json({ message: error.message || "Solicitud no encontrada" });
  }
};

export const entregarAlmuerzoCampo = async (req, res) => {
  try {
    const { id } = req.params;
    const { idReserva } = req.body;
    const resultado = await CampoService.entregarAlmuerzoGuardado(id, idReserva || null);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("[CampoController] Error en entregarAlmuerzoCampo:", error);
    return res.status(400).json({ message: error.message || "Error al registrar la entrega de almuerzo" });
  }
};
