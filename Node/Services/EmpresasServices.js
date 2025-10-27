import EmpresasModel from "../Models/EmpresasModel.js";
class EmpresasServices {
    async getAll() {
        return await EmpresasModel.findAll()

    }
    async getById(id) {
        const Empresas = await EmpresasModel.findByPk(id)
        if(!Empresas) throw new Error("Empresa no encontrada")
        return Empresas
    }
    async create(data){
        return await EmpresasModel.create(data)
    }
    async update(id, data) {
        const result = await EmpresasModel.update(data, { where: { id_Empresa: id } });

        if (result[0] === 0) {
            const Empresas = await EmpresasModel.findByPk(id);
            if (!Empresas) throw new Error("Empresa no encontrada");
            throw new Error("No hubo cambios en la empresa (los datos son iguales)");
            }

  return true;
}

    async delete(id){
        const deleted = await EmpresasModel.destroy({where:{id_Empresa: id}})
        if (!deleted) throw new Error("Empresa no encontrada")
        return true
    }
}
export default new EmpresasServices