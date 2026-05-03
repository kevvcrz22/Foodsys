import PlatoModel from "../Models/PlatosModels.js";

class PlatosService {

  async getAll() {
    return await PlatoModel.findAll({ order: [['Id_Plato', 'DESC']] });
  }

  async getById(id) {
    const plato = await PlatoModel.findByPk(id);
    if (!plato) throw new Error("Plato no encontrado");
    return plato;
  }

  async create(data) {
    return await PlatoModel.create(data);
  }

  async update(id, data) {
    const [updated] = await PlatoModel.update(data, { where: { Id_Plato: id } });
    if (updated === 0) {
      const existe = await PlatoModel.findByPk(id);
      if (!existe) throw new Error("Plato no encontrado");
      throw new Error("No hubo cambios en el plato");
    }
    return true;
  }

  async delete(id) {
    const deleted = await PlatoModel.destroy({ where: { Id_Plato: id } });
    if (!deleted) throw new Error("Plato no encontrado");
    return true;
  }
}

export default new PlatosService();