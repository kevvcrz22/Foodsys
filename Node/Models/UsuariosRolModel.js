import db from "../Database/db.js";
import { DataTypes } from "sequelize";
import UsuariosModel from "./UsuariosModel.js";
import RolesModel from "./RolesModel.js";

const UsuariosRolModel = db.define('UsuariosRol', {
  Id_UsuariosRol: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Id_Rol: {type: DataTypes.INTEGER, references: {model: 'roles', key: 'Id_Rol' }},
  Id_Usuario: {type: DataTypes.INTEGER, references: {model: 'Usuarios', key: 'Id_Usuario'}}
}, {
  freezeTableName: true,
  timestamps: false
})
export default UsuariosRolModel;