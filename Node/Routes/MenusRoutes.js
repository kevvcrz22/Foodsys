// Routes/MenusRoutes.js
// Rutas del modulo de menus del sistema FoodSys
// Las rutas de escritura estan protegidas con
// authMiddleware y MenuMiddleware

import express from "express";
import authMiddleware from "../Middleware/authMiddleware.js";
import MenuMiddleware from "../Middleware/MenuMiddleware.js";
import {
  getAllMenu,
  getMenu,
  getMenuByFecha,
  createMenu,
  updateMenu,
  deleteMenu,
  getMenuDisponibles,
} from "../Controllers/MenusController.js";

const router = express.Router();

// Lectura publica de menus
router.get("/", getAllMenu);
router.get("/disponibles", getMenuDisponibles); // Platos disponibles por fecha y tipo
router.get("/:id", getMenu);

// Escritura protegida con auth + permiso de vista Menu
router.post("/", authMiddleware, MenuMiddleware, createMenu);
router.put("/:id", authMiddleware, MenuMiddleware, updateMenu);
router.delete("/:id", authMiddleware, MenuMiddleware, deleteMenu);

export default router;