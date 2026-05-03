import MenuModel from "../Models/MenusModels.js";
import PlatoModel from "../Models/PlatosModels.js";

class MenusService {

  async getAll() {
    return await MenuModel.findAll({
      include: [{ model: PlatoModel, as: "plato" }],
      order: [['Id_Menu', 'DESC']]
    });
  }

  async getById(id) {
    const menu = await MenuModel.findByPk(id, {
      include: [{ model: PlatoModel, as: "plato" }]
    });
    if (!menu) throw new Error("Menú no encontrado");
    return menu;
  }

  async create(data) {
    return await MenuModel.create(data);
  }

  async update(id, data) {
    const [updated] = await MenuModel.update(data, { where: { Id_Menu: id } });
    if (updated === 0) {
      const existe = await MenuModel.findByPk(id);
      if (!existe) throw new Error("Menú no encontrado");
      throw new Error("No hubo cambios en el menú");
    }
    return true;
  }

  async delete(id) {
    const deleted = await MenuModel.destroy({ where: { Id_Menu: id } });
    if (!deleted) throw new Error("Menú no encontrado");
    return true;
  }

  async getByFecha(fecha) {
    return await MenuModel.findAll({
      where: { Fec_Menu: fecha },
      include: [{ model: PlatoModel, as: "plato" }]
    });
  }
}

export default new MenusService();