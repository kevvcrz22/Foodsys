// ✅ UsuariosRolServices.js — corregido
import UsuariosRolModel from "../Models/UsuariosRolModel.js";
import UsuariosModel from "../Models/UsuariosModel.js";
import RolesModel from "../Models/RolesModel.js";

class UsuariosRolService {

    async getAll() {
        return await UsuariosRolModel.findAll({
            include: [
                {
                    model: UsuariosModel,
                    as: "usuario",
                    attributes: ["Id_Usuario", "Nom_Usuario", "Ape_Usuario", "NumDoc_Usuario"]
                },
                {
                    model: RolesModel,
                    as: "rol",
                    attributes: ["Id_Rol", "Nom_Rol"]
                }
            ],
            order: [['Id_UsuariosRol', 'DESC']]
        });
    }

    async getById(id) {
        const usuarioRol = await UsuariosRolModel.findByPk(id);
        if (!usuarioRol) throw new Error("UsuarioRol no encontrado");
        return usuarioRol;
    }

    // ✅ create simplificado — solo una inserción limpia
    async create(data) {
        const { Id_Usuario, Id_Rol } = data;

        if (!Id_Usuario || !Id_Rol) {
            throw new Error("Id_Usuario e Id_Rol son requeridos");
        }

        return await UsuariosRolModel.create({ Id_Usuario, Id_Rol });
    }

    async update(id, data) {
        const { Id_Usuario, Id_Rol } = data;
        const result = await UsuariosRolModel.update(
            { Id_Usuario, Id_Rol },
            { where: { Id_UsuariosRol: id } }
        );
        if (result[0] === 0) throw new Error("UsuarioRol no encontrado o sin cambios");
        return true;
    }

    async create(data) {
    const { Id_Usuario, Id_Rol } = data;

    if (!Id_Usuario || !Id_Rol) {
        throw new Error("Id_Usuario e Id_Rol son requeridos");
    }

    // ✅ Verificar si ya existe esa combinación usuario-rol
    const existe = await UsuariosRolModel.findOne({
        where: { Id_Usuario, Id_Rol }
    });

    if (existe) {
        throw new Error("Este usuario ya tiene ese rol asignado");
    }

    return await UsuariosRolModel.create({ Id_Usuario, Id_Rol });
}

    async delete(id) {
        const deleted = await UsuariosRolModel.destroy({ where: { Id_UsuariosRol: id } });
        if (!deleted) throw new Error("UsuarioRol no encontrado");
        return true;
    }
}

export default new UsuariosRolService();