// ═══════════════════════════════════════════════════
// Node/Routes/ReportesRoute.js   (archivo NUEVO)
// ═══════════════════════════════════════════════════
import express from "express";
import {
  getReporteDiario,
  getReporteSemanal,
  getReporteMensual,
  getReporteAnual,
  exportarPDF,
  exportarExcel,
} from "../Controllers/ReportesController.js";
import authMiddleware from "../Middleware/authMiddleware.js";

const router = express.Router();

// Todos los endpoints de reportes requieren autenticación
router.use(authMiddleware);

router.get("/diario",            getReporteDiario);
router.get("/semanal",           getReporteSemanal);
router.get("/mensual",           getReporteMensual);
router.get("/anual",             getReporteAnual);
router.get("/exportar/pdf",      exportarPDF);
router.get("/exportar/excel",    exportarExcel);

export default router;