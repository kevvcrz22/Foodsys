import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const RolesModel = db.define('roles', {
  Id_Rol: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Nom_Rol: { type: DataTypes.STRING, allowNull: true }
}, {
  freezeTableName: true,
  
});

export default RolesModel;