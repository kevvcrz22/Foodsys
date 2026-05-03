// Routes/UsuariosRolRoutes.js
// Rutas para la asignacion de roles a usuarios
// Protegidas con authMiddleware y UsuariosMiddleware
// Solo Administrador puede asignar roles

import express from "express";
import authMiddleware from "../Middleware/authMiddleware.js";
import UsuariosMiddleware from "../Middleware/UsuariosMiddleware.js";
import {
  getAllUsuariosRol,
  getUsuariosRol,
  createUsuariosRol,
  updateUsuariosRol,
  deleteUsuariosRol,
} from "../Controllers/UsuariosRolController.js";

const router = express.Router();

// Lectura protegida con auth
router.get("/", authMiddleware, getAllUsuariosRol);
router.get("/:id", authMiddleware, getUsuariosRol);

// Escritura protegida: solo Administrador
router.post("/", authMiddleware, UsuariosMiddleware, createUsuariosRol);
router.put("/:id", authMiddleware, UsuariosMiddleware, updateUsuariosRol);
router.delete("/:id", authMiddleware, UsuariosMiddleware, deleteUsuariosRol);

export default router;