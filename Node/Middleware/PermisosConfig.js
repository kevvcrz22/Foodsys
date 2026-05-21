// Middleware/PermisosConfig.js
//
// Configuracion centralizada de permisos por vista y rol.
// Cada clave es el nombre de la vista y su valor es un array
// con los roles que tienen acceso a esa vista.
//
// IMPORTANTE: los nombres de roles deben coincidir EXACTAMENTE con
// los valores del campo Nom_Rol en la tabla roles de la base de datos.
// Si hay diferencia de mayusculas o espacios, el sistema no dara acceso.
//
// CAMBIOS APLICADOS:
//   - Reporte: se elimino Supervisor. Solo Admin, Coordinador, Cocina, Bienestar.
//   - Novedad: Bienestar puede crear novedades ademas de Coordinador.
//   - Menu / Plato: Cocina tiene acceso de lectura para planificar produccion.
//   - PlanCocina: nuevo permiso para el modulo de cantidades por turno (solo Cocina).

const Permisos_Vista = {
  // Solo el Supervisor puede registrar consumos de QR
  Registrar: ["Supervisor"],

  // Todos los tipos de aprendices y pasantes pueden generar reservas.
  // Aunque un usuario tenga otros roles (ej: Coordinador), solo puede
  // acceder a Reservar cuando su rol activo sea el de aprendiz/pasante.
  Reservar: [
    "Aprendiz Interno",
    "Aprendiz Externo",
    "Pasante Interno",
    "Pasante Externo",
  ],

  // El CRUD de usuarios es exclusivo del Administrador
  Usuarios: ["Administrador"],

  // La vista de fichas la pueden ver varios roles administrativos
  Ficha: [
    "Administrador", "Supervisor",
    "Coordinador", "Bienestar",
  ],

  // Los reportes son visibles para roles de gestion y operacion.
  // Supervisor NO tiene acceso a reportes.
  // Aprendices y Pasantes NO tienen acceso a reportes.
  Reporte: [
    "Administrador",
    "Coordinador", "Cocina", "Bienestar",
  ],

  // Novedades: Bienestar puede crear y ver novedades ademas del Coordinador y Admin.
  Novedad: [
    "Administrador", "Coordinador", "Bienestar",
  ],

  // Menu: Admin para CRUD completo. Cocina solo usa GET (lectura) para
  // ver los menus del dia y planificar cantidades de produccion.
  Menu: ["Administrador", "Cocina"],

  // Plato: Admin para CRUD completo. Cocina solo usa GET (lectura).
  Plato: ["Administrador", "Cocina"],

  // Programas: roles de planificacion academica
  Programas: [
    "Administrador", "Coordinador",
  ],

  // Planeacion: roles estrategicos
  Planeacion: [
    "Administrador", "Supervisor", "Bienestar",
  ],

  // Gestion de permisos: exclusivo del Administrador
  Permisos: ["Administrador"],

  // Contacto: visible para aprendices, pasantes y roles de apoyo
  Contacto: [
    "Aprendiz Externo", "Aprendiz Interno",
    "Pasante Interno", "Pasante Externo",
    "Coordinador", "Cocina", "Bienestar",
  ],

  // Vista de aprendices con campo sancion: Admin, Coordinador y Bienestar
  Aprendices: [
    "Administrador", "Coordinador", "Bienestar",
  ],

  // Historial de reservas personales: aprendices y pasantes
  Historial: [
    "Administrador",
    "Aprendiz Externo", "Aprendiz Interno",
    "Pasante Interno", "Pasante Externo",
  ],

  // Verificacion de cocina: solo el personal de cocina puede verificar presencia
  Verificar: ["Cocina"],

  // Modulo de planificacion de cantidades por turno: exclusivo de Cocina.
  // Permite ver cuantas reservas hay por tipo y plato para preparar la produccion.
  PlanCocina: ["Cocina"],
};

export default Permisos_Vista;
