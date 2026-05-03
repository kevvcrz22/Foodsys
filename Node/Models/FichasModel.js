import db from "../Database/db.js";
import { DataTypes } from "sequelize";

// Modelo que representa la tabla 'fichas' en la base de datos
const FichasModel = db.define('fichas', {
  Id_Ficha: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }, // Clave primaria autoincrementable
  Num_Ficha: { type: DataTypes.INTEGER },                                       // Numero identificador de la ficha
  FecIniLec_Ficha: { type: DataTypes.DATE },                                    // Fecha de inicio de la fase lectiva
  FecFinLec_Ficha: { type: DataTypes.DATE },                                    // Fecha de fin de la fase lectiva
  FecIniPra_Ficha: { type: DataTypes.DATE },                                    // Fecha de inicio de la fase practica
  FecFinPra_Ficha: { type: DataTypes.DATE },                                    // Fecha de fin de la fase practica
  Id_Programa: {                                                                // Llave foranea hacia la tabla programas
    type: DataTypes.INTEGER,
    references: { model: 'programas', key: 'Id_Programa' }
  }
}, {
  freezeTableName: true // Evita que Sequelize pluralice el nombre de la tabla
});

export default FichasModel;