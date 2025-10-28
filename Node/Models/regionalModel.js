import db from "../Database/db.js";
import { DataTypes } from 'sequelize';

const regionalModel = db.define('regional', {
  
  Id_Regional: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Nom_Regional: { type: DataTypes.STRING },
  Cod_Regional: { type: DataTypes.STRING }

}, {
    freezeTableName: true
})

export default regionalModel;