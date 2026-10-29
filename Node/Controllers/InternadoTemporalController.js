// Node/Controllers/InternadoTemporalController.js
// Controlador para la gestion de aprendices externos que pasan a internado temporal (SENA Empresa / Gestores)

import InternadoTemporalService from "../Services/InternadoTemporalService.js";

// GET /api/internado-temporal y GET /api/internado-temporal/listar
export const getRegistros = async (req, res) => {
  try {
    const registros = await InternadoTemporalService.obtenerRegistros(req.query);
    if (req.path && req.path.includes("listar")) {
      return res.status(200).json({ registros });
    }
    return res.status(200).json(registros);
  } catch (error) {
    console.error("[InternadoTemporalController] getRegistros error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/internado-temporal/importar-excel
export const importarExcel = async (req, res) => {
  try {
    const archivo = req.file || (Array.isArray(req.files) && req.files[0]);
    if (!archivo || !archivo.buffer) {
      return res.status(400).json({ message: "Debe adjuntar un archivo Excel (.xlsx o .xls)." });
    }

    const usuario = {
      id: req.user?.Id_Usuario || req.user?.id || null,
      rol: req.user?.rol || "SENA Empresa"
    };

    const resultado = await InternadoTemporalService.importarExcelSenaEmpresa(archivo.buffer, usuario);
    return res.status(200).json({
      message: "Archivo Excel de SENA Empresa procesado exitosamente.",
      resultado,
      totalImportados: resultado.creadosOActualizados || 0,
      totalActivadosHoy: resultado.activadosHoy || 0,
      totalOmitidos: Array.isArray(resultado.noEncontradosEnBd) ? resultado.noEncontradosEnBd.length : 0
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

// POST /api/internado-temporal/manual y POST /api/internado-temporal/crear
export const registrarManual = async (req, res) => {
  try {
    const usuario = {
      id: req.user?.Id_Usuario || req.user?.id || null,
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

// PUT /api/internado-temporal/:id
export const actualizarRegistro = async (req, res) => {
  try {
    const actualizado = await InternadoTemporalService.actualizarRegistro(req.params.id, req.body);
    return res.status(200).json({
      message: "Turno de internado temporal actualizado correctamente.",
      registro: actualizado
    });
  } catch (error) {
    console.error("[InternadoTemporalController] actualizarRegistro error:", error);
    return res.status(400).json({ message: error.message });
  }
};

// DELETE /api/internado-temporal/:id o PATCH /api/internado-temporal/:id/revocar
export const eliminarRegistro = async (req, res) => {
  try {
    const rol = req.user?.rol || "";
    const resultado = await InternadoTemporalService.eliminarRegistro(req.params.id, {
      soloRevocar: rol === "SENA Empresa" || req.method === "PATCH"
    });
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("[InternadoTemporalController] eliminarRegistro error:", error);
    return res.status(400).json({ message: error.message });
  }
};

// POST /api/internado-temporal/revisar-vencimientos y POST /api/internado-temporal/revisar-vencidos
export const revisarVencimientos = async (req, res) => {
  try {
    const resultado = await InternadoTemporalService.revisarYRevertirVencidos();
    return res.status(200).json({
      message: "Revisión de vencimientos ejecutada correctamente.",
      resultado,
      activados: resultado.activados || 0,
      revertidos: resultado.revertidos || 0
    });
  } catch (error) {
    console.error("[InternadoTemporalController] revisarVencimientos error:", error);
    return res.status(500).json({ message: error.message });
  }
};
