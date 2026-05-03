// Routes/FichasRoute.js
// Rutas del modulo de fichas del sistema FoodSys
// Las rutas de escritura estan protegidas con
// authMiddleware y FichaMiddleware

import express from "express";
import authMiddleware from "../Middleware/authMiddleware.js";
import FichaMiddleware from "../Middleware/FichaMiddleware.js";
import {
  getAllFichas,
  getFichas,
  createFichas,
  updateFichas,
  deleteFichas,
} from "../Controllers/FichasController.js";

const router = express.Router();

// Lectura publica de fichas
router.get("/", getAllFichas);
router.get("/:id", getFichas);

// Escritura protegida con auth + permiso de vista Ficha
router.post("/", authMiddleware, FichaMiddleware, createFichas);
router.put("/:id", authMiddleware, FichaMiddleware, updateFichas);
router.delete("/:id", authMiddleware, FichaMiddleware, deleteFichas);

export default router;