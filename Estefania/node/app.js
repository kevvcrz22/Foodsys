import express from 'express'
import cors from 'cors'
import db from './database/db.js'
import boletasRoutes from './routes/boletasRoutes.js'
import turnosRoutes from './routes/turnosRoutes.js'
import regionalRoutes from './routes/regionalRoutes.js'
import dotenv from 'dotenv'

const app = express()

app.use(express.json())
app.use(cors())

app.use('/api/boletas', boletasRoutes)
app.use('/api/turnos', turnosRoutes)
app.use('/api/regional', regionalRoutes)

try{
    await db.authenticate()
    console.log('conexion a la base de datos exitosa')
}catch(error){
    console.error('Error al conectar a la base de datos: ', error)
    process.exit(1)
}

app.get('/', (req, res) => {
    res.send('Hola Mundo ADSO')
})
dotenv.config()
const PORT = process.env.PORT || 8000

app.listen(PORT, () =>{
    console.log(`Server up running in http://localhost:${PORT}`)
})
export default app