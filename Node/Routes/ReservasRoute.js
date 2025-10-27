import express from "express"
import { getAllReservas, getReservas, createReservas, updateReservas, deleteReservas } from '../Controllers/ReservasController.js'

const router = express.Router()

router.get('/', getAllReservas);
router.get('/:id', getReservas);
router.post('/', createReservas);
router.put('/:id', updateReservas);
router.delete('/:id', deleteReservas);

export default router;