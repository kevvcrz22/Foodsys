// Middleware para restringir el acceso a usuarios con roles de gestion: Administrador, Coordinador o Bienestar
export default async function GestionMiddleware(req, res, next) {
  try {
    // Verifica que el token ya fue procesado por authMiddleware y que existe el objeto user
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    // Roles permitidos para funciones administrativas / de gestion
    const rolesPermitidos = ['Administrador', 'Coordinador', 'Bienestar'];

    // Se asume que el payload del token incluye un array 'roles'
    const rolesUsuario = req.user.roles || [];

    // Comprueba si al menos uno de los roles del usuario coincide con los permitidos
    const tienePermiso = rolesUsuario.some(rol => rolesPermitidos.includes(rol));
    
    if (!tienePermiso) {
      return res.status(403).json({ message: 'Acceso denegado: se requiere rol de Administrador, Coordinador o Bienestar' });
    }

    // Si todo es correcto, continua con la siguiente funcion (controlador)
    return next();
  } catch (err) {
    // En caso de error inesperado, responde con 403
    return res.status(403).json({ message: 'Forbidden: Acceso Prohibido' });
  }
}