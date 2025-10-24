import Express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './Database/db.js';
import AprendizRoute from './Routes/AprendizRoute.js'

const app = Express()
app.use(Express.json())
app.use(cors())
app.use('/api/Aprendiz', AprendizRoute)

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
  console.log(`Server up running at http://localhost:${PORT}`)
})

export default app
