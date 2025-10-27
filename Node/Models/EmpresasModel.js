import db from "../Database/db.js";
import { DataTypes } from "sequelize";
const EmpresasModel = db.define ('empresas',{
    id_Empresa:{type:DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    Nom_Empresa:{type:DataTypes.STRING},
    Nit_Empresa:{type:DataTypes.INTEGER},
    Tel_Empresa:{type:DataTypes.INTEGER},
    Dir_Empresa:{type:DataTypes.INTEGER},
    
  

},
    {freezeTableName: true
        
    })
export default EmpresasModel;