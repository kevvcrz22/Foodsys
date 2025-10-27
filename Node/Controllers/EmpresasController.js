import EmpresasServices from "../Services/EmpresasServices.js";
export const getAllEmpresas = async (req, res) => {
    try{
        const Empresas = await EmpresasServices.getAll();
        res.status(200).json(Empresas)
    }catch(error){
        res.status(500).json({message: error.message})
    }
}
export const getEmpresas = async(req, res)=>{
    try{
        const Empresas = await EmpresasServices.getById(req.params.id)
        res.status(200).json(Empresas)
    }catch(error){
        res.status(404).json({message: error.message})
    }
}
export const createEmpresas = async (req, res) =>{
    try{
        const Empresas = await EmpresasServices.create(req.body)
        res.status(201).json({message:"Empresa Creada", Empresas})
    }catch(error){
        res.status(400).json({message:error.message})
    }
}
export const updateEmpresas = async(req, res) => {
    try{
        await EmpresasServices.update(parseInt(req.params.id), req.body)
        res.status(200).json({message:"Empresa Actualizada Correctamente"})
    }catch(error){
        res.status(400).json({message: error.message})
    }
}
export const deleteEmpresas = async(req, res)=>{
    try{
        await EmpresasServices.delete(req.params.id)
        res.status(204).send()
    }catch(error){
        res.status(400).json({message: error.message})
    }
}