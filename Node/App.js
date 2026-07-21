// App.js
// Archivo principal del servidor de la aplicación Foodsys.
// Arquitectura Clean Code y Seguridad Senior implementada.

// ---------- 1. IMPORTACIÓN DE DEPENDENCIAS ----------
import Express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet'; // Seguridad: Protección de cabeceras HTTP
import rateLimit from 'express-rate-limit'; // Seguridad: Prevención de fuerza bruta
import db from './Database/db.js';
import { fileURLToPath } from 'url';
import Path from 'path';
import './Jobs/VencimientoJob.js';

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

// ---------- 3. IMPORTACIÓN DE MODELOS ----------
import FichasModel from './Models/FichasModel.js';
import UsuariosModel from './Models/UsuariosModel.js';
import ProgramaModel from './Models/ProgramaModel.js';
import ReservasModel from './Models/ReservasModel.js';
import RolesModel from './Models/RolesModel.js';
import UsuariosRolModel from './Models/UsuariosRolModel.js';
import PlatosModel from './Models/PlatosModels.js';
import MenuModel from './Models/MenusModels.js';
import NovedadesService from './Services/NovedadesService.js';

// ---------- 4. CONFIGURACIÓN INICIAL ----------
dotenv.config();
const aplicacion = Express();

// ---------- 5. SEGURIDAD Y MIDDLEWARES GLOBALES ----------
// Seguridad: Cabeceras HTTP seguras
aplicacion.use(helmet());

// Seguridad: Rate Limiting para evitar ataques de fuerza bruta o DDoS
const limitadorGlobal = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 peticiones por IP cada 15 minutos
  message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo en 15 minutos.',
});
aplicacion.use('/api', limitadorGlobal);

// Middlewares estándar
aplicacion.use(Express.json());
const opcionesCors = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
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
} catch (errorDb) {
  console.error('❌ Error al conectar a la Base de Datos: ', errorDb);
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
aplicacion.listen(PUERTO, () => console.log(`🚀 Servidor ejecutándose en http://localhost:${PUERTO}`));

export default aplicacion;