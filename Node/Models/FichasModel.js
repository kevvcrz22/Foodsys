import db from "../Database/db.js";
import { DataTypes } from "sequelize";
const FichasModel = db.define ('fichas',{
    id_Ficha:{type:DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    FecReg_Ficha:{type:DataTypes.DATE},
    FecIniLec_Ficha:{type:DataTypes.DATE},
    FecFinLec_Ficha:{type:DataTypes.DATE},
    FecIniPra_Ficha:{type:DataTypes.DATE},
    FecFinPra_Ficha:{type:DataTypes.DATE},
    CanApreIni_Ficha:{type:DataTypes.INTEGER},
    CanApreRet_Ficha:{type:DataTypes.INTEGER},
    TotApre_Ficha:{type:DataTypes.INTEGER},
    Mod_Ficha:{type:DataTypes.STRING},
    Jor_Ficha:{type:DataTypes.STRING},
    Id_programa: {type: DataTypes.INTEGER, references: {
    model: 'programas', 
    key: 'id_Programa' 
  }
}
},
    {freezeTableName: true
        
    })
export default FichasModel;