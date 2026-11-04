import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const MenusModel = db.define('menus', {
  Id_Menu: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Fec_Menu: { type: DataTypes.DATEONLY, allowNull: false },
  Tip_Menu: { type: DataTypes.ENUM('Desayuno', 'Almuerzo', 'Cena'), allowNull: false },
  Id_Plato: { type: DataTypes.INTEGER, allowNull: false, references: { model: "platos", key: "Id_Plato" } }
}, {
  freezeTableName: true,
  timestamps: false
});

export default MenusModel;