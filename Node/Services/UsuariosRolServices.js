import { Op } from "sequelize";
import UsuariosRolModel from "../Models/UsuariosRolModel.js";
import UsuariosModel from "../Models/UsuariosModel.js";
import RolesModel from "../Models/RolesModel.js";
import { encolarEventoSync } from "./SyncOutboxService.js";

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

    // Valida incompatibilidades de roles y jerarquía (cadena de mando)
    async validarIncompatibilidadRoles(Id_Usuario, Id_Rol_Nuevo, Id_UsuariosRol_Actual = null, usuarioSolicitante = null) {
        const rolNuevo = await RolesModel.findByPk(Id_Rol_Nuevo);
        if (!rolNuevo) throw new Error("Rol no encontrado");

        const nombreRolNuevo = rolNuevo.Nom_Rol;

        // 1. Validar cadena de mando y prohibición de autoasignación de roles superiores
        if (usuarioSolicitante) {
            const idSolicitante = Number(usuarioSolicitante.id || usuarioSolicitante.Id_Usuario || 0);
            const rolActivoSolicitante = usuarioSolicitante.rol || "";
            const ROLES_SUPERIORES = ["Administrador", "Coordinador", "Supervisor de Contrato"];

            if (idSolicitante === Number(Id_Usuario) && ROLES_SUPERIORES.includes(nombreRolNuevo) && rolActivoSolicitante !== "Administrador") {
                throw new Error(`No está permitido autoasignarse un rol superior ('${nombreRolNuevo}').`);
            }

            if (rolActivoSolicitante === "Coordinador") {
                const ROLES_PERMITIDOS_COORDINADOR = [
                    "Cocina",
                    "Monitor",
                    "Supervisor",
                    "Bienestar",
                    "Aprendiz Interno",
                    "Aprendiz Externo",
                    "Pasante Interno",
                    "Pasante Externo"
                ];
                if (!ROLES_PERMITIDOS_COORDINADOR.includes(nombreRolNuevo)) {
                    throw new Error(`El rol Coordinador solo está autorizado para asignar perfiles de Casino/Cocina, Monitores, Bienestar y Aprendices/Pasantes.`);
                }
            }
        }

        // 2. Obtener los roles que ya tiene el usuario (excluyendo el registro actual si es edición)
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

        // Regla A: No permitir Interno y Externo simultáneamente
        const ROLES_INTERNOS = ["Aprendiz Interno", "Pasante Interno"];
        const ROLES_EXTERNOS = ["Aprendiz Externo", "Pasante Externo", "Visitante"];

        if (ROLES_INTERNOS.includes(nombreRolNuevo) && nombresRolesActuales.some(r => ROLES_EXTERNOS.includes(r))) {
            throw new Error(`No se puede asignar '${nombreRolNuevo}' porque el usuario ya tiene un perfil Externo asignado.`);
        }
        if (ROLES_EXTERNOS.includes(nombreRolNuevo) && nombresRolesActuales.some(r => ROLES_INTERNOS.includes(r))) {
            throw new Error(`No se puede asignar '${nombreRolNuevo}' porque el usuario ya tiene un perfil Interno asignado.`);
        }

        // Regla B: Pasante NO es Aprendiz (exclusión mutua)
        const ROLES_PASANTE = ["Pasante Interno", "Pasante Externo"];
        const ROLES_APRENDIZ = ["Aprendiz Interno", "Aprendiz Externo"];

        if (ROLES_PASANTE.includes(nombreRolNuevo) && nombresRolesActuales.some(r => ROLES_APRENDIZ.includes(r))) {
            throw new Error(`No se puede asignar '${nombreRolNuevo}' porque un Pasante no puede tener simultáneamente un rol de Aprendiz.`);
        }
        if (ROLES_APRENDIZ.includes(nombreRolNuevo) && nombresRolesActuales.some(r => ROLES_PASANTE.includes(r))) {
            throw new Error(`No se puede asignar '${nombreRolNuevo}' porque el usuario ya figura como Pasante (Pasante no es Aprendiz).`);
        }
    }

    async create(data, usuarioSolicitante = null) {
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

        // Validar incompatibilidad y jerarquía
        await this.validarIncompatibilidadRoles(Id_Usuario, Id_Rol, null, usuarioSolicitante);

        const creado = await UsuariosRolModel.create({ Id_Usuario, Id_Rol });

        const user = await UsuariosModel.findByPk(Id_Usuario, {
            include: [{ model: UsuariosRolModel, as: "rolesUsuario", include: [{ model: RolesModel, as: "rolUsuario" }] }]
        });
        if (user) {
            const rolesNombres = user.rolesUsuario?.map(r => r.rolUsuario?.Nom_Rol).filter(Boolean) || [];
            await encolarEventoSync({
                entidad: "USUARIO_ROL",
                operacion: "SYNC_ROLES",
                entity_uuid: user.NumDoc_Usuario,
                payload: { NumDoc_Usuario: user.NumDoc_Usuario, roles: rolesNombres }
            });
        }

        return creado;
    }

    async update(id, data, usuarioSolicitante = null) {
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

        // Validar incompatibilidad y jerarquía
        await this.validarIncompatibilidadRoles(Id_Usuario, Id_Rol, id, usuarioSolicitante);

        const result = await UsuariosRolModel.update(
            { Id_Usuario, Id_Rol },
            { where: { Id_UsuariosRol: id } }
        );
        if (result[0] === 0) throw new Error("UsuarioRol no encontrado o sin cambios");

        const user = await UsuariosModel.findByPk(Id_Usuario, {
            include: [{ model: UsuariosRolModel, as: "rolesUsuario", include: [{ model: RolesModel, as: "rolUsuario" }] }]
        });
        if (user) {
            const rolesNombres = user.rolesUsuario?.map(r => r.rolUsuario?.Nom_Rol).filter(Boolean) || [];
            await encolarEventoSync({
                entidad: "USUARIO_ROL",
                operacion: "SYNC_ROLES",
                entity_uuid: user.NumDoc_Usuario,
                payload: { NumDoc_Usuario: user.NumDoc_Usuario, roles: rolesNombres }
            });
        }

        return true;
    }

    async delete(id, usuarioSolicitante = null) {
        const ur = await UsuariosRolModel.findByPk(id, {
            include: [{ model: RolesModel, as: "rolUsuario" }]
        });
        if (!ur) throw new Error("UsuarioRol no encontrado");

        if (usuarioSolicitante && usuarioSolicitante.rol === "Coordinador") {
            const ROLES_PERMITIDOS_COORDINADOR = [
                "Cocina",
                "Monitor",
                "Supervisor",
                "Bienestar",
                "Aprendiz Interno",
                "Aprendiz Externo",
                "Pasante Interno",
                "Pasante Externo"
            ];
            const nomRol = ur.rolUsuario?.Nom_Rol || "";
            if (nomRol && !ROLES_PERMITIDOS_COORDINADOR.includes(nomRol)) {
                throw new Error(`El rol Coordinador no puede retirar el perfil '${nomRol}'.`);
            }
        }

        const Id_Usuario = ur?.Id_Usuario;
        const deleted = await UsuariosRolModel.destroy({ where: { Id_UsuariosRol: id } });
        if (!deleted) throw new Error("UsuarioRol no encontrado");

        if (Id_Usuario) {
            const user = await UsuariosModel.findByPk(Id_Usuario, {
                include: [{ model: UsuariosRolModel, as: "rolesUsuario", include: [{ model: RolesModel, as: "rolUsuario" }] }]
            });
            if (user) {
                const rolesNombres = user.rolesUsuario?.map(r => r.rolUsuario?.Nom_Rol).filter(Boolean) || [];
                await encolarEventoSync({
                    entidad: "USUARIO_ROL",
                    operacion: "SYNC_ROLES",
                    entity_uuid: user.NumDoc_Usuario,
                    payload: { NumDoc_Usuario: user.NumDoc_Usuario, roles: rolesNombres }
                });
            }
        }

        return true;
    }
}

export default new UsuariosRolService();