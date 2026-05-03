// app.js
// Archivo principal del servidor de la aplicacion Foodsys.
// Su funcion es:
//   1. Importar y configurar las dependencias necesarias (Express, CORS, etc.).
//   2. Importar todas las rutas de la API que se encuentran en la carpeta "Routes".
//   3. Importar los modelos de base de datos para luego definir sus relaciones.
//   4. Configurar middlewares globales (JSON y CORS).
//   5. Registrar las rutas en el servidor.
//   6. Servir archivos estaticos (imagenes, documentos, etc.) desde la carpeta "uploads".
//   7. Establecer la conexion a la base de datos y definir las asociaciones entre tablas.
//   8. Iniciar el servidor en el puerto indicado.

// ---------- 1. IMPORTACION DE DEPENDENCIAS ----------
import Express from 'express';   // Framework web para Node.js
import cors from 'cors';         // Middleware para permitir peticiones de diferentes origenes
import dotenv from 'dotenv';     // Carga variables de entorno desde un archivo .env
import db from './Database/db.js'; // Objeto de conexion a la base de datos (Sequelize)
import { fileURLToPath } from 'url'; // Utilidad para convertir URLs de archivos a rutas absolutas
import Path from 'path';         // Modulo nativo de Node.js para manejar rutas de archivos

// ---------- 2. IMPORTACION DE RUTAS ----------
// Cada archivo en la carpeta "Routes" define un enrutador de Express para un recurso.
// El nombre de la variable debe coincidir con lo exportado por cada modulo (por defecto).
import UsuariosRoute   from './Routes/UsuariosRoute.js';   // Rutas para gestion de usuarios
import FichasRoute     from './Routes/FichasRoute.js';     // Rutas para fichas
import ReservasRoute   from './Routes/ReservasRoute.js';   // Rutas para reservas de comida
import ProgramaRoute   from './Routes/ProgramaRoutes.js';  // Rutas para programas academicos
import RolesRoute      from './Routes/RolesRoute.js';      // Rutas para roles de usuario
import UsuariosRolRoutes from './Routes/UsuariosRolRoutes.js'; // Rutas para asignacion de roles a usuarios
import PlatosRoutes    from './Routes/PlatosRoutes.js';    // Rutas para platos de comida
import MenusRoutes     from './Routes/MenusRoutes.js';     // Rutas para menus diarios
import ReportesRoute   from './Routes/ReportesRoute.js';   // Rutas para reportes y estadisticas
import InicioRoute     from './Routes/InicioRoute.js';     // Rutas para la pagina de Inicio

// ---------- 3. IMPORTACION DE MODELOS ----------
// Los modelos representan las tablas de la base de datos.
// Se importan aqui para poder establecer las relaciones (asociaciones) entre ellos.
import FichasModel      from './Models/FichasModel.js';
import UsuariosModel    from './Models/UsuariosModel.js';
import ProgramaModel    from './Models/ProgramaModel.js';
import ReservasModel    from './Models/ReservasModel.js';
import RolesModel       from './Models/RolesModel.js';
import UsuariosRolModel from './Models/UsuariosRolModel.js';
import PlatosModel      from './Models/PlatosModels.js';
import MenuModel        from './Models/MenusModels.js';

// ---------- 4. CONFIGURACION INICIAL ----------
dotenv.config();                // Carga las variables definidas en el archivo .env
const app = Express();          // Crea la aplicacion de Express

// ---------- 5. MIDDLEWARES GLOBALES ----------
// Los middlewares se ejecutan en cada solicitud antes de llegar a las rutas.
app.use(Express.json()); // Convierte automaticamente el cuerpo de las peticiones JSON a objeto JavaScript
app.use(cors());         // Permite que el frontend (incluso en otro dominio) pueda hacer peticiones al servidor

// ---------- 6. REGISTRO DE RUTAS DE LA API ----------
// Cada grupo de rutas se monta en una ruta base.
// Ejemplo: todas las rutas definidas en UsuariosRoute seran accesibles desde /api/Usuarios
app.use('/api/Usuarios', UsuariosRoute);
app.use('/api/Fichas', FichasRoute);   // Alias: a veces el frontend usa /api/Fichas (con mayuscula)
app.use('/api/Reservas', ReservasRoute);
app.use('/api/Programa', ProgramaRoute); // Alias para que tambien funcione con /api/Programa
app.use('/api/Roles', RolesRoute);
app.use('/api/UsuariosRoles', UsuariosRolRoutes); // Las asignaciones usuario-rol quedan bajo /api/UsuariosRoles
app.use('/api/platos', PlatosRoutes);
app.use('/api/menu', MenusRoutes);
app.use('/api/reportes', ReportesRoute);
app.use('/api/Inicio', InicioRoute);

