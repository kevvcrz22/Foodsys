import db from "../Database/db.js";
import { DataTypes } from "sequelize";
const ReservasModel = db.define ('reservas',{
    id_Reserva:{type:DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    FecIni_Reserva:{type:DataTypes.DATE},
    FecFin_Reserva:{type:DataTypes.DATE},
    Est_Reserva:{type:DataTypes.STRING},
    Id_Aprendiz: {type: DataTypes.INTEGER, references: {
    model: 'Aprendiz', 
    key: 'id_Aprendiz' 
  }
}
},
    {freezeTableName: true
        
    })
export default ReservasModel;