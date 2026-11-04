// Node/Routes/NotificacionesRoute.js
import express from "express";
import authMiddleware from "../Middleware/authMiddleware.js";
import {
  obtenerNotificaciones,
  marcarLeida,
  marcarTodasLeidas
} from "../Controllers/NotificacionesController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", obtenerNotificaciones);
router.patch("/:id/leer", marcarLeida);
router.patch("/leer-todas", marcarTodasLeidas);

export default router;
