import express from 'express'
import { getAllturnos, getturnos, createturnos, updateturnos, deleteturnos } from '../Controllers/turnosController.js'

const router = express.Router();

router.get('/', getAllturnos);
router.get('/:id', getturnos);
router.post('/', createturnos);
router.put('/:id', updateturnos);
router.delete('/:id', deleteturnos);

export default router;