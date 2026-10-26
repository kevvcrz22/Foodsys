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
import { sincronizarFichasAlInicio } from './Jobs/VencimientoJob.js';
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
import SyncRoute from './Routes/SyncRoute.js';
import PqrsfRoute from './Routes/PqrsfRoute.js';

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
import PqrsfModel from './Models/PqrsfModel.js';
import CentrosSenaConfigModel from './Models/CentrosSenaConfigModel.js';
import NovedadesService from './Services/NovedadesService.js';
import { syncWorkerInstance } from './Jobs/SyncWorker.js';

// ---------- 4. CONFIGURACIÓN INICIAL ----------
const __rutaApp = fileURLToPath(import.meta.url);
const __directorioApp = Path.dirname(__rutaApp);
dotenv.config({ path: Path.join(__directorioApp, '.env') });
const aplicacion = Express();

// Configuración de Proxy Inverso (Nginx en Hetzner)
// Permite a Express reconocer la IP pública real del cliente a través de X-Forwarded-For
aplicacion.set('trust proxy', 1);

// ---------- 5. SEGURIDAD Y MIDDLEWARES GLOBALES ----------
// Seguridad: Cabeceras HTTP seguras
aplicacion.use(helmet());

// Middlewares estándar con capacidad para importaciones masivas (hasta 50 MB)
// Se montan PRIMERO para que el body esté disponible para validadores y limitadores
aplicacion.use(Express.json({ limit: '50mb' }));
aplicacion.use(Express.urlencoded({ extended: true, limit: '50mb' }));

// Lista de orígenes permitidos por CORS
const origenesPermitidos = [
  'https://foodsyslagranja.com',
  'https://www.foodsyslagranja.com',
  'https://2.31.23.211',
  'http://2.31.23.211',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:8000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
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
    // Permitir orígenes declarados o cualquier puerto local en desarrollo
    if (origenesPermitidos.includes(origin) || (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost(:\d+)?$/.test(origin))) {
      return callback(null, true);
    }
    // Permitir cualquier subdominio o variante de foodsyslagranja.com
    if (/^https?:\/\/(www\.)?foodsyslagranja\.com(:[0-9]+)?$/.test(origin)) {
      return callback(null, true);
    }
    // Permitir cualquier IP directa (acceso por IP del servidor como https://2.31.23.211)
    if (/^https?:\/\/\d+\.\d+\.\d+\.\d+(:[0-9]+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};
aplicacion.use(cors(opcionesCors));

// Seguridad: Rate Limiting global de alta concurrencia
// Diseñado para soportar más de 50.000 peticiones concurrentes y redes compartidas (Wi-Fi SENA)
const limitadorGlobal = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    mensaje: 'Demasiadas peticiones al servidor, por favor intenta nuevamente más tarde.'
  }
});
aplicacion.use('/api', limitadorGlobal);

// Seguridad: Rate Limiting para Login y Recuperación (Anti Fuerza Bruta)
// Agrupa por IP + Documento para evitar que el fallo de un aprendiz bloquee a toda la sede en el Wi-Fi
const limitadorSensible = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 60, // Máximo 60 intentos por cuenta en 15 minutos
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req) => {
    const doc = req.body?.NumDoc_Usuario || req.body?.email || req.body?.documento || req.body?.correo || 'anon';
    const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    return `${clientIp}_${doc}`;
  },
  message: {
    mensaje: 'Demasiados intentos para esta cuenta. Por motivos de seguridad, por favor intenta nuevamente en 15 minutos.'
  }
});
aplicacion.use('/api/Usuarios/login', limitadorSensible);
aplicacion.use('/api/Auth/recuperar', limitadorSensible);

