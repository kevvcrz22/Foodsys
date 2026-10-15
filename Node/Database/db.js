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
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    timezone: '-05:00',
    logging: false,
    pool: {
      max: 25,
      min: 5,
      acquire: 60000,
      idle: 10000,
    },
  }
);

export default db;