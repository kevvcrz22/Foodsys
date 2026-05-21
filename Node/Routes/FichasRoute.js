// Routes/FichasRoute.js
// Rutas del modulo de fichas del sistema Foodsys
// Las rutas de escritura estan protegidas con
// authMiddleware y FichaMiddleware

import express from "express";
import authMiddleware from "../Middleware/authMiddleware.js";
import {
  getAllFichas,
  getFichas,
  createFichas,
  updateFichas,
  deleteFichas,
  descargarPlantillaFicha
} from "../Controllers/FichasController.js";

const router = express.Router();

// Lectura publica de fichas
router.get("/", getAllFichas);
router.get('/plantilla-excel', descargarPlantillaFicha);
router.get("/:id", getFichas);

// Escritura protegida con auth + permiso de vista Ficha
router.post("/", authMiddleware, createFichas);
router.put("/:id", authMiddleware, updateFichas);
router.delete("/:id", authMiddleware, deleteFichas);

export default router;