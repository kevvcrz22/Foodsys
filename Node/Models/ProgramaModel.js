import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const ProgramaModel = db.define('programas', {
  Id_Programa: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Nom_Programa: { type: DataTypes.STRING, },
  Area: { type: DataTypes.STRING, },
  Niv_For_Programa: { type: DataTypes.STRING, }
}, {
  freezeTableName: true,
  timestamps: false
});

export default ProgramaModel;
