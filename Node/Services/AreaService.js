import AreaModel from "../models/AreaModel.js";

class AreaService {
    async getAll() {
        return await AreaModel.findAll()
    }
    async getById(Id_Area) {
        const Area = await AreaModel.findByPk(Id_Area)
        if (!Area) throw new Error('Area no encontrada')
        return Area
    }
    async create(data) {
        return await AreaModel.create(data)
    }
    async update(Id_Area, data) {
        const result = await AreaModel.update(data, { where: { Id_Area } })

        const update = result[0]
        if (update === 0) throw new Error('area no encontrada o sin cambios')
        return true
    }
    async delete(Id_Area) {
        const deleted = await AreaModel.destroy({ where: { Id_Area } })
        if (deleted === 0) throw new Error('Area no encontrada')
    }
}
export default new AreaService()