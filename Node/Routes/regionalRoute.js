import express from 'express'
import { getAllregional, regional, createregional, updateregional, deleteregional } from '../controllers/regionalController.js'

const router = express.Router()

router.get('/', getAllregional);
router.get('/:id', regional);
router.post('/', createregional);
router.put('/:id', updateregional);
router.delete('/:id', deleteregional);

export default router;