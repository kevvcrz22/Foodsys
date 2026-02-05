import ReservasServices from "../Services/ReservasServices.js";
import QRCode from "qrcode";

export const getAllReservas = async (req, res) => {
    try{
        const Reservas = await ReservasServices.getAll();
        res.status(200).json(Reservas)
    }catch(error){
        res.status(500).json({message: error.message})
    }
}

export const getReservas = async(req, res)=>{
    try{
        const Reservas = await ReservasServices.getById(req.params.id)
        res.status(200).json(Reservas)
    }catch(error){
        res.status(404).json({message: error.message})
    }
}

export const createReservas = async (req, res) =>{
    try{

        // Crear reserva
        const reserva = await ReservasServices.create(req.body);

        // 🔥 Crear texto QR con TODOS los datos
        const textoQR = `
Reserva: ${reserva.Id_Reserva}
Fecha Reserva: ${reserva.Fec_Reserva}
Vencimiento: ${reserva.Vencimiento}
Estado: ${reserva.Est_Reserva}
Tipo: ${reserva.Tipo}
Usuario: ${reserva.Id_Usuario}
        `;

        // Generar imagen QR
        const qrImagen = await QRCode.toDataURL(textoQR);

        // Guardar texto QR en BD
        await ReservasServices.update(reserva.Id_Reserva, {
            Tex_Qr: textoQR
        });

        res.status(201).json({
            message:"Reserva Creada",
            reserva,
            qr: qrImagen
        });

    }catch(error){
        res.status(400).json({message:error.message})
    }
}


export const updateReservas = async(req, res) => {
    try{
        await ReservasServices.update(parseInt(req.params.id), req.body)
        res.status(200).json({message:"Reserva Actualizada Correctamente"})
    }catch(error){
        res.status(400).json({message: error.message})
    }
}

export const deleteReservas = async(req, res)=>{
    try{
        await ReservasServices.delete(req.params.id)
        res.status(204).send()
    }catch(error){
        res.status(400).json({message: error.message})
    }
}
