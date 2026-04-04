export default async function rolesusuariosMiddleware(req, res, next) {
  try {

    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const rolesPermitidos = ['Aprendiz Interno', 'Aprendiz Externo'];

    const rolesUsuario = req.user.roles || [];

    const tienePermiso = rolesUsuario.some(rol =>
      rolesPermitidos.includes(rol)
    );

    if (!tienePermiso) {
      return res.status(403).json({ message: 'Este rol no permite generar QR' });
    }

    return next();

  } catch (err) {
    return res.status(403).json({ message: 'Forbidden: Acceso Prohibido' });
  }
}