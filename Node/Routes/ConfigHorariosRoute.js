// Node/Routes/ConfigHorariosRoute.js
// Rutas de API para la configuracion de raciones y horarios en Foodsys
// Comentarios didacticos sin tildes ni emojis para aprendices de primer semestre.

import express from "express";
import authMiddleware from "../Middleware/authMiddleware.js";
import {
  getConfigRaciones,
  updateConfigRacion,
  toggleRacion
} from "../Controllers/ConfigHorariosController.js";

const router = express.Router();

// Lectura publica / autenticada para conocer horarios y estado activo
router.get("/", getConfigRaciones);

// Rutas de administracion protegidas
router.put("/:id", authMiddleware, updateConfigRacion);
router.patch("/:id/toggle", authMiddleware, toggleRacion);

export default router;
