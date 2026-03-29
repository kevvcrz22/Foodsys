import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const PlatosModels = db.define('platos', {
  Id_Plato: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  Nom_Plato: { type: DataTypes.STRING(100), allowNull: false},
  Des_Plato: { type: DataTypes.STRING(255), allowNull: true},
  Img_Plato: { type: DataTypes.STRING(255), allowNull: true },
  Tip_Plato: { type: DataTypes.ENUM('Desayuno', 'Almuerzo', 'Cena'), allowNull: false },
  createdat: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW},
  updatedat: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW}

}, {
  freezeTableName: true,
  timestamps: false
});

export default PlatosModels;