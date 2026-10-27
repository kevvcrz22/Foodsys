// Node/Services/UsuariosService.js
// Servicio principal del modulo de usuarios para el sistema Foodsys
// Maneja registro, autenticacion, roles, sesion unica, pasantes e inasistencias semanales
// Codigo comentado didacticamente sin tildes ni emojis para aprendices de primer semestre

import UsuariosModel from "../Models/UsuariosModel.js";
import FichasModel from "../Models/FichasModel.js";
import UsuariosRolModel from "../Models/UsuariosRolModel.js";
import RolesModel from "../Models/RolesModel.js";
import ProgramaModel from "../Models/ProgramaModel.js";
import ReservaModel from "../Models/ReservasModel.js";
import Servicio_Correo from "./Servicio_Correo.js";
import VencimientoService from "./VencimientoService.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import { encolarEventoSync } from "./SyncOutboxService.js";

class UsuariosService {

  // Solicita enlace para restablecer contrasena por correo
  async resetPassword(email) {
    const usuario = await UsuariosModel.findOne({ where: { Cor_Usuario: email } });
    if (!usuario) {
      // Por seguridad y evitar enumeracion de usuarios retornamos silenciosamente
      return;
    }

    const tokenForPassword = jwt.sign(
      { usuario: { id: usuario.Id_Usuario } },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    await Servicio_Correo.sendPasswordResetEmail(email, tokenForPassword);
    return;
  }

  // Establece una nueva contrasena usando el token JWT recibido
  async setNewPassword(data) {
    const { tokenForPassword, newPassword } = data;
    const decodificado = jwt.verify(tokenForPassword, process.env.JWT_SECRET);

    const usuario = await UsuariosModel.findByPk(decodificado.usuario.id);
    if (!usuario) throw new Error("Ups, algo paso.");

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await UsuariosModel.update(
      { password: hashedPassword },
      { where: { Id_Usuario: decodificado.usuario.id } }
    );

    await encolarEventoSync({
      entidad: "USUARIO",
      operacion: "UPDATE_PASSWORD",
      entity_uuid: usuario.NumDoc_Usuario,
      payload: {
        NumDoc_Usuario: usuario.NumDoc_Usuario,
        password: hashedPassword
      }
    });

    return;
  }

  // Inicia sesion y genera token con control de sesion unica (tokenVersion)
  async Login(data) {
    const { TipDoc_Usuario, NumDoc_Usuario, password } = data;

    const usuarios = await UsuariosModel.findOne({
      where: { TipDoc_Usuario, NumDoc_Usuario },
      include: [{
        model: UsuariosRolModel,
        as: "rolesUsuario",
        include: [{ model: RolesModel, as: "rolUsuario" }]
      }]
    });

    if (!usuarios) throw new Error("Documento o contrasena incorrectos");

    const isValid = await bcrypt.compare(password, usuarios.password);
    if (!isValid) throw new Error("Documento o contrasena incorrectos");

    const usuarioJson = usuarios.toJSON();
    const roles = usuarioJson.rolesUsuario?.map(r => r.rolUsuario?.Nom_Rol).filter(Boolean) || [];

    // Sesion unica: incrementar tokenVersion en BD para invalidar cualquier sesion anterior en otros dispositivos
    const nuevoTokenVersion = (usuarios.tokenVersion || 1) + 1;
    await UsuariosModel.update({ tokenVersion: nuevoTokenVersion }, { where: { Id_Usuario: usuarios.Id_Usuario } });

    const token = jwt.sign(
      { id: usuarios.Id_Usuario, uuid: usuarios.uuid, roles, tokenVersion: nuevoTokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: "6h" }
    );

    const { password: _, ...usuarioSinPassword } = usuarioJson;
    usuarioSinPassword.tokenVersion = nuevoTokenVersion;
    return { usuario: usuarioSinPassword, roles, token };
  }

  // Registra un nuevo usuario con validacion de documento, etapa lectiva y asignacion de rol
  async register(data) {
    const {
      TipDoc_Usuario, NumDoc_Usuario, Nom_Usuario, Ape_Usuario,
      Gen_Usuario, Cor_Usuario, Tel_Usuario, CenCon_Usuario,
      Est_Usuario, San_Usuario, Id_Ficha, Roles, password
    } = data;

    const userExist = await UsuariosModel.findOne({ where: { TipDoc_Usuario, NumDoc_Usuario } });
    if (userExist) throw new Error("El usuario ya existe con ese documento");

    const cenCon = String(CenCon_Usuario || "").toLowerCase().trim();
    const esInterno = ["si", "sí", "1", "true"].includes(cenCon);

    // Verificar si la ficha asociada ya vencio su etapa lectiva
    let estUsuarioFinal = Est_Usuario || "En Formacion";
    if (Id_Ficha) {
      const ficha = await FichasModel.findByPk(Id_Ficha);
      const hoyBogota = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
      if (ficha?.FecFinLec_Ficha && ficha.FecFinLec_Ficha < hoyBogota) {
        estUsuarioFinal = "Inactivo";
      }
    }

    const pwd = password || String(NumDoc_Usuario);
    const hashedPassword = await bcrypt.hash(pwd, 10);

    const usuariosUuid = uuidv4();
    const usuarios = await UsuariosModel.create({
      TipDoc_Usuario,
      NumDoc_Usuario,
      Nom_Usuario,
      Ape_Usuario,
      Gen_Usuario,
      Cor_Usuario,
      Tel_Usuario,
      CenCon_Usuario: esInterno ? "Si" : "No",
      Est_Usuario: estUsuarioFinal,
      San_Usuario: San_Usuario || "No",
      Pol_Usuario: "No",
      Id_Ficha: Id_Ficha || null,
      password: hashedPassword,
      uuid: usuariosUuid,
    });

    // Asignar roles: si se enviaron roles especificos se asignan, de lo contrario se asigna por CenCon_Usuario
    // Asignar roles: si se enviaron roles especificos se asignan, si es Instructor se asigna Instructor, de lo contrario por CenCon_Usuario
    let rolesNombres = [];
    if (Array.isArray(Roles) && Roles.length > 0) {
      for (const idRol of Roles) {
        await UsuariosRolModel.create({ Id_Usuario: usuarios.Id_Usuario, Id_Rol: idRol });
        const rObj = await RolesModel.findByPk(idRol);
        if (rObj) rolesNombres.push(rObj.Nom_Rol);
      }
    } else if (String(estUsuarioFinal).toLowerCase().includes("instructor")) {
      const rolInstructor = await RolesModel.findOne({ where: { Nom_Rol: "Instructor" } });
      if (rolInstructor) {
        await UsuariosRolModel.create({ Id_Usuario: usuarios.Id_Usuario, Id_Rol: rolInstructor.Id_Rol });
        rolesNombres.push("Instructor");
      }
    } else {
      const nombreRol = esInterno ? "Aprendiz Interno" : "Aprendiz Externo";
      const rolEncontrado = await RolesModel.findOne({ where: { Nom_Rol: nombreRol } });
      if (rolEncontrado) {
        await UsuariosRolModel.create({ Id_Usuario: usuarios.Id_Usuario, Id_Rol: rolEncontrado.Id_Rol });
        rolesNombres.push(rolEncontrado.Nom_Rol);
      }
    }

    // Encolar evento para sincronizacion inmediata en Hetzner
    await encolarEventoSync({
      entidad: "USUARIO",
      operacion: "CREATE",
      entity_uuid: usuarios.NumDoc_Usuario,
      payload: {
        Id_Usuario: usuarios.Id_Usuario,
        TipDoc_Usuario: usuarios.TipDoc_Usuario,
        NumDoc_Usuario: usuarios.NumDoc_Usuario,
        Nom_Usuario: usuarios.Nom_Usuario,
        Ape_Usuario: usuarios.Ape_Usuario,
        Gen_Usuario: usuarios.Gen_Usuario,
        Cor_Usuario: usuarios.Cor_Usuario,
        Tel_Usuario: usuarios.Tel_Usuario,
        CenCon_Usuario: usuarios.CenCon_Usuario,
        Est_Usuario: usuarios.Est_Usuario,
        San_Usuario: usuarios.San_Usuario,
        Pol_Usuario: usuarios.Pol_Usuario,
        Id_Ficha: usuarios.Id_Ficha,
        password: hashedPassword,
        uuid: usuarios.uuid,
        roles: rolesNombres
      }
    });

    return usuarios;
  }

  // Obtiene el mapa en memoria de inasistencias en la semana ISO actual para semaforo de riesgo
  async obtenerMapaInasistenciasSemana() {
    try {
      const { inicioSemanaStr, finSemanaStr } = VencimientoService.getRangoSemana();
      const inasistencias = await ReservaModel.findAll({
        attributes: ["Id_Usuario", "Fec_Reserva"],
        where: {
          Est_Reserva: "Vencido",
          Fec_Reserva: { [Op.between]: [inicioSemanaStr, finSemanaStr] }
        }
      });

      const mapa = new Map();
      for (const res of inasistencias) {
        const id = res.Id_Usuario;
        mapa.set(id, (mapa.get(id) || 0) + 1);
      }
      return mapa;
    } catch (err) {
      console.warn("Error al calcular mapa de inasistencias semanales:", err.message);
      return new Map();
    }
  }

  // Lista todos los usuarios con sus roles, fichas e indicador de inasistencias
  async getAll() {
    const mapaInasistencias = await this.obtenerMapaInasistenciasSemana();

    const todos = await UsuariosModel.findAll({
      include: [
        {
          model: UsuariosRolModel,
          as: "rolesUsuario",
          include: [{ model: RolesModel, as: "rolUsuario" }]
        },
        {
          model: FichasModel,
          as: "ficha",
          attributes: ["Id_Ficha", "Num_Ficha"],
          include: [
            {
              model: ProgramaModel,
              as: "programas",
              attributes: ["Id_Programa", "Nom_Programa"]
            }
          ]
        }
      ]
    });

    return todos.map((u) => {
      const roles = u.rolesUsuario?.map(r => r.rolUsuario?.Nom_Rol).filter(Boolean) || [];
      const userObj = u.toJSON ? u.toJSON() : u;
      const inasistenciasSemana = mapaInasistencias.get(u.Id_Usuario) || 0;
      return { ...userObj, roles, inasistenciasSemana };
    });
  }

  // Obtiene el detalle de un unico usuario por su ID
  async getById(Id) {
    const usuario = await UsuariosModel.findByPk(Id, {
      include: [
        {
          model: UsuariosRolModel,
          as: "rolesUsuario",
          include: [{ model: RolesModel, as: "rolUsuario" }]
        },
        {
          model: FichasModel,
          as: "ficha",
          attributes: ["Id_Ficha", "Num_Ficha"],
          include: [
            {
              model: ProgramaModel,
              as: "programas",
              attributes: ["Nom_Programa"]
            }
          ]
        }
      ]
    });
    if (!usuario) throw new Error("Usuario no encontrado");
    const roles = usuario.rolesUsuario?.map(r => r.rolUsuario?.Nom_Rol).filter(Boolean) || [];
    const userObj = usuario.toJSON ? usuario.toJSON() : usuario;
    return { ...userObj, roles };
  }

  async create(data) {
    return await UsuariosModel.create(data);
  }

  async update(Id_Usuario, data) {
    const camposPermitidos = [
      "TipDoc_Usuario", "NumDoc_Usuario", "Nom_Usuario", "Ape_Usuario",
      "Gen_Usuario", "Cor_Usuario", "Tel_Usuario", "CenCon_Usuario",
      "Est_Usuario", "San_Usuario", "Fec_Desancion", "Id_Ficha", "Pol_Usuario"
    ];
    const dataFiltrada = {};
    for (const campo of camposPermitidos) {
      if (data[campo] !== undefined) {
        dataFiltrada[campo] = data[campo];
      }
    }

    if (data.password && data.password.trim()) {
      dataFiltrada.password = await bcrypt.hash(data.password, 10);
    }

    const result = await UsuariosModel.update(dataFiltrada, { where: { Id_Usuario } });
    if (result[0] === 0) throw new Error("Usuario No Encontrado o Sin Cambios");

    // Si el estado cambio a Instructor, asignar automaticamente el rol de Instructor si no lo tiene
    if (dataFiltrada.Est_Usuario && String(dataFiltrada.Est_Usuario).toLowerCase().includes("instructor")) {
      const rolInstructor = await RolesModel.findOne({ where: { Nom_Rol: "Instructor" } });
      if (rolInstructor) {
        const tieneRol = await UsuariosRolModel.findOne({
          where: { Id_Usuario, Id_Rol: rolInstructor.Id_Rol }
        });
        if (!tieneRol) {
          await UsuariosRolModel.create({ Id_Usuario, Id_Rol: rolInstructor.Id_Rol });
        }
      }
    }

    const usuarioAct = await UsuariosModel.findByPk(Id_Usuario, {
      include: [{ model: UsuariosRolModel, as: "rolesUsuario", include: [{ model: RolesModel, as: "rolUsuario" }] }]
    });
    const rolesNombres = usuarioAct?.rolesUsuario?.map(r => r.rolUsuario?.Nom_Rol).filter(Boolean) || [];

    await encolarEventoSync({
      entidad: "USUARIO",
      operacion: "UPDATE",
      entity_uuid: usuarioAct.NumDoc_Usuario,
      payload: {
        Id_Usuario: usuarioAct.Id_Usuario,
        TipDoc_Usuario: usuarioAct.TipDoc_Usuario,
        NumDoc_Usuario: usuarioAct.NumDoc_Usuario,
        Nom_Usuario: usuarioAct.Nom_Usuario,
        Ape_Usuario: usuarioAct.Ape_Usuario,
        Gen_Usuario: usuarioAct.Gen_Usuario,
        Cor_Usuario: usuarioAct.Cor_Usuario,
        Tel_Usuario: usuarioAct.Tel_Usuario,
        CenCon_Usuario: usuarioAct.CenCon_Usuario,
        Est_Usuario: usuarioAct.Est_Usuario,
        San_Usuario: usuarioAct.San_Usuario,
        Fec_Desancion: usuarioAct.Fec_Desancion,
        Pol_Usuario: usuarioAct.Pol_Usuario,
        Id_Ficha: usuarioAct.Id_Ficha,
        password: dataFiltrada.password || undefined,
        roles: rolesNombres
      }
    });

    return true;
  }

  async delete(Id_Usuario) {
    const usuario = await UsuariosModel.findByPk(Id_Usuario);
    if (!usuario) throw new Error("Usuario No encontrado");
    const doc = usuario.NumDoc_Usuario;
    await UsuariosModel.destroy({ where: { Id_Usuario } });

    await encolarEventoSync({
      entidad: "USUARIO",
      operacion: "DELETE",
      entity_uuid: doc,
      payload: { Id_Usuario, NumDoc_Usuario: doc }
    });

    return true;
  }

  async aceptarPolitica(Id_Usuario) {
    const result = await UsuariosModel.update(
      { Pol_Usuario: "Si" },
      { where: { Id_Usuario } }
    );
    if (result[0] === 0) throw new Error("Usuario no encontrado");

    const u = await UsuariosModel.findByPk(Id_Usuario);
    if (u) {
      await encolarEventoSync({
        entidad: "USUARIO",
        operacion: "UPDATE",
        entity_uuid: u.NumDoc_Usuario,
        payload: { NumDoc_Usuario: u.NumDoc_Usuario, Pol_Usuario: "Si" }
      });
    }

    return true;
  }

  // Lista exclusivamente a los usuarios con rol Aprendiz Interno o Aprendiz Externo
  async getAprendices() {
    try {
      await VencimientoService.procesarVencimientosGlobales();
    } catch (err) {
      console.error("Error al procesar vencimientos en getAprendices:", err.message);
    }

    const mapaInasistencias = await this.obtenerMapaInasistenciasSemana();

    const todos = await UsuariosModel.findAll({
      include: [
        {
          model: UsuariosRolModel,
          as: "rolesUsuario",
          include: [{ model: RolesModel, as: "rolUsuario" }]
        },
        {
          model: FichasModel,
          as: "ficha",
          attributes: ["Id_Ficha", "Num_Ficha"],
          include: [
            { model: ProgramaModel, as: "programas", attributes: ["Nom_Programa"] }
          ]
        }
      ]
    });

    return todos
      .filter((u) => {
        const roles = u.rolesUsuario?.map(r => r.rolUsuario?.Nom_Rol).filter(Boolean) || [];
        return roles.some(r => ["Aprendiz Interno", "Aprendiz Externo"].includes(r));
      })
      .map((u) => {
        const roles = u.rolesUsuario?.map(r => r.rolUsuario?.Nom_Rol).filter(Boolean) || [];
        const { password, token, ...rest } = u.toJSON();
        const inasistenciasSemana = mapaInasistencias.get(u.Id_Usuario) || 0;
        return { ...rest, roles, inasistenciasSemana };
      });
  }

  // Lista exclusivamente a los usuarios con rol Pasante Interno o Pasante Externo
  async getPasantes() {
    try {
      await VencimientoService.procesarVencimientosGlobales();
    } catch (err) {
      console.error("Error al procesar vencimientos en getPasantes:", err.message);
    }

    const mapaInasistencias = await this.obtenerMapaInasistenciasSemana();

    const todos = await UsuariosModel.findAll({
      include: [
        {
          model: UsuariosRolModel,
          as: "rolesUsuario",
          include: [{ model: RolesModel, as: "rolUsuario" }]
        },
        {
          model: FichasModel,
          as: "ficha",
          attributes: ["Id_Ficha", "Num_Ficha"],
          include: [
            { model: ProgramaModel, as: "programas", attributes: ["Nom_Programa"] }
          ]
        }
      ]
    });

    return todos
      .filter((u) => {
        const roles = u.rolesUsuario?.map(r => r.rolUsuario?.Nom_Rol).filter(Boolean) || [];
        return roles.some(r => ["Pasante Interno", "Pasante Externo"].includes(r));
      })
      .map((u) => {
        const roles = u.rolesUsuario?.map(r => r.rolUsuario?.Nom_Rol).filter(Boolean) || [];
        const { password, token, ...rest } = u.toJSON();
        const inasistenciasSemana = mapaInasistencias.get(u.Id_Usuario) || 0;
        return { ...rest, roles, inasistenciasSemana };
      });
  }
}

export default new UsuariosService();