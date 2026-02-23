import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig.js";
import DataTable from "react-data-table-component";
import UsuariosRolForm from "./UsuariosRolForm.jsx";

const CrudUsuariosRol = () => {

    const [usuariosRol, setUsuariosRol] = useState([]);
    const [filterText, setFilterText] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const [editar, setEditar] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const columnsTable = [
        { 
            name: "Id", 
            selector: row => row.Id_UsuarioRol, 
            sortable: true 
        },
        { 
            name: "Id_Usuario", 
            selector: row => row.Id_Usuario, 
            sortable: true 
        },
        { 
            name: "Id_Rol", 
            selector: row => row.Id_Rol, 
            sortable: true 
        },
        { 
            name: "Fecha Ingreso", 
            selector: row => new Date(row.Fec_Ingreso).toLocaleDateString(),
            sortable: true 
        },
        {
            name: "Acciones",
            cell: row => (
                <div className="flex gap-2">
                    <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        onClick={() => editItem(row)}
                    >
                        Editar
                    </button>
                </div>
            )
        }
    ];

    useEffect(() => {
        getAllUsuariosRol();
    }, []);

    const getAllUsuariosRol = async () => {
        try {
            const response = await apiAxios.get("/api/UsuariosRol");
            setUsuariosRol(response.data);
        } catch (error) {
            console.error("Error al cargar UsuariosRol:", error);
        }
    };

    const editItem = (row) => {
        setSelectedItem(row);
        setEditar(true);
        setIsModalOpen(true);
    };

    const newList = usuariosRol.filter(item => {
        const text = filterText.toLowerCase();
        return (
            item.Id_Usuario?.toString().includes(text) ||
            item.Id_Rol?.toString().includes(text)
        );
    });

    const hideModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    const handleNuevo = () => {
        setSelectedItem(null);
        setEditar(false);
        setIsModalOpen(true);
    };

    return (
        <div className="container mx-auto px-4 py-6">

            <div className="flex justify-between mb-6 gap-4">
                <input
                    type="text"
                    placeholder="Buscar..."
                    className="w-full md:w-1/3 px-4 py-2 border rounded-lg"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                />

                <button
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg"
                    onClick={handleNuevo}
                >
                    Nuevo Registro
                </button>
            </div>

            <DataTable
                title="Usuarios - Roles"
                columns={columnsTable}
                data={newList}
                pagination
                highlightOnHover
                striped
            />

            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex justify-center items-center">

                    <div
                        className="fixed inset-0 bg-black/30"
                        onClick={hideModal}
                    />

                    <div className="bg-white p-6 rounded-xl shadow-xl z-10 w-full max-w-lg">

                        <UsuariosRolForm
                            hideModal={hideModal}
                            data={selectedItem}
                            Edit={editar}
                            reload={getAllUsuariosRol}
                        />

                    </div>
                </div>
            )}

        </div>
    );
};

export default CrudUsuariosRol;
