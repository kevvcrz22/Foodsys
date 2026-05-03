import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const PlatoModel = db.define('platos', {
  Id_Plato: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Nom_Plato: { type: DataTypes.STRING, allowNull: false },
  Des_Plato: { type: DataTypes.STRING, allowNull: true },
  Img_Plato: { type: DataTypes.STRING, allowNull: true },
  Tip_Plato: { type: DataTypes.STRING, allowNull: true}
}, {
  freezeTableName: true
});

export default PlatoModel;