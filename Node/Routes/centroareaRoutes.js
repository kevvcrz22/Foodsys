import express from 'express'
import { createcentroarea, deletecentroarea, getAllcentroarea, getcentroarea, updatecentroarea } from '../Controllers/centroareaController.js'

const router = express.Router()

router.get('/', getAllcentroarea);
router.get('/:id', getcentroarea);
router.post('/', createcentroarea);
router.put('/:id', updatecentroarea);
router.delete('/:id', deletecentroarea);

export default router;