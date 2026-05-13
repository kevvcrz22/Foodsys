// Node/Routes/ReportesRoute.js
//
// Define todas las rutas HTTP del modulo de reportes estadisticos de Foodsys.
// Todas las rutas requieren autenticacion mediante authMiddleware.
//
// REGLA IMPORTANTE DE ORDEN EN EXPRESS:
//   Las rutas estaticas (sin parametro dinamico en el segmento)
//   deben declararse ANTES que las rutas con parametros (:id, :formato, etc.)
//   para que Express no interprete "diario", "semanal", "platos", etc.
//   como valores de un parametro cuando coinciden en el mismo nivel de path.
//
//   Ejemplo incorrecto:
//     router.get("/:periodo",          handler1)  <- captura "semanal", "platos", etc.
//     router.get("/semanal/desglose",  handler2)  <- nunca llega aqui
//
//   Ejemplo correcto (el que se usa aqui):
//     router.get("/semanal/desglose",  handler2)  <- se evalua primero
//     router.get("/:periodo",          handler1)  <- solo llega si no coincidio antes
//
// Rutas ORIGINALES — paths identicos al archivo anterior:
//   GET /api/Reportes/diario
//   GET /api/Reportes/semanal
//   GET /api/Reportes/mensual
//   GET /api/Reportes/anual
//   GET /api/Reportes/personalizado
//   GET /api/Reportes/exportar/pdf
//   GET /api/Reportes/exportar/excel
//
// Rutas NUEVAS — agregadas al final de la lista, antes de cualquier parametro dinamico:
//   GET   /api/Reportes/diario/detalle      -> detalle con filtros de tipo y estado
//   GET   /api/Reportes/semanal/desglose    -> resumen dia a dia de una semana ISO
//   GET   /api/Reportes/semanal/dia         -> detalle de un dia del desglose semanal
//   GET   /api/Reportes/semanal/platos      -> ranking de platos de la semana
//   GET   /api/Reportes/anual/desglose      -> desglose mes a mes de un anio
//   GET   /api/Reportes/tiempo-real         -> estadisticas del dia para polling
//   GET   /api/Reportes/aprendiz            -> perfil de reservas por documento
//   PATCH /api/Reportes/aprendiz/sancion    -> actualizar sancion del aprendiz
//   GET   /api/Reportes/platos/top          -> top N platos consumidos en el periodo

import { Router } from "express";
import authMiddleware from "../Middleware/authMiddleware.js";

import {
  // Controladores originales — importados sin cambio
  getReporteDiario,
  getReporteSemanal,
  getReporteMensual,
  getReporteAnual,
  getReportePersonalizado,
  exportarPDF,
  exportarExcel,
  // Controladores nuevos — agregados al final del controlador
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

// ===========================================================================
// RUTAS ORIGINALES — paths y orden identicos al archivo anterior
// ===========================================================================

// Resumen de los ultimos 7 dias para el grafico de barras general
// Ejemplo: GET /api/Reportes/diario
router.get("/diario", authMiddleware, getReporteDiario);

// Resumen de las ultimas 8 semanas ISO
// Ejemplo: GET /api/Reportes/semanal
router.get("/semanal", authMiddleware, getReporteSemanal);

// Resumen de los ultimos 12 meses
// Ejemplo: GET /api/Reportes/mensual
router.get("/mensual", authMiddleware, getReporteMensual);

// Resumen de los ultimos 5 anios
// Ejemplo: GET /api/Reportes/anual
router.get("/anual", authMiddleware, getReporteAnual);

// Rango personalizado con filtros de fecha y tipo de alimento
// Ejemplo: GET /api/Reportes/personalizado?fechaInicio=2026-01-01&fechaFin=2026-05-09
router.get("/personalizado", authMiddleware, getReportePersonalizado);

// Exportacion PDF — ruta estatica para evitar conflicto con un posible /:formato
// Ejemplo: GET /api/Reportes/exportar/pdf?periodo=mensual
router.get("/exportar/pdf", authMiddleware, exportarPDF);

// Exportacion Excel
// Ejemplo: GET /api/Reportes/exportar/excel?periodo=mensual
router.get("/exportar/excel", authMiddleware, exportarExcel);

// ===========================================================================
// RUTAS NUEVAS — declaradas antes de cualquier segmento con parametro dinamico
// ===========================================================================

// Detalle completo de las reservas de un dia especifico con filtros de tipo y estado.
// Ejemplo: GET /api/Reportes/diario/detalle?fecha=2026-04-18&tipo=Almuerzo
// El frontend lo usa para la tabla detallada debajo de las graficas del tab Diario.
router.get("/diario/detalle", authMiddleware, getReporteDiarioDetalle);

// Desglose dia a dia de una semana ISO: Lunes a Domingo con sus totales.
// Ejemplo: GET /api/Reportes/semanal/desglose?anio=2026&semana=19
// El frontend lo usa para el panel semanal con filas clicables.
router.get("/semanal/desglose", authMiddleware, getReporteSemanalDesglose);

// Detalle de los usuarios que consumieron en un dia del desglose semanal.
// Se activa cuando el Coordinador hace clic en Miercoles, Jueves, etc.
// Ejemplo: GET /api/Reportes/semanal/dia?fecha=2026-05-07&tipo=Almuerzo
router.get("/semanal/dia", authMiddleware, getReporteDiaDetalle);

// Ranking de platos mas consumidos en una semana ISO especifica.
// Incluye imagen y descripcion del plato para el panel visual.
// Ejemplo: GET /api/Reportes/semanal/platos?anio=2026&semana=19
router.get("/semanal/platos", authMiddleware, getResumenSemanalPlatos);

// Desglose mes a mes de un anio especifico (enero, febrero... del anio seleccionado).
// Ejemplo: GET /api/Reportes/anual/desglose?anio=2026
router.get("/anual/desglose", authMiddleware, getReporteAnualDesglose);

// Estadisticas del dia actual calculadas en tiempo real sin cache.
// El frontend hace polling cada 30 segundos sobre esta ruta.
// Ejemplo: GET /api/Reportes/tiempo-real
router.get("/tiempo-real", authMiddleware, getTiempoReal);

// Perfil completo de reservas de un aprendiz buscado por numero de documento.
// Ejemplo: GET /api/Reportes/aprendiz?documento=1003810633&fechaInicio=2026-01-01
router.get("/aprendiz", authMiddleware, getAprendizReporte);

// Actualiza el campo San_Usuario de un aprendiz (sancionar o levantar sancion).
// Metodo PATCH porque modifica parcialmente un recurso existente.
// Ejemplo: PATCH /api/Reportes/aprendiz/sancion  Body: { Id_Usuario: 5, San_Usuario: "Si" }
router.patch("/aprendiz/sancion", authMiddleware, actualizarSancion);

// Top N platos mas consumidos en el periodo indicado para el ranking visual.
// Ejemplo: GET /api/Reportes/platos/top?periodo=mensual&n=3
router.get("/platos/top", authMiddleware, getPlatosTopConsumo);

export default router;