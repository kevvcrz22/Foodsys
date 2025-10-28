import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const ProgramaModel = db.define('Programa', {
  Id_Programa: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Nom_Programa: { type: DataTypes.STRING, },
  Id_Area: { type: DataTypes.INTEGER, },
  Niv_For_Programa: { type: DataTypes.STRING, }
}, {
  freezeTableName: true,
  timestamps: false
});

export default ProgramaModel;
