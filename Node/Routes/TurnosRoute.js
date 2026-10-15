// Node/Routes/TurnosRoute.js
import express from "express";
import authMiddleware from "../Middleware/authMiddleware.js";
import SupervisorMiddleware from "../Middleware/SupervisorMiddleware.js";
import {
  obtenerTurnoActivo,
  iniciarTurno,
  finalizarTurno,
  obtenerHistorial
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

export default router;
