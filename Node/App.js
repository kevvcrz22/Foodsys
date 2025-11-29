import Express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './Database/db.js';
<<<<<<< Updated upstream
import AprendizRoute from './Routes/AprendizRoute.js'
import FichasRoute from "./Routes/FichasRoute.js"
import EmpresasRoute from "./Routes/EmpresasRoute.js"
import ReservasRoute from "./Routes/ReservasRoute.js"
import ResponsableRoutes from "./routes/ResponsableRoutes.js";
import CentroRoutes from "./routes/CentroRoutes.js";
import CiudadRoutes from "./routes/CiudadRoutes.js";
import ProgramaRoutes from "./Routes/ProgramaRoutes.js"
import contratoRoutes from "./Routes/contratoRoutes.js"
import centroarea from "./Routes/centroareaRoutes.js"
=======
import UsuariosRoute from './Routes/UsuariosRoute.js';
import FichasRoute from "./Routes/FichasRoute.js";
import ReservasRoute from "./Routes/ReservasRoute.js";
import ProgramaRoute from "./Routes/ProgramaRoutes.js";
import FichasModel from './Models/FichasModel.js';
import UsuariosModel from "./Models/UsuariosModel.js";
import ProgramaModel from "./Models/ProgramaModel.js"; 
import ReservasModel from './Models/ReservasModel.js';
>>>>>>> Stashed changes

const app = Express()
app.use(Express.json())
app.use(cors())
app.use('/api/Aprendiz', AprendizRoute)
app.use('/api/Fichas', FichasRoute)
app.use('/api/Empresas', EmpresasRoute)
app.use('/api/Reservas', ReservasRoute)
app.use('/api/responsable', ResponsableRoutes)
app.use('/api/centro', CentroRoutes)
app.use('/api/ciudad', CiudadRoutes)
app.use('/api/Programa', ProgramaRoutes)
app.use('/api/contrato',contratoRoutes)
app.use("./api/centroarea",centroarea)

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
<<<<<<< Updated upstream
  console.log(`Server up running at http://localhost:${PORT}`)})
export default app
=======
  console.log(`Server up running at http://localhost:${PORT}`)
})

FichasModel.hasMany(UsuariosModel, {foreignKey: 'Id_Ficha', as: 'usuarios'})
UsuariosModel.belongsTo(FichasModel, {foreignKey: 'Id_Ficha', as: 'ficha'})

ProgramaModel.hasMany(FichasModel, {foreignKey: 'Id_Programa', as: 'ficha'})
FichasModel.belongsTo(ProgramaModel, {foreignKey: 'Id_Programa', as:'programa'})

ReservasModel.hasMany(UsuariosModel, {foreignKey: 'Id_Reserva', as: 'usuarios'})
UsuariosModel.belongsTo(ReservasModel, {foreignKey: 'Id_Reserva', as: 'reservas'})
export default app;  
>>>>>>> Stashed changes
