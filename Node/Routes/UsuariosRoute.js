import Express from "express";
import {getAllUsuarios, getUsuarios, createUsuarios, updateUsuarios, deleteUsuarios} from "../Controllers/UsuariosControllers.js";

const router = Express.Router();

router.get("/", getAllUsuarios);
router.get("/:Id", getUsuarios);
router.post("/", createUsuarios);
router.put("/:Id", updateUsuarios);
router.delete("/:Id", deleteUsuarios);

export default router;
