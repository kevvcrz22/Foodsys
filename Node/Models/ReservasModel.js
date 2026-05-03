import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const ReservaModel = db.define('reservas', {
  Id_Reserva: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Fec_Reserva: { type: DataTypes.DATEONLY },               // Solo fecha
  Vec_Reserva: { type: DataTypes.DATE },                    // Fecha y hora
  Est_Reserva: { type: DataTypes.STRING, allowNull: true }, // Generado, Verificado, Vencido, Cancelado
  Tip_Reserva: { type: DataTypes.STRING },                  // Desayuno, Almuerzo, Cena
  Qr_Reserva: { type: DataTypes.STRING },                   // Texto encriptado para el QR
  Id_Plato: { type: DataTypes.INTEGER },
  Id_Usuario: { type: DataTypes.INTEGER },
  Res_Excepcional: { type: DataTypes.STRING, defaultValue: "No" },
  Justificacion: { type: DataTypes.TEXT } // Agregar opcionalmente si es necesario
}, {
  freezeTableName: true
});

export default ReservaModel