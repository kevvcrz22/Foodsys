import AreaService from "../services/AreaService.js";

// Obtener todos los responsables
export const getAllArea = async (req, res) => {
    try {

        const areas = await AreaService.getAll()
        res.status(200).json(areas)

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Obtener un Area por ID
export const getArea = async (req, res) => {
    try {
        const area = await AreaService.getById(req.params.id)
        res.status(200).json(area)

    } catch (error) {
        res.status(404).json({ message: error.message })
    }
}

// Crear un nueva area
export const createArea = async (req, res) => {
    try {

        const newArea = await AreaService.create(req.body)
        res.status(201).json({message: 'area creada', newArea})
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}
// Actualizar un area existente
export const updateArea = async (req, res) => {
    try {
        await AreaService.update(req.params.id, req.body)
        res.status(200).json({ message: 'Area actualizada' })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// Eliminar un area
export const deleteArea = async (req, res) => {
    try {
        await AreaService.delete(req.params.id)
        res.status(204).send()
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}