// Node/Middleware/VistaMiddleware.js
// Fabrica de middlewares para validar permisos de acceso a vistas especificas
// Compara los roles del usuario con la configuracion en PermisosConfig.js

import Permisos_Vista from "./PermisosConfig.js";

/**
 * Crea un middleware que verifica si el usuario autenticado tiene permisos para una vista.
 * @param {string} nombreVista - El nombre de la vista tal como aparece en PermisosConfig.js
 * @returns {Function} Middleware de Express
 */
const Verificar_Vista = (nombreVista) => {
  return (req, res, next) => {
    try {
      // El objeto req.user debe haber sido inyectado previamente por authMiddleware
      if (!req.user) {
        return res.status(401).json({ message: "No autenticado" });
      }

      // Obtener los roles permitidos para esta vista desde la configuracion
      const rolesPermitidos = Permisos_Vista[nombreVista] || [];
      const rolesUsuario = req.user.roles || [];

      // Si no hay roles configurados, por seguridad denegamos el acceso
      if (rolesPermitidos.length === 0) {
        return res.status(403).json({ message: `Acceso denegado: vista '${nombreVista}' no configurada` });
      }

      // Comprobar si el usuario tiene al menos uno de los roles requeridos
      const tienePermiso = rolesUsuario.some((rol) => rolesPermitidos.includes(rol));

      if (!tienePermiso) {
        return res.status(403).json({
          message: `Acceso denegado: no tienes permiso para acceder a la vista '${nombreVista}'`
        });
      }

      // El usuario tiene permiso, continuamos al siguiente middleware o controlador
      return next();
    } catch (error) {
      console.error("Error en VistaMiddleware:", error);
      return res.status(500).json({ message: "Error interno en la validacion de permisos" });
    }
  };
};

export default Verificar_Vista;
