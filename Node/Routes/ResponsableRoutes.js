import express from "express";
import { getAllResponsables, getResponsable, createResponsable, updateResponsable, deleteResponsable } from "../controllers/ResponsableController.js";

const router = express.Router();

router.get('/', getAllResponsables);
router.get('/:id', getResponsable);
router.post('/', createResponsable);
router.put('/:id', updateResponsable);
router.delete('/:id', deleteResponsable);

export default router;