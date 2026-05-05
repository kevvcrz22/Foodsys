import { Router } from "express";
import authMiddleware from "../Middleware/authMiddleware.js";
// HorariosMiddleware valida que el horario actual permita crear una reserva
// para el tipo de comida enviado. Actua como guardia antes del controlador.
import {
  generarAlimentoTomorrow,
  obtenerHistorial,
  obtenerHistorialCompleto,
  cancelarReserva,
} from "../Controllers/ReservasController.js";

const router = Router();

// Genera una nueva reserva para el dia siguiente.
// La cadena de middlewares es: auth -> controlador.
router.post('/reservar/generate-tomorrow',
  authMiddleware,
  generarAlimentoTomorrow
);

// Retorna las ultimas 10 reservas del usuario autenticado
router.get('/reservar/historial',
  authMiddleware,
  obtenerHistorial
);

// Retorna todas las reservas del usuario autenticado sin limite
router.get('/reservar/historial/completo',
  authMiddleware,
  obtenerHistorialCompleto
);

// Cancela una reserva con estado Generado que pertenece al usuario autenticado
router.patch('/reservar/:id/cancelar',
  authMiddleware,
  cancelarReserva
);

export default router;