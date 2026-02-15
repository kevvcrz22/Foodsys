import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig.js";
import DataTable from "react-data-table-component";
import ReservasForm from "./ReservaForm.jsx";

const CrudReservas = () => {
    const [reservas, setReservas] = useState([]);
    const [filterText, setFilterText] = useState("");
    const [selectedReserva, setSelectedReserva] = useState(null);
    const [Editar, setEditar] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const columnsTable = [
        { name: "Id_Reserva", selector: row => row.Id_Reserva, sortable: true },
        { name: "Fec_Reserva", selector: row => row.Fec_Reserva, sortable: true },
        { name: "Vencimiento", selector: row => new Date(row.Vencimiento).toLocaleString(), sortable: true },
        { name: "Est_Reserva", selector: row => row.Est_Reserva, sortable: true },
        { name: "Tipo", selector: row => row.Tipo, sortable: true },
        { name: "Tex_Qr", selector: row => row.Tex_Qr },
        { name: "Id_Usuario", selector: row => row.Id_Usuario, sortable: true },
        {
            name: "Acciones",
            cell: row => (
                <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-2"
                    onClick={() => editReserva(row)}
                >
                    <i className="bi bi-pencil-square"></i> Editar
                </button>
            )
        }
    ];

    useEffect(() => {
        getAllReservas();
    }, []);

    const getAllReservas = async () => {
        try {
            const response = await apiAxios.get("/api/Reservas");
            setReservas(response.data);
            console.log(response.data);
        } catch (error) {
            console.error("Error al cargar reservas:", error);
        }
    };

    const editReserva = (row) => {
        setSelectedReserva(row);
        setEditar(true);
        setIsModalOpen(true);
    };

    const newListReservas = reservas.filter(reserva => {
        const text = filterText.toLowerCase();
        return (
            reserva.Tipo?.toLowerCase().includes(text) ||
            reserva.Fec_Reserva?.toLowerCase().includes(text) ||
            reserva.Vencimiento?.toLowerCase().includes(text) ||
            reserva.Est_Reserva?.toLowerCase().includes(text)
        );
    });

    const hideModal = () => {
        setIsModalOpen(false);
        setSelectedReserva(null);
    };

    const handleNuevo = () => {
        setSelectedReserva(null);
        setEditar(false);
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

    return (
        <>
            <div className="container mx-auto px-4 py-6">
                <div className="flex justify-between items-center mb-6 gap-4">
                    <div className="w-full md:w-1/3">
                        <input
                            type="text"
                            placeholder="Buscar reserva..."
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
                        <i className="bi bi-plus-circle"></i> Nueva Reserva
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <DataTable
                        title="Reservas"
                        columns={columnsTable}
                        data={newListReservas}
                        keyField="Id_Reserva"
                        pagination
                        highlightOnHover
                        striped
                        customStyles={customStyles}
                        noDataComponent={
                            <div className="text-gray-500 py-8">
                                No hay reservas para mostrar
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
                                    <i className={`bi ${selectedReserva ? 'bi-pencil-square' : 'bi-plus-circle'}`}></i>
                                    {selectedReserva ? "Editar Reserva" : "Agregar Reserva"}
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
                                <ReservasForm
                                    hideModal={hideModal}
                                    reserva={selectedReserva}
                                    Edit={Editar}
                                    reload={getAllReservas}
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
    );
};

export default CrudReservas;