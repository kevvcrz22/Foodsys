import express from 'express'
import { getAllregional, getregional, createregional, updateregional, deleteregional } from '../Controllers/regionalControllers.js'

const router = express.Router()

router.get('/', getAllregional);
router.get('/:id', getregional);
router.post('/', createregional);
router.put('/:id', updateregional);
router.delete('/:id', deleteregional);

export default router;