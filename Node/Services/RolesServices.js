import RolesModel from "../Models/RolesModel.js";
class RolesServices {
    async getAll() {
        return await RolesModel.findAll()
    }
    async getById(id) {
        const Roles = await RolesModel.findByPk(id)
        if(!Roles) throw new Error("Rol no encontrado")
        return Roles
    }
    async create(data){
        return await RolesModel.create(data)
    }
    async update(id, data) {
        const result = await RolesModel.update(data, { where: { Id_Rol: id } });

        if (result[0] === 0) {
            const Roles = await RolesModel.findByPk(id);
            if (!Roles) throw new Error("Rol no encontrado");
            throw new Error("No hubo cambios en los roles (los datos son iguales)");
            }

  return true;
}

    async delete(id){
        const deleted = await RolesModel.destroy({where:{Id_Rol: id}})
        if (!deleted) throw new Error("Rol no encontrado")
        return true
    }
}
export default new RolesServices();