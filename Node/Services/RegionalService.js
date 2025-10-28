import regionalModel from "../Models/regionalModel.js";

class regionalService {

    async getAll() {
        return await regionalModel.findAll()
    }

    async getById(id) {

        const regional = await regionalModel.findByPk(id)
        if (!regional) throw new Error("Regional no encontrada")
        return regional
    }

    async create(data) {
        return await regionalModel.create(data)
    }

    async update(id, data) {
        const result = await regionalModel.update(data, { where: { Id_Regional: id } })
        const updated = result[0]

        if (updated === 0) throw new Error("Regional no encontrada o sin cambios")
        
        return true
    }

    async delete(id) {
        const deleted = await regionalModel.destroy({ where: { id } })

        if (!deleted) throw new Error("Regional no encontrada");
        return true
        
    }
}

export default new regionalService()