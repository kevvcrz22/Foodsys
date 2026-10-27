// Node/Models/InternadoTemporalModel.js
// Modelo Sequelize para la tabla internado_temporal_sena_empresa
// Gestiona el pase temporal a internado de aprendices externos segun SENA Empresa / Bienestar / Coordinacion

import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const InternadoTemporalModel = db.define('internado_temporal_sena_empresa', {
  Id_Registro: {
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
  Num_Ficha: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  Unidad_Productiva: {
    type: DataTypes.STRING(120),
    allowNull: false,
    defaultValue: 'SENA Empresa'
  },
  Fecha_Inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  Fecha_Fin: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  Rol_Original: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Aprendiz Externo'
  },
  Estado_Original_CenCon: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'No'
  },
  Estado_Periodo: {
    type: DataTypes.ENUM('PROGRAMADO', 'ACTIVO', 'VENCIDO', 'CANCELADO'),
    allowNull: false,
    defaultValue: 'PROGRAMADO'
  },
  Observaciones: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  Id_Usuario_Registro: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  Rol_Usuario_Registro: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  Origen_Registro: {
    type: DataTypes.ENUM('EXCEL', 'MANUAL'),
    allowNull: false,
    defaultValue: 'EXCEL'
  }
}, {
  freezeTableName: true,
  timestamps: true
});

export default InternadoTemporalModel;
