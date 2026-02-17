import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const RolesModel = db.define('Roles', {
  Id_Rol: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Nom_Rol: { type: DataTypes.STRING, allowNull: true },
  CreateData: { type: DataTypes.DATE, allowNull: true },
  UpdateData: { type: DataTypes.DATE, allowNull: true }
}, {
  freezeTableName: true,
  timestamps: false
});

export default RolesModel;