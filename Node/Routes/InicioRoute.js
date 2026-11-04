// Routes/InicioRoute.js
// Ruta para el endpoint de Inicio del sistema
// Protegida con authMiddleware para validar el token

import express from "express";
import authMiddleware from "../Middleware/authMiddleware.js";
import { ObtenerVistas } from "../Controllers/InicioController.js";

const Router_Inicio = express.Router();

// GET /api/Inicio/vistas?rol=Administrador
// Retorna las vistas disponibles para el rol dado
Router_Inicio.get(
  "/vistas",
  authMiddleware,
  ObtenerVistas
);

export default Router_Inicio;
