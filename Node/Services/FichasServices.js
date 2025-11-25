import FichasModel from "../Models/FichasModel.js";
import ProgramaModel from "../Models/ProgramaModel.js";
class FichasServices {
    async getAll() {
     
return await FichasModel.findAll({
  include: [
    { model: ProgramaModel, as: 'Programa', attributes: ['Id_Programa', 'Nom_Programa'] }
  ]
})


    }
    async getById(id) {
        const Fichas = await FichasModel.findByPk(id)
        if(!Fichas) throw new Error("Ficha no encontrada")
        return Fichas
    }
    async create(data){
        return await FichasModel.create(data)
    }
    async update(id, data) {
        const result = await FichasModel.update(data, { where: { id_Ficha: id } });

        if (result[0] === 0) {
            const Fichas = await FichasModel.findByPk(id);
            if (!Fichas) throw new Error("Ficha no encontrada");
            throw new Error("No hubo cambios en la ficha (los datos son iguales)");
            }

  return true;
}

    async delete(id){
        const deleted = await FichasModel.destroy({where:{id_Ficha: id}})
        if (!deleted) throw new Error("Ficha no encontrada")
        return true
    }
}
export default new FichasServices