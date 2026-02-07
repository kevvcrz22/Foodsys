import {Sequelize} from "sequelize";
const db = new Sequelize('foodsys','root', '', {
    host: 'localhost',
    dialect: 'mysql',
    timezone: '-05:00',
    dialectOptions: {
        useUTC: false
    }
})
export default db