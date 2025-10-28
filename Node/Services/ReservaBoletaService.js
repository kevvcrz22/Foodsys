import ReservaBoletaModel from "../models/ReservaBoletaModel.js";

class ReservaBoletaService {
    async getAll() {
        return await ReservaBoletaModel.findAll()
    }
    async getById(Id_ReservaBoleta) {
        const ReservaBoleta = await ReservaBoletaModel.findByPk(Id_ReservaBoleta)
        if (!ReservaBoleta) throw new Error('ReservaBoleta no encontrada')
        return ReservaBoleta
    }
    async create(data) {
        return await ReservaBoletaModel.create(data)
    }
    async update(Id_ReservaBoleta, data) {
        const result = await ReservaBoletaModel.update(data, { where: { Id_ReservaBoleta } })

        const update = result[0]
        if (update === 0) throw new Error('ReservaBoleta no encontrada o sin cambios')
        return true
    }
    async delete(Id_ReservaBoleta) {
        const deleted = await ReservaBoletaModel.destroy({ where: { Id_ReservaBoleta } })
        if (deleted === 0) throw new Error('ReservaBoleta no encontrada')
    }
}
export default new ReservaBoletaService()