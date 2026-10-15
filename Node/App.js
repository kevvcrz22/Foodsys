// App.js
// Archivo principal del servidor de la aplicación Foodsys.
// Arquitectura Clean Code y Seguridad Senior implementada.

// ---------- 1. IMPORTACIÓN DE DEPENDENCIAS ----------
import http from 'http';
import Express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet'; // Seguridad: Protección de cabeceras HTTP
import rateLimit from 'express-rate-limit'; // Seguridad: Prevención de fuerza bruta
import db from './Database/db.js';
import { fileURLToPath } from 'url';
import Path from 'path';
import './Jobs/VencimientoJob.js';
import { initSocket } from './Services/SocketService.js';

// ---------- 2. IMPORTACIÓN DE RUTAS ----------
import UsuariosRoute from './Routes/UsuariosRoute.js';
import FichasRoute from './Routes/FichasRoute.js';
import ReservasRoute from './Routes/ReservasRoute.js';
import ProgramaRoute from './Routes/ProgramaRoutes.js';
import RolesRoute from './Routes/RolesRoute.js';
import UsuariosRolRoutes from './Routes/UsuariosRolRoutes.js';
import PlatosRoutes from './Routes/PlatosRoutes.js';
import MenusRoutes from './Routes/MenusRoutes.js';
import ReportesRoute from './Routes/ReportesRoute.js';
import InicioRoute from './Routes/InicioRoute.js';
import NovedadesRoute from './Routes/NovedadesRoute.js';
import CocinaRoute from './Routes/CocinaRoute.js';
import RutasAutenticacion from './Routes/Rutas_Autenticacion.js';
import TurnosRoute from './Routes/TurnosRoute.js';
import NotificacionesRoute from './Routes/NotificacionesRoute.js';

// ---------- 3. IMPORTACIÓN DE MODELOS ----------
import FichasModel from './Models/FichasModel.js';
import UsuariosModel from './Models/UsuariosModel.js';
import ProgramaModel from './Models/ProgramaModel.js';
import ReservasModel from './Models/ReservasModel.js';
import RolesModel from './Models/RolesModel.js';
import UsuariosRolModel from './Models/UsuariosRolModel.js';
import PlatosModel from './Models/PlatosModels.js';
import MenuModel from './Models/MenusModels.js';
import TurnosModel from './Models/TurnosModel.js';
import NotificacionesModel from './Models/NotificacionesModel.js';
import NovedadesService from './Services/NovedadesService.js';

// ---------- 4. CONFIGURACIÓN INICIAL ----------
dotenv.config();
const aplicacion = Express();

// ---------- 5. SEGURIDAD Y MIDDLEWARES GLOBALES ----------
// Seguridad: Cabeceras HTTP seguras
aplicacion.use(helmet());

// Seguridad: Rate Limiting global permisivo para navegación y consumo normal de la API
const limitadorGlobal = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 2000 : 10000, // Límite amplio para evitar bloqueos en la SPA
  standardHeaders: true, // Devuelve cabeceras estándar `RateLimit-*`
  legacyHeaders: false, // Desactiva cabeceras `X-RateLimit-*`
  message: {
    mensaje: 'Demasiadas peticiones al servidor, por favor intenta nuevamente más tarde.'
  }
});
aplicacion.use('/api', limitadorGlobal);

// Seguridad: Rate Limiting estricto para rutas sensibles (prevención de fuerza bruta en Login y OTP)
const limitadorSensible = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // Máximo 20 intentos en 15 minutos
  message: {
    mensaje: 'Demasiados intentos. Por motivos de seguridad, por favor intenta nuevamente en 15 minutos.'
  }
});
aplicacion.use('/api/Usuarios/login', limitadorSensible);
aplicacion.use('/api/Auth/recuperar', limitadorSensible);

// Middlewares estándar
aplicacion.use(Express.json());

const origenesPermitidos = [
  'https://foodsyslagranja.com',
  'https://www.foodsyslagranja.com',
  'http://localhost:5173',
  'http://localhost:8000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8000'
];

