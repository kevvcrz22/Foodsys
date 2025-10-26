import db from "../database/db.js";
import { DataTypes } from 'sequelize';

const regionalModel = db.define('regional', {
  
  Id_Regional: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Nom_Regional: { type: DataTypes.STRING },
  Cod_Regional: { type: DataTypes.STRING },
  Createdat: { type: DataTypes.DATE, allowNull: true },
  Updatedat: { type: DataTypes.DATE, allowNull: true }

}, {
    freezeTableName: true
})

export default regionalModel;