// Node/Models/PqrsfModel.js
// Modelo Sequelize para el sistema de PQRSF con matriz de prioridad,
// termometro de interventoria, estandar de categorias y SLA.

import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const PqrsfModel = db.define('pqrsf', {
  Id_Pqrsf: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  uuid_pqrsf: { type: DataTypes.CHAR(36), allowNull: false, unique: true },
  Radicado: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  Id_Usuario: { type: DataTypes.INTEGER, allowNull: true },
  Id_Reserva: { type: DataTypes.INTEGER, allowNull: true },
  Nombre_Reportante: { type: DataTypes.STRING(120), allowNull: true },
  Correo_Reportante: { type: DataTypes.STRING(120), allowNull: true },
  Rol_Reportante: { type: DataTypes.STRING(50), defaultValue: 'Aprendiz' },
  Tipo_Solicitud: {
    type: DataTypes.ENUM('Felicitacion', 'Sugerencia', 'Peticion', 'Queja', 'Reclamo'),
    allowNull: false
  },
  Categoria_Estandar: {
    type: DataTypes.ENUM(
      'CALIDAD_ALIMENTACION',
      'ESTADO_PLATO_MENAJE',
      'MOBILIARIO_MESAS_SILLAS',
      'ATENCION_SERVICIO',
      'PLATAFORMA_RESERVAS',
      'RECONOCIMIENTO',
      'OTRO'
    ),
    defaultValue: 'CALIDAD_ALIMENTACION'
  },
  Subcategoria: { type: DataTypes.STRING(120), allowNull: false },
  Persona_Servicio_Ref: { type: DataTypes.STRING(120), allowNull: true },
  Fec_Hecho: { type: DataTypes.DATEONLY, allowNull: false },
  Tip_Comida: {
    type: DataTypes.ENUM('Desayuno', 'Almuerzo', 'Cena', 'General'),
    defaultValue: 'Almuerzo'
  },
  Id_Plato_Relacionado: { type: DataTypes.INTEGER, allowNull: true },
  Nivel_Prioridad: {
    type: DataTypes.ENUM('CRITICA', 'ALTA', 'MEDIA', 'BAJA', 'POSITIVA'),
    defaultValue: 'MEDIA'
  },
  Puntaje_Prioridad: { type: DataTypes.INTEGER, defaultValue: 50 },
  Sla_Horas: { type: DataTypes.INTEGER, defaultValue: 48 },
  Calificacion_Servicio: { type: DataTypes.TINYINT, allowNull: true },
  Descripcion: { type: DataTypes.TEXT, allowNull: false },
  Archivo_Evidencia: { type: DataTypes.STRING(255), allowNull: true },
  Estado_Pqrsf: {
    type: DataTypes.ENUM('Abierta', 'En Revision', 'Respondida', 'Cerrada'),
    defaultValue: 'Abierta'
  },
  Respuesta_Administracion: { type: DataTypes.TEXT, allowNull: true },
  Id_Responsable_Respuesta: { type: DataTypes.INTEGER, allowNull: true },
  Fecha_Respuesta: { type: DataTypes.DATE, allowNull: true },
  Fecha_Limite_SLA: { type: DataTypes.DATE, allowNull: false },
  nodo_origen: {
    type: DataTypes.ENUM('LOCAL', 'CLOUD'),
    defaultValue: 'LOCAL'
  },
  sync_status: {
    type: DataTypes.ENUM('PENDING', 'SYNCED'),
    defaultValue: 'PENDING'
  }
}, {
  freezeTableName: true,
  timestamps: true
});

export default PqrsfModel;
