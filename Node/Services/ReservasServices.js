import ReservasModel from "../Models/ReservasModel.js";
class ReservasServices {
    async getAll() {
        return await ReservasModel.findAll({
            order: [
                ['Id_Reserva', 'DESC']
            ]
        })

    }
    async getById(id) {
        const Reservas = await ReservasModel.findByPk(id)
        if (!Reservas) throw new Error("Reserva no encontrada")
        return Reservas
    }
    async create(data) {

        // const {Id_Reserva} = await ReservasModel.create(data)

        // const {Tex_Qr} = data

        // const newTex_Qr = `${Id_Reserva}_${Tex_Qr}`

        // const reserva = await ReservasModel.update(Id_Reserva, {Tex_Qr: newTex_Qr})

        const reserva = await ReservasModel.create(data)

        const { Id_Reserva } = reserva
        const { Tex_Qr } = data
        
        const newTex_Qr = JSON.parse(Tex_Qr)
        newTex_Qr.Id_Reserva = Id_Reserva

        // console.log(newTex_Qr)

        reserva.Tex_Qr = JSON.stringify(newTex_Qr)

        

        return await reserva.save()

        // return reserva

        //Al crear la reserva hay que obtener el id que se genera e incluirlo en el texto del QR
        //Después actualizar la reserva con el texto del QR generado

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

    async delete(id) {
        const deleted = await ReservasModel.destroy({ where: { Id_Reservad: id } })
        if (!deleted) throw new Error("Reservas no encontrada")
        return true
    }
}
export default new ReservasServices