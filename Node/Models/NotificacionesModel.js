import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const NotificacionesModel = db.define('notificaciones', {
  Id_Notificacion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Id_Usuario: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'Id_Usuario'
    }
  },
  Rol_Destino: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'Todos'
  },
  Titulo: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  Mensaje: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  Tipo: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'info' // 'info', 'alerta', 'exito', 'urgente'
  },
  Leido: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  Fecha_Creacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  freezeTableName: true,
  timestamps: false
});

export default NotificacionesModel;
