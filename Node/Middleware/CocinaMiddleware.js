// Middleware/CocinaMiddleware.js
//
// Restringe el acceso a la ruta de verificacion de reservas
// exclusivamente al rol Cocina.
//
// PROPOSITO:
//   El personal de cocina es el unico que puede confirmar la presencia
//   fisica de un aprendiz externo o pasante externo antes de que el
//   supervisor pueda consumir su reserva con el QR.
//
// RUTA QUE USA ESTE MIDDLEWARE:
//   PATCH /api/Reservas/verificar/:id/cocina
//
// FLUJO DEL ESTADO:
//   Generado -> [Cocina verifica con este endpoint] -> Verificado
//            -> [Supervisor escanea QR]             -> Consumido
//
// USO EN LA RUTA:
//   router.patch('/verificar/:id/cocina', authMiddleware, CocinaMiddleware, verificarCocina);

export default async function CocinaMiddleware(req, res, next) {
  try {
    // authMiddleware debe haberse ejecutado antes para que req.user exista
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const rolesPermitidos = ['Cocina', 'Supervisor', 'Monitor', 'Bienestar', 'Coordinador', 'Supervisor de Contrato', 'Administrador'];
    const rolesUsuario    = req.user.roles || [];

    // Con some() verificamos que al menos uno de los roles del usuario este permitido
    const tienePermiso = rolesUsuario.some(rol => rolesPermitidos.includes(rol));

    if (!tienePermiso) {
      return res.status(403).json({
        message: 'Acceso denegado: se requieren permisos de Cocina, Monitor/Supervisor, Bienestar o Coordinador'
      });
    }

    // El usuario tiene el rol correcto: continuar con el controlador
    return next();
  } catch {
    return res.status(403).json({ message: 'Forbidden: Acceso Prohibido' });
  }
}
