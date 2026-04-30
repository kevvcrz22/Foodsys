import ReservasModel from "../Models/ReservasModel.js";
import { Op } from "sequelize";
import UsuariosModel from "../Models/UsuariosModel.js";

class ReservasServices {

    async reporteDetalleAprendiz(idUsuario) {

  const reservas = await ReservasModel.findAll({
    where: {
      Id_Usuario: idUsuario,
      Est_Reserva: { [Op.ne]: "Cancelada" }
    },
    order: [["Fec_Reserva", "DESC"]]
  });

  const resultado = {};

  reservas.forEach(r => {
    if (!resultado[r.Fec_Reserva]) {
      resultado[r.Fec_Reserva] = {
        fecha: r.Fec_Reserva,
        desayuno: false,
        almuerzo: false,
        cena: false
      };
    }

    if (r.Tipo === "Desayuno") resultado[r.Fec_Reserva].desayuno = true;
    if (r.Tipo === "Almuerzo") resultado[r.Fec_Reserva].almuerzo = true;
    if (r.Tipo === "Cena") resultado[r.Fec_Reserva].cena = true;
  });

  return Object.values(resultado);
}

 
    async getAll() {
        return await ReservasModel.findAll({
            order: [
                ['Id_Reserva', 'DESC']
            ],
            include: [{
            model: UsuariosModel,
            as: 'usuario',
            attributes: ['Nom_Usuario', 'Ape_Usuario']
        }]
        })

        

    }
        async checkDisponibilidad(usuario, fecha, tipo) {
        const reserva = await ReservasModel.findOne({
            where: {
                Id_Usuario: usuario,
                Fec_Reserva: fecha,
                Tipo: tipo,
                Est_Reserva: { [Op.ne]: "Cancelada" }
            }
        });
        return reserva === null;
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
        const deleted = await ReservasModel.destroy({ where: { Id_Reserva: id } })
        if (!deleted) throw new Error("Reservas no encontrada")
        await ReservasModel.update(
            { Est_Reserva: "Cancelada" },
            { where: { Id_Reserva: id } }
        );

            return true
    }
    // 🔢 Cuenta total de reservas canceladas (para el contador en tiempo real)
    async countCanceladas() {
        return await ReservasModel.count({
            where: { Est_Reserva: "Cancelada" }
        });
    }


    async crearExcepcional(data) {
    const ahora = new Date();
    const hora = ahora.getHours();
    const diaSemana = ahora.getDay();

    // Si es antes de las 18:00 → hoy, si no → mañana
    const fechaReserva = new Date();
    if (hora >= 18) {
        fechaReserva.setDate(fechaReserva.getDate() + 1);
    }

    const dia = fechaReserva.getDate();
    const mes = fechaReserva.getMonth();
    const anio = fechaReserva.getFullYear();
    const fechaStr = `${anio}-${String(mes + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
    const diaDeLaReserva = fechaReserva.getDay();
    const esSabado = diaDeLaReserva === 6;
    const esDomingo = diaDeLaReserva === 0;

    // Validar duplicado
    const reservaExistente = await ReservasModel.findOne({
        where: {
            Id_Usuario: data.Id_Usuario,
            Tipo: data.Tipo,
            Fec_Reserva: fechaStr,
            Est_Reserva: { [Op.ne]: 'Cancelada' }
        }
    });

    if (reservaExistente) {
        throw new Error(`Este aprendiz ya tiene una reserva de ${data.Tipo} para ese día`);
    }

    // Vencimiento con hora Colombia directamente
    let horaVenc, minVenc;
    if (data.Tipo === 'Desayuno') {
        horaVenc = esDomingo ? 9 : esSabado ? 8 : 7;
        minVenc = 0;
    } else if (data.Tipo === 'Almuerzo') {
        horaVenc = 13;
        minVenc = 30;
    } else {
        horaVenc = (esSabado || esDomingo) ? 18 : 19;
        minVenc = (esSabado || esDomingo) ? 30 : 0;
    }

    // +5 para compensar UTC-5 de Colombia
const vencimiento = new Date(Date.UTC(anio, mes, dia, horaVenc + 5, minVenc, 0));

    const reserva = await ReservasModel.create({
        ...data,
        Est_Reserva: 'Generada',
        Res_Excepcional: 'Si',
        Fec_Reserva: fechaStr,
        Vencimiento: vencimiento
    });

    const { Id_Reserva } = reserva;
    reserva.Tex_Qr = JSON.stringify({
        Id_Reserva,
        Id_Usuario: data.Id_Usuario,
        Tipo: data.Tipo,
        Excepcional: true
    });
    return await reserva.save();
}

}

export default new ReservasServices