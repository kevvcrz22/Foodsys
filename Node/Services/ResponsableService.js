import ResponsableModel from "../Models/ResponsableModel.js";

class ResponsableService {
    async getAll() {
        return await ResponsableModel.findAll()
    }
    async getById(Id_Responsable) {
        const responsable = await ResponsableModel.findByPk(Id_Responsable)
        if (!player) throw new Error('responsable no encontrado')
        return responsable
    }
    async create(data) {
        return await ResponsableModel.create(data)
    }
    async update(Id_Responsable, data) {
        const result = await ResponsableModel.update(data, { where: { Id_Responsable } })

        const update = result[0]
        if (update === 0) throw new Error('responsable no encontrado o sin cambios')
        return true
    }
    async delete(Id_Responsable) {
        const deleted = await ResponsableModel.destroy({ where: { Id_Responsable } })
        if (deleted === 0) throw new Error('responsable no encontrado')
    }
}
export default new ResponsableService()