import AprendizService from "../Services/AprendizService.js";
export const getAllAprendiz = async (req, res) => {
    try{
        const Aprendiz = await AprendizService.getAll()
        res.status(200).json(Aprendiz)
    }catch(error){
        res.status(500).json({message: error.message})
    }
}
export const getAprendiz = async(req, res)=>{
    try{
        const Aprendiz = await AprendizService.getById_Aprendiz(req.params.Id)
        res.status(200).json(Aprendiz)
    }catch(error){
        res.status(404).json({message: error.message})
    }
}
export const createAprendiz = async (req, res) =>{
    try{
        const Aprendiz = await AprendizService.create(req.body)
        res.status(201).json({message:"Aprendiz Creado", Aprendiz})
    }catch(error){
        res.status(400).json({message: error.message})

    }
}
export const updateAprendiz = async(req, res) => {
    try{
        await AprendizService.update(req.params.Id, req.body)
        res.status(200).json({message:"Aprendiz Actualizado Correctamente"})
    }catch(error){
        res.status(400).json({message: error.message})
    }
}
export const deleteAprendiz = async(req, res)=>{
    try{
        await AprendizService.delete(req.params.Id)
        res.status(204).send()
    }catch(error){
        res.status(400).json({message: error.message})
    }
}