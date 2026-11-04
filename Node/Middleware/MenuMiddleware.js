// Middleware/MenuMiddleware.js
// Restringe el acceso a las rutas de menus.
// Solo los roles definidos en PermisosConfig para la clave "Menu" pueden escribir.
// Debe ejecutarse despues de authMiddleware, que ya poblo req.user.

import Permisos_Vista from "./PermisosConfig.js";

export default async function MenuMiddleware(req, res, next) {
  try {
    // Verifica que authMiddleware haya procesado el token y populado req.user
    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    // Roles con acceso a la gestion de menus segun la configuracion centralizada
    const Roles_Permitidos = Permisos_Vista.Menu || [];

    // El payload del token debe incluir el array 'roles' del usuario
    const Roles_Usuario = req.user.roles || [];

    // Verifica que al menos uno de los roles del usuario este en la lista permitida
    const Tiene_Permiso = Roles_Usuario.some((Rol) =>
      Roles_Permitidos.includes(Rol)
    );

    if (!Tiene_Permiso) {
      return res.status(403).json({
        message: `Acceso denegado: se requiere uno de estos roles: ${Roles_Permitidos.join(", ")}`,
      });
    }

    // Todo correcto: pasa al siguiente middleware o controlador
    return next();
  } catch (Err) {
    return res.status(403).json({ message: "Forbidden: Acceso Prohibido" });
  }
}
