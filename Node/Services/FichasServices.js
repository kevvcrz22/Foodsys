import FichasModel from "../Models/FichasModel.js";
import ProgramaModel from "../Models/ProgramaModel.js";

class FichasServices {
  // Obtiene todas las fichas incluyendo el nombre del programa relacionado
  async getAll() {
    return await FichasModel.findAll({
      include: [
        {
          model: ProgramaModel,
          as: 'programas',                    // El alias debe coincidir con la asociacion definida
          attributes: ['Id_Programa', 'Nom_Programa'] // Solo traemos estos campos del programa
        }
      ]
    });
  }

  // Busca una ficha por su ID principal
  async getById(Id) {
    const Fichas = await FichasModel.findByPk(Id, {
      include: [
        {
          model: ProgramaModel,
          as: 'programas',
          attributes: ['Id_Programa', 'Nom_Programa']
        }
      ]
    });

    if (!Fichas) throw new Error("Ficha no encontrada");
    return Fichas;
  }

  // Inserta una nueva ficha con los datos proporcionados
  async create(data) {
    return await FichasModel.create(data);
  }

  // Actualiza una ficha existente; si no hay cambios lanza un error controlado
  async update(Id, data) {
    // El metodo update devuelve un arreglo donde el primer elemento es el numero de filas afectadas
    const result = await FichasModel.update(data, { where: { Id_Ficha: Id } });
    if (result[0] === 0) {
      // Verifica si la ficha realmente existe para dar un mensaje claro
      const Fichas = await FichasModel.findByPk(Id);
      if (!Fichas) throw new Error("Ficha no encontrada");
      throw new Error("No hubo cambios en la ficha (los datos son iguales)");
    }
    return true;
  }

  // Elimina una ficha por su ID
  async delete(Id) {
    const deleted = await FichasModel.destroy({ where: { Id_Ficha: Id } });
    if (!deleted) throw new Error("Ficha no encontrada");
    return true;
  }
}

export default new FichasServices();