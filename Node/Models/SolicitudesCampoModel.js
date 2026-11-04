// Node/Models/SolicitudesCampoModel.js
// Modelo Sequelize para la tabla solicitudes_guardado_campo
// Gestiona las actas y solicitudes de almuerzo guardado para fichas en jornada de campo o SENA Empresa

import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const SolicitudesCampoModel = db.define('solicitudes_guardado_campo', {
  Id_Solicitud_Campo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  uuid_solicitud: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    unique: true
  },
  Codigo_Acta: {
    type: DataTypes.VARCHAR ? DataTypes.STRING(30) : DataTypes.STRING(30),
    allowNull: false,
    unique: true
  },
  Id_Ficha: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Num_Ficha: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  Nom_Programa: {
    type: DataTypes.STRING(180),
    allowNull: false
  },
  Fec_Servicio: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  Tip_Comida: {
    type: DataTypes.ENUM('Almuerzo'),
    defaultValue: 'Almuerzo',
    allowNull: false
  },
  Unidad_Productiva: {
    type: DataTypes.ENUM(
      'GANADERIA',
      'PISCICULTURA',
      'PORCINOS',
      'AVICULTURA',
      'CULTIVOS_AGRICOLAS',
      'MECANIZACION_AGRICOLA',
      'AGROINDUSTRIA',
      'SENA_EMPRESA_GENERAL',
      'SALIDA_PEDAGOGICA',
      'OTRA_UNIDAD'
    ),
    defaultValue: 'SENA_EMPRESA_GENERAL',
    allowNull: false
  },
  Detalle_Lugar_Practica: {
    type: DataTypes.STRING(180),
    allowNull: false
  },
  Justificacion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  Hora_Estimada_Llegada: {
    type: DataTypes.TIME,
    defaultValue: '14:00:00',
    allowNull: false
  },
  Modalidad_Guardado: {
    type: DataTypes.ENUM('GUARDAR_EN_COMEDOR', 'EMPACA_PARA_LLEVAR'),
    defaultValue: 'GUARDAR_EN_COMEDOR',
    allowNull: false
  },
  Total_Aprendices_Guardados: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  Total_Almuerzos_Entregados: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  Id_Usuario_Solicitante: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Rol_Solicitante: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  Id_Usuario_Aval_SenaEmpresa: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  Estado_Solicitud: {
    type: DataTypes.ENUM(
      'ACTIVA_GUARDADA',
      'ENTREGADA_COMPLETA',
      'ENTREGADA_PARCIAL',
      'VENCIDA',
      'CANCELADA'
    ),
    defaultValue: 'ACTIVA_GUARDADA',
    allowNull: false
  },
  Observaciones_Cocina: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  freezeTableName: true,
  timestamps: true
});

export default SolicitudesCampoModel;
