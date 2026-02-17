import Express from "express";
import {RegisterUsuarios, Login, getAllUsuarios, getUsuarios, updateUsuarios, deleteUsuarios} from "../Controllers/UsuariosControllers.js";
import { check } from 'express-validator';


const router = Express.Router();

router.post('/',
    [
        check('TipDoc_Usuario', 'Tipo de documento obligatorio').notEmpty(),
        check('NumDoc_Usuario', 'Número de documento obligatorio').notEmpty(),
        check('password', 'Mínimo 8 caracteres').isLength({ min: 8 })
    ],
    RegisterUsuarios);

router.post('/login', Login);



router.get("/", getAllUsuarios);
router.get("/:Id", getUsuarios);
router.put("/:Id", updateUsuarios);
router.delete("/:Id", deleteUsuarios);

export default router;