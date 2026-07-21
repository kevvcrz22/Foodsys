// Database/db.js
// Configuración de conexión a la base de datos MySQL con Sequelize.
// Las credenciales se leen desde variables de entorno (.env).

import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const db = new Sequelize(
  process.env.DB_NAME || 'foodsys',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    timezone: '-05:00',
    logging: false,
  }
);

export default db;