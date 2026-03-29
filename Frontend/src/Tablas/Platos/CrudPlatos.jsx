import apiAxios from "../../api/axiosConfig";
import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import PlatosForm from "./PlatosForm";
import { Pencil, Plus, X, ZoomIn } from "lucide-react";

const API_URL = "http://localhost:8000";

const CrudPlatos = () => {

  const [platos, setPlatos] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [selectedPlato, setSelectedPlato] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* ── Estado zoom imagen ── */
  const [zoomImg, setZoomImg] = useState(null); // { src, alt }

  const columnsTable = [
    { name: "ID", selector: r => r.Id_Plato, sortable: true, width: "70px" },

    {
      name: "Imagen De Referencia",
      width: "120px",
      cell: row => (
        row.Img_Plato ? (
          <div className="relative group cursor-pointer" onClick={() => setZoomImg({ src: `${API_URL}/uploads/${row.Img_Plato}`, alt: row.Nom_Plato })}>
            <img
              src={`${API_URL}/uploads/${row.Img_Plato}`}
              alt={row.Nom_Plato}
              className="w-16 h-16 object-cover rounded-lg border transition-opacity duration-200 group-hover:opacity-70"
            />
            {/* Icono zoom sobre la imagen */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-black/50 rounded-full p-1.5">
                <ZoomIn className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        ) : (
          <span className="text-gray-400 text-xs">Sin imagen</span>
        )
      )
    },

    { name: "Nombre",      selector: r => r.Nom_Plato, sortable: true },
    { name: "Descripción", selector: r => r.Des_Plato },
    { name: "Tipo",        selector: r => r.Tip_Plato, sortable: true },

    {
      name: "Acciones",
      cell: row => (
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
          onClick={() => editPlato(row)}
        >
          <Pencil size={14}/> Editar
        </button>
      )
    }
  ];

  useEffect(() => {
    getAllPlatos();
  }, []);

  const getAllPlatos = async () => {
    try {
      const res = await apiAxios.get("/api/platos");
      setPlatos(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const editPlato = (row) => {
    setSelectedPlato(row);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const newList = platos.filter(p => {
    const t = filterText.toLowerCase();
    return (
      p.Nom_Plato?.toLowerCase().includes(t) ||
      p.Tip_Plato?.toLowerCase().includes(t)
    );
  });

  const hideModal = () => {
    setIsModalOpen(false);
    setSelectedPlato(null);
    setIsEdit(false);
  };

  return (
    <div className="container mx-auto px-4 py-6">

      {/* Buscador + botón */}
      <div className="flex justify-between mb-4 gap-4">
        <input
          type="text"
          placeholder="Buscar plato..."
          className="w-full md:w-1/3 px-4 py-2 border rounded-lg"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />

        <button
          onClick={() => {
            setSelectedPlato(null);
            setIsEdit(false);
            setIsModalOpen(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={16}/> Nuevo
        </button>
      </div>

      {/* Tabla */}
      <DataTable
        title="Platos"
        columns={columnsTable}
        data={newList}
        pagination
        highlightOnHover
        striped
      />

      {/* Modal editar / nuevo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-center items-center">
          <div className="fixed inset-0 bg-black/30" onClick={hideModal}/>
          <div className="bg-white p-6 rounded-xl shadow-xl z-10 w-full max-w-lg">
            <PlatosForm
              hideModal={hideModal}
              selectedPlato={selectedPlato}
              isEdit={isEdit}
              reload={getAllPlatos}
            />
          </div>
        </div>
      )}

      {/* ── MODAL ZOOM IMAGEN ── */}
      {zoomImg && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={() => setZoomImg(null)}
        >
          {/* Fondo oscuro */}
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />

          {/* Contenedor imagen */}
          <div
            className="relative z-10 max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <p className="font-semibold text-gray-800 text-sm truncate pr-4">
                {zoomImg.alt}
              </p>
              <button
                onClick={() => setZoomImg(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl p-2 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Imagen */}
            <div className="bg-gray-50 flex items-center justify-center p-4 max-h-[70vh]">
              <img
                src={zoomImg.src}
                alt={zoomImg.alt}
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 text-right">
              <button
                onClick={() => setZoomImg(null)}
                className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrudPlatos;