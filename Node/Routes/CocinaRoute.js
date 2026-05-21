// Routes/CocinaRoute.js
//
// Rutas del modulo de planificacion de Cocina.
// Todas las rutas requieren autenticacion (authMiddleware) y
// rol Cocina (CocinaMiddleware), excepto GetResumenPorFecha que
// solo requiere auth ya que puede ser consultado por Admin tambien.
//
// Mapa de rutas:
//   GET /api/Cocina/plan-hoy                 -> resumen de hoy
//   GET /api/Cocina/plan/:fecha              -> resumen de una fecha
//   GET /api/Cocina/reporte-previo/:tipo     -> platos a preparar (8h antes del turno)
//   GET /api/Cocina/excepcionales-hoy        -> novedades del dia
//   GET /api/Cocina/turno-actual/:tipo       -> balance del turno en progreso

import { Router } from 'express';
import authMiddleware from '../Middleware/authMiddleware.js';
import CocinaMiddleware from '../Middleware/CocinaMiddleware.js';
import {
  GetResumenPorFecha,
  GetResumenHoy,
  GetReportePrevioTurno,
  GetExcepcionalesHoy,
  GetResumenTurnoActual
} from '../Controllers/CocinaController.js';

const router = Router();

// Resumen del dia de hoy: totales por turno, platos, excepcionales.
// El personal de cocina lo consulta al inicio del turno.
router.get('/plan-hoy', authMiddleware, CocinaMiddleware, GetResumenHoy);

// Resumen de una fecha especifica: util para planificar dias futuros.
// El admin puede consultarlo; Cocina tambien.
router.get('/plan/:fecha', authMiddleware, CocinaMiddleware, GetResumenPorFecha);

// Reporte previo al turno: cuantos platos de cada tipo preparar.
// Disponible 8 horas antes del inicio del turno.
// Params: tipo (Desayuno|Almuerzo|Cena), query: ?fecha=YYYY-MM-DD
router.get('/reporte-previo/:tipo', authMiddleware, CocinaMiddleware, GetReportePrevioTurno);

// Novedades del dia: reservas excepcionales (Exc_Reserva = 'Si').
// Se llama periodicamente desde el frontend para detectar nuevas novedades.
router.get('/excepcionales-hoy', authMiddleware, CocinaMiddleware, GetExcepcionalesHoy);

// Balance del turno en progreso: consumidos, pendientes, cancelados.
// Se refresca cada N segundos en el panel de cocina.
router.get('/turno-actual/:tipo', authMiddleware, CocinaMiddleware, GetResumenTurnoActual);

export default router;
