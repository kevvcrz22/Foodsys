import CentroService from "../Services/CentroService.js";

// Obtener todos los responsables
export const getAllCentros = async (req, res) => {
    try {

        const centros = await CentroService.getAll()
        res.status(200).json(centros)

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Obtener un centro por ID
export const getCentro = async (req, res) => {
    try {
        const centro = await CentroService.getById(req.params.id)
        res.status(200).json(centro)

    } catch (error) {
        res.status(404).json({ message: error.message })
    }
}

// Crear un nuevo centro
export const createCentro = async (req, res) => {
    try {

        const newCentro = await CentroService.create(req.body)
        res.status(201).json({message: 'centro creado', newCentro})
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}
// Actualizar un centro existente
export const updatecentro = async (req, res) => {
    try {
        await CentroService.update(req.params.id, req.body)
        res.status(200).json({ message: 'centro actualizado' })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// Eliminar un centro
export const deleteCentro = async (req, res) => {
    try {
        await CentroService.delete(req.params.id)
        res.status(204).send()
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}