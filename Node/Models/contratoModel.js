import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const contratoModel = db.define('contrato', {
  Id_contrato: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Id_Empresa: { type: DataTypes.INTEGER, },
  Num_Ref_Contrato: { type: DataTypes.INTEGER, },
  Fec_Ini_Contrato: { type: DataTypes.DATE, },
  Fec_Fin_Contrato: { type: DataTypes.DATE, },
  Est_Contrato: {type: DataTypes.STRING,}
}, {
  freezeTableName: true,
  timestamps: false
});

export default contratoModel;
