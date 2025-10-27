import boletasModel from "../models/boletasModel.js";

class boletasService {

    async getAll() {
        return await boletasModel.findAll()
    }

    async getById(id) {

        const boletas = await boletasModel.findByPk(id)
        if (!boletas) throw new Error("Boleta no reservada")
        return boletas
    }

    async create(data) {
        return await boletasModel.create(data)
    }

    async update(id, data) {
        const result = await boletasModel.update(data, { where: { id }})
        const updated = result[0]

        if (updated === 0) throw new Error("Boleta no encontrada o sin cambios")
        
        return true
    }

    async delete(id) {
        const deleted = await boletasModel.destroy({ where: { id } })

        if (!deleted) throw new Error("Boleta no registrada");
        return true
        
    }
}

export default new boletasService()