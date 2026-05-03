// Node/Routes/UsuariosRoutes.js
// Rutas del modulo de usuarios del sistema FoodSys
// Incluye rutas publicas (login, registro) y protegidas con authMiddleware

import express from "express";
import { check } from "express-validator";
import authMiddleware from "../Middleware/authMiddleware.js";

import {
  RegisterUsuarios,
  Login,
  getAllUsuarios,
  getUsuarios,
  updateUsuarios,
  deleteUsuarios,
  aceptarPolitica,
  getAprendices,
  importarCSV,
  // Controladores para el flujo seguro de cambio de contrasena
  validarPasswordActual,
  cambiarPassword,
} from "../Controllers/UsuariosControllers.js";

const router = express.Router();

// Registro de nuevo usuario con validaciones basicas de los campos requeridos
router.post(
  "/",
  [
    check("TipDoc_Usuario", "Tipo de documento obligatorio").notEmpty(),
    check("NumDoc_Usuario", "Numero de documento obligatorio").notEmpty(),
    check("password", "Minimo 8 caracteres").isLength({ min: 8 }),
  ],
  RegisterUsuarios
);

// Inicio de sesion: devuelve usuario, roles y token JWT
router.post("/login", Login);

// Listado de aprendices filtrado por rol (requiere autenticacion)
router.get("/aprendices", authMiddleware, getAprendices);

// Consulta publica de todos los usuarios o uno por ID
router.get("/", getAllUsuarios);
router.get("/:Id", getUsuarios);

// Actualizacion y eliminacion de usuario (requieren autenticacion)
router.put("/:Id", authMiddleware, updateUsuarios);
router.delete("/:Id", authMiddleware, deleteUsuarios);

// Aceptacion de politica de privacidad
router.patch("/:Id/politica", aceptarPolitica);

// Importacion masiva de usuarios desde un archivo CSV
router.post("/importar-csv", authMiddleware, importarCSV);

// Flujo de cambio de contrasena en dos pasos:
// Paso 1: valida que la contrasena actual sea correcta antes de permitir el cambio
router.post("/:Id/validar-password", authMiddleware, validarPasswordActual);

// Paso 2: actualiza la contrasena con la nueva clave encriptada con bcrypt
router.put("/:Id/password", authMiddleware, cambiarPassword);

export default router;