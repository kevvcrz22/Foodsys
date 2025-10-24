import AprendizModel from "../Models/AprendizModel.js";
class AprendizService {
    async getAll() {
        return await AprendizModel.findAll()
    }
    async getById_Aprendiz(Id_Aprendiz){
        const Aprendiz = await AprendizModel.findByPk(Id_Aprendiz)
        if (!Aprendiz) throw new Error("Aprendiz No Encontrado")
        return Aprendiz
    }
    async create(data) {
        return await AprendizModel.create(data)
    }
    async update(Id_Aprendiz, data){
        const result = await AprendizModel.update(data, { where: {Id_Aprendiz}})
        const updated = result[0]
        if(updated === 0) throw new Error("Aprendiz Noencontrado o Sin Cambios")
        return true
    }
    async delete(Id_Aprendiz){
        const deleted = await AprendizModel.destroy({where:{Id_Aprendiz}})
        if(!deleted) throw new Error("Aprendiz No encontrado")
        return true
    }
}
export default new AprendizService