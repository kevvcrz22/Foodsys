import MenusModel from "../Models/MenusModels.js";
import PlatosModel from "../Models/PlatosModels.js";

class MenusService {

  async getAll() {
    return await MenusModel.findAll({
      include: [
        {
          model: PlatosModel,
          as: "plato"
        }
      ],
      order: [['Id_Menu', 'DESC']]
    });
  }

  async getById(id) {
    const Menu = await MenusModel.findByPk(id, {
      include: [
        {
          model: PlatosModel,
          as: "plato"
        }
      ]
    });

    if (!Menu) throw new Error("Menu no encontrado");
    return Menu;
  }

  async create(data) {
    return await MenusModel.create(data);
  }

  async update(id, data) {
    const result = await MenusModel.update(data, { where: { Id_Menu: id } });
    const updated = result[0];

    if (updated === 0) {
      const Menu = await MenusModel.findByPk(id);
      if (!Menu) throw new Error("Menu no encontrado");
      throw new Error("No hubo cambios en el menu");
    }

    return true;
  }

  async delete(id) {
    const deleted = await MenusModel.destroy({ where: { Id_Menu: id } });
    if (!deleted) throw new Error("Menu no encontrado");
    return true;
  }

  // 🔥 EXTRA PRO (te sirve mucho)
  async getByFecha(fecha) {
    return await MenusModel.findAll({
      where: { Fec_Menu: fecha },
      include: [
        {
          model: PlatosModel,
          as: "plato"
        }
      ]
    });
  }

}

export default new MenusService();