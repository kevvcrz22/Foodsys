import CentroModel from "../Models/CentroModel.js";

class CentroService {
    async getAll() {
        return await CentroModel.findAll()
    }
    async getById(Id_Centro) {
        const Centro = await CentroModel.findByPk(Id_Centro)
        if (!player) throw new Error('Centro no encontrado')
        return Centro
    }
    async create(data) {
        return await CentroModel.create(data)
    }
    async update(Id_Centro, data) {
        const result = await CentroModel.update(data, { where: { Id_Centro } })

        const update = result[0]
        if (update === 0) throw new Error('Centro no encontrado o sin cambios')
        return true
    }
    async delete(Id_Centro) {
        const deleted = await CentroModel.destroy({ where: { Id_Centro } })
        if (deleted === 0) throw new Error('Centro no encontrado')
    }
}
export default new CentroService()