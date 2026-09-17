import ProgramaModel from "../Models/ProgramaModel.js";

class ProgramaService {
    async getAll() {
        return await ProgramaModel.findAll({
            order: [['Id_Programa', 'DESC']]
        });
    }

    async getById(id) {
        const Programa = await ProgramaModel.findByPk(id);
        if (!Programa) throw new Error("Programa no encontrado");
        return Programa;    
    }

    async create(data) {
        return await ProgramaModel.create({
            ...data,
            Est_Programa: data.Est_Programa || 'Activo'
        });
    }

    async update(id, data) {
        const result = await ProgramaModel.update(data, { where: { Id_Programa: id } });
        const updated = result[0];
        if (updated === 0) throw new Error("Programa no encontrado o sin cambios");
        return true;
    }

    async cambiarEstado(id, nuevoEstado) {
        const programa = await ProgramaModel.findByPk(id);
        if (!programa) throw new Error("Programa no encontrado");
        const estadoFinal = nuevoEstado || (programa.Est_Programa === 'Inactivo' ? 'Activo' : 'Inactivo');
        await ProgramaModel.update({ Est_Programa: estadoFinal }, { where: { Id_Programa: id } });
        return { estado: estadoFinal };
    }

    async delete(id) {
        // En lugar de borrar físicamente, se inactiva el programa
        const programa = await ProgramaModel.findByPk(id);
        if (!programa) throw new Error("Programa no encontrado");
        await ProgramaModel.update({ Est_Programa: 'Inactivo' }, { where: { Id_Programa: id } });
        return true;
    }
}

export default new ProgramaService();