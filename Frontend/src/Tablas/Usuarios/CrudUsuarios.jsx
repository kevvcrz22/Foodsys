import apiAxios from "../../api/axiosConfig";
import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import UsuariosForm from "./UsuariosForm.jsx";

const CrudUsuarios = () => {

  const [Usuarios, setUsuarios] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [selectedUsuario, setselectedUsuario] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columnsTable = [
    { name: "ID", selector: row => row.Id_Usuario, sortable: true },
    { name: "Tipo de Documento", selector: row => row.TipDoc_Usuario, sortable: true },
    { name: "Documento", selector: row => row.NumDoc_Usuario, sortable: true },
    { name: "Nombres", selector: row => row.Nom_Usuario, sortable: true },
    { name: "Apellidos", selector: row => row.Ape_Usuario, sortable: true },
    { name: "Genero", selector: row => row.Gen_Usuario, sortable: true },
    { name: "Correo", selector: row => row.Cor_Usuario, sortable: true },
    { name: "Telefono", selector: row => row.Tel_Usuario, sortable: true },
    { name: "Centro Convivencia", selector: row => row.CenCon_Usuario, sortable: true },
    { name: "Tipo De Usuario", selector: row => row.Tip_Usuario, sortable: true },
    { name: "Estado De Usuario", selector: row => row.Est_Usuario, sortable: true },
    { name: "Contraseña", selector: row => row.Con_Usuario },
    { name: "Sancion", selector: row => row.Sancion, sortable: true },
    { name: "Ficha", selector: row => row.ficha?.Num_Ficha || "Sin ficha", sortable: true },
    { name: "Fecha de Creación", selector: row => new Date(row.CreateData).toLocaleDateString(), sortable: true },
    { name: "Fecha de Actualización", selector: row => new Date(row.UpdateData).toLocaleDateString(), sortable: true },
    {
      name: "Acciones",
      cell: row => (
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-2"
          onClick={() => editUsuario(row)}
        >
          <i className="bi bi-pencil-square"></i> Editar
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
    setIsModalOpen(true);
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
    setIsModalOpen(false);
    setselectedUsuario(null);
    setIsEdit(false);
  };

  const handleNuevo = () => {
    setselectedUsuario(null);
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

  return (
    <>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6 gap-4">
          <div className="w-full md:w-1/3">
            <input
              type="text"
              placeholder="Buscar usuario..."
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
            <i className="bi bi-plus-circle"></i> Nuevo Usuario
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <DataTable
            title="Usuarios"
            columns={columnsTable}
            data={newListUsuarios}
            keyField="Id_Usuario"
            pagination
            highlightOnHover
            striped
            customStyles={customStyles}
            noDataComponent={
              <div className="text-gray-500 py-8">
                No hay usuarios para mostrar
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 max-h-[95vh] overflow-hidden flex flex-col animate-fadeIn">
              {/* Header fijo */}
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-plus-circle'}`}></i>
                  {isEdit ? "Editar Usuario" : "Agregar Usuario"}
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
                <UsuariosForm
                  hideModal={hideModal}
                  UsuarioSeleccionado={selectedUsuario}
                  Editar={isEdit}
                  reload={getAllUsuarios}
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

export default CrudUsuarios;