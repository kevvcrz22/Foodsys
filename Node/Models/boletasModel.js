import db from "../Database/db.js";
import { DataTypes } from "sequelize";

const boletasModel = db.define('boleta', {

    Id_Boleta: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    Tip_Boleta: { type: DataTypes.STRING },
    Id_Aprendiz: { type: DataTypes.INTEGER },
    Pre_Boleta: { type: DataTypes.FLOAT },
    Fec_Boleta: { type: DataTypes.DATE },
    CodQR_Boleta: { type: DataTypes.STRING },
    Updatedat: { type: DataTypes.DATE, allowNull: true },
    Createdat: { type: DataTypes.DATE, allowNull: true }
   
}, {
    freezeTableName: true
})
export default boletasModel;