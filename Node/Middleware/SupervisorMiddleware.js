// Middleware/SupervisorMiddleware.js
//
// Restringe el acceso a un endpoint exclusivamente al rol Supervisor.
// Se usa en las rutas de consumo de reservas:
//   POST /api/Reservas/consumir/supervisor
//   POST /api/Reservas/consumir/documento
//   POST /api/Reservas/consumir/id
//
// El supervisor es el unico rol que puede marcar una reserva como Consumida.
// Si un usuario con otro rol intenta acceder, recibe un 403.
//
// USO EN LA RUTA:
//   router.post('/consumir/supervisor', authMiddleware, SupervisorMiddleware, controlador);

export default async function SupervisorMiddleware(req, res, next) {
  try {
    // authMiddleware debe haberse ejecutado antes para que req.user exista
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    // Solo el Supervisor puede registrar consumos de reservas.
    // Un Administrador no puede hacer esta funcion aunque tenga mas permisos en otras areas.
    const rolesPermitidos = ['Supervisor'];
    const rolesUsuario    = req.user.roles || [];

    // Con some() verificamos que al menos uno de los roles del usuario sea Supervisor
    const tienePermiso = rolesUsuario.some(rol => rolesPermitidos.includes(rol));

    if (!tienePermiso) {
      return res.status(403).json({
        message: 'Acceso denegado: solo el Supervisor puede registrar consumos de reservas'
      });
    }

    // El usuario tiene el rol correcto: continuar con el controlador
    return next();
  } catch {
    return res.status(403).json({ message: 'Forbidden: Acceso Prohibido' });
  }
}
