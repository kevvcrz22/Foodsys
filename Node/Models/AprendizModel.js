import db from "../Database/db.js";
import { DataTypes } from "sequelize";
const AprendizModel = db.define ('aprendices',{
    Id_Aprendiz:{type:DataTypes.NUMBER, primaryKey: true, autoIncrement: true},
    TipDoc_Aprendiz: {type: DataTypes.CHAR},
    NumDoc_Aprendiz: {type: DataTypes.INTEGER},
    PriNom_Aprendiz: {type: DataTypes.STRING},
    SegNom_Aprendiz: {type: DataTypes.STRING},
    PriApe_Aprendiz: {type: DataTypes.STRING},
    SegApe_Aprendiz: {type: DataTypes.STRING},
    NomCom_Aprendiz: {type: DataTypes.STRING},
    Gen_Aprendiz: {type: DataTypes.CHAR},
    Cor_Aprendiz: {type: DataTypes.STRING},
    Tel_Aprendiz: {type: DataTypes.INTEGER},
    CenCon_Aprendiz: {type: DataTypes.CHAR},
    Est_Aprendiz: {type: DataTypes.CHAR},
    Sub_Aprendiz: {type: DataTypes.CHAR},
    Usu_Aprendiz: {type: DataTypes.STRING},
    Con_Aprendiz: {type: DataTypes.STRING},
    Id_Contrato: {type: DataTypes.INTEGER, references: {model: 'Contrato',key: 'Id_Contrato'}},
    Id_Ficha: {type: DataTypes.INTEGER, references: {model: 'Fichas',key: 'Id_Ficha'}},
    CreateData: {type: DataTypes.DATE, allowNull: true},
    UpdateData: {type: DataTypes.DATE, allowNull: true}
}, {
    freezeTableName: true,
    timestamps: false
})
export default AprendizModel
