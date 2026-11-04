// Database/db.js
// Configuración de conexión a la base de datos MySQL con Sequelize.
// Las credenciales se leen desde variables de entorno (.env).

import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import Path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);
dotenv.config({ path: Path.resolve(__dirname, '../.env') });

const db = new Sequelize(
  process.env.DB_NAME || 'foodsys_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    timezone: '-05:00',
    logging: false,
    pool: {
      max: Number(process.env.DB_POOL_MAX) || 75,
      min: Number(process.env.DB_POOL_MIN) || 10,
      acquire: 45000,
      idle: 10000,
    },
    dialectOptions: {
      decimalNumbers: true,
      connectTimeout: 20000,
    },
  }
);

export default db;