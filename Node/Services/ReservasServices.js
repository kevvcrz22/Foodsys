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
            order: [['Id_Reserva', 'DESC']],
            include: [{
                model: UsuariosModel,
                as: 'usuario',
                attributes: ['Nom_Usuario', 'Ape_Usuario']
            }]
        });
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
        const reserva = await ReservasModel.findByPk(id);

        if (!reserva) throw new Error("Reserva no encontrada");

        return reserva;
    }

    /* ═══════════════════════════════
       CREAR RESERVA NORMAL
    ═══════════════════════════════ */

    async create(data) {

        const reserva = await ReservasModel.create(data);

        const { Id_Reserva, Id_Usuario, Tipo, Fec_Reserva } = reserva;

        const qrData = {
            Id_Reserva,
            Id_Usuario,
            Tipo,
            Fecha: Fec_Reserva
        };

        reserva.Tex_Qr = JSON.stringify(qrData);

        return await reserva.save();
    }

    /* ═══════════════════════════════
       ACTUALIZAR
    ═══════════════════════════════ */

    async update(id, data) {

        const result = await ReservasModel.update(
            data,
            { where: { Id_Reserva: id } }
        );

        if (result[0] === 0) {

            const reserva = await ReservasModel.findByPk(id);

            if (!reserva) throw new Error("Reserva no encontrada");

            throw new Error("No hubo cambios en la reserva");
        }

        return true;
    }

    /* ═══════════════════════════════
       CANCELAR RESERVA
    ═══════════════════════════════ */

    async delete(id) {

        const result = await ReservasModel.update(
            { Est_Reserva: "Cancelada" },
            { where: { Id_Reserva: id } }
        );

        if (!result[0]) throw new Error("Reserva no encontrada");

        return true;
    }

    /* ═══════════════════════════════
       CONTADOR DE CANCELADAS
    ═══════════════════════════════ */

    async countCanceladas() {

        return await ReservasModel.count({
            where: { Est_Reserva: "Cancelada" }
        });
    }

    /* ═══════════════════════════════
       RESERVA EXCEPCIONAL
    ═══════════════════════════════ */

    async crearExcepcional(data) {

        const ahora = new Date();
        const hora = ahora.getHours();

        const fechaReserva = new Date();

        if (hora >= 18) {
            fechaReserva.setDate(fechaReserva.getDate() + 1);
        }

        const dia = fechaReserva.getDate();
        const mes = fechaReserva.getMonth();
        const anio = fechaReserva.getFullYear();

        const fechaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

        const diaDeLaReserva = fechaReserva.getDay();

        const esSabado = diaDeLaReserva === 6;
        const esDomingo = diaDeLaReserva === 0;

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

        const vencimiento = new Date(Date.UTC(anio, mes, dia, horaVenc + 5, minVenc, 0));

        const reserva = await ReservasModel.create({
            ...data,
            Est_Reserva: 'Generada',
            Res_Excepcional: 'Si',
            Fec_Reserva: fechaStr,
            Vencimiento: vencimiento
        });

        const { Id_Reserva, Id_Usuario, Tipo } = reserva;

        reserva.Tex_Qr = JSON.stringify({
            Id_Reserva,
            Id_Usuario,
            Tipo,
            Excepcional: true
        });

        return await reserva.save();
    }
}

export default new ReservasServices();