import apiNode from "../../api/axiosConfig";
import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import ProgramaForm from "./ProgramaForm.jsx";

const CrudPrograma = () => {
  const [Programa, setPrograma] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [ProgramaSeleccionado, setProgramaSeleccionado] = useState(null);

  const columnsTable = [
    { name: "N°", selector: (row) => row.Id_Programa },
    { name: "Nombre Programa", selector: (row) => row.Nom_Programa },
    { name: "Área", selector: (row) => row.Area },
    { name: "Nivel Programa", selector: (row) => row.Niv_For_Programa },
    {
      name: "Acciones",
      cell: (row) => (
        <button
          className="btn btn-sm bg-info"
          data-bs-toggle="modal"
          data-bs-target="#modalPrograma"
          onClick={() => setProgramaSeleccionado(row)}   
        >
          <i className="fa-solid fa-pencil"></i>
        </button>
      ),
    },
  ];

  useEffect(() => {
    getAllPrograma();
  }, []);

  const getAllPrograma = async () => {
    const response = await apiNode.get("/api/Programa/");
    setPrograma(response.data);
    console.log(response.data);
  };

  const newListPrograma = Programa.filter((p) =>
    p.Nom_Programa.toLowerCase().includes(filterText.toLowerCase())
  );

  const hideModal = () => {
  const modal = bootstrap.Modal.getInstance(document.getElementById("modalPrograma"));
  modal.hide();
};


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
              className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalPrograma" onClick={() => setProgramaSeleccionado(null)}  
            >
              Nuevo
            </button>
          </div>
        </div>

        <DataTable
          title="Programa"
          columns={columnsTable}
          data={newListPrograma}
          pagination
          highlightOnHover
          striped
        />
      </div>

      {/* MODAL */}
      <div
        className="modal fade"
        id="modalPrograma"
        tabIndex="-1"
        aria-labelledby="modalProgramaLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              {/* Título dinámico */}
              <h1 className="modal-title fs-5" id="modalProgramaLabel">
                {ProgramaSeleccionado ? "Editar Programa" : "Registrar Programa"}
              </h1>

              <button
                type="button"
                className="btn-close"
                 data-bs-dismiss="modal"
                aria-label="Close"
                id="closeModal"
              ></button>
            </div>

            <div className="modal-body">
              <ProgramaForm 
                hideModal={hideModal}  programa={ProgramaSeleccionado}  actualizarLista={getAllPrograma}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CrudPrograma;
