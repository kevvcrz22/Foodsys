// Routes/ProgramaRoutes.js
// Rutas del modulo de programas del sistema FoodSys
// Las rutas de escritura estan protegidas con
// authMiddleware y ProgramaMiddleware

import express from "express";
import authMiddleware from "../Middleware/authMiddleware.js";
import ProgramaMiddleware from "../Middleware/ProgramaMiddleware.js";
import {
  getAllPrograma,
  getPrograma,
  createPrograma,
  updatePrograma,
  deletePrograma,
} from "../Controllers/ProgramaController.js";

const router = express.Router();

// Lectura publica de programas
router.get("/", getAllPrograma);
router.get("/:id", getPrograma);

// Escritura protegida con auth + permiso de vista Programas
router.post("/", authMiddleware, ProgramaMiddleware, createPrograma);
router.put("/:id", authMiddleware, ProgramaMiddleware, updatePrograma);
router.delete("/:id", authMiddleware, ProgramaMiddleware, deletePrograma);

export default router;