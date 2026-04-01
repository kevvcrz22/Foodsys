import express from "express"
import { getAllReservas, getReservas, createReservas, updateReservas, deleteReservas, checkDisponibilidad, countCanceladas, crearReservaExcepcional } from '../Controllers/ReservasController.js'

const router = express.Router()

router.get('/', getAllReservas);
router.get('/disponibilidad', checkDisponibilidad);
router.get('/canceladas/count', countCanceladas);  
router.get('/:id', getReservas);
router.post('/', createReservas);
router.put('/:id', updateReservas);
router.delete('/:id', deleteReservas);
router.post('/excepcional', crearReservaExcepcional);

export default router;