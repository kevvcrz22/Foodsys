import UsuariosModel from "../Models/UsuariosModel.js";
import FichasModel from "../Models/FichasModel.js";
import UsuariosRolModel from "../Models/UsuariosRolModel.js";
import RolesModel from "../Models/RolesModel.js";
import ProgramaModel from "../Models/ProgramaModel.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import {v4 as uuidv4} from 'uuid'


class UsuariosService {
  async Login(data) {
  const { TipDoc_Usuario, NumDoc_Usuario, password } = data;

  const usuarios = await UsuariosModel.findOne({
    where: { TipDoc_Usuario, NumDoc_Usuario },
    include: [{
      model: UsuariosRolModel,
      as: "rolesUsuario",
      include: [{
        model: RolesModel,
        as: "rol"
      }]
    }]
  });

  if (!usuarios) {
    throw new Error("Documento o contraseña incorrectos");
  }

  const isValid = await bcrypt.compare(password, usuarios.password);

  if (!isValid) {
    throw new Error("Documento o contraseña incorrectos");
  }

  

  const usuarioJson = usuarios.toJSON();

/* EXTRAER ROLES DEL USUARIO */
const roles = usuarioJson.rolesUsuario
  ?.map(r => r.rol?.Nom_Rol)
  .filter(Boolean);

  const token = jwt.sign(
    {
    id: usuarios.Id_Usuario, 
    uuid: usuarios.uuid,
    roles: roles
     },
    process.env.JWT_SECRET,
    { expiresIn: "6h" }
  );
/* QUITAR PASSWORD */
const { password: _, ...usuarioSinPassword } = usuarioJson;

/* RESPUESTA FINAL */
return {
  usuario: usuarioSinPassword,
  roles,
  token
};
}

async register(data) {
  const {
    TipDoc_Usuario,
    NumDoc_Usuario,
    Nom_Usuario,
    Ape_Usuario,
    Gen_Usuario,
    Cor_Usuario,
    Tel_Usuario,
    CenCon_Usuario,
    Est_Usuario,
    San_Usuario,
    Id_Ficha,
    Roles
  } = data;
  console.log("DATA COMPLETA:", data);
  console.log("Roles recibidos:", Roles);

  const userExist = await UsuariosModel.findOne({
    where: {
      TipDoc_Usuario,
      NumDoc_Usuario
    }
  });

  if (userExist) {
    throw new Error("El usuario ya existe con ese documento");
  }

  // 🔐 La contraseña será el número de documento
  const hashedPassword = await bcrypt.hash(NumDoc_Usuario, 10);

  const usuariosUuid = uuidv4();
  const usuarios = await UsuariosModel.create({
    TipDoc_Usuario,
    NumDoc_Usuario,
    Nom_Usuario,
    Ape_Usuario,
    Gen_Usuario,
    Cor_Usuario,
    Tel_Usuario,
    CenCon_Usuario,
    Est_Usuario,
    password: hashedPassword,
    uuid: usuariosUuid,
    San_Usuario,
    Id_Ficha
  });

  return usuarios;
}

  async getAll() {
    return await UsuariosModel.findAll({
      include: [
        {model: FichasModel, as: 'ficha', include: [
          {
            model: ProgramaModel,
            as: 'Programa',
            attributes: ['Id_Programa', 'Nom_Programa']
          }
        ], 
      attributes: ['Id_Ficha', 'Num_Ficha']}
      ]
    });
  }

async getById(Id) {
  const usuarios = await UsuariosModel.findByPk(Id, {
    include: [
      {
        model: FichasModel,
        as: 'ficha',
        include: [
          {
            model: ProgramaModel,
            as: 'programa',
            attributes: ['Nom_Programa']
          }
        ],
        attributes: ['Id_Ficha', 'Num_Ficha']
      }
    ]
  });
  if (!usuarios) throw new Error("Usuario no encontrado");
  return usuarios;
}

  async create(data) {
    return await UsuariosModel.create(data);
  }

  async update(Id_Usuario, data) {

  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  const result = await UsuariosModel.update(data, { where: { Id_Usuario } });
  const updated = result[0];

  if (updated === 0) throw new Error("Usuario No Encontrado o Sin Cambios");

  return true;
}

  async delete(Id_Usuario) {
    const deleted = await UsuariosModel.destroy({ where: { Id_Usuario } });
    if (!deleted) throw new Error("Usuario No encontrado");
    return true;
  }
    async aceptarPolitica(Id_Usuario) {
  const result = await UsuariosModel.update(
    { Pol_Usuario: 'Si' },
    { where: { Id_Usuario } }
  );
  if (result[0] === 0) throw new Error("Usuario no encontrado");
  return true;
}

async getAprendices() {
    const aprendices = await UsuariosModel.findAll({
        include: [
            {
                model: UsuariosRolModel,
                as: 'rolesUsuario',
                include: [{ model: RolesModel, as: 'rol' }]
            },
            {
                model: FichasModel,
                as: 'ficha',
                attributes: ['Id_Ficha', 'Num_Ficha']
            }
        ]
    });

    return aprendices
        .filter(u => {
            const roles = u.rolesUsuario?.map(r => r.rol?.Nom_Rol) || [];
            return roles.includes('Aprendiz Interno') || roles.includes('Aprendiz Externo');
        })
        .map(u => {
            const roles = u.rolesUsuario?.map(r => r.rol?.Nom_Rol) || [];
            const { password, token, ...rest } = u.toJSON();
            return { ...rest, roles };
        });
}
}

export default new UsuariosService ()
