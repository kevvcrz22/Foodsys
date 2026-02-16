import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const UsuariosModel = db.define('usuarios', {
  Id_Usuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  TipDoc_Usuario: { type: DataTypes.STRING, allowNull: true },
  NumDoc_Usuario: { type: DataTypes.INTEGER, allowNull: true },
  Nom_Usuario: { type: DataTypes.STRING, allowNull: true },
  Ape_Usuario: { type: DataTypes.STRING, allowNull: true },
  Gen_Usuario: { type: DataTypes.STRING, allowNull: true },
  Cor_Usuario: { type: DataTypes.STRING, allowNull: true },
  Tel_Usuario: { type: DataTypes.STRING, allowNull: true },
  CenCon_Usuario: { type: DataTypes.STRING, allowNull: true },
  Tip_Usuario: { type: DataTypes.STRING, allowNull: true },
  Est_Usuario: { type: DataTypes.STRING, allowNull: true},
  password: { type: DataTypes.STRING, allowNull: true },
  uuid: { type: DataTypes.STRING, allowNull: true },
  token: { type: DataTypes.STRING, allowNull: true },
  Id_Ficha: {type: DataTypes.INTEGER,references: { model: "fichas", key: "Id_Ficha" }},
  Sancion: {type: DataTypes.STRING, allowNull: true},
  CreateData: { type: DataTypes.DATE, allowNull: true },
  UpdateData: { type: DataTypes.DATE, allowNull: true }
},
{
  freezeTableName: true,
  timestamps: false
});
import FichasModel from "./FichasModel.js";


UsuariosModel.belongsTo(FichasModel, {
  foreignKey: "Id_Ficha",
  as: "Ficha"
});

export default UsuariosModel