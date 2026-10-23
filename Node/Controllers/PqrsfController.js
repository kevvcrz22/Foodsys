// Node/Controllers/PqrsfController.js
// Controlador para recepcion, consulta, respuesta y exportacion de PQRSF
// Nomenclatura limpia sin tildes ni emojis

import PqrsfService from "../Services/PqrsfService.js";

export const crearPqrsf = async (req, res) => {
  try {
    const datos = req.body;
    const archivoBuffer = req.file ? req.file.buffer : null;
    const archivoNombre = req.file ? req.file.originalname : null;

    const resultado = await PqrsfService.crearPqrsf(datos, archivoBuffer, archivoNombre);
    return res.status(201).json(resultado);
  } catch (error) {
    console.error("[PqrsfController] Error al crear PQRSF:", error);
    return res.status(400).json({ message: error.message || "Error al radicar la PQRSF." });
  }
};

export const responderPqrsf = async (req, res) => {
  try {
    const { id } = req.params;
    const { respuesta, estado } = req.body;
    const idResponsable = req.usuario?.Id_Usuario || null;

    const actualizada = await PqrsfService.responderPqrsf(id, idResponsable, respuesta, estado);
    return res.status(200).json({ message: "PQRSF respondida correctamente.", pqrsf: actualizada });
  } catch (error) {
    console.error("[PqrsfController] Error al responder PQRSF:", error);
    return res.status(400).json({ message: error.message || "Error al responder la PQRSF." });
  }
};

export const listarPqrsf = async (req, res) => {
  try {
    const resultado = await PqrsfService.listarPqrsf(req.query);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("[PqrsfController] Error al listar PQRSF:", error);
    return res.status(500).json({ message: "Error al consultar las PQRSF." });
  }
};

export const obtenerRanking = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const ranking = await PqrsfService.obtenerRankingFrecuencia(fechaInicio, fechaFin);
    return res.status(200).json(ranking);
  } catch (error) {
    console.error("[PqrsfController] Error al obtener ranking PQRSF:", error);
    return res.status(500).json({ message: "Error al calcular el ranking de PQRSF." });
  }
};

export const exportarExcel = async (req, res) => {
  try {
    const buffer = await PqrsfService.generarExcelPqrsf(req.query);
    res.setHeader("Content-Disposition", 'attachment; filename="Foodsys_Reporte_PQRSF_Ranking.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(buffer);
  } catch (error) {
    console.error("[PqrsfController] Error al exportar Excel PQRSF:", error);
    return res.status(500).json({ message: "Error al generar el archivo Excel de PQRSF." });
  }
};

export const exportarPdf = async (req, res) => {
  try {
    const buffer = await PqrsfService.generarPdfPqrsf(req.query);
    res.setHeader("Content-Disposition", 'attachment; filename="Foodsys_Acta_Interventoria_PQRSF.pdf"');
    res.setHeader("Content-Type", "application/pdf");
    return res.send(buffer);
  } catch (error) {
    console.error("[PqrsfController] Error al exportar PDF PQRSF:", error);
    return res.status(500).json({ message: "Error al generar el acta PDF de PQRSF." });
  }
};

export default {
  crearPqrsf,
  responderPqrsf,
  listarPqrsf,
  obtenerRanking,
  exportarExcel,
  exportarPdf
};
