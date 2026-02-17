import apiAxios from "../../api/axiosConfig";
import { useState, useEffect} from "react";
import DataTable from 'react-data-table-component'
import FichasForm from "./FichasForm";



const CrudFichas =() => {
    const [Fichas, setFichas]= useState([])  
    const [filterText, setFilterText]= useState("")
    const [selectedFicha, setSelectedFicha] = useState(null);
    const [isEdit, setIsEdit] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);



    const columnsTable = [ 
        {name: 'Id Ficha', selector: row => row.Id_Ficha, sortable: true},
        {name: 'Numero de Ficha', selector: row => row.Num_Ficha, sortable: true},
        {name: 'Inicio Etapa Lectiva', selector: row => row.FecIniLec_Ficha, sortable: true},
        {name: 'Fin Etapa Lectiva', selector: row => row.FecFinLec_Ficha, sortable: true},
        {name: 'Inicio Etapa Practica', selector: row => row.FecIniPra_Ficha, sortable: true},
        {name: 'Fin Etapa Practica', selector: row => row.FecFinPra_Ficha, sortable: true},
        {name: 'Programa', selector: row => row.programa?.Nom_Programa, sortable: true },
        {name: 'Fecha de Creacion', selector: row => new Date(row.createdAt).toLocaleDateString(), sortable: true},
        {name: 'Fecha de Actualizacion', selector: row => new Date(row.updatedAt).toLocaleDateString(), sortable: true},
        {
            name:'Acciones', 
            cell: row => (
                <button 
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-2"
                    onClick={() => editFicha(row)}
                >
                    <i className="bi bi-pencil-square"></i> Editar
                </button>
            )
        }
    ]

    useEffect(()=>{
        getAllFichas()
    },[])

    const getAllFichas = async () => {
        try {
            const response = await apiAxios.get('/api/Fichas/')
            console.log("Datos recibidos del backend:", response.data)
            setFichas(response.data)
        } catch (error) {
            console.error("Error al obtener las fichas:", error)
        }
    }

    const editFicha = (row) => {
        setSelectedFicha(row);
        setIsEdit(true);
        setIsModalOpen(true);
    };

    const newListFichas = Fichas.filter(Ficha => {
        const textToSearch = filterText.toLowerCase();

        const Num_Ficha = String(Ficha.Num_Ficha || "").toLowerCase();

        const Nom_Programa = String(
            Ficha.Programa?.Nom_Programa || Ficha.Programa?.Nom_programa || ""
        ).toLowerCase();

        return (
            Num_Ficha.includes(textToSearch) ||
            Nom_Programa.includes(textToSearch)
        );
    });

    const hideModal = () => {
        setIsModalOpen(false);
        setSelectedFicha(null);
        setIsEdit(false);
    };

    const handleNuevo = () => {
        setSelectedFicha(null);
        setIsEdit(false);
        setIsModalOpen(true);
    };

    const customStyles = {
        headRow: {
            style: {
                color: 'black',
                fontSize: '14px',
                fontWeight: 'bold',
                borderRadius: '8px 8px 0 0',
            },
        },
        rows: {
            style: {
                '&:hover': {
                    backgroundColor: '#f3f4f6',
                    cursor: 'pointer',
                },
                borderBottom: '1px solid #e5e7eb',
            },
        },
        pagination: {
            style: {
                borderTop: '1px solid #e5e7eb',
                fontSize: '14px',
            },
        },
    };

    return(
        <>
            <div className="container mx-auto px-4 py-6">
                <div className="flex justify-between items-center mb-6 gap-4">
                    <div className="w-full md:w-1/3">
                        <input
                            type="text"
                            placeholder="Buscar ficha..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                        />
                    </div>

                    <button
                        type="button"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2"
                        onClick={handleNuevo}
                    >
                        <i className="bi bi-plus-circle"></i> Nueva Ficha
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <DataTable
                        title="Fichas"
                        columns={columnsTable}
                        data={newListFichas}
                        keyField="Id_Ficha"
                        pagination
                        highlightOnHover
                        striped
                        customStyles={customStyles}
                        noDataComponent={
                            <div className="text-gray-500 py-8">
                                No hay fichas para mostrar
                            </div>
                        }
                    />
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        {/* 🔥 Fondo borroso en lugar de negro */}
                        <div 
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-all duration-300"
                            onClick={hideModal}
                        />
                        
                        {/* 🔥 Modal con mejor posicionamiento y scroll interno */}
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 max-h-[95vh] overflow-hidden flex flex-col animate-fadeIn">
                            {/* Header fijo */}
                            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 flex-shrink-0">
                                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                    <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-plus-circle'}`}></i>
                                    {isEdit ? "Editar Ficha" : "Agregar Ficha"}
                                </h2>
                                <button
                                    onClick={hideModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <i className="bi bi-x-lg text-xl"></i>
                                </button>
                            </div>

                            {/* Contenido con scroll */}
                            <div className="px-6 py-4 overflow-y-auto flex-1">
                                <FichasForm 
                                    hideModal={hideModal}
                                    selectedFicha={selectedFicha}
                                    isEdit={isEdit}
                                    reload={getAllFichas}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
            `}</style>
        </>
    )
}
export default CrudFichas