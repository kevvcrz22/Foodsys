import db from '../Database/db.js'
import { DataTypes, Sequelize } from 'sequelize'

const CheckinpassesModel = db.define('checkinpasses', {

    Codigo_para_QR: {type: DataTypes.STRING, unique:true},
    Id_Usuario: { type: DataTypes.INTEGER},
    Id_Ficha: {type: DataTypes.INTEGER},
    type: {type: DataTypes.STRING, defaultValue: 'Desayuno' },
    Valid_date: {type: DataTypes.DATEONLY},
    Status: {type: DataTypes.STRING, defaultValue: 'active'},
    ExpiresAt: {type:DataTypes.DATE},
    UsedAt: {type:DataTypes.DATE},
    generatedByUserId: {type: DataTypes.INTEGER},
    consumedByUserId: {type: DataTypes.INTEGER}
}, {
    freezeTableName: true
})

export default CheckinpassesModel