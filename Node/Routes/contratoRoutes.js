import express from 'express'
import { createcontrato, deletecontrato, getAllcontrato, getcontrato, updatecontrato } from '../Controllers/contratoController.js'

const router = express.Router()

router.get('/', getAllcontrato);
router.get('/:id', getcontrato);
router.post('/', createcontrato);
router.put('/:id', updatecontrato);
router.delete('/:id', deletecontrato);

export default router;