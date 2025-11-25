import Express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './Database/db.js';
import UsuariosRoute from './Routes/UsuariosRoute.js';
import FichasRoute from "./Routes/FichasRoute.js";
import ReservasRoute from "./Routes/ReservasRoute.js";
import ResponsableRoute from "./Routes/ResponsableRoutes.js";
import ProgramaRoute from "./Routes/ProgramaRoutes.js";
import FichasModel from './Models/FichasModel.js';
import UsuariosModel from './Models/UsuariosModel.js';
import ProgramaModel from './Models/ProgramaModel.js';

dotenv.config();

const app = Express();
app.use(Express.json());
app.use(cors());

app.use('/api/Usuarios', UsuariosRoute);
app.use('/api/fichas', FichasRoute);
app.use('/api/Reservas', ReservasRoute);
app.use('/api/responsable', ResponsableRoute);
app.use('/api/Programa', ProgramaRoute);
import contratoRoute from "./Routes/contratoRoutes.js";
import centroareaRoutes from './Routes/centroareaRoutes.js';
import boletasRoute from "./Routes/boletasRoute.js";
import regionalRoute from "./Routes/regionalRoute.js";
import turnosRoute from "./Routes/turnosRoute.js";
import AreaRoutes from './routes/AreaRoutes.js';
import ReservaBoletaRoutes from './routes/ReservaBoletaRoutes.js'
import FichasModel from './Models/FichasModel.js';
import ProgramaModel from './Models/ProgramaModel.js';

ProgramaModel.hasMany(FichasModel, {foreignKey: 'Id_Programa', as: 'Ficha'});
FichasModel.belongsTo(ProgramaModel, {foreignKey:'Id_Programa', as: 'Programa'})



const app = Express()
app.use(Express.json())
app.use(cors())
app.use('/api/Aprendiz', AprendizRoute)
app.use('/api/Fichas', FichasRoute)
app.use('/api/Empresas', EmpresasRoute)
app.use('/api/Reservas', ReservasRoute)
app.use('/api/responsable', ResponsableRoute)
app.use('/api/centro', CentroRoute)
app.use('/api/ciudad', CiudadRoute)
app.use('/api/Programa', ProgramaRoute)
app.use('/api/contrato',contratoRoute)
app.use('/api/centroarea',centroareaRoutes)
app.use('/api/boletas', boletasRoute)
app.use('/api/regional', regionalRoute)
app.use('/api/turnos', turnosRoute)
app.use('/api/Area', AreaRoutes)
app.use('/api/ReservaBoleta', ReservaBoletaRoutes)

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
  console.log(`Server up running at http://localhost:${PORT}`)});
  

  
export default app
