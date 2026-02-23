import Express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './Database/db.js';
import UsuariosRoute from './Routes/UsuariosRoute.js';
import FichasRoute from "./Routes/FichasRoute.js";
import ReservasRoute from "./Routes/ReservasRoute.js";
import ProgramaRoute from "./Routes/ProgramaRoutes.js";
import RolesRoute from "./Routes/RolesRoute.js";
import UsuariosRolRoute from './Routes/UsuariosRolRoutes.js';
import FichasModel from './Models/FichasModel.js';
import UsuariosModel from "./Models/UsuariosModel.js";
import ProgramaModel from "./Models/ProgramaModel.js"; 
import ReservasModel from './Models/ReservasModel.js';
import RolesModel from './Models/RolesModel.js';
import UsuariosRolModel from './Models/UsuariosRolModel.js';


dotenv.config();
import { fileURLToPath } from 'url';
import Path from 'path';



const app = Express();
app.use(Express.json());
app.use(cors());

app.use('/api/Usuarios', UsuariosRoute);
app.use('/api/fichas', FichasRoute);
app.use('/api/Reservas', ReservasRoute);
app.use('/api/Programa', ProgramaRoute);
app.use('/api/Roles', RolesRoute);
app.use('/api/UsuariosRol', UsuariosRolRoute);



const __filename =fileURLToPath(import.meta.url)
const __dirname = Path.dirname(__filename)


app.use('/public/uploads', Express.static(Path.join(__dirname,'public/uploads')));

app.get('/', (req, res) => {
  res.send('Hola Mundo Foodsys');
})

try {
  await db.authenticate();
  console.log('Conexion a la base de datos exitosa')
} catch (error) {
  console.error('Error al Conectar a la Base de Datos: ', error)
  process.exit(1)
}
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server up running at http://localhost:${PORT}`)
})

FichasModel.hasMany(UsuariosModel, {foreignKey: 'Id_Ficha', as: 'usuarios'})
UsuariosModel.belongsTo(FichasModel, {foreignKey: 'Id_Ficha', as: 'ficha'})

ProgramaModel.hasMany(FichasModel, {foreignKey: 'Id_Programa', as: 'ficha'})
FichasModel.belongsTo(ProgramaModel, {foreignKey: 'Id_Programa', as:'programa'})


UsuariosModel.hasMany(ReservasModel, { foreignKey: 'Id_Usuario', as: 'reservas' });
ReservasModel.belongsTo(UsuariosModel, { foreignKey: 'Id_Usuario', as: 'usuario' });

RolesModel.hasMany(UsuariosModel, { foreignKey: 'Id_Rol', as: 'usuarios' });
UsuariosModel.belongsTo(RolesModel, { foreignKey: 'Id_Rol', as: 'Roles' });

export default app;