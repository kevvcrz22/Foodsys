import db from "../database/db.js";
import { DataTypes } from "sequelize";

const ReservaBoletaModel = db.define('reserva/boleta', {
    Id_ReservaBoleta: {type: DataTypes.NUMBER, primaryKey: true, autoIncrement: true},
    Id_Reserva: {type: DataTypes.NUMBER, foreignKey: true},
    Id_Boleta: {type: DataTypes.NUMBER, foreignKey: true},
    Can_Boleta: {type: DataTypes.NUMBER}

}, {
    freezeTableName: true
})
export default ReservaBoletaModel