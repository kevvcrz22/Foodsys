// Node/Routes/ReportesRoute.js
//
// Define las rutas HTTP para el modulo de reportes estadisticos de FoodSys.
// Todas las rutas requieren autenticacion mediante authMiddleware.
//
// Rutas originales (sin modificacion de path):
//   GET /api/Reportes/diario
//   GET /api/Reportes/semanal
//   GET /api/Reportes/mensual
//   GET /api/Reportes/anual
//   GET /api/Reportes/personalizado
//   GET /api/Reportes/exportar/pdf
//   GET /api/Reportes/exportar/excel
//
// Rutas nuevas:
//   GET   /api/Reportes/diario/detalle
//   GET   /api/Reportes/semanal/desglose
//   GET   /api/Reportes/semanal/dia
//   GET   /api/Reportes/semanal/platos
//   GET   /api/Reportes/anual/desglose
//   GET   /api/Reportes/tiempo-real
//   GET   /api/Reportes/aprendiz
//   PATCH /api/Reportes/aprendiz/sancion
//   GET   /api/Reportes/platos/top
//
// ORDEN IMPORTANTE: las rutas estaticas (sin parametro dinamico en el segmento)
// deben declararse antes que las rutas con parametros para que Express no interprete
// "diario", "semanal", etc. como valores de un parametro :id.

import { Router } from "express";
import authMiddleware from "../Middleware/authMiddleware.js";
import {
  // Funciones originales
  getReporteDiario,
  getReporteSemanal,
  getReporteMensual,
  getReporteAnual,
  getReportePersonalizado,
  exportarPDF,
  exportarExcel,
  // Funciones nuevas
  getReporteDiarioDetalle,
  getReporteSemanalDesglose,
  getReporteDiaDetalle,
  getResumenSemanalPlatos,
  getReporteAnualDesglose,
  getTiempoReal,
  getAprendizReporte,
  actualizarSancion,
  getPlatosTopConsumo,
} from "../Controllers/ReportesController.js";

const router = Router();

// =========================================================================
// RUTAS ORIGINALES — paths identicos, solo se agrega authMiddleware
// =========================================================================

// Resumen de los ultimos 7 dias para el grafico de barras principal
router.get("/diario",        authMiddleware, getReporteDiario);

// Resumen de las ultimas 8 semanas ISO
router.get("/semanal",       authMiddleware, getReporteSemanal);

// Resumen de los ultimos 12 meses
router.get("/mensual",       authMiddleware, getReporteMensual);

// Resumen de los ultimos 5 años
router.get("/anual",         authMiddleware, getReporteAnual);

// Rango personalizado con filtros de fecha y tipo de alimento
// Query params: fechaInicio, fechaFin, tipoAlimento (opcional)
router.get("/personalizado", authMiddleware, getReportePersonalizado);

// Exportaciones — el parametro :formato ya estaba como path en el original
// Se mantienen como rutas estaticas separadas para evitar ambiguedad
router.get("/exportar/pdf",   authMiddleware, exportarPDF);
router.get("/exportar/excel", authMiddleware, exportarExcel);

// =========================================================================
// RUTAS NUEVAS — deben ir antes de cualquier ruta con :parametro dinamico
// =========================================================================

// Detalle de un dia especifico con listado de usuarios, platos y datos de contacto.
// Query params: fecha (obligatorio), tipo (opcional), estado (opcional)
router.get("/diario/detalle",      authMiddleware, getReporteDiarioDetalle);

// Desglose dia a dia de una semana ISO.
// Query params: anio (obligatorio), semana (obligatorio)
router.get("/semanal/desglose",    authMiddleware, getReporteSemanalDesglose);

// Detalle de los usuarios que consumieron en un dia del desglose semanal.
// Query params: fecha (obligatorio), tipo (opcional), estado (opcional)
router.get("/semanal/dia",         authMiddleware, getReporteDiaDetalle);

// Ranking de platos consumidos en una semana ISO.
// Query params: anio (obligatorio), semana (obligatorio)
router.get("/semanal/platos",      authMiddleware, getResumenSemanalPlatos);

// Desglose mes a mes de un año especifico.
// Query params: anio (obligatorio)
router.get("/anual/desglose",      authMiddleware, getReporteAnualDesglose);

// Estadisticas del dia actual calculadas en tiempo real.
// No requiere query params. El frontend hace polling sobre esta ruta.
router.get("/tiempo-real",         authMiddleware, getTiempoReal);

// Perfil de reservas de un aprendiz buscado por numero de documento.
// Query params: documento (obligatorio), fechaInicio (opcional), fechaFin (opcional)
router.get("/aprendiz",            authMiddleware, getAprendizReporte);

// Actualiza la sancion de un aprendiz.
// Body: { Id_Usuario, San_Usuario: "Si" | "No" }
router.patch("/aprendiz/sancion",  authMiddleware, actualizarSancion);

// Top N platos mas consumidos en el periodo indicado.
// Query params: periodo (default: mensual), n (default: 5, max: 20)
router.get("/platos/top",          authMiddleware, getPlatosTopConsumo);

export default router;