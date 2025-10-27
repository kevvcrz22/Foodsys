import CiudadService from "../services/CiudadService.js";

// Obtener todos los responsables
export const getAllCiudades = async (req, res) => {
    try {

        const ciudad = await CiudadService.getAll()
        res.status(200).json(ciudad)

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Obtener una ciudad por ID
export const getCiudad = async (req, res) => {
    try {
        const ciudad = await CiudadService.getById(req.params.id)
        res.status(200).json(ciudad)

    } catch (error) {
        res.status(404).json({ message: error.message })
    }
}

// Crear una nueva ciudad
export const createCiudad = async (req, res) => {
    try {

        const newCiudad = await CiudadService.create(req.body)
        res.status(201).json({message: 'Ciudad creada', newCiudad})
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}
// Actualizar una ciudad existente
export const updateCiudad = async (req, res) => {
    try {
        await CiudadService.update(req.params.id, req.body)
        res.status(200).json({ message: 'Ciudad actualizada' })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// Eliminar una ciudad
export const deleteCiudad = async (req, res) => {
    try {
        await CiudadService.delete(req.params.id)
        res.status(204).send()
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}