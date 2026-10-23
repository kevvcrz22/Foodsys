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
  Id_Usuario: { type: DataTypes.INTEGER },
  Id_Usuario_Cedente: { type: DataTypes.INTEGER, allowNull: true },
  Fec_Cesion: { type: DataTypes.DATE, allowNull: true },
  motivo_cesion: { type: DataTypes.STRING(180), allowNull: true },
  sync_status: { type: DataTypes.ENUM('PENDING', 'SYNCED'), defaultValue: 'PENDING' }
}, {
  freezeTableName: true,
  timestamps: true
});

export default ReservaModel;