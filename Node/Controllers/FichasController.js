import FichasServices from "../Services/FichasServices.js";
export const getAllFichas = async (req, res) => {
    try{
        const Fichas = await FichasServices.getAll();
        res.status(200).json(Fichas)
    }catch(error){
        res.status(500).json({message: error.message})
    }
}
export const getFichas = async(req, res)=>{
    try{
        const Fichas = await FichasServices.getById(req.params.id)
        res.status(200).json(Fichas)
    }catch(error){
        res.status(404).json({message: error.message})
    }
}
export const createFichas = async (req, res) =>{
    try{
        const Fichas = await FichasServices.create(req.body)
        res.status(201).json({message:"Ficha Creada", Fichas})
    }catch(error){
        res.status(400).json({message:error.message})
    }
}
export const updateFichas = async(req, res) => {
    try{
        await FichasServices.update(parseInt(req.params.id), req.body)
        res.status(200).json({message:"Ficha Actualizada Correctamente"})
    }catch(error){
        res.status(400).json({message: error.message})
    }
}
export const deleteFichas = async(req, res)=>{
    try{
        await FichasServices.delete(req.params.id)
        res.status(204).send()
    }catch(error){
        res.status(400).json({message: error.message})
    }
}