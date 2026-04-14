import express from "express"

import { getAllReservas, getReservas, createReservas, updateReservas, deleteReservas, checkDisponibilidad, countCanceladas, crearReservaExcepcional, getReporteDetalleAprendiz,  obtenerReporteAprendices  } from '../Controllers/ReservasController.js'

const router = express.Router()

router.get('/', getAllReservas);
router.get('/disponibilidad', checkDisponibilidad);
router.get('/canceladas/count', countCanceladas);  
router.get('/reportes/aprendices', obtenerReporteAprendices);
router.get('/:id', getReservas);
router.post('/', createReservas);
router.get('/reporte-aprendiz-detalle/:id', getReporteDetalleAprendiz);

router.put('/:id', updateReservas);
router.delete('/:id', deleteReservas);
router.post('/excepcional', crearReservaExcepcional)


export default router;