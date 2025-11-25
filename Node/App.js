import Express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './Database/db.js';
import UsuariosRoute from './Routes/UsuariosRoute.js';
import FichasRoute from "./Routes/FichasRoute.js";
import ReservasRoute from "./Routes/ReservasRoute.js";
import ProgramaRoute from "./Routes/ProgramaRoutes.js";
import FichasModel from './Models/FichasModel.js';
import UsuariosModel from "./Models/UsuariosModel.js";
import ProgramaModel from "./Models/ProgramaModel.js"; 

dotenv.config();

const app = Express();
app.use(Express.json());
app.use(cors());

app.use('/api/Usuarios', UsuariosRoute);
app.use('/api/fichas', FichasRoute);
app.use('/api/Reservas', ReservasRoute);
app.use('/api/Programa', ProgramaRoute);

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

export default app;  
