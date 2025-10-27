import ResponsableService from "../services/ResponsableService.js";

// Obtener todos los responsables
export const getAllResponsables = async (req, res) => {
    try {

        const responsables = await ResponsableService.getAll()
        res.status(200).json(responsables)

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Obtener un responsable por ID
export const getResponsable = async (req, res) => {
    try {
        const responsable = await ResponsableService.getById(req.params.id)
        res.status(200).json(responsable)

    } catch (error) {
        res.status(404).json({ message: error.message })
    }
}

// Crear un nuevo responsable
export const createResponsable = async (req, res) => {
    try {

        const newResponsable = await ResponsableService.create(req.body)
        res.status(201).json({message: 'Responsable creado', newResponsable})
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}
// Actualizar un responsable existente
export const updateResponsable = async (req, res) => {
    try {
        await ResponsableService.update(req.params.id, req.body)
        res.status(200).json({ message: 'Responsable actualizado' })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// Eliminar un responsable
export const deleteResponsable = async (req, res) => {
    try {
        await ResponsableService.delete(req.params.id)
        res.status(204).send()
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}