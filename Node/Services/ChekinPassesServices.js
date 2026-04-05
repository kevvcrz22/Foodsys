import crypto from "crypto"
import db from '../Database/db.js'
import CheckinpassesModel from "../Models/CheckinPassesModel.js"
import UsuariosModel from "../Models/UsuariosModel.js"

/** 
 * Generar un pass para mañana, revoca cualquier pass activo previo del mismo player del mismo player para malañana (tipo training),
 * Crea uno nuevo y devuelve el code, expiresAt, qrUrl.
*/

class chekinPassesService {

    //Metodos internos, no se llaman desde el controlador,
    //son utilizados por otros metodos de la clase ChekinPassesServices
    generarDateTomorrow(){

    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(now.getDate() + 1) //Hasta aqui ya agrego un dia a ña fecha actual
    //pero Javascript guarda la fecha como un objeto completo
    //por ejemplo: Fri Feb 23 2026 16:42:12 GMT-0500
    //pero la base de datos no acepta  este formato
    //por eso hay que reformatear  a 2026-02-23
    //se logra con el siguiente codigo

    const yyyy = tomorrow.getFullYear()
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0") // ✅ CORREGIDO
    const dd = String(tomorrow.getDate()).padStart(2, "0")
    //padStard se asegura de que el texto tenga minimo 2 caracteres.
    //Si no los tinene , rellena por la izquierda con '0'
    // Entonces, para los meses que son de un solo digito  se le agrega el cero antes 3 -> 03 porque es el formato que se requiere
    return `${yyyy}-${mm}-${dd}`
    
    }
    
    generarDateExpires() {
        //vende mañana a las 10:59:59
        const now = new Date()
        const d = new Date(now)
        d.setDate(now.getDate() + 1)
        d.setHours(10,59, 59)//horas, minutos, segundos y milisegundos ✅ CORREGIDO
        return d
    }

    generarCode() {
        //metodo paraa generar el codigo unico que ira en la Url
        //De aqui despues se genera el qr

        //crypto es un modulo nativo de Node.js para generar vaores seguros
        return crypto.randomBytes(24).toString("hex")

    }
     //Ahora si los metodos que utilizara el cotrolador 
    async generateDesayunopassForTomorrow(Id_Usuario) {
    
        return await db.transaction(
            async (transaction) => {
                //1.consultar el user
                const usuario = await UsuariosModel.findOne({
                    where: { Id_Usuario: Id_Usuario }, // ✅ CORREGIDO
                    transaction
                })

                if (!usuario) { // ✅ CORREGIDO
                    throw new Error ("Usuario no encontrado")
                 }
                
                 const validDate = this.generarDateTomorrow()
                 const expiresAt = this.generarDateExpires()

                 //2. Renovar pass activo previo para mañana (tipo training)
                 //consultar con el modelo si existe
                 await CheckinpassesModel.update(
                    { status: 'revoked'},
                    {
                        where: {
                            Id_Usuario: usuario.Id_Usuario, // ✅ CORREGIDO
                            type: 'desayuno', // ✅ CORREGIDO (era training)
                            Valid_date: validDate,
                            Status: 'active'
                        },
                        transaction
                    }
                 )

                 //3. Crear un pass nuevo
                 const code = this.generarCode()
                 const pass =  await CheckinpassesModel.create({
                    Code_para_QR: code,
                    Id_Usuario: usuario.Id_Usuario, // ✅ CORREGIDO
                    Id_Ficha: usuario.Id_Ficha, 
                    //Asumiendo que tu player tiene id_ficha
                    type: "desayuno",
                    Valid_date: validDate,
                    Status:  "active",
                    expiresAt,
                    generatedbyuserId: Id_Usuario,
                    

                },
                
                   {
                        transaction
                    })

                const baseUrlFrontend = "http://localhost:5173"
                const qrUrl = `${baseUrlFrontend}/desayuno-chekin?code=${encodeURIComponent(pass.code_para_QR)}`
                //encodeURIComponent convierte carracteres especiales en un formato seguro para URLs
                //por ejemplo "hola mundo" no puede llegar con espacios a la url, esta funcion retornara "hola%20mundo" reemplazando el espcio
            
                return {
                    code_para_QR: pass.code_para_QR,
                    validDate: pass.valid_date,
                    expiresAt: pass.expiresAt,
                    qrUrl
                }
                

            }
        )
    }

}

export default new chekinPassesService() // ✅ CORREGIDO