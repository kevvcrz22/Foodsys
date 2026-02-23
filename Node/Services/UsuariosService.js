import UsuariosModel from "../Models/UsuariosModel.js";
import FichasModel from "../Models/FichasModel.js";
import RolesModel from "../Models/RolesModel.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import {v4 as uuidv4} from 'uuid'
import ProgramaModel from "../Models/ProgramaModel.js";


class UsuariosService {
  async Login(data) {
  const { TipDoc_Usuario, NumDoc_Usuario, password } = data;

  const usuarios = await UsuariosModel.findOne({
    where: {
      TipDoc_Usuario,
      NumDoc_Usuario
    }
  });

  if (!usuarios) {
    throw new Error("Documento o contraseña incorrectos");
  }

  const isValid = await bcrypt.compare(password, usuarios.password);

  if (!isValid) {
    throw new Error("Documento o contraseña incorrectos");
  }

  const token = jwt.sign(
    { id: usuarios.Id_Usuario, uuid: usuarios.uuid },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  usuarios.token = token;
  await usuarios.save();

  const { password: _, ...usuarioSinPassword } = usuarios.toJSON();

  return { usuarios: usuarioSinPassword };
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
    Id_Rol,
    Est_Usuario,
    password,
    Sancion,
    Id_Ficha
  } = data;

  const userExist = await UsuariosModel.findOne({
    where: {
      TipDoc_Usuario,
      NumDoc_Usuario
    }
  });

  if (userExist) {
    throw new Error("El usuario ya existe con ese documento");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const usuariosUuid = uuidv4();

  const usuarios = await UsuariosModel.create({
    TipDoc_Usuario,
    NumDoc_Usuario,
    Nom_Usuario,
    Ape_Usuario,
    Gen_Usuario,
    Cor_Usuario,
    CenCon_Usuario,
    Tel_Usuario,
    Id_Rol,
    Est_Usuario,
    password: hashedPassword,
    uuid: usuariosUuid,
    Sancion,
    Id_Ficha
  });

  return usuarios;
}


  async getAll() {
    return await UsuariosModel.findAll({
      include: [
        {model: RolesModel, as: 'ficha', attributes: ['Id_Rol', 'Nom_Rol']}
      ]
    });
  }

   async getAll() {
    return await UsuariosModel.findAll({
      include: [
        {model: FichasModel, as: 'ficha', attributes: ['Id_Ficha', 'Num_Ficha']}
      ]
    });
  }

async getById(Id) {
  const usuarios = await UsuariosModel.findByPk(Id, {
    include: [
      {
        model: FichasModel,
        as: 'Ficha',
        include: [
          {
            model: ProgramaModel,
            as: 'Programa',
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
}

export default new UsuariosService ()