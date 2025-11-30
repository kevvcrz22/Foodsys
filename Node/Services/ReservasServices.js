import ReservasModel from "../Models/ReservasModel.js";
class ReservasServices {
    async getAll() {
        return await ReservasModel.findAll()

    }
    async getById(id) {
        const Reservas = await ReservasModel.findByPk(id)
        if(!Reservas) throw new Error("Reserva no encontrada")
        return Reservas
    }
    async create(data){
        return await ReservasModel.create(data)
    }
    async update(id, data) {
        const result = await ReservasModel.update(data, { where: { Id_Reserva: id } });

        if (result[0] === 0) {
            const Reservas = await ReservasModel.findByPk(id);
            if (!Reservas) throw new Error("Reserva no encontrada");
            throw new Error("No hubo cambios en la reserva (los datos son iguales)");
            }

  return true;
}

    async delete(id){
        const deleted = await ReservasModel.destroy({where:{Id_Reservad_Reserva: id}})
        if (!deleted) throw new Error("Reservas no encontrada")
        return true
    }
}
export default new ReservasServices