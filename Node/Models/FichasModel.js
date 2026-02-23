import db from "../Database/db.js";
import { DataTypes } from "sequelize";
import ProgramaModel from "./ProgramaModel.js";

const FichasModel = db.define('fichas', {
  Id_Ficha: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Num_Ficha: { type: DataTypes.INTEGER },
  FecIniLec_Ficha: { type: DataTypes.DATE },
  FecFinLec_Ficha: { type: DataTypes.DATE },
  FecIniPra_Ficha: { type: DataTypes.DATE },
  FecFinPra_Ficha: { type: DataTypes.DATE },
  Id_Programa: {
    type: DataTypes.INTEGER,
    references: { model: 'programas', key: 'Id_Programa' }
  }
}, {
  freezeTableName: true
});

//asociación
FichasModel.belongsTo(ProgramaModel, {
  foreignKey: 'Id_Programa',
  as: 'Programa'
});

export default FichasModel;