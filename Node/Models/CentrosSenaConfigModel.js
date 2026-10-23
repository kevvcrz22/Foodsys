// Node/Models/CentrosSenaConfigModel.js
// Modelo Sequelize para configuracion multi-sede y contingencia offline

import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const CentrosSenaConfigModel = db.define('centros_sena_config', {
  Id_Centro: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Codigo_Centro_Sena: { type: DataTypes.STRING(10), allowNull: false, unique: true, defaultValue: '9121' },
  Nombre_Centro: { type: DataTypes.STRING(150), defaultValue: 'Centro Agropecuario "La Granja" del Espinal-Tolima' },
  Regional: { type: DataTypes.STRING(80), defaultValue: 'Regional Tolima' },
  Tiene_Internado: { type: DataTypes.TINYINT, defaultValue: 1 },
  Cupo_Max_Desayuno: { type: DataTypes.INTEGER, defaultValue: 250 },
  Cupo_Max_Almuerzo: { type: DataTypes.INTEGER, defaultValue: 450 },
  Cupo_Max_Cena: { type: DataTypes.INTEGER, defaultValue: 250 },
  Porcentaje_Cupo_Local_Offline: { type: DataTypes.INTEGER, defaultValue: 75 },
  Hora_Inicio_Almuerzo: { type: DataTypes.TIME, defaultValue: '11:30:00' },
  Hora_Fin_Almuerzo: { type: DataTypes.TIME, defaultValue: '13:30:00' },
  Horas_Antelacion_Reserva: { type: DataTypes.INTEGER, defaultValue: 8 },
  Horas_Antelacion_Cancelacion: { type: DataTypes.INTEGER, defaultValue: 9 },
  Horas_Antelacion_Cesion: { type: DataTypes.INTEGER, defaultValue: 2 },
  Max_Inasistencias_Semana: { type: DataTypes.INTEGER, defaultValue: 3 },
  Valor_Unitario_Racion_COP: { type: DataTypes.INTEGER, defaultValue: 12500 },
  Public_Key_Ed25519: { type: DataTypes.TEXT, allowNull: true },
  Ultima_Sincronizacion: { type: DataTypes.DATE, allowNull: true },
  Estado_Nodo_Local: { type: DataTypes.ENUM('ONLINE', 'OFFLINE_CONTINGENCIA'), defaultValue: 'ONLINE' }
}, {
  freezeTableName: true,
  timestamps: false
});

export default CentrosSenaConfigModel;
