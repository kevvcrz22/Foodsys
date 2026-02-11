import apiNode from "../../api/axiosConfig";
import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import ProgramaForm from "./ProgramaForm.jsx";

const CrudPrograma = () => {
  const [Programa, setPrograma] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [ProgramaSeleccionado, setProgramaSeleccionado] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columnsTable = [
    { name: "N°", selector: (row) => row.Id_Programa, sortable: true },
    { name: "Nombre Programa", selector: (row) => row.Nom_Programa, sortable: true },
    { name: "Área", selector: (row) => row.Area, sortable: true },
    { name: "Nivel Programa", selector: (row) => row.Niv_For_Programa, sortable: true },
    {
      name: "Acciones",
      cell: (row) => (
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-2"
          onClick={() => editPrograma(row)}
        >
          <i className="bi bi-pencil-square"></i> Editar
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

  const editPrograma = (row) => {
    setProgramaSeleccionado(row);
    setIsModalOpen(true);
  };

  const newListPrograma = Programa.filter((p) =>
    p.Nom_Programa.toLowerCase().includes(filterText.toLowerCase())
  );

  const hideModal = () => {
    setIsModalOpen(false);
    setProgramaSeleccionado(null);
  };

  const handleNuevo = () => {
    setProgramaSeleccionado(null);
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
              placeholder="Buscar programa..."
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
            <i className="bi bi-plus-circle"></i> Nuevo Programa
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <DataTable
            title="Programas"
            columns={columnsTable}
            data={newListPrograma}
            keyField="Id_Programa"
            pagination
            highlightOnHover
            striped
            customStyles={customStyles}
            noDataComponent={
              <div className="text-gray-500 py-8">
                No hay programas para mostrar
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
                  <i className={`bi ${ProgramaSeleccionado ? 'bi-pencil-square' : 'bi-plus-circle'}`}></i>
                  {ProgramaSeleccionado ? "Editar Programa" : "Registrar Programa"}
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
                <ProgramaForm 
                  hideModal={hideModal}
                  programa={ProgramaSeleccionado}
                  actualizarLista={getAllPrograma}
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

export default CrudPrograma;