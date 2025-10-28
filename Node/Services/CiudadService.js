import CiudadModel from "../Models/CiudadModel.js";

class CiudadService {
    async getAll() {
        return await CiudadModel.findAll()
    }
    async getById(Id_Ciudad) {
        const Ciudad = await CiudadModel.findByPk(Id_Ciudad)
        if (!player) throw new Error('Ciudad no encontrada')
        return Ciudad
    }
    async create(data) {
        return await CiudadModel.create(data)
    }
    async update(Id_Ciudad, data) {
        const result = await CiudadModel.update(data, { where: { Id_Ciudad } })

        const update = result[0]
        if (update === 0) throw new Error('Ciudad no encontrada o sin cambios')
        return true
    }
    async delete(Id_Ciudad) {
        const deleted = await CiudadModel.destroy({ where: { Id_Ciudad } })
        if (deleted === 0) throw new Error('ciudad no encontrada')
    }
}
export default new CiudadService()