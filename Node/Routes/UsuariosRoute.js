import Express from "express";
import { RegisterUsuarios, Login, getAllUsuarios, getUsuarios, updateUsuarios, deleteUsuarios } from "../Controllers/UsuariosControllers.js";
import { check } from 'express-validator';
import authMiddleware from "../Middleware/authMiddleware.js";

const router = Express.Router();

// 🔓 Registro
router.post('/',
    [
        check('TipDoc_Usuario', 'Tipo de documento obligatorio').notEmpty(),
        check('NumDoc_Usuario', 'Número de documento obligatorio').notEmpty(),
        check('password', 'Mínimo 8 caracteres').isLength({ min: 8 })
    ],
    RegisterUsuarios
);

// 🔓 Login
router.post('/login', Login);

// 🔓 Lectura sin auth
router.get("/", getAllUsuarios);
router.get("/:Id", getUsuarios);
router.put("/:Id", authMiddleware, updateUsuarios);

// 🔒 Escritura con auth
router.delete("/:Id", authMiddleware, deleteUsuarios);

export default router;