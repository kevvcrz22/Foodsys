import express from "express"
import { getAllFichas, getFichas, createFichas, updateFichas, deleteFichas } from '../Controllers/FichasController.js'

const router = express.Router()

router.get('/', getAllFichas);
router.get('/:id', getFichas);
router.post('/', createFichas);
router.put('/:id', updateFichas);
router.delete('/:id', deleteFichas);

export default router;