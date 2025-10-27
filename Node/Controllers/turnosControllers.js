import turnosModel from "../models/turnosModel.js";
import turnosService from "../services/turnosService.js";

export const getAllturnos = async (req, res) => {
    try{
        const turnos = await turnosService.getAll()
        res.status(200).json(turnos)
    }catch (error){
        res.status(500).json({message: error.message})
    }
}

export const getturnos = async (req, res) => {
    try{

        const turnos = await turnosService.getById(req.params.id)
        res.status(200).json(turnos)

    }catch(error){
        res.status(404).json({message: error.message})
    }
}

export const createturnos = async (req, res) =>{
    try{
        const turnos = await turnosService.create(req.body)
        res.status(201).json({message:"Turno registrado", turnos})
    
    }catch(error){
        res.status(400).json({message:error.message})
    }
}

export const updateturnos = async (req,res) => {
    try{
        await turnosService.update(req.params.id, req.body)
        res.status(200).json({message: "Turno actualizado correctamente"})

    }catch(error){
        res.status(400).json({message: error.message})
    }
}

export const deleteturnos = async(req, res) =>{
    try{
        await turnosService.delete(req.params.id)
        res.status(204).send()
    }catch(error){
        res.status(400).json({message: error.message})
    }
}