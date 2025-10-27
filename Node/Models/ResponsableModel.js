import db from "../database/db.js";
import { DataTypes } from "sequelize";

const ResponsableModel = db.define('responsable', {
    Id_Responsable: {type: DataTypes.NUMBER, primaryKey: true, autoIncrement: true},
    Nom_Responsable: {type: DataTypes.STRING},
    Tel_Responsable: {type: DataTypes.STRING},
    Dir_Responsable: {type: DataTypes.STRING},
    Cor_Responsable: {type: DataTypes.STRING},
    Rol_Responsable: {type: DataTypes.STRING},
    Doc_Responsable: {type: DataTypes.NUMBER},
    Tip_Doc_Responsable: {type: DataTypes.STRING},
    Usu_Responsable: {type: DataTypes.STRING},
    Con_Responsable: {type: DataTypes.STRING},
    Cargo: {type: DataTypes.STRING},

}, {
    freezeTableName: true
})
export default ResponsableModel