import NovedadesRoute from './Routes/NovedadesRoute.js';
app.use('/api/Novedades', NovedadesRoute);

// ---------- 7. ARCHIVOS ESTATICOS ----------
// Permite acceder a archivos guardados en la carpeta "uploads" (por ejemplo, imagenes de platos).
// Ejemplo: http://localhost:8000/uploads/foto.jpg mostrara la imagen si existe en esa carpeta.
const __filename = fileURLToPath(import.meta.url); // Obtiene la ruta absoluta al archivo actual
const __dirname = Path.dirname(__filename);       // Obtiene el directorio donde se encuentra este archivo
app.use('/uploads', Express.static(Path.join(__dirname, 'uploads')));

// Ruta de prueba: al visitar http://localhost:8000 se muestra un mensaje simple
app.get('/', (req, res) => res.send('Hola Mundo Foodsys'));

// ---------- 8. CONEXION A LA BASE DE DATOS ----------
// Intenta conectarse a la base de datos usando Sequelize.
// db.authenticate() verifica que las credenciales y la conexion sean validas.
try {
  await db.authenticate();
  console.log('Conexion a la base de datos exitosa');
} catch (error) {
  console.error('Error al conectar a la Base de Datos: ', error);
  process.exit(1); // Si no se puede conectar, detiene la aplicacion, porque sin BD no funciona.
}

// ========== 9. ASOCIACIONES ENTRE MODELOS (RELACIONES) ==========
// Aqui se le dice a Sequelize como estan relacionadas las tablas.
// Esto permite en las consultas usar "include" para traer datos de otras tablas.

// ---- Fichas y Usuarios ----
// Una ficha tiene muchos usuarios (aprendices). Cada usuario pertenece a una ficha.
FichasModel.hasMany(UsuariosModel, { foreignKey: 'Id_Ficha', as: 'usuarios' });
UsuariosModel.belongsTo(FichasModel, { foreignKey: 'Id_Ficha', as: 'ficha' });

// ---- Programas y Fichas ----
// Un programa (ej. "Analisis y Desarrollo de Software") agrupa muchas fichas.
ProgramaModel.hasMany(FichasModel, { foreignKey: 'Id_Programa', as: 'fichas' });
FichasModel.belongsTo(ProgramaModel, { foreignKey: 'Id_Programa', as: 'programas' });

// ---- Usuarios y Reservas ----
// Un usuario puede hacer muchas reservas de comida. Cada reserva pertenece a un usuario.
UsuariosModel.hasMany(ReservasModel, { foreignKey: 'Id_Usuario', as: 'reservas' });
ReservasModel.belongsTo(UsuariosModel, { foreignKey: 'Id_Usuario', as: 'usuario' });

// ---- Usuarios, Roles y tabla intermedia UsuariosRol ----
// Un usuario puede tener varios roles, y un rol puede ser asignado a varios usuarios.
// La tabla 'usuariosrol' guarda esa relacion. Sequelize la maneja asi:
//   UsuariosModel -> tiene muchos UsuariosRol (registros en la tabla intermedia)
//   UsuariosRolModel -> pertenece a un Usuario y a un Rol
UsuariosModel.hasMany(UsuariosRolModel, { foreignKey: "Id_Usuario", as: "rolesUsuario" });
UsuariosRolModel.belongsTo(UsuariosModel, { foreignKey: "Id_Usuario", as: "usuario" });
UsuariosRolModel.belongsTo(RolesModel, { foreignKey: "Id_Rol", as: "rolUsuario" });
UsuariosRolModel.belongsTo(RolesModel, { foreignKey: "Id_Rol", as: "rol" });
RolesModel.hasMany(UsuariosRolModel, { foreignKey: "Id_Rol", as: "usuariosRol" });

// ---- Platos y Menus ----
// Un plato puede aparecer en muchos menus, y un menu (dia y tipo) tiene un plato.
PlatosModel.hasMany(MenuModel, { foreignKey: "Id_Plato", as: "menus" });
MenuModel.belongsTo(PlatosModel, { foreignKey: "Id_Plato", as: "plato" });

// ---------- 10. INICIAR EL SERVIDOR ----------
// El servidor escucha en el puerto definido en la variable de entorno PORT, o 8000 si no existe.
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

export default app;