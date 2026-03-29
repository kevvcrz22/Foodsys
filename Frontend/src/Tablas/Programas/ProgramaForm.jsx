import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig.js";

const ProgramaForm = ({ hideModal, programa, actualizarLista }) => {

    const [Id_Programa, setId_Programa] = useState("");
    const [Nom_Programa, setNom_Programa] = useState("");
    const [Area, setArea] = useState("");
    const [Niv_For_Programa, setNiv_For_Programa] = useState("");

    const [textFormButton, setTextFormButton] = useState("Enviar");

    useEffect(() => {
        if (programa) {
            setId_Programa(programa.Id_Programa);
            setNom_Programa(programa.Nom_Programa);
            setArea(programa.Area);
            setNiv_For_Programa(programa.Niv_For_Programa);
            setTextFormButton("Actualizar");
        } else {
            setId_Programa("");
            setNom_Programa("");
            setArea("");
            setNiv_For_Programa("");
            setTextFormButton("Enviar");
        }
    }, [programa]);

   
    const gestionarForm = async (e) => {
        e.preventDefault();

        try {
          
            if (textFormButton === "Enviar") {

                await apiAxios.post('/api/Programa/', {
                    Nom_Programa,
                    Niv_For_Programa,
                    Area
                });

                alert("Programa creado correctamente");

            }

            else if (textFormButton === "Actualizar") {

                await apiAxios.put(`/api/Programa/${Id_Programa}`, {
                    Nom_Programa,
                    Niv_For_Programa,
                    Area
                });

                alert("Programa actualizado correctamente");
            }

            actualizarLista();
            hideModal();

        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <>
            <form onSubmit={gestionarForm} className="space-y-4">

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre
                    </label>
                    <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={Nom_Programa}
                        onChange={(e) => setNom_Programa(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nivel Formación
                    </label>
                    <select
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={Niv_For_Programa}
                        onChange={(e) => setNiv_For_Programa(e.target.value)}
                    >
                        <option value="">Selecciona uno...</option>
                        <option value="Tecnologo">Tecnólogo</option>
                        <option value="Tecnico">Técnico</option>
                        <option value="Operario">Operario</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Área
                    </label>
                    <select
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={Area}
                        onChange={(e) => setArea(e.target.value)}
                    >
                        <option value="">Selecciona uno...</option>
                        <option value="Agricola">Agrícola</option>
                        <option value="Agroindustria">Agroindustria</option>
                        <option value="Ambiental">Ambiental</option>
                        <option value="Gestion">Gestión</option>
                        <option value="Mecanizacion">Mecanización</option>
                        <option value="Pecuario">Pecuario</option>
                    </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={hideModal}
                        className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                    >
                        {textFormButton}
                    </button>
                </div>

            </form>
        </>
    );
};

export default ProgramaForm;