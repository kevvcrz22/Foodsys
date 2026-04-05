import {Router} from "express"
import authMiddleware from "../Middleware/authMiddleware.js"
import rolesusuariosMiddleware from "../Middleware/rolesusuariosMiddleware.js"
import { generarDesayunoTomorrow } from "../Controllers/CheckinPassContoller.js"

const routerCheckinpass = Router()

routerCheckinpass.post('/desayuno/generate-tomorrow', authMiddleware, rolesusuariosMiddleware, generarDesayunoTomorrow)

export default routerCheckinpass