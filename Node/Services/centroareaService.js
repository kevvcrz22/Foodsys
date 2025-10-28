import centroareaModel from "../models/centroareaModel.js";

class centroareaService {
    async getAll() {
        return await centroareaModel.findAll();
    }
    async getById(id) {
        const centroarea = await centroareaModel.findByPk(id);
        if (!centroarea) throw new Error("centro/Area no encontrado");
        return centroarea;    
    }

    async create(data) {
        console.log("POST: ", data)
        return await centroareaModel.create(data);
    }


    async update(id, data) {
        
        console.log("🟢 ID recibido en update:", id);
        console.log("🟢 Datos recibidos:", data);
        const result = await centroareaModel.update(data, { where: { Id_centroArea: id } });
        const updated = result[0];
        if (updated === 0) throw new Error("centro/Area no encontrado o sin cambios");
        return true;
    }

    async delete(id) {
        const deleted = await centroareaModel.destroy({ where: { Id_centroArea: id } });
        if (!deleted) throw new Error("centro/Area no encontrado");
        return true;
    }
}

export default new centroareaService();