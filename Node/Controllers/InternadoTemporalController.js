// Node/Controllers/InternadoTemporalController.js
// Controlador para la gestion de aprendices externos que pasan a internado temporal (SENA Empresa / Gestores)

import InternadoTemporalService from "../Services/InternadoTemporalService.js";

// GET /api/internado-temporal
export const getRegistros = async (req, res) => {
  try {
    const registros = await InternadoTemporalService.obtenerRegistros(req.query);
    return res.status(200).json(registros);
  } catch (error) {
    console.error("[InternadoTemporalController] getRegistros error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/internado-temporal/importar-excel
export const importarExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Debe adjuntar un archivo Excel (.xlsx o .xls)." });
    }

    const usuario = {
      id: req.user?.Id_Usuario,
      rol: req.user?.rol || "SENA Empresa"
    };

    const resultado = await InternadoTemporalService.importarExcelSenaEmpresa(req.file.buffer, usuario);
    return res.status(200).json({
      message: "Archivo Excel de SENA Empresa procesado exitosamente.",
      resultado
    });
  } catch (error) {
    console.error("[InternadoTemporalController] importarExcel error:", error);
    return res.status(400).json({ message: error.message });
  }
};

// GET /api/internado-temporal/plantilla
export const descargarPlantilla = async (req, res) => {
  try {
    const buffer = await InternadoTemporalService.generarPlantillaOficial();
    res.setHeader("Content-Disposition", 'attachment; filename="Plantilla_Oficial_Internado_Temporal_SENA_Empresa.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(buffer);
  } catch (error) {
    console.error("[InternadoTemporalController] descargarPlantilla error:", error);
    return res.status(500).json({ message: "Error al generar plantilla Excel" });
  }
};

// POST /api/internado-temporal/manual
export const registrarManual = async (req, res) => {
  try {
    const usuario = {
      id: req.user?.Id_Usuario,
      rol: req.user?.rol || "SENA Empresa"
    };

    const nuevo = await InternadoTemporalService.crearRegistroManual(req.body, usuario);
    return res.status(201).json({
      message: "Aprendiz asignado a internado temporal correctamente.",
      registro: nuevo
    });
  } catch (error) {
    console.error("[InternadoTemporalController] registrarManual error:", error);
    return res.status(400).json({ message: error.message });
  }
};

// DELETE /api/internado-temporal/:id
export const eliminarRegistro = async (req, res) => {
  try {
    const resultado = await InternadoTemporalService.eliminarRegistro(req.params.id);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("[InternadoTemporalController] eliminarRegistro error:", error);
    return res.status(400).json({ message: error.message });
  }
};

// POST /api/internado-temporal/revisar-vencimientos
export const revisarVencimientos = async (req, res) => {
  try {
    const resultado = await InternadoTemporalService.revisarYRevertirVencidos();
    return res.status(200).json({
      message: "Revisión de vencimientos ejecutada correctamente.",
      resultado
    });
  } catch (error) {
    console.error("[InternadoTemporalController] revisarVencimientos error:", error);
    return res.status(500).json({ message: error.message });
  }
};
