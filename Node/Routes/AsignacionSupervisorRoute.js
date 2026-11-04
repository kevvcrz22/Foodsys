// Node/Routes/AsignacionSupervisorRoute.js
import express from "express";
import authMiddleware from "../Middleware/authMiddleware.js";
import {
  getAsignaciones,
  crearAsignacion,
  revocarAsignacion,
  revisarVencidos
} from "../Controllers/AsignacionSupervisorController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getAsignaciones);
router.get("/listar", getAsignaciones);
router.post("/crear", crearAsignacion);
router.patch("/:id/revocar", revocarAsignacion);
router.delete("/:id", revocarAsignacion);
router.post("/revisar-vencidos", revisarVencidos);

export default router;

