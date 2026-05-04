// Routes/NovedadesRoute.js
// Rutas del modulo de novedades del sistema
// Protegidas con authMiddleware

import express from "express";
import authMiddleware from "../Middleware/authMiddleware.js";
import {
  Obtener_Excepcionales,
  Obtener_Tipos,
} from "../Controllers/NovedadesController.js";

const Router_Novedades = express.Router();

// GET /api/Novedades/excepcionales
// Retorna las reservas excepcionales del dia
Router_Novedades.get(
  "/excepcionales",
  authMiddleware,
  Obtener_Excepcionales
);

// GET /api/Novedades/tipos
// Retorna los tipos de comida permitidos por rol
Router_Novedades.get(
  "/tipos",
  authMiddleware,
  Obtener_Tipos
);

export default Router_Novedades;
