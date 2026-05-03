import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const ProgramaModel = db.define('programas', {
  Id_Programa: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Nom_Programa: { type: DataTypes.STRING, },
  Are_Programa: { type: DataTypes.STRING, },
  NivFor_Programa: { type: DataTypes.STRING, }
}, {
  freezeTableName: true
});

export default ProgramaModel;