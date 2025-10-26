import { Sequelize } from "sequelize";

const db = new Sequelize('foodsys', 'root', '', {
  host: 'localhost',
  dialect: 'mysql'
})

export default db;