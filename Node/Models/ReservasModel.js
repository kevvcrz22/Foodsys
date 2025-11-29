import db from "../Database/db.js";
import { DataTypes } from "sequelize";
const ReservasModel = db.define ('reservas',{
    Id_Reserva:{type:DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    Fec_Reserva:{type:DataTypes.DATE},
    Vencimiento:{type:DataTypes.DATE},
    Est_Reserva:{type:DataTypes.TEXT, defaultValue: "Generada"},
    Tipo:{type:DataTypes.STRING},
    Tex_Qr:{type:DataTypes.TEXT},
    Id_Usuario: {type: DataTypes.INTEGER, references: {
    model: 'Usuario', 
    key: 'Id_Usuario' 
  }
}
},
    {freezeTableName: true
        
    })
export default ReservasModel;