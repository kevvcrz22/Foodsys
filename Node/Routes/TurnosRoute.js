// Node/Routes/TurnosRoute.js
// Rutas de turnos de supervision de comedor
import express from "express";
import authMiddleware from "../Middleware/authMiddleware.js";
import SupervisorMiddleware from "../Middleware/SupervisorMiddleware.js";
import {
  obtenerTurnoActivo,
  iniciarTurno,
  finalizarTurno,
  obtenerHistorial,
  obtenerConsumosDeTurno
} from "../Controllers/TurnosController.js";

const router = express.Router();

router.use(authMiddleware);

// Consultar si hay un turno activo en el sistema
router.get("/activo", obtenerTurnoActivo);

// Iniciar turno (exclusivo para supervisor)
router.post("/iniciar", SupervisorMiddleware, iniciarTurno);

// Finalizar turno
router.post("/finalizar", finalizarTurno);

// Historial de turnos
router.get("/historial", obtenerHistorial);

// Listado nominal de consumos de un turno especifico para cierre y reportes
router.get("/:id/consumos", obtenerConsumosDeTurno);

export default router;
