// Middleware/PermisosConfig.js
//
// Configuracion centralizada de permisos por vista y rol.
// Cada clave es el nombre de la vista y su valor es un array
// con los roles que tienen acceso a esa vista.
//
// IMPORTANTE: los nombres de roles deben coincidir EXACTAMENTE con
// los valores del campo Nom_Rol en la tabla roles de la base de datos.
// Si hay diferencia de mayusculas o espacios, el sistema no dara acceso.

const Permisos_Vista = {
  // Solo el Supervisor puede registrar consumos
  Registrar: ["Supervisor"],

  // Todos los tipos de aprendices y pasantes pueden generar reservas
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

  // Los reportes son visibles para todos los roles de gestion y monitoreo
  Reporte: [
    "Administrador", "Supervisor",
    "Coordinador", "Cocina", "Bienestar",
  ],

  // Las novedades las gestionan los roles de bienestar y coordinacion
  Novedad: [
    "Administrador", "Coordinador", "Bienestar",
  ],

  // El CRUD de menus lo administra solo el Admin
  Menu: ["Administrador"],

  // Programas: solo roles de planificacion
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

  // Vista de aprendices: roles administrativos y de bienestar
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
};

export default Permisos_Vista;
