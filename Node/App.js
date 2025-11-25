import Express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './Database/db.js';
import AprendizRoute from './Routes/AprendizRoute.js';
import FichasRoute from "./Routes/FichasRoute.js";
import EmpresasRoute from "./Routes/EmpresasRoute.js";
import ReservasRoute from "./Routes/ReservasRoute.js";
import ResponsableRoute from "./Routes/ResponsableRoutes.js";
import CentroRoute from "./Routes/CentroRoutes.js";
import CiudadRoute from "./Routes/CiudadRoutes.js";
import ProgramaRoute from "./Routes/ProgramaRoutes.js";
import contratoRoute from "./Routes/contratoRoutes.js";
import centroareaRoutes from './Routes/centroareaRoutes.js';
import boletasRoute from "./Routes/boletasRoute.js";
import regionalRoute from "./Routes/regionalRoute.js";
import turnosRoute from "./Routes/turnosRoute.js";
import AreaRoutes from './routes/AreaRoutes.js';
import ReservaBoletaRoutes from './routes/ReservaBoletaRoutes.js'
import ProgramaModel from './Models/ProgramaModel.js';
import AreaModel from './models/AreaModel.js';

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
  res.send('Hola Mundo Foodsys')
})

try {
  await db.authenticate()
  console.log('Conexion a la base de datos exitosa')
} catch (error) {
  console.error('Error al Conectar a la Base de Datos: ', error)
  process.exit(1)
}
dotenv.config()

const PORT = process.env.PORT || 8000
app.listen(PORT, () => {
  console.log(`Server up running at http://localhost:${PORT}`)})




export default app
