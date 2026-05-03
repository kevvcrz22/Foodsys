// Verifica que el usuario autenticado tenga un rol que le permita generar reservas
export default async function ReservarMiddleware(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const rolesPermitidos = ['Aprendiz Interno', 'Aprendiz Externo', 'Pasante Interno', 'Pasante Externo'];
    const rolesUsuario = req.user.roles || [];

    // Con some() basta con que un solo rol del usuario este en la lista para dar acceso
    const tienePermiso = rolesUsuario.some(rol => rolesPermitidos.includes(rol));
    if (!tienePermiso) {
      return res.status(403).json({ message: 'Este rol no permite generar QR' });
    }

    return next();
  } catch (err) {
    return res.status(403).json({ message: 'Forbidden: Acceso Prohibido' });
  }
}