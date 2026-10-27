import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const PlatoModel = db.define('platos', {
  Id_Plato: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Nom_Plato: { type: DataTypes.STRING, allowNull: false },
  Des_Plato: { type: DataTypes.STRING, allowNull: true },
  Img_Plato: { type: DataTypes.STRING, allowNull: true },
  Tip_Plato: { type: DataTypes.STRING, allowNull: true },
  Tipo_Item: { type: DataTypes.ENUM('PLATO', 'BEBIDA'), defaultValue: 'PLATO', allowNull: false },
  Subtipo_Bebida: { type: DataTypes.ENUM('NINGUNA', 'FRIA', 'CALIENTE'), defaultValue: 'NINGUNA', allowNull: false },
  Tip_Comida_Item: { type: DataTypes.ENUM('Desayuno', 'Almuerzo', 'Cena', 'Todas'), defaultValue: 'Todas', allowNull: false }
}, {
  freezeTableName: true
});

export default PlatoModel;