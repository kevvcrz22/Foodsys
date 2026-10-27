// Node/Models/ConfigHorariosModel.js
// Modelo Sequelize para la tabla configuracion_raciones
// Permite al Administrador activar/desactivar raciones y configurar horarios en tiempo real

import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const ConfigHorariosModel = db.define("configuracion_raciones", {
  Id_Config: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Tip_Racion: {
    type: DataTypes.ENUM("Desayuno", "Almuerzo", "Cena"),
    allowNull: false,
    unique: true
  },
  Racion_Activa: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  Hora_Inicio_Servicio: {
    type: DataTypes.TIME,
    allowNull: false
  },
  Hora_Fin_Servicio: {
    type: DataTypes.TIME,
    allowNull: false
  },
  Hora_Inicio_Reserva_Dia_Anterior: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: "06:00:00"
  },
  Hora_Limite_Reserva_Normal: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: "22:30:00"
  },
  Hora_Limite_Cancelacion: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: "21:00:00"
  },
  Hora_Limite_Excepcional: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: "09:00:00"
  },
  Hora_Limite_Cesion: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: "10:30:00"
  },
  Fecha_Excepcion_Temporal: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: "2026-10-27"
  },
  Hora_Limite_Excepcion_Temporal: {
    type: DataTypes.TIME,
    allowNull: true,
    defaultValue: "08:00:00"
  }
}, {
  freezeTableName: true,
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});

export default ConfigHorariosModel;
