import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig.js";
import DataTable from "react-data-table-component";
import ReservasForm from "./ReservaForm.jsx";
import { QRCodeCanvas } from "qrcode.react";

const CrudReservas = () => {
    const [reservas, setReservas] = useState([]);
    const [filterText, setFilterText] = useState("");
    const [selectedReserva, setSelectedReserva] = useState(null);
    const [Editar, setEditar] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // NUEVOS ESTADOS PARA MODAL QR
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrTexto, setQrTexto] = useState("");

    // Mostrar QR desde tabla o desde form
    const verQr = (row) => {
        setQrTexto(row.Tex_Qr);
        setQrModalOpen(true);
    };

    // Mostrar QR cuando el form lo envíe
    const mostrarQR = (textoQR) => {
        setQrTexto(textoQR);
        setQrModalOpen(true);
    };

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
                <div className="flex gap-2">

                    <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-2"
                        onClick={() => editReserva(row)}
                    >
                        <i className="bi bi-pencil-square"></i> Editar
                    </button>

                    <button
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-2"
                        onClick={() => verQr(row)}
                    >
                        <i className="bi bi-qr-code"></i> Ver QR
                    </button>

                </div>
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

    return (
        <>
            <div className="container mx-auto px-4 py-6">

                <div className="flex justify-between mb-6 gap-4">
                    <input
                        type="text"
                        placeholder="Buscar reserva..."
                        className="w-full md:w-1/3 px-4 py-2 border rounded-lg"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />

                    <button
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg flex gap-2"
                        onClick={handleNuevo}
                    >
                        Nueva Reserva
                    </button>
                </div>

                <DataTable
                    title="Reservas"
                    columns={columnsTable}
                    data={newListReservas}
                    pagination
                    highlightOnHover
                    striped
                />

                {/* MODAL FORM */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[9999] flex justify-center items-center">

                        <div
                            className="fixed inset-0 bg-black/30"
                            onClick={hideModal}
                        />

                        <div className="bg-white p-6 rounded-xl shadow-xl z-10 w-full max-w-lg">

                            <ReservasForm
                                hideModal={hideModal}
                                reserva={selectedReserva}
                                Edit={Editar}
                                reload={getAllReservas}
                                mostrarQR={mostrarQR}
                            />

                        </div>
                    </div>
                )}

                {/* 🔥 MODAL QR */}
                {qrModalOpen && (
                    <div className="fixed inset-0 z-[9999] flex justify-center items-center">

                        <div
                            className="fixed inset-0 bg-black/40"
                            onClick={() => setQrModalOpen(false)}
                        />

                        <div className="bg-white p-6 rounded-xl shadow-xl z-10 text-center">

                            <h2 className="text-lg font-bold mb-4">
                                Código QR Reserva
                            </h2>

                            <QRCodeCanvas value={qrTexto} size={220} />

                            <button
                                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                                onClick={() => setQrModalOpen(false)}
                            >
                                Cerrar
                            </button>

                        </div>
                    </div>
                )}

            </div>
        </>
    );
};

export default CrudReservas;
