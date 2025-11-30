import UsuariosModel from "../Models/UsuariosModel.js";
import FichasModel from "../Models/FichasModel.js";

class UsuariosService {
  async getAll() {
    return await UsuariosModel.findAll({
      include: [
        {model: FichasModel, as: 'ficha', attributes: ['Id_Ficha', 'Num_Ficha']}
      ]
    });
  }

  async getById(Id) {
    const Usuarios = await UsuariosModel.findByPk(Id)
    if(!Usuarios) throw new Error("Usuario no encontrado")
      return Usuarios
  }

  async create(data) {
    return await UsuariosModel.create(data);
  }

  async update(Id_Usuario, data) {
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