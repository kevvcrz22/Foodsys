import express from "express";
import { aceptarPolitica, getAprendices } from "../Controllers/UsuariosControllers.js";
import {
  RegisterUsuarios,
  Login,
  getAllUsuarios,
  getUsuarios,
  updateUsuarios,
  deleteUsuarios
} from "../Controllers/UsuariosControllers.js";

import { check } from "express-validator";
import authMiddleware from "../Middleware/authMiddleware.js";

const router = express.Router();

// 🔓 Registro
router.post(
  "/",
  [
    check("TipDoc_Usuario", "Tipo de documento obligatorio").notEmpty(),
    check("NumDoc_Usuario", "Número de documento obligatorio").notEmpty(),
    check("password", "Mínimo 8 caracteres").isLength({ min: 8 })
  ],
  RegisterUsuarios
);

// 🔓 Login
router.post("/login", Login);


router.get("/aprendices", getAprendices);

// 🔓 Lectura sin auth
router.get("/", getAllUsuarios);
router.get("/:Id", getUsuarios);

// 🔒 Escritura con auth
router.put("/:Id", authMiddleware, updateUsuarios);
router.delete("/:Id", authMiddleware, deleteUsuarios);

// ✅ Política
router.patch("/:Id/politica", aceptarPolitica);


export default router;