// Node/Middleware/ProgramaMiddleware.js
// Middleware especializado para la gestion de programas de formacion
import Verificar_Vista from "./VistaMiddleware.js";

const ProgramaMiddleware = Verificar_Vista("Programas");

export default ProgramaMiddleware;
