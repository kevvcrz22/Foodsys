import PlatosModel from "../Models/PlatosModels.js";

class PlatosService {

  async getAll() {
    return await PlatosModel.findAll({
      order: [['Id_Plato', 'DESC']]
    });
  }

  async getById(id) {
    const Plato = await PlatosModel.findByPk(id);
    if (!Plato) throw new Error("Plato no encontrado");
    return Plato;
  }

  async create(data) {
    return await PlatosModel.create(data);
  }

  async update(id, data) {
    const result = await PlatosModel.update(data, { where: { Id_Plato: id } });
    const updated = result[0];

    if (updated === 0) {
      const Plato = await PlatosModel.findByPk(id);
      if (!Plato) throw new Error("Plato no encontrado");
      throw new Error("No hubo cambios en el plato");
    }

    return true;
  }

  async delete(id) {
    const deleted = await PlatosModel.destroy({ where: { Id_Plato: id } });
    if (!deleted) throw new Error("Plato no encontrado");
    return true;
  }
}

export default new PlatosService();