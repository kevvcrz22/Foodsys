import express from "express"
import { getAllEmpresas, getEmpresas, createEmpresas, updateEmpresas, deleteEmpresas } from '../Controllers/EmpresasController.js'

const router = express.Router()

router.get('/', getAllEmpresas);
router.get('/:id', getEmpresas);
router.post('/', createEmpresas);
router.put('/:id', updateEmpresas);
router.delete('/:id', deleteEmpresas);

export default router;