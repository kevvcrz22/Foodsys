import db from "../database/db.js";
import { DataTypes } from "sequelize";

const AreaModel = db.define('area', {
    Id_Area: {type: DataTypes.NUMBER, primaryKey: true, autoIncrement: true},
    Nom_Area: {type: DataTypes.STRING}

}, {
    freezeTableName: true
})
export default AreaModel