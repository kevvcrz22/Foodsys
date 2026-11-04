// Node/Models/AsignacionSupervisorModel.js
// Modelo Sequelize para la tabla asignacion_supervisores_temporal
// Permite a Bienestar y Coordinador asignar el rol de Supervisor a un usuario
// por un tiempo determinado, con destitucion y reversion automatica al vencer la fecha.

import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const AsignacionSupervisorModel = db.define("asignacion_supervisores_temporal", {
  Id_Asignacion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Id_Usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "usuarios",
      key: "Id_Usuario"
    }
  },
  NumDoc_Usuario: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  Nom_Usuario: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  Ape_Usuario: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  Fecha_Inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  Fecha_Fin: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  Estado_Periodo: {
    type: DataTypes.ENUM("PROGRAMADO", "ACTIVO", "VENCIDO", "CANCELADO"),
    allowNull: false,
    defaultValue: "PROGRAMADO"
  },
  Observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  Id_Usuario_Asigno: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  Rol_Usuario_Asigno: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: "Bienestar"
  }
}, {
  freezeTableName: true,
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});

export default AsignacionSupervisorModel;

