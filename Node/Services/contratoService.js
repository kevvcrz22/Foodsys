import contratoModel from "../models/contratoModel.js";

class contratoService {
    async getAll() {
        return await contratoModel.findAll();
    }

    async getById(id) {
        const contrato = await contratoModel.findByPk(id);
        if (!contrato) throw new Error("contrato no encontrado");
        return contrato;    
    }

    async create(data) {
        return await contratoModel.create(data);
    }


    async update(id, data) {
        
        console.log("🟢 ID recibido en update:", id);
        console.log("🟢 Datos recibidos:", data);
        const result = await contratoModel.update(data, { where: { Id_contrato: id } });
        const updated = result[0];
        if (updated === 0) throw new Error("contrato no encontrado o sin cambios");
        return true;
    }

    async delete(id) {
        const deleted = await contratoModel.destroy({ where: { Id_contrato: id } });
        if (!deleted) throw new Error("contrato no encontrado");
        return true;
    }
}

export default new contratoService();