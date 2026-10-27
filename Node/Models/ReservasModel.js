// Node/Models/ReservasModel.js
// Modelo Sequelize para la tabla reservas
// Incluye soporte para sincronizacion offline, cesion solidaria y trazabilidad criptografica

import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const ReservaModel = db.define('reservas', {
  Id_Reserva: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  uuid_reserva: { type: DataTypes.CHAR(36), allowNull: true },
  nodo_origen: { type: DataTypes.ENUM('LOCAL', 'CLOUD'), defaultValue: 'CLOUD' },
  Fec_Reserva: { type: DataTypes.DATEONLY },               // Solo fecha
  Vec_Reserva: { type: DataTypes.DATE },                    // Fecha y hora
  Est_Reserva: { type: DataTypes.STRING, allowNull: true }, // Generado, Verificado, Consumido, Vencido, Cancelado
  Tip_Reserva: { type: DataTypes.STRING },                  // Desayuno, Almuerzo, Cena
  Qr_Reserva: { type: DataTypes.TEXT },                     // Token o firma del QR
  Exc_Reserva: { type: DataTypes.STRING, allowNull: true }, // Texto para excepciones
  Jus_Reserva: { type: DataTypes.STRING, allowNull: true }, // Justificacion para excepciones
  Id_Plato: { type: DataTypes.INTEGER },
  Id_Bebida: { type: DataTypes.INTEGER, allowNull: true },
  Id_Usuario: { type: DataTypes.INTEGER },
  Id_Usuario_Cedente: { type: DataTypes.INTEGER, allowNull: true },
  Id_Usuario_Receptor_Pendiente: { type: DataTypes.INTEGER, allowNull: true },
  Estado_Cesion: { 
    type: DataTypes.ENUM('NINGUNA', 'PENDIENTE_ACEPTACION', 'ACEPTADA', 'RECHAZADA'), 
    defaultValue: 'NINGUNA' 
  },
  Token_Aceptacion_Cesion: { type: DataTypes.STRING(80), allowNull: true },
  Fec_Cesion: { type: DataTypes.DATE, allowNull: true },
  motivo_cesion: { type: DataTypes.STRING(180), allowNull: true },
  sync_status: { type: DataTypes.ENUM('PENDING', 'SYNCED'), defaultValue: 'PENDING' },
  Es_Guardado_Campo: { type: DataTypes.BOOLEAN, defaultValue: false },
  Id_Solicitud_Campo: { type: DataTypes.INTEGER, allowNull: true },
  Hora_Limite_Extendida: { type: DataTypes.TIME, allowNull: true },
  Justificacion_Campo: { type: DataTypes.STRING(255), allowNull: true },
  Unidad_Productiva_Campo: { type: DataTypes.STRING(80), allowNull: true }
}, {
  freezeTableName: true,
  timestamps: true
});

export default ReservaModel;