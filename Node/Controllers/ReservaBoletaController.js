import ReservaBoletaService from "../services/ReservaBoletaService.js";

// Obtener todos los responsables
export const getAllReservaBoleta = async (req, res) => {
    try {

        const ReservaBoletas = await ReservaBoletaService.getAll()
        res.status(200).json(ReservaBoletas)

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Obtener un ReservaBoleta por ID
export const getReservaBoleta = async (req, res) => {
    try {
        const ReservaBoleta = await ReservaBoletaService.getById(req.params.id)
        res.status(200).json(ReservaBoleta)

    } catch (error) {
        res.status(404).json({ message: error.message })
    }
}

// Crear un nueva ReservaBoleta
export const createReservaBoleta = async (req, res) => {
    try {

        const newReservaBoleta = await ReservaBoletaService.create(req.body)
        res.status(201).json({message: 'ReservaBoleta creada', newReservaBoleta})
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}
// Actualizar un ReservaBoleta existente
export const updateReservaBoleta = async (req, res) => {
    try {
        await ReservaBoletaService.update(req.params.id, req.body)
        res.status(200).json({ message: 'ReservaBoleta actualizada' })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// Eliminar un ReservaBoleta
export const deleteReservaBoleta = async (req, res) => {
    try {
        await ReservaBoletaService.delete(req.params.id)
        res.status(204).send()
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}