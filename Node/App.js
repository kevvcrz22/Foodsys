// Node/App.js  (reemplaza el existente — solo se agrega la ruta de reportes)
import Express from 'express';
import cors    from 'cors';
import dotenv  from 'dotenv';
import db      from './Database/db.js';

import { fileURLToPath } from 'url';
import Path from 'path';

/* ===================== ROUTES ===================== */
import UsuariosRoute     from './Routes/UsuariosRoute.js';
import FichasRoute       from "./Routes/FichasRoute.js";
import ReservasRoute     from "./Routes/ReservasRoute.js";
import ProgramaRoute     from "./Routes/ProgramaRoutes.js";
import RolesRoute        from "./Routes/RolesRoute.js";
import UsuariosRolRoute  from './Routes/UsuariosRolRoutes.js';
import PlatosRoutes      from './Routes/PlatosRoutes.js';
import MenusRoutes       from './Routes/MenusRoutes.js';
import ReservasMenuRoutes from './Routes/ReservasMenuRoutes.js';
import ReportesRoute     from './Routes/ReportesRoute.js';   // ✅ NUEVO

/* ===================== MODELS ===================== */
import FichasModel       from './Models/FichasModel.js';
import UsuariosModel     from "./Models/UsuariosModel.js";
import ProgramaModel     from "./Models/ProgramaModel.js";
import ReservasModel     from './Models/ReservasModel.js';
import RolesModel        from './Models/RolesModel.js';
import UsuariosRolModel  from './Models/UsuariosRolModel.js';
import PlatosModel       from './Models/PlatosModels.js';
import MenuModel         from './Models/MenusModels.js';
import ReservasMenuModel from './Models/ReservasMenuModels.js';

dotenv.config();

const app = Express();
app.use(Express.json());
app.use(cors());

/* ===================== RUTAS ===================== */
app.use('/api/Usuarios',      UsuariosRoute);
app.use('/api/fichas',        FichasRoute);
app.use('/api/Reservas',      ReservasRoute);
app.use('/api/Programas',     ProgramaRoute);
app.use('/api/Roles',         RolesRoute);
app.use('/api/UsuariosRoles', UsuariosRolRoute);
app.use('/api/platos',        PlatosRoutes);
app.use('/api/menu',          MenusRoutes);
app.use('/api/reservasmenu',  ReservasMenuRoutes);
app.use('/api/reportes',      ReportesRoute);            // ✅ NUEVO

/* ===================== STATIC ===================== */
const __filename = fileURLToPath(import.meta.url);
const __dirname  = Path.dirname(__filename);
app.use('/uploads', Express.static(Path.join(__dirname, 'uploads')));

/* ===================== TEST ===================== */
app.get('/', (req, res) => res.send('Hola Mundo Foodsys'));

/* ===================== CONEXIÓN DB ===================== */
try {
  await db.authenticate();
  console.log('Conexion a la base de datos exitosa');
} catch (error) {
  console.error('Error al Conectar a la Base de Datos: ', error);
  process.exit(1);
}

/* ===================== RELACIONES ===================== */
FichasModel.hasMany(UsuariosModel,      { foreignKey: 'Id_Ficha',   as: 'usuariosFicha' });
UsuariosModel.belongsTo(FichasModel,    { foreignKey: 'Id_Ficha',   as: 'ficha' });

ProgramaModel.hasMany(FichasModel,      { foreignKey: 'Id_Programa', as: 'fichas' });
FichasModel.belongsTo(ProgramaModel,    { foreignKey: 'Id_Programa', as: 'programa' });

UsuariosModel.hasMany(ReservasModel,    { foreignKey: 'Id_Usuario',  as: 'reservas' });
ReservasModel.belongsTo(UsuariosModel,  { foreignKey: 'Id_Usuario',  as: 'usuario' });

UsuariosModel.hasMany(UsuariosRolModel, { foreignKey: "Id_Usuario",  as: "rolesUsuario" });
UsuariosRolModel.belongsTo(UsuariosModel, { foreignKey: "Id_Usuario" });
UsuariosRolModel.belongsTo(RolesModel,  { foreignKey: "Id_Rol",      as: "rol" });
RolesModel.hasMany(UsuariosRolModel,    { foreignKey: "Id_Rol",      as: "usuariosRol" });

PlatosModel.hasMany(MenuModel,          { foreignKey: "Id_Plato",    as: "menus" });
MenuModel.belongsTo(PlatosModel,        { foreignKey: "Id_Plato",    as: "plato" });

ReservasModel.hasMany(ReservasMenuModel,   { foreignKey: "Id_Reserva", as: "detalleReserva" });
ReservasMenuModel.belongsTo(ReservasModel, { foreignKey: "Id_Reserva", as: "reserva" });

MenuModel.hasMany(ReservasMenuModel,       { foreignKey: "Id_Menu", as: "detalleMenu" });
ReservasMenuModel.belongsTo(MenuModel,     { foreignKey: "Id_Menu", as: "menu" });

/* ===================== SERVER ===================== */
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

export default app;