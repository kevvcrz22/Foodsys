// Node/Routes/CampoRoute.js
// Rutas de API para el modulo de Jornada de Campo y Almuerzos Guardados (SENA Empresa)

import express from "express";
import authMiddleware from "../Middleware/authMiddleware.js";
import {
  obtenerAprendicesFicha,
  crearSolicitudCampo,
  listarSolicitudesCampo,
  detalleSolicitudCampo,
  entregarAlmuerzoCampo,
  programarSemanaCampo
} from "../Controllers/CampoController.js";

const router = express.Router();

// 1. Obtener aprendices de una ficha con estado de reserva de almuerzo
router.get("/ficha/:numFicha", authMiddleware, obtenerAprendicesFicha);

// 2. Crear solicitud / acta de almuerzos guardados por jornada de campo
router.post("/solicitud", authMiddleware, crearSolicitudCampo);

// 2.1 Programar turnos de almuerzo para toda la semana (Lunes a Viernes)
router.post("/programar-semana", authMiddleware, programarSemanaCampo);

// 3. Listar solicitudes registradas con filtros (fecha, unidad, ficha, estado)
router.get("/solicitudes", authMiddleware, listarSolicitudesCampo);

// 4. Detalle nominal de aprendices de una solicitud especifica
router.get("/solicitudes/:id", authMiddleware, detalleSolicitudCampo);

// 5. Registrar entrega de almuerzo guardado (individual o grupal)
router.post("/solicitudes/:id/entregar", authMiddleware, entregarAlmuerzoCampo);

export default router;
