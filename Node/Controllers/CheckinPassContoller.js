import ChekinPassesServices from "../Services/ChekinPassesServices.js";

export const generarDesayunoTomorrow = async (req, res) => {

    try {
        // Aqui ya  no se reciben los datos por req.body porque seria inseguro
        //se recibe id_ususario que  viene directamente desde el authMidlleware(req.user.id)
        //Recuerda que en el token vienen algunos datos que se agregaron en la seccion PAYLOAD del token 

        const Id_Usuario = req.user.id; // 🔥 ESTA ES LA CLAVE

        const result = await ChekinPassesServices.generateDesayunopassForTomorrow(Id_Usuario);

        return res.status(201).json(result)

    } catch (err) {
         console.log("🔥 ERROR REAL:", err.message);
    console.log("🔥 STACK:", err.stack);

        return res.status(400).json({ message: err.message })
    }

}