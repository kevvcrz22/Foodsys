import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const TurnosModel = db.define('turnos', {
  Id_Turno: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Id_Usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'Id_Usuario'
    }
  },
  Fecha_Inicio: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  Fecha_Fin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  Estado: {
    type: DataTypes.ENUM('Activo', 'Finalizado'),
    allowNull: false,
    defaultValue: 'Activo'
  },
  Total_Consumos_Registrados: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  Observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  freezeTableName: true,
  timestamps: true
});

export default TurnosModel;
