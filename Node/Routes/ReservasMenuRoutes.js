import express from "express";
import { getAllReservasMenu, getReservaMenu, createReservaMenu, updateReservaMenu, deleteReservaMenu } from "../Controllers/ReservasMenuControllers.js";

const router = express.Router();

router.get('/', getAllReservasMenu);
router.get('/:id', getReservaMenu);
router.post('/', createReservaMenu);
router.put('/:id', updateReservaMenu);
router.delete('/:id', deleteReservaMenu);

export default router;