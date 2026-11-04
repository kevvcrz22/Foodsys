// Routes/MenusRoutes.js
// Rutas del modulo de menus del sistema Foodsys.
// Las rutas estaticas SIEMPRE antes de /:id para que Express no las interprete
// como valores de parametro.
//
// Ruta agregada (no existia):
//   GET /fecha/:fecha -> getMenuByFecha
//   Necesaria para que el modulo de Novedades cargue los platos disponibles del dia
//   actual al momento de registrar una reserva excepcional. La funcion getMenuByFecha
//   ya estaba importada en MenusController pero no tenia ruta asignada.

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
router.get("/disponibles", getMenuDisponibles);

// Retorna todos los menus de una fecha especifica con el plato incluido.
// Parametro: fecha en formato YYYY-MM-DD.
// Novedades.jsx la usa para cargar los platos disponibles del dia actual
// al seleccionar un aprendiz en el formulario de reserva excepcional.
router.get("/fecha/:fecha", getMenuByFecha);

// Lectura por ID — debe ir despues de las rutas estaticas para evitar colisiones
router.get("/:id", getMenu);

// Escritura protegida con auth + permiso de vista Menu
router.post("/", authMiddleware, MenuMiddleware, createMenu);
router.put("/:id", authMiddleware, MenuMiddleware, updateMenu);
router.delete("/:id", authMiddleware, MenuMiddleware, deleteMenu);

export default router;