import express from 'express'
import { createPrograma, deletePrograma, getAllPrograma, getPrograma, updatePrograma } from '../Controllers/ProgramaController.js'

const router = express.Router()

router.get('/', getAllPrograma);
router.get('/:id', getPrograma);
router.post('/', createPrograma);
router.put('/:id', updatePrograma);
router.delete('/:id', deletePrograma);

export default router;