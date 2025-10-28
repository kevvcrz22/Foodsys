import express from 'express'
import { getAllboletas, getboletas, createboletas,updateboletas, deleteboletas } from '../Controllers/boletasController.js'

const router = express.Router()

router.get('/', getAllboletas);
router.get('/:id', getboletas);
router.post('/', createboletas);
router.put('/:id', updateboletas);
router.delete('/:id', deleteboletas);

export default router;