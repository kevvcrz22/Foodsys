import db from "../Database/db.js";
import { DataTypes } from 'sequelize';

const turnosModel = db.define('turno', {
  
  Id_Turno: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Id_Responsable: { type: DataTypes.INTEGER },
  Tip_Turno: { type: DataTypes.STRING },
  FecIni_Turno: { type: DataTypes.DATE },
  FecFin_Turno: { type: DataTypes.DATE },
  HorIni_Turno: { type: DataTypes.TIME },
  HorFin_Turno: { type: DataTypes.TIME },
  
}, {
  freezeTableName: true
});

export default turnosModel;