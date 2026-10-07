import { Op } from "sequelize";
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
                    as: "rolUsuario",
                    attributes: ["Id_Rol", "Nom_Rol"]
                }
            ],
            order: [['Id_UsuariosRol', 'DESC']]
        });
    }

    async getById(id) {
        const usuarioRol = await UsuariosRolModel.findByPk(id, {
            include: [
                {
                    model: UsuariosModel,
                    as: "usuario",
                    attributes: ["Id_Usuario", "Nom_Usuario", "Ape_Usuario", "NumDoc_Usuario"]
                },
                {
                    model: RolesModel,
                    as: "rolUsuario",
                    attributes: ["Id_Rol", "Nom_Rol"]
                }
            ]
        });
        if (!usuarioRol) throw new Error("UsuarioRol no encontrado");
        return usuarioRol;
    }

    // Valida incompatibilidades de roles entre perfiles internos y externos
    async validarIncompatibilidadRoles(Id_Usuario, Id_Rol_Nuevo, Id_UsuariosRol_Actual = null) {
        const rolNuevo = await RolesModel.findByPk(Id_Rol_Nuevo);
        if (!rolNuevo) throw new Error("Rol no encontrado");

        const nombreRolNuevo = rolNuevo.Nom_Rol;

        // Obtener los roles que ya tiene el usuario (excluyendo el registro actual si es edición)
        const rolesAsignados = await UsuariosRolModel.findAll({
            where: {
                Id_Usuario,
                ...(Id_UsuariosRol_Actual ? { Id_UsuariosRol: { [Op.ne]: Id_UsuariosRol_Actual } } : {})
            },
            include: [{ model: RolesModel, as: "rolUsuario" }]
        });

        const nombresRolesActuales = rolesAsignados
            .map(ur => ur.rolUsuario?.Nom_Rol)
            .filter(Boolean);

        if (nombreRolNuevo === "Aprendiz Interno" && nombresRolesActuales.includes("Aprendiz Externo")) {
            throw new Error("No se puede asignar 'Aprendiz Interno' porque el usuario ya tiene el perfil 'Aprendiz Externo'.");
        }
        if (nombreRolNuevo === "Aprendiz Externo" && nombresRolesActuales.includes("Aprendiz Interno")) {
            throw new Error("No se puede asignar 'Aprendiz Externo' porque el usuario ya tiene el perfil 'Aprendiz Interno'.");
        }
        if (nombreRolNuevo === "Pasante Interno" && nombresRolesActuales.includes("Pasante Externo")) {
            throw new Error("No se puede asignar 'Pasante Interno' porque el usuario ya tiene el perfil 'Pasante Externo'.");
        }
        if (nombreRolNuevo === "Pasante Externo" && nombresRolesActuales.includes("Pasante Interno")) {
            throw new Error("No se puede asignar 'Pasante Externo' porque el usuario ya tiene el perfil 'Pasante Interno'.");
        }
    }

    async create(data) {
        const { Id_Usuario, Id_Rol } = data;

        if (!Id_Usuario || !Id_Rol) {
            throw new Error("Id_Usuario e Id_Rol son requeridos");
        }

        // Verificar si ya existe esa combinación usuario-rol
        const existe = await UsuariosRolModel.findOne({
            where: { Id_Usuario, Id_Rol }
        });

        if (existe) {
            throw new Error("Este usuario ya tiene ese rol asignado");
        }

        // Validar incompatibilidad (no permitir aprendiz interno y externo juntos, ni pasante interno y externo juntos)
        await this.validarIncompatibilidadRoles(Id_Usuario, Id_Rol);

        return await UsuariosRolModel.create({ Id_Usuario, Id_Rol });
    }

    async update(id, data) {
        const { Id_Usuario, Id_Rol } = data;
        if (!Id_Usuario || !Id_Rol) {
            throw new Error("Id_Usuario e Id_Rol son requeridos");
        }

        const existe = await UsuariosRolModel.findOne({
            where: {
                Id_Usuario,
                Id_Rol,
                Id_UsuariosRol: { [Op.ne]: id }
            }
        });
        if (existe) {
            throw new Error("Este usuario ya tiene ese rol asignado");
        }

        // Validar incompatibilidad
        await this.validarIncompatibilidadRoles(Id_Usuario, Id_Rol, id);

        const result = await UsuariosRolModel.update(
            { Id_Usuario, Id_Rol },
            { where: { Id_UsuariosRol: id } }
        );
        if (result[0] === 0) throw new Error("UsuarioRol no encontrado o sin cambios");
        return true;
    }

    async delete(id) {
        const deleted = await UsuariosRolModel.destroy({ where: { Id_UsuariosRol: id } });
        if (!deleted) throw new Error("UsuarioRol no encontrado");
        return true;
    }
}

export default new UsuariosRolService();