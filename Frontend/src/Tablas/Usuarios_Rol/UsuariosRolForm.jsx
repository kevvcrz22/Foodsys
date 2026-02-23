import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig.js";

const UsuariosRolForm = ({ hideModal, data, Edit, reload }) => {

    const [Id_UsuarioRol, setId_UsuarioRol] = useState("");
    const [Id_Usuario, setId_Usuario] = useState("");
    const [Id_Rol, setId_Rol] = useState("");
    const [Fec_Ingreso, setFec_Ingreso] = useState("");

    const [textFormButton, setTextFormButton] = useState("Guardar");

    useEffect(() => {
        if (data) {
            setId_UsuarioRol(data.Id_UsuarioRol);
            setId_Usuario(data.Id_Usuario);
            setId_Rol(data.Id_Rol);
            setFec_Ingreso(data.Fec_Ingreso?.split("T")[0]); // formatea fecha
            setTextFormButton("Actualizar");
        } else {
            setId_UsuarioRol("");
            setId_Usuario("");
            setId_Rol("");
            setFec_Ingreso("");
            setTextFormButton("Guardar");
        }
    }, [data]);

    const gestionarForm = async (e) => {
        e.preventDefault();

        try {

            if (!Edit) {
                await apiAxios.post("/api/UsuariosRol", {
                    Id_Usuario,
                    Id_Rol,
                    Fec_Ingreso
                });

                alert("Registro creado correctamente");
            } 
            
            else {
                await apiAxios.put(`/api/UsuariosRol/${Id_UsuarioRol}`, {
                    Id_Usuario,
                    Id_Rol,
                    Fec_Ingreso
                });

                alert("Registro actualizado correctamente");
            }

            reload();
            hideModal();

        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <form onSubmit={gestionarForm} className="space-y-4">

            <h2 className="text-lg font-bold text-gray-700">
                {Edit ? "Editar Usuario - Rol" : "Nuevo Usuario - Rol"}
            </h2>

            <div>
                <label className="block text-sm font-medium mb-2">
                    Id Usuario
                </label>
                <input
                    type="number"
                    className="w-full px-4 py-2 border rounded-lg"
                    value={Id_Usuario}
                    onChange={(e) => setId_Usuario(e.target.value)}
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    Id Rol
                </label>
                <input
                    type="number"
                    className="w-full px-4 py-2 border rounded-lg"
                    value={Id_Rol}
                    onChange={(e) => setId_Rol(e.target.value)}
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    Fecha Ingreso
                </label>
                <input
                    type="date"
                    className="w-full px-4 py-2 border rounded-lg"
                    value={Fec_Ingreso}
                    onChange={(e) => setFec_Ingreso(e.target.value)}
                    required
                />
            </div>

            <div className="flex gap-3 pt-4 border-t">
                <button
                    type="button"
                    onClick={hideModal}
                    className="flex-1 px-4 py-2 bg-gray-200 rounded-lg"
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg"
                >
                    {textFormButton}
                </button>
            </div>

        </form>
    );
};

export default UsuariosRolForm;
