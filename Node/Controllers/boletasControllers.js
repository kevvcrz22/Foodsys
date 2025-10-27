import boletasModel from "../models/boletasModel.js";
import boletasService from "../services/boletasService.js";

export const getAllboletas = async (req, res) => {
    try{
        const boletas = await boletasService.getAll()
        res.status(200).json(boletas)
    }catch (error){
        res.status(500).json({message: error.message})
    }
}

export const getboletas = async (req, res) => {
    try{

        const boletas = await boletasService.getById(req.params.id)
        res.status(200).json(boletas)

    }catch(error){
        res.status(404).json({message: error.message})
    }
}

export const createboletas = async (req, res) =>{
    try{
        const boletas = await boletasService.create(req.body)
        res.status(201).json({message:"Boleta creada", boletas})
    
    }catch(error){
        res.status(400).json({message:error.message})
    }
}

export const updateboletas = async (req,res) => {
    try{
        await boletasService.update(req.params.id, req.body)
        res.status(200).json({message: "Boleta actualizada correctamente"})

    }catch(error){
        res.status(400).json({message: error.message})
    }
}

export const deleteboletas = async(req, res) =>{
    try{
        await boletasService.delete(req.params.id)
        res.status(204).send()
    }catch(error){
        res.status(400).json({message: error.message})
    }
}