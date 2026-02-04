import { useState, useEffect } from "react";
import apiAxios from "../api/axiosConfig.js";

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
            setArea(programa.Area );
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
            <form onSubmit={gestionarForm} className="col-12 col-md-6">

                <div className="mb-3">
                    <label className="form-label">Nombre</label>
                    <input
                        type="text"
                        className="form-control"
                        value={Nom_Programa}
                        onChange={(e) => setNom_Programa(e.target.value)}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Nivel Formación</label>
                    <select
                        className="form-control"
                        value={Niv_For_Programa}
                        onChange={(e) => setNiv_For_Programa(e.target.value)}
                    >
                        <option value="">Selecciona uno...</option>
                        <option value="Tecnologo">Tecnólogo</option>
                        <option value="Tecnico">Técnico</option>
                        <option value="Operario">Operario</option>
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">Área</label>
                    <select
                        type="text"
                        className="form-control"
                        value={Area}
                        onChange={(e) => setArea(e.target.value)}
                    >

                    <option value="Agricola">Agricola</option>
                    <option value="Agroindustria">Agroindustria</option>
                    <option value="Ambiental">Ambiental</option>
                    <option value="Gestion">Gestion</option>
                    <option value="Mecanizacion">Mecanizacion</option>
                    <option value="Pecuario">Pecuario</option>
                    </select>
                    
                    
                </div>

                <div className="mb-3">
                    <input
                        type="submit"
                        className="btn btn-primary w-50"
                        value={textFormButton}
                    />
                </div>
            </form>
        </>
    );
};

export default ProgramaForm;
