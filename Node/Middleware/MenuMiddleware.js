// Middleware/MenuMiddleware.js
// Middleware para la vista Menu
// Solo permite acceso al rol Coordinador
import Verificar_Vista from "./VistaMiddleware.js";

const MenuMiddleware = Verificar_Vista("Menu");

export default MenuMiddleware;
