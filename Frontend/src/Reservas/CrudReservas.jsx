import { useState, useEffect } from "react";
import apiAxios from "../api/axiosConfig.js";
import DataTable from "react-data-table-component";
import ReservasForm from "./ReservaForm.jsx";

const CrudReservas = () => {

    const [reservas, setReservas] = useState([]);
    const [filterText, setFilterText] = useState("");
    const [selectedReserva, setSelectedReserva] = useState(null);
    const [Editar, setEditar] = useState(false)

    const columnsTable = [
        { name: "Id_Reserva", selector: row => row.Id_Reserva },
        { name: "Fec_Reserva", selector: row => row.Fec_Reserva },
        { name: "Vencimiento", selector: row => row.Vencimiento },
        { name: "Est_Reserva", selector: row => row.Est_Reserva },
        { name: "Tipo", selector: row => row.Tipo },
        { name: "Tex_Qr", selector: row => row.Tex_Qr },
        { name: "Id_Usuario", selector: row => row.Id_Usuario },

        {
            name: "Acciones",
            cell: row => (
                <button
                    className="btn btn-sm bg-info"
                    data-bs-toggle="modal"
                    data-bs-target="#exampleModal1"
                    onClick={() => editReserva(row)}
                >
                    <i className="fa-solid fa-pencil"></i>
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
    } catch (error) {
        console.error("Error al cargar reservas:", error);
    }
}


const editReserva = (row) => {
setSelectedReserva(row);
setEditar(true);
document.getElementById("openModalBtn").click();
};


const newListReservas = reservas.filter(reserva => {
    const text = filterText.toLowerCase();

    return (
        reserva.Tipo?.toLowerCase().includes(text) ||
        reserva.Fec_Reserva?.toLowerCase().includes(text)||
        reserva.Vencimiento?.toLowerCase().includes(text)||
        reserva.Est_Reserva?.toLowerCase().includes(text)
    );
});

const hideModal = () => {
    document.getElementById("closeModal").click();
    setSelectedReserva(null);
};

const handleNuevo = () => {
    setSelectedReserva(null);
    setEditar(false)
}

return (
    <>
        <div className="container mt-5">

       
            <div className="row d-flex justify-content-between mb-3">
                <div className="col-4">
                    <input
                        className="form-control"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                </div>

                <div className="col-2">
                    <button
                        type="button"
                        className="btn btn-primary"
                        data-bs-toggle="modal"
                        data-bs-target="#exampleModal1"
                        onClick={handleNuevo}
                        
                    >
                        Nuevo
                    </button>
                </div>
            </div>

            {}
            <div style={{ width: "100%", overflowX: "auto" }}>
                <DataTable
                    title="Reservas"
                    columns={columnsTable}
                    data={newListReservas}
                    keyField="Id_Reserva"
                    pagination
                    highlightOnHover
                    striped
                />
            </div>

            {}
            <div className="modal fade" id="exampleModal1" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">

                        <div className="modal-header">
                            <h1 className="modal-title fs-5">
                                {selectedReserva ? "Editar Reserva" : "Agregar Reserva"}
                            </h1>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" id="closeModal"></button>
                        </div>

                        <div className="modal-body">
                            <ReservasForm
                                hideModal={hideModal}
                                reserva={selectedReserva}
                                Edit= {Editar}
                                reload={getAllReservas}
                            />
                        </div>

                    </div>
                </div>
            </div>

        </div>
    </>
);
};

export default CrudReservas;
