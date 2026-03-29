import ReservasMenuModel from "../Models/ReservasMenuModels.js";
import MenusModels from "../Models/MenusModels.js";

class ReservasMenuService {

  async getAll() {
    return await ReservasMenuModel.findAll({
      include: [
        {
          model: MenusModels,
          as: "menus"
        }
      ],
      order: [['Id_ReservaMenu', 'DESC']]
    });
  }

  async getById(id) {
    const ReservaMenu = await ReservasMenuModel.findByPk(id, {
      include: [
        {
          model: MenusModels,
          as: "menus"
        }
      ]
    });

    if (!ReservaMenu) throw new Error("ReservaMenu no encontrado");
    return ReservaMenu;
  }

  async create(data) {
    return await ReservasMenuModel.create(data);
  }

  async update(id, data) {
    const result = await ReservasMenuModel.update(data, { where: { Id_ReservaMenu: id } });
    const updated = result[0];

    if (updated === 0) {
      const ReservaMenu = await ReservasMenuModel.findByPk(id);
      if (!ReservaMenu) throw new Error("ReservaMenu no encontrado");
      throw new Error("No hubo cambios en la reservaMenu");
    }

    return true;
  }

  async delete(id) {
    const deleted = await ReservasMenuModel.destroy({ where: { Id_ReservaMenu: id } });
    if (!deleted) throw new Error("ReservaMenu no encontrado");
    return true;
  }

}

export default new ReservasMenuService();