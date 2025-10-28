import turnosModel from "../Models/turnosModel.js";

class turnosService {

    async getAll() {
        return await turnosModel.findAll()
    }

    async getById(id) {

        const turnos = await turnosModel.findByPk(id)
        if (!turnos) throw new Error("Turno no registrado")
        return turnos
    }

    async create(data) {
        return await turnosModel.create(data)
    }

    async update(id, data) {
        const result = await turnosModel.update(data, { where: { id }})
        const updated = result[0]

        if (updated === 0) throw new Error("Turno no encontrado o sin cambios")
        
        return true
    }

    async delete(id) {
        const deleted = await turnosModel.destroy({ where: { id } })

        if (!deleted) throw new Error("Boleta no registrada");
        return true
        
    }
}

export default new turnosService()