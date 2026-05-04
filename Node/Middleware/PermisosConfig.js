// Middleware/PermisosConfig.js
// Configuracion centralizada de permisos por vista y rol
// Cada clave es el nombre de la vista y su valor es
// un array con los roles que tienen acceso a esa vista

const Permisos_Vista = {
  Registrar: ["Supervisor"],
  Reservar: [
    "Aprendiz Interno", "Aprendiz Externo",
    "Pasante",
  ],
  Usuarios: ["Administrador"],
  Ficha: [
    "Administrador", "Supervisor",
    "Coordinador", "Bienestar",
  ],
  Reporte: [
    "Administrador", "Supervisor",
    "Coordinador", "Cocina", "Bienestar",
  ],
  Novedad: [
    "Administrador", "Coordinador", "Bienestar",
  ],
  Menu: ["Administrador", "Coordinador"],
  Programas: [
    "Supervisor", "Coordinador", "Cocina",
  ],
  Planeacion: [
    "Administrador", "Supervisor", "Bienestar",
  ],
  Permisos: ["Administrador"],
  Contacto: [
    "Aprendiz Externo", "Aprendiz Interno",
    "Pasante", "Coordinador",
    "Cocina", "Bienestar",
  ],
  Foo: [
    "Administrador", "Coordinador", "Bienestar",
  ],
  Aprendices: [
    "Administrador", "Coordinador", "Bienestar",
  ],
  Historial: [
    "Administrador", "Aprendiz Externo",
    "Aprendiz Interno",
  ],
  Konan: [
    "Pasante", "Supervisor",
    "Coordinador", "Bienestar",
  ],
};

export default Permisos_Vista;