// ---------- 6. REGISTRO DE RUTAS DE LA API (Soporta PascalCase y minúsculas) ----------
aplicacion.use('/api/Usuarios', UsuariosRoute);
aplicacion.use('/api/usuarios', UsuariosRoute);
aplicacion.use('/api/Fichas', FichasRoute);
aplicacion.use('/api/fichas', FichasRoute);
aplicacion.use('/api/Reservas', ReservasRoute);
aplicacion.use('/api/reservas', ReservasRoute);
aplicacion.use('/api/Programa', ProgramaRoute);
aplicacion.use('/api/programa', ProgramaRoute);
aplicacion.use('/api/Roles', RolesRoute);
aplicacion.use('/api/roles', RolesRoute);
aplicacion.use('/api/UsuariosRoles', UsuariosRolRoutes);
aplicacion.use('/api/usuariosroles', UsuariosRolRoutes);
aplicacion.use('/api/Platos', PlatosRoutes);
aplicacion.use('/api/platos', PlatosRoutes);
aplicacion.use('/api/Menus', MenusRoutes);
aplicacion.use('/api/menus', MenusRoutes);
aplicacion.use('/api/Reportes', ReportesRoute);
aplicacion.use('/api/reportes', ReportesRoute);
aplicacion.use('/api/Inicio', InicioRoute);
aplicacion.use('/api/inicio', InicioRoute);
aplicacion.use('/api/Novedades', NovedadesRoute);
aplicacion.use('/api/novedades', NovedadesRoute);
aplicacion.use('/api/Cocina', CocinaRoute);
aplicacion.use('/api/cocina', CocinaRoute);
aplicacion.use('/api/Auth', RutasAutenticacion);
aplicacion.use('/api/auth', RutasAutenticacion);
aplicacion.use('/api/Turnos', TurnosRoute);
aplicacion.use('/api/turnos', TurnosRoute);
aplicacion.use('/api/Notificaciones', NotificacionesRoute);
aplicacion.use('/api/notificaciones', NotificacionesRoute);
aplicacion.use('/api/Sync', SyncRoute);
aplicacion.use('/api/sync', SyncRoute);
aplicacion.use('/api/Pqrsf', PqrsfRoute);
aplicacion.use('/api/pqrsf', PqrsfRoute);

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

  // Asegurar ampliación de columnas para nombres largos institucionales en programas y usuarios
  try {
    await db.query("ALTER TABLE programas MODIFY COLUMN Nom_Programa VARCHAR(255) NOT NULL");
    await db.query("ALTER TABLE programas MODIFY COLUMN Are_Programa VARCHAR(100) NULL");
    await db.query("ALTER TABLE programas MODIFY COLUMN NivFor_Programa VARCHAR(100) NULL");
    console.log('✅ Columnas de programas ampliadas a VARCHAR(255) y VARCHAR(100)');
  } catch (errAmpP) {
    console.warn('Nota sobre ampliacion de programas:', errAmpP.message);
  }

  try {
    await db.query("ALTER TABLE usuarios MODIFY COLUMN Nom_Usuario VARCHAR(100) NULL");
    await db.query("ALTER TABLE usuarios MODIFY COLUMN Ape_Usuario VARCHAR(100) NULL");
    await db.query("ALTER TABLE usuarios MODIFY COLUMN Cor_Usuario VARCHAR(100) NULL");
    await db.query("ALTER TABLE usuarios MODIFY COLUMN TipDoc_Usuario VARCHAR(20) NULL DEFAULT 'CC'");
    await db.query("ALTER TABLE usuarios MODIFY COLUMN NumDoc_Usuario BIGINT NOT NULL");
    await db.query("ALTER TABLE usuarios MODIFY COLUMN Gen_Usuario VARCHAR(50) NULL DEFAULT 'No especificado'");
    await db.query("ALTER TABLE usuarios MODIFY COLUMN CenCon_Usuario VARCHAR(20) NULL DEFAULT 'No'");
    await db.query("ALTER TABLE usuarios MODIFY COLUMN Pol_Usuario VARCHAR(20) NULL DEFAULT 'No'");
    await db.query("ALTER TABLE usuarios MODIFY COLUMN San_Usuario VARCHAR(20) NULL DEFAULT 'No'");
    console.log('✅ Columnas de usuarios ampliadas y flexibilizadas');
  } catch (errAmpU) {
    console.warn('Nota sobre ampliacion de usuarios:', errAmpU.message);
  }

  // Asegurar que fichas mantenga todas sus fechas como obligatorias (NOT NULL)
  try {
    await db.query("ALTER TABLE fichas MODIFY COLUMN FecIniLec_Ficha DATE NOT NULL");
    await db.query("ALTER TABLE fichas MODIFY COLUMN FecFinLec_Ficha DATE NOT NULL");
    await db.query("ALTER TABLE fichas MODIFY COLUMN FecIniPra_Ficha DATE NOT NULL");
    await db.query("ALTER TABLE fichas MODIFY COLUMN FecFinPra_Ficha DATE NOT NULL");
    console.log('✅ Columnas de fechas en fichas aseguradas como obligatorias (NOT NULL)');
  } catch (errAmpF) {
    console.warn('Nota sobre fechas de fichas:', errAmpF.message);
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

  // Asegurar compatibilidad de Est_Usuario para aceptar 'Inactivo' y nuevos estados sin truncamiento
  try {
    const [colsEst] = await db.query("SHOW COLUMNS FROM usuarios LIKE 'Est_Usuario'");
    if (colsEst.length > 0 && String(colsEst[0].Type).startsWith('enum')) {
      if (!String(colsEst[0].Type).includes("'Inactivo'")) {
        await db.query("ALTER TABLE usuarios MODIFY COLUMN Est_Usuario VARCHAR(50) DEFAULT 'En Formacion'");
        console.log('✅ Columna Est_Usuario ampliada a VARCHAR(50) de forma retrocompatible');
      }
    }
  } catch (errEst) {
    console.warn('Nota sobre columna Est_Usuario:', errEst.message);
  }

  // Asegurar que Tel_Usuario admita NULL y telefonos compartidos entre aprendices sin error 500
  try {
    const [colsTel] = await db.query("SHOW COLUMNS FROM usuarios LIKE 'Tel_Usuario'");
    if (colsTel.length > 0 && colsTel[0].Null === 'NO') {
      await db.query("ALTER TABLE usuarios MODIFY COLUMN Tel_Usuario VARCHAR(20) NULL DEFAULT NULL");
      console.log('✅ Columna Tel_Usuario ajustada para admitir NULL');
    }
    const [indexesTel] = await db.query("SHOW INDEX FROM usuarios WHERE Key_name = 'Tel_Aprendiz'");
    if (indexesTel.length > 0) {
      await db.query("ALTER TABLE usuarios DROP INDEX Tel_Aprendiz");
      console.log('✅ Indice Tel_Aprendiz flexibilizado para permitir telefonos familiares/compartidos');
    }
  } catch (errTel) {
    console.warn('Nota sobre columna Tel_Usuario:', errTel.message);
  }

  // Asegurar que Gen_Usuario admita NULL o tenga default 'No especificado' para evitar fallos en importacion
  try {
    const [colsGen] = await db.query("SHOW COLUMNS FROM usuarios LIKE 'Gen_Usuario'");
    if (colsGen.length > 0 && colsGen[0].Null === 'NO') {
      await db.query("ALTER TABLE usuarios MODIFY COLUMN Gen_Usuario VARCHAR(20) NULL DEFAULT 'No especificado'");
      console.log('✅ Columna Gen_Usuario ajustada para admitir NULL y default');
    }
  } catch (errGen) {
    console.warn('Nota sobre columna Gen_Usuario:', errGen.message);
  }

  // Asegurar existencia de tablas turnos y notificaciones
  try {
    await TurnosModel.sync({ alter: false });
    await NotificacionesModel.sync({ alter: false });
    console.log('✅ Tablas turnos y notificaciones sincronizadas');
  } catch (errSync) {
    console.warn('Nota sobre sincronización de tablas turnos/notificaciones:', errSync.message);
  }

  // Asegurar migracion v3: columnas en reservas para sincronizacion offline y cesion
  try {
    const [colsRes] = await db.query("SHOW COLUMNS FROM reservas");
    const nombresColsRes = colsRes.map(c => c.Field);
    if (!nombresColsRes.includes('uuid_reserva')) {
      await db.query("ALTER TABLE reservas ADD COLUMN uuid_reserva CHAR(36) NULL AFTER Id_Reserva");
      await db.query("UPDATE reservas SET uuid_reserva = UUID() WHERE uuid_reserva IS NULL");
      await db.query("CREATE UNIQUE INDEX idx_reservas_uuid ON reservas (uuid_reserva)");
      console.log('✅ Columna uuid_reserva creada en tabla reservas');
    }
    if (!nombresColsRes.includes('nodo_origen')) {
      await db.query("ALTER TABLE reservas ADD COLUMN nodo_origen ENUM('LOCAL', 'CLOUD') NOT NULL DEFAULT 'CLOUD'");
      console.log('✅ Columna nodo_origen creada en tabla reservas');
    }
    if (!nombresColsRes.includes('Id_Usuario_Cedente')) {
      await db.query("ALTER TABLE reservas ADD COLUMN Id_Usuario_Cedente INT NULL");
      console.log('✅ Columna Id_Usuario_Cedente creada en tabla reservas');
    }
    if (!nombresColsRes.includes('Fec_Cesion')) {
      await db.query("ALTER TABLE reservas ADD COLUMN Fec_Cesion DATETIME NULL");
      console.log('✅ Columna Fec_Cesion creada en tabla reservas');
    }
    if (!nombresColsRes.includes('motivo_cesion')) {
      await db.query("ALTER TABLE reservas ADD COLUMN motivo_cesion VARCHAR(180) NULL");
      console.log('✅ Columna motivo_cesion creada en tabla reservas');
    }
    if (!nombresColsRes.includes('sync_status')) {
      await db.query("ALTER TABLE reservas ADD COLUMN sync_status ENUM('PENDING', 'SYNCED') NOT NULL DEFAULT 'PENDING'");
      console.log('✅ Columna sync_status creada en tabla reservas');
    }
  } catch (errRes) {
    console.warn('Nota sobre columnas de reservas v3:', errRes.message);
  }

  // Asegurar tablas de sincronizacion offline y control antifraude Ed25519
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS qr_consumidos_control (
        uuid_reserva CHAR(36) PRIMARY KEY,
        NumDoc_Usuario BIGINT NOT NULL,
        Fec_Reserva DATE NOT NULL,
        Tip_Reserva VARCHAR(20) NOT NULL,
        Fecha_Consumo DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        Id_Supervisor INT NULL,
        nodo_consumo ENUM('LOCAL', 'CLOUD') NOT NULL DEFAULT 'LOCAL',
        UNIQUE INDEX uk_consumo_unico_aprendiz (NumDoc_Usuario, Fec_Reserva, Tip_Reserva)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS sync_outbox (
        event_id CHAR(36) PRIMARY KEY,
        source_node ENUM('LOCAL', 'CLOUD') NOT NULL DEFAULT 'LOCAL',
        entidad VARCHAR(40) NOT NULL,
        operacion VARCHAR(30) NOT NULL,
        entity_uuid CHAR(36) NOT NULL,
        payload JSON NOT NULL,
        sync_status ENUM('PENDING', 'SYNCED', 'CONFLICT', 'ERROR') NOT NULL DEFAULT 'PENDING',
        attempts INT NOT NULL DEFAULT 0,
        last_error TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME NULL,
        INDEX idx_sync_pending (sync_status, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS sync_inbox_processed (
        event_id CHAR(36) PRIMARY KEY,
        source_node ENUM('LOCAL', 'CLOUD') NOT NULL,
        processed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await PqrsfModel.sync({ alter: false });
    await CentrosSenaConfigModel.sync({ alter: false });

    // Sembrar configuracion base del Centro Agropecuario La Granja si no existe
    const conteoCentros = await CentrosSenaConfigModel.count();
    if (conteoCentros === 0) {
      await CentrosSenaConfigModel.create({
        Codigo_Centro_Sena: '9121',
        Nombre_Centro: 'Centro Agropecuario "La Granja" del Espinal-Tolima',
        Regional: 'Regional Tolima',
        Tiene_Internado: true,
        Cupo_Max_Desayuno: 250,
        Cupo_Max_Almuerzo: 450,
        Cupo_Max_Cena: 250,
        Porcentaje_Cupo_Local_Offline: 75,
        Hora_Inicio_Almuerzo: '11:30:00',
        Hora_Fin_Almuerzo: '13:30:00',
        Horas_Antelacion_Reserva: 8,
        Horas_Antelacion_Cancelacion: 9,
        Horas_Antelacion_Cesion: 2,
        Max_Inasistencias_Semana: 3,
        Valor_Unitario_Racion_COP: 12500,
        Estado_Nodo_Local: 'ONLINE'
      });
      console.log('✅ Configuracion base de Centro La Granja (9121) sembrada');
    }
    console.log('✅ Tablas de sincronizacion, PQRSF y multi-sede verificadas');
  } catch (errSyncTables) {
    console.warn('Nota sobre tablas de sincronizacion v3:', errSyncTables.message);
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

UsuariosModel.hasMany(PqrsfModel, { foreignKey: 'Id_Usuario', as: 'pqrsfs' });
PqrsfModel.belongsTo(UsuariosModel, { foreignKey: 'Id_Usuario', as: 'usuario' });

PlatosModel.hasMany(PqrsfModel, { foreignKey: 'Id_Plato_Relacionado', as: 'pqrsfs' });
PqrsfModel.belongsTo(PlatosModel, { foreignKey: 'Id_Plato_Relacionado', as: 'plato' });
PqrsfModel.belongsTo(PlatosModel, { foreignKey: 'Id_Plato_Relacionado', as: 'platoRelacionado' });

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

// Sincronizar fichas vencidas despues de que las asociaciones de Sequelize esten listas
await sincronizarFichasAlInicio();

// Iniciar motor de sincronizacion offline tipo OneDrive (nodo local)
if (process.env.NODE_ROLE !== 'CLOUD') {
  syncWorkerInstance.iniciar();
  console.log('✅ SyncWorker iniciado: monitoreo offline cada 20 segundos hacia Hetzner');
} else {
  console.log('ℹ️ Servidor en modo CLOUD Hetzner (SyncWorker receptor activo)');
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

// ---------- 10. MANEJADOR GLOBAL DE ERRORES ----------
// Captura cualquier error no controlado y responde en formato JSON limpio evitando bloqueos 500
aplicacion.use((err, req, res, next) => {
  console.error('[Error No Capturado]:', err?.message || err);
  const status = err.status || (err.message && err.message.includes('CORS') ? 403 : 500);
  res.status(status).json({
    message: err.message || 'Error interno del servidor. Intenta nuevamente.'
  });
});

// Prevenir caida del proceso Node ante excepciones no capturadas o promesas rechazadas
process.on('uncaughtException', (err) => {
  console.error('⚠️ [ALERTA DE PROCESO] uncaughtException:', err?.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ [ALERTA DE PROCESO] unhandledRejection:', reason?.message || reason);
});

// ---------- 11. INICIAR EL SERVIDOR ----------
const PUERTO = process.env.PORT || 8000;
const servidorHttp = http.createServer(aplicacion);
initSocket(servidorHttp, opcionesCors);

servidorHttp.listen(PUERTO, '0.0.0.0', () => console.log(`Servidor ejecutándose en http://0.0.0.0:${PUERTO}`));

export default aplicacion;