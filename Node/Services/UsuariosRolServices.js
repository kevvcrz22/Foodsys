import db_store from "../Database/db.js";
import UsuariosRolModel from "../Models/UsuariosRolModel.js";

class UsuariosRolService {
    async getAll() {
    return await UsuariosRolModel.findAll({
        order:[['Id_UsuariosRol', 'DESC']]
    });
    }


    async getById(id) {
        const UsuariosRol = await UsuariosRolModel.findByPk(id);
        if (!UsuariosRol) throw new Error("UsuarioRol no encontrado");
        return UsuariosRol;    
    }

    async create(data) {
        const transaction = await db_store.transaction()
        const UsuarioRol = await UsuariosRolModel.create(data, {transaction})
        const {Id_UsuariosRol} = UsuarioRol

        await UsuariosRolModel.create({
            Id_UsuariosRol: Id_UsuariosRol,
            Id_Usuarios: 1,
            Id_Rol: 1

        },  {transaction})
        return await UsuariosRolModel.create(data);
    }


    async update(id, data) {
        
        console.log("🟢 ID recibido en update:", id);
        console.log("🟢 Datos recibidos:", data);
        const result = await UsuariosRolModel.update(data, { where: { Id_UsuariosRol: id } });
        const updated = result[0];
        if (updated === 0) throw new Error("UsuarioRol no encontrado o sin cambios");
        return true;
    }

    async delete(id) {
        const deleted = await UsuariosRolModel.destroy({ where: { Id_UsuariosRol: id } });
        if (!deleted) throw new Error("UsuarioRol no encontrado");
        return true;
    }
}

export default new UsuariosRolService();
