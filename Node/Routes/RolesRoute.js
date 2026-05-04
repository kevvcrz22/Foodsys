// Routes/RolesRoute.js
// Rutas del modulo de roles del sistema FoodSys
// Protegidas con authMiddleware y UsuariosMiddleware
// ya que solo Administrador gestiona los roles

import express from "express";
import authMiddleware from "../Middleware/authMiddleware.js";
import {
  getAllRoles,
  getRoles,
  createRoles,
  updateRoles,
  deleteRoles,
} from "../Controllers/RolesController.js";

const router = express.Router();

// Lectura de roles (puede ser publica para formularios)
router.get("/", getAllRoles);
router.get("/:id", getRoles);

// Escritura protegida: solo Administrador
router.post("/", authMiddleware, createRoles);
router.put("/:id", authMiddleware, updateRoles);
router.delete("/:id", authMiddleware, deleteRoles);

export default router;