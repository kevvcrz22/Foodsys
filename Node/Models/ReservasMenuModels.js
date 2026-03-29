import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const ReservasMenuModels = db.define('reservasmenu', {

  Id_ReservaMenu: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Id_Reserva: { type: DataTypes.INTEGER,allowNull: false,references: {model: "reservas", key: "Id_Reserva"}},
  Id_Menu: { type: DataTypes.INTEGER,allowNull: false,references: {model: "menu", key: "Id_Menu"}},
  createdat: { type: DataTypes.DATE,allowNull: true, defaultValue: DataTypes.NOW}
}, {
  freezeTableName: true,
  timestamps: false
});

export default ReservasMenuModels;