import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const UsuariosRolModel = db.define('UsuariosRol', {
  Id_UsuariosRol: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Fec_Ingreso : {type: DataTypes.DATEONLY},
  Id_Rol: {type: DataTypes.INTEGER, references: {model: 'roles', key: 'Id_Rol' }},
  Id_Usuario: {type: DataTypes.INTEGER, references: {
    model: 'Usuario', 
    key: 'Id_Usuario' 
  }
  
}

}, {
  freezeTableName: true,
  timestamps: false
});

export default UsuariosRolModel;
