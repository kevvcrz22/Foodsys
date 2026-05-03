import { Router } from "express";
import authMiddleware from "../Middleware/authMiddleware.js";
import ReservarMiddleware from "../Middleware/ReservarMiddleware.js";
import { generarAlimentoTomorrow, obtenerHistorial, generarReservaExcepcional } from "../Controllers/ReservasController.js";

const router = Router();

// Genera una nueva reserva para el dia siguiente
router.post('/reservar/generate-tomorrow',
  authMiddleware,
  // ReservarMiddleware, // descomentar cuando se quiera restringir por rol
  generarAlimentoTomorrow
);

// Retorna el historial de reservas del usuario autenticado
router.get('/reservar/historial',
  authMiddleware,
  obtenerHistorial
);

// Genera una reserva excepcional (novedad)
router.post('/excepcional',
  authMiddleware,
  generarReservaExcepcional
);

export default router;