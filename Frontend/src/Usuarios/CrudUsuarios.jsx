import apiAxios from "../api/axiosConfig";
import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import UsuariosForm from "./UsuariosForm.jsx";
import { Modal } from "bootstrap";

const CrudUsuarios = () => {

  const [Usuarios, setUsuarios] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [selectedUsuario, setselectedUsuario] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const columnsTable = [
    { name: "ID", selector: row => row.Id_Usuario },
    { name: "Tipo de Documento", selector: row => row.TipDoc_Usuario },
    { name: "Documento", selector: row => row.NumDoc_Usuario },
    { name: "Nombres", selector: row => row.Nom_Usuario },
    { name: "Apellidos", selector: row => row.Ape_Usuario },
    { name: "Genero", selector: row => row.Gen_Usuario },
    { name: "Correo", selector: row => row.Cor_Usuario },
    { name: "Telefono", selector: row => row.Tel_Usuario },
    { name: "Centro Convivencia", selector: row => row.CenCon_Usuario },
    { name: "Tipo De Usuario", selector: row => row.Tip_Usuario },
    { name: "Estado De Usuario", selector: row => row.Est_Usuario },
    { name: "Contraseña", selector: row => row.Con_Usuario },
    { name: "Sancion", selector: row => row.Sancion},
    { name: "Ficha", selector: row => row.ficha?.Num_Ficha || "Sin ficha" },
    { name: "Fecha de Creación", selector: row => new Date(row.CreateData).toLocaleDateString() },
    { name: "Fecha de Actualización", selector: row => new Date(row.UpdateData).toLocaleDateString() },

    {
      name: "Acciones",
      selector: row => (
        <button
          className="btn btn-sm bg-info"
          onClick={() => editUsuario(row)}
        >
          <i className="fa-solid fa-pencil"></i>
        </button>
      )
    }
  ];

useEffect(() => {
  getAllUsuarios();
}, []);

const getAllUsuarios = async () => {
  try {
    const response = await apiAxios.get("/api/Usuarios/");
    setUsuarios(response.data);
  } catch (error) {
    console.error("Error al obtener Usuario:", error);
  }
};


const editUsuario = (row) => {
  setselectedUsuario(row);
  setIsEdit(true);
  const modal = new Modal(document.getElementById("exampleModal"));
  modal.show();
};


  const newListUsuarios = Usuarios.filter(a => {
    const textToSearch = filterText.toLowerCase();
    const NumDoc = String(a.NumDoc_Usuario || "").toLowerCase();
    const Nombre = String(a.Nom_Usuario || "").toLowerCase();
    const NumFicha = String(
        a.ficha?.Num_Ficha || a.ficha?.Num_Ficha || ""
    ).toLowerCase();

    return (
        NumDoc.includes(textToSearch) ||
        Nombre.includes(textToSearch) ||
        NumFicha.includes(textToSearch)
    );
  });

  const hideModal = () => {
    document.getElementById("closeModal").click();
  };

  return (
    <>
      <div className="container mt-5">

        <div className="row d-flex justify-content-between">
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
              data-bs-target="#exampleModal"
            >
              Nuevo
            </button>
          </div>
        </div>

        <DataTable
          title="Usuarios"
          columns={columnsTable}
          data={newListUsuarios}
          keyField="Id_Usuario"
          pagination
          highlightOnHover
          striped
        />

        {/* Modal */}
        <div
          className="modal fade"
          id="exampleModal"
          tabIndex="-1"
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">

              <div className="modal-header">
                <h1 className="modal-title fs-5" id="exampleModalLabel">
                  {isEdit ? "Editar Usuario" : "Agregar Usuario"}
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
                <UsuariosForm
                  hideModal={hideModal}
                  UsuarioSeleccionado={selectedUsuario}
                  Editar={isEdit}
                  reload={getAllUsuarios}
                />
              </div>

            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default CrudUsuarios