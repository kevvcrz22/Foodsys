import Express from "express";
import {getAllAprendiz, getAprendiz, createAprendiz, updateAprendiz, deleteAprendiz} from "../Controllers/AprendizControllers.js";

const router = Express.Router();

router.get("/", getAllAprendiz);
router.get("/:Id", getAprendiz);
router.post("/", createAprendiz);
router.put("/:Id", updateAprendiz);
router.delete("/:Id", deleteAprendiz);

export default router;
