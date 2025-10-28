import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const CiudadModel = db.define('ciudad', {
    Id_Ciudad: {type: DataTypes.NUMBER, primaryKey: true, autoIncrement: true},
    Nom_Ciudad: {type: DataTypes.STRING},
}, {
    freezeTableName: true
})
export default CiudadModel