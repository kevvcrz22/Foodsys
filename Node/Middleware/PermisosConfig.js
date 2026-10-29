// Middleware/PermisosConfig.js
// Configuracion centralizada de permisos por vista y rol (Matriz RBAC Oficial).

const Permisos_Vista = {
  // Monitor (ex-Supervisor), Coordinador, Bienestar y Administrador pueden registrar consumos de QR
  Registrar: ["Supervisor", "Monitor", "Coordinador", "Bienestar", "Administrador"],

  // Aprendices, Pasantes, Vocero y Visitante pueden generar reservas personales
  Reservar: [
    "Aprendiz Interno",
    "Aprendiz Externo",
    "Pasante Interno",
    "Pasante Externo",
    "Vocero",
    "Visitante",
  ],

  // El CRUD de usuarios: Administrador y Coordinador (Instructores/Pasantes)
  Usuarios: ["Administrador", "Coordinador"],

  // Fichas: Administrador, Coordinador, Supervisor, Monitor, Bienestar
  Ficha: [
    "Administrador", "Supervisor", "Monitor",
    "Coordinador", "Bienestar",
  ],

  // Reportes: Administrador, Coordinador, Cocina, Bienestar, SENA Empresa, Supervisor de Contrato, Monitor/Supervisor
  Reporte: [
    "Administrador",
    "Coordinador", "Cocina", "Bienestar",
    "SENA Empresa", "Supervisor de Contrato",
    "Supervisor", "Monitor"
  ],

  // Novedades: Administrador, Coordinador y Bienestar
  Novedad: [
    "Administrador", "Coordinador", "Bienestar",
  ],

  // Menu: Administrador, Coordinador, Bienestar, Cocina, Supervisor de Contrato
  Menu: ["Administrador", "Coordinador", "Bienestar", "Cocina", "Supervisor de Contrato"],

  // Plato: Administrador, Coordinador, Bienestar, Cocina, Supervisor de Contrato
  Plato: ["Administrador", "Coordinador", "Bienestar", "Cocina", "Supervisor de Contrato"],

  // Programas: Administrador y Coordinador
  Programas: [
    "Administrador", "Coordinador",
  ],

  // Planeacion
  Planeacion: [
    "Administrador", "Supervisor", "Monitor", "Bienestar", "Coordinador", "Supervisor de Contrato"
  ],

  // Gestion de permisos y asignacion de roles: Administrador y Coordinador
  Permisos: ["Administrador", "Coordinador"],

  // Contacto
  Contacto: [
    "Aprendiz Externo", "Aprendiz Interno",
    "Pasante Interno", "Pasante Externo",
    "Visitante", "Vocero", "Instructor", "SENA Empresa",
    "Coordinador", "Cocina", "Bienestar", "Supervisor", "Monitor", "Supervisor de Contrato"
  ],

  // Vista de aprendices: Admin, Coordinador y Bienestar
  Aprendices: [
    "Administrador", "Coordinador", "Bienestar",
  ],

  // Vista de pasantes: Admin, Coordinador y Bienestar
  Pasantes: [
    "Administrador", "Coordinador", "Bienestar",
  ],

  // Historial de reservas personales
  Historial: [
    "Administrador", "Coordinador",
    "Aprendiz Externo", "Aprendiz Interno",
    "Pasante Interno", "Pasante Externo",
    "Vocero", "Visitante", "SENA Empresa"
  ],

  // Verificacion de cocina y monitor
  Verificar: ["Cocina", "Monitor", "Supervisor", "Administrador", "Coordinador"],

  // Planificacion de cantidades por turno: Cocina, Bienestar, Coordinador, Supervisor de Contrato y Administrador
  PlanCocina: ["Cocina", "Bienestar", "Coordinador", "Supervisor de Contrato", "Administrador"],
};

export default Permisos_Vista;
