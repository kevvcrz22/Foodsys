import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const centroareaModel = db.define('centroarea', {
  Id_centroArea: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Id_Centro: { type: DataTypes.INTEGER, },
  Id_Area: { type: DataTypes.INTEGER, },

}, {
  freezeTableName: true,
  timestamps: false
});

export default centroareaModel;