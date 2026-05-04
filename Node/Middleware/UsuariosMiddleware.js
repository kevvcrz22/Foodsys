// Node/Middleware/UsuariosMiddleware.js
// Middleware especializado para la gestion administrativa de usuarios y roles
// Utiliza la fabrica de permisos centralizada
import Verificar_Vista from "./VistaMiddleware.js";

// Segun PermisosConfig.js, solo el Administrador tiene acceso a la vista 'Usuarios'
const UsuariosMiddleware = Verificar_Vista("Usuarios");

export default UsuariosMiddleware;
