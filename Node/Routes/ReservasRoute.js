 import { Router } from "express";
import authMiddleware from "../Middleware/authMiddleware.js";
import {
  obtenerTiposPermitidos,
  obtenerPlatosDelMenu,
  generarAlimentoTomorrow
} from "../Controllers/ReservasController.js";

const router = Router();

// Retorna los tipos de comida que puede reservar el usuario logueado segun su rol
// El frontend llama este endpoint al cargar el formulario para construir el select
// Internos ven: Desayuno, Almuerzo, Cena
// Externos ven: solo Almuerzo
// Ejemplo de uso: GET /api/Reservas/reservar/tipos-permitidos
router.get('/reservar/tipos-permitidos',
  authMiddleware,
  obtenerTiposPermitidos
);

// Retorna los platos del menu para una fecha y tipo de comida especificos
// El usuario primero elige el tipo de comida y luego se consulta este endpoint
// para mostrar los platos disponibles antes de confirmar la reserva
// Ejemplo de uso: GET /api/Reservas/reservar/menu/2025-05-06/Almuerzo
router.get('/reservar/menu/:fechaReserva/:tipComida',
  authMiddleware,
  obtenerPlatosDelMenu
);

// Genera una nueva reserva con el tipo de comida y plato elegido por el usuario
router.post('/reservar/generate-tomorrow',
  authMiddleware,
  generarAlimentoTomorrow
);

export default router;