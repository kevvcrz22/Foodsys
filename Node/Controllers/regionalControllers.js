import regionalService from "../Services/regionalService.js";

export const getAllregional = async (req, res) => {
    try{
        const regional = await regionalService.getAll()
        res.status(200).json(regional)
    }catch (error){
        res.status(500).json({message: error.message})
    }
}

export const regional = async (req, res) => {
    try{

        const regional = await regionalService.getById(req.params.id)
        res.status(200).json(regional)

    }catch(error){
        res.status(404).json({message: error.message})
    }
}

export const createregional = async (req, res) =>{
    try{
        const regional = await regionalService.create(req.body)
        res.status(201).json({message:"regional registrada", regional})
    
    }catch(error){
        res.status(400).json({message:error.message})
    }
}

export const updateregional = async (req,res) => {
    try{
        await regionalService.update(req.params.id, req.body)
        res.status(200).json({message: "Regioanl actualizada correctamente"})

    }catch(error){
        res.status(400).json({message: error.message})
    }
}

export const deleteregional = async(req, res) =>{
    try{
        await regionalService.delete(req.params.id)
        res.status(204).send()
    }catch(error){
        res.status(400).json({message: error.message})
    }
}