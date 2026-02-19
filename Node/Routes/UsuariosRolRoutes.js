import express from 'express'
import { createUsuariosRol, deleteUsuariosRol, getAllUsuariosRol, getUsuariosRol, updateUsuariosRol } from '../Controllers/UsuariosRolController.js'

const router = express.Router()

router.get('/', getAllUsuariosRol);
router.get('/:id', getUsuariosRol);
router.post('/', createUsuariosRol);
router.put('/:id', updateUsuariosRol);
router.delete('/:id', deleteUsuariosRol);

export default router;