if (process.env.CORS_ORIGIN) {
  process.env.CORS_ORIGIN.split(',').forEach(o => {
    const lim = o.trim();
    if (lim && !origenesPermitidos.includes(lim)) origenesPermitidos.push(lim);
  });
}

const opcionesCors = {
  origin: function (origin, callback) {
    // Permitir llamadas sin origin (same-origin, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (origenesPermitidos.includes(origin)) {
      return callback(null, true);
    }
    // Permitir cualquier subdominio o variante de foodsyslagranja.com
    if (/^https?:\/\/(www\.)?foodsyslagranja\.com(:[0-9]+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Bloqueado por CORS: origen ${origin} no permitido`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};
aplicacion.use(cors(opcionesCors));

// ---------- 6. REGISTRO DE RUTAS DE LA API ----------
aplicacion.use('/api/Usuarios', UsuariosRoute);
aplicacion.use('/api/Fichas', FichasRoute);
aplicacion.use('/api/Reservas', ReservasRoute);
aplicacion.use('/api/Programa', ProgramaRoute);
aplicacion.use('/api/Roles', RolesRoute);
aplicacion.use('/api/UsuariosRoles', UsuariosRolRoutes);
aplicacion.use('/api/Platos', PlatosRoutes);
aplicacion.use('/api/Menus', MenusRoutes);
aplicacion.use('/api/Reportes', ReportesRoute);
aplicacion.use('/api/Inicio', InicioRoute);
aplicacion.use('/api/Novedades', NovedadesRoute);
aplicacion.use('/api/Cocina', CocinaRoute);
aplicacion.use('/api/Auth', RutasAutenticacion);
aplicacion.use('/api/Turnos', TurnosRoute);
aplicacion.use('/api/Notificaciones', NotificacionesRoute);

// ---------- 7. ARCHIVOS ESTÁTICOS ----------
const rutaArchivo = fileURLToPath(import.meta.url);
const directorioActual = Path.dirname(rutaArchivo);
aplicacion.use('/uploads', Express.static(Path.join(directorioActual, 'uploads')));

// Ruta de prueba
aplicacion.get('/', (peticion, respuesta) => respuesta.send('Hola Mundo Foodsys - Versión Senior'));

// ---------- 8. CONEXIÓN A LA BASE DE DATOS ----------
try {
  await db.authenticate();
  console.log('✅ Conexión a la base de datos exitosa');
  // Asegurar existencia de columna Fec_Desancion en usuarios
  try {
    const [cols] = await db.query("SHOW COLUMNS FROM usuarios LIKE 'Fec_Desancion'");
    if (cols.length === 0) {
      await db.query("ALTER TABLE usuarios ADD COLUMN Fec_Desancion DATETIME NULL");
      console.log('Columna Fec_Desancion creada exitosamente en tabla usuarios');
    }
  } catch (errCol) {
    console.warn('Nota sobre columna Fec_Desancion:', errCol.message);
  }

  // Asegurar existencia de columna Est_Programa en programas
  try {
    const [colsProg] = await db.query("SHOW COLUMNS FROM programas LIKE 'Est_Programa'");
    if (colsProg.length === 0) {
      await db.query("ALTER TABLE programas ADD COLUMN Est_Programa VARCHAR(20) DEFAULT 'Activo'");
      await db.query("UPDATE programas SET Est_Programa = 'Activo' WHERE Est_Programa IS NULL");
      console.log('Columna Est_Programa creada exitosamente en tabla programas');
    }
  } catch (errCol) {
    console.warn('Nota sobre columna Est_Programa:', errCol.message);
  }

  // Asegurar existencia de columna tokenVersion en usuarios (Sesión única)
  try {
    const [colsToken] = await db.query("SHOW COLUMNS FROM usuarios LIKE 'tokenVersion'");
    if (colsToken.length === 0) {
      await db.query("ALTER TABLE usuarios ADD COLUMN tokenVersion INT NOT NULL DEFAULT 1");
      console.log('Columna tokenVersion creada exitosamente en tabla usuarios');
    }
  } catch (errCol) {
    console.warn('Nota sobre columna tokenVersion:', errCol.message);
  }

  // Asegurar existencia de tablas turnos y notificaciones
  try {
    await TurnosModel.sync({ alter: false });
    await NotificacionesModel.sync({ alter: false });
    console.log('✅ Tablas turnos y notificaciones sincronizadas');
  } catch (errSync) {
    console.warn('Nota sobre sincronización de tablas turnos/notificaciones:', errSync.message);
  }
} catch (errorDb) {
  console.error('Error al conectar a la Base de Datos: ', errorDb);
  process.exit(1);
}

// ========== 9. ASOCIACIONES ENTRE MODELOS (RELACIONES) ==========
FichasModel.hasMany(UsuariosModel, { foreignKey: 'Id_Ficha', as: 'usuarios' });
UsuariosModel.belongsTo(FichasModel, { foreignKey: 'Id_Ficha', as: 'ficha' });

ProgramaModel.hasMany(FichasModel, { foreignKey: 'Id_Programa', as: 'fichas' });
FichasModel.belongsTo(ProgramaModel, { foreignKey: 'Id_Programa', as: 'programas' });

UsuariosModel.hasMany(ReservasModel, { foreignKey: 'Id_Usuario', as: 'reservas' });
ReservasModel.belongsTo(UsuariosModel, { foreignKey: 'Id_Usuario', as: 'usuario' });

UsuariosModel.hasMany(UsuariosRolModel, { foreignKey: "Id_Usuario", as: "rolesUsuario" });
UsuariosRolModel.belongsTo(UsuariosModel, { foreignKey: "Id_Usuario", as: "usuario" });
UsuariosRolModel.belongsTo(RolesModel, { foreignKey: "Id_Rol", as: "rolUsuario" });

RolesModel.hasMany(UsuariosRolModel, { foreignKey: "Id_Rol", as: "usuariosRol" });

PlatosModel.hasMany(MenuModel, { foreignKey: "Id_Plato", as: "menus" });
MenuModel.belongsTo(PlatosModel, { foreignKey: "Id_Plato", as: "plato" });

ReservasModel.belongsTo(PlatosModel, { foreignKey: "Id_Plato", as: "plato" });
PlatosModel.hasMany(ReservasModel, { foreignKey: "Id_Plato", as: "reservas" });

UsuariosModel.hasMany(TurnosModel, { foreignKey: "Id_Usuario", as: "turnos" });
TurnosModel.belongsTo(UsuariosModel, { foreignKey: "Id_Usuario", as: "supervisor" });

UsuariosModel.hasMany(NotificacionesModel, { foreignKey: "Id_Usuario", as: "notificaciones" });
NotificacionesModel.belongsTo(UsuariosModel, { foreignKey: "Id_Usuario", as: "usuario" });

// ========== 10. TAREA DE MANTENIMIENTO: ESTADOS ESPECIALES EXPIRADOS ==========
try {
  const resultadoReversion = await NovedadesService.RevertirEspecialesExpirados();
  if (resultadoReversion.revertidos > 0) {
    console.log(
      `[Mantenimiento] Se revirtieron ${resultadoReversion.revertidos} usuarios ` +
      `de estado Especial a En Formacion por vencimiento de 30 días.`
    );
  } else {
    console.log('[Mantenimiento] No hay estados Especiales expirados al arrancar.');
  }
} catch (errorMantenimiento) {
  console.error('[Mantenimiento] Error al revertir estados Especiales:', errorMantenimiento.message);
}

setInterval(async () => {
  try {
    const resultado = await NovedadesService.RevertirEspecialesExpirados();
    if (resultado.revertidos > 0) {
      console.log(`[Mantenimiento] Reversión programada: ${resultado.revertidos} usuarios revertidos.`);
    }
  } catch (errorIntervalo) {
    console.error('[Mantenimiento] Error en reversión programada:', errorIntervalo.message);
  }
}, 24 * 60 * 60 * 1000);

// ---------- 11. INICIAR EL SERVIDOR ----------
const PUERTO = process.env.PORT || 8000;
const servidorHttp = http.createServer(aplicacion);
initSocket(servidorHttp, opcionesCors);

servidorHttp.listen(PUERTO, () => console.log(`Servidor ejecutándose en http://localhost:${PUERTO}`));

export default aplicacion;