import ProgramaModel from "../Models/ProgramaModel.js";

class ProgramaService {
    async getAll() {
    return await ProgramaModel.findAll({
        order:[['Id_Programa', 'DESC']]
    });
    }


    async getById(id) {
        const Programa = await ProgramaModel.findByPk(id);
        if (!Programa) throw new Error("Programa no encontrado");
        return Programa;    
    }

    async create(data) {
        return await ProgramaModel.create(data);
    }


    async update(id, data) {
        
        console.log("🟢 ID recibido en update:", id);
        console.log("🟢 Datos recibidos:", data);
        const result = await ProgramaModel.update(data, { where: { Id_Programa: id } });
        const updated = result[0];
        if (updated === 0) throw new Error("Programa no encontrado o sin cambios");
        return true;
    }

    async delete(id) {
        const deleted = await ProgramaModel.destroy({ where: { Id_Programa: id } });
        if (!deleted) throw new Error("Programa no encontrado");
        return true;
    }
}

export default new ProgramaService();
