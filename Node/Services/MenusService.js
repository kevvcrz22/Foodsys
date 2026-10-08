import { Op } from "sequelize";
import MenuModel from "../Models/MenusModels.js";
import PlatoModel from "../Models/PlatosModels.js";
import ReservaModel from "../Models/ReservasModel.js";

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
    const { Fec_Menu, Tip_Menu } = data;
    if (!Fec_Menu || !Tip_Menu) {
      throw new Error("Fecha y tipo de comida son obligatorios");
    }

    const fechaHoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

    // No permitir crear menús para fechas pasadas
    if (Fec_Menu < fechaHoy) {
      throw new Error("No se pueden crear menús para fechas pasadas");
    }

    // No permitir crear Almuerzo para el mismo día
    if (Tip_Menu === 'Almuerzo' && Fec_Menu <= fechaHoy) {
      throw new Error("No se permite programar ni crear menú de Almuerzo para el mismo día");
    }

    // Obtener los platos a registrar (soporta objeto individual o array)
    const platosArray = Array.isArray(data.platos)
      ? data.platos
      : Array.isArray(data.platosSeleccionados)
      ? data.platosSeleccionados
      : data.Id_Plato
      ? [data.Id_Plato]
      : [];

    if (platosArray.length === 0) {
      throw new Error("Debes seleccionar los platos para el menú");
    }

    // Validar que no se superen los 2 platos por tipo de comida por día
    const countExistentes = await MenuModel.count({
      where: { Fec_Menu, Tip_Menu }
    });

    if (countExistentes + platosArray.length > 2) {
      throw new Error(
        `El menú de ${Tip_Menu} para la fecha ${Fec_Menu} solo permite un máximo de 2 platos (actualmente tiene ${countExistentes}).`
      );
    }

    const creados = [];
    for (const Id_Plato of platosArray) {
      const platoRepetido = await MenuModel.findOne({
        where: { Fec_Menu, Tip_Menu, Id_Plato }
      });
      if (platoRepetido) {
        throw new Error(`El plato ID #${Id_Plato} ya está asignado al menú de ${Tip_Menu} en esta fecha.`);
      }
      const nuevo = await MenuModel.create({ Fec_Menu, Tip_Menu, Id_Plato });
      creados.push(nuevo);
    }

    return creados.length === 1 ? creados[0] : creados;
  }

  async update(id, data) {
    const menu = await MenuModel.findByPk(id);
    if (!menu) throw new Error("Menú no encontrado");

    const Fec_Menu = data.Fec_Menu || menu.Fec_Menu;
    const Tip_Menu = data.Tip_Menu || menu.Tip_Menu;
    const Id_Plato = data.Id_Plato || menu.Id_Plato;

    const fechaHoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

    if (data.Fec_Menu && data.Fec_Menu < fechaHoy) {
      throw new Error("No se pueden programar menús para fechas pasadas");
    }

    if (Tip_Menu === 'Almuerzo' && Fec_Menu <= fechaHoy) {
      throw new Error("No se permite programar menú de Almuerzo para el mismo día");
    }

    // Verificar si el plato está duplicado en el mismo menú del día
    const platoRepetido = await MenuModel.findOne({
      where: {
        Fec_Menu,
        Tip_Menu,
        Id_Plato,
        Id_Menu: { [Op.ne]: id }
      }
    });

    if (platoRepetido) {
      throw new Error(`Este plato ya forma parte del menú de ${Tip_Menu} para la fecha ${Fec_Menu}.`);
    }

    const [updated] = await MenuModel.update(data, { where: { Id_Menu: id } });
    if (updated === 0) {
      throw new Error("No hubo cambios en el menú");
    }
    return true;
  }

  async delete(id) {
    const menu = await MenuModel.findByPk(id);
    if (!menu) throw new Error("Menú no encontrado");

    // Verificar si alguien ya hizo una reserva/solicitud activa para este menú
    const reservasCount = await ReservaModel.count({
      where: {
        Fec_Reserva: menu.Fec_Menu,
        Tip_Reserva: menu.Tip_Menu,
        Id_Plato: menu.Id_Plato,
        Est_Reserva: { [Op.notIn]: ['Cancelado'] }
      }
    });

    if (reservasCount > 0) {
      throw new Error("No se puede eliminar este menú porque ya tiene solicitudes o reservas registradas.");
    }

    const deleted = await MenuModel.destroy({ where: { Id_Menu: id } });
    if (!deleted) throw new Error("Menú no encontrado");
    return true;
  }

  async getByFecha(Fecha) {
    return await MenuModel.findAll({
      where: { Fec_Menu: Fecha },
      include: [{ model: PlatoModel, as: "plato" }],
    });
  }

  // Retorna los platos del menu filtrados por fecha y tipo de comida.
  // Lo usa el formulario de nueva reserva para mostrar solo lo disponible ese dia.
  async getByFechaYTipo(Fecha, Tipo) {
    const Tipos_Validos = ["Desayuno", "Almuerzo", "Cena"];
    if (!Tipos_Validos.includes(Tipo)) {
      throw new Error("Tipo de menu no valido");
    }
    return await MenuModel.findAll({
      where: { Fec_Menu: Fecha, Tip_Menu: Tipo },
      include: [{ model: PlatoModel, as: "plato" }],
    });
  }
}

export default new MenusService();