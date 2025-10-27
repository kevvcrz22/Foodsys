import db from "../database/db.js";
import { DataTypes } from "sequelize";

const CentroModel = db.define('centro', {
    Id_Centro: {type: DataTypes.NUMBER, primaryKey: true, autoIncrement: true},
    Id_Ciudad: {type: DataTypes.NUMBER, foreignKey: true},
    Nom_Centro: {type: DataTypes.STRING},
    Id_Regional: {type: DataTypes.NUMBER, foreignKey: true},
    Cod_Centro: {type: DataTypes.NUMBER},
}, {
    freezeTableName: true
})
export default CentroModel