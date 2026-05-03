import apiAxios from "../../api/axiosConfig";
import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import PlatosForm from "./PlatosForm";
import { Pencil, Plus, X, ZoomIn, Search, UtensilsCrossed, Image } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isMobile;
};

const tipoBadge = {
  Desayuno: "bg-amber-100 text-amber-800 border-amber-300",
  Almuerzo: "bg-green-100 text-green-800 border-green-300",
  Cena:     "bg-indigo-100 text-indigo-800 border-indigo-300",
};

/* ── Card móvil ── */
const PlatoCard = ({ plato, onEdit, onZoom }) => {
  const imgSrc = plato.Img_Plato ? `${API_URL}/uploads/${plato.Img_Plato}` : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.99] transition-transform">
      {/* Imagen */}
      <div
        className="relative h-44 bg-gray-100 cursor-pointer group"
        onClick={() => imgSrc && onZoom({ src: imgSrc, alt: plato.Nom_Plato })}
      >
        {imgSrc ? (
          <>
            <img
              src={imgSrc}
              alt={plato.Nom_Plato}
              className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/50 rounded-full p-2">
                <ZoomIn className="w-5 h-5 text-white" />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-300">
            <Image className="w-10 h-10 mb-1" />
            <p className="text-xs">Sin imagen</p>
          </div>
        )}

        {/* Badge tipo */}
        <div className="absolute top-2 left-2">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${tipoBadge[plato.Tip_Plato] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
            {plato.Tip_Plato}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 truncate">{plato.Nom_Plato}</p>
            {plato.Des_Plato && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{plato.Des_Plato}</p>
            )}
          </div>
          <button
            onClick={() => onEdit(plato)}
            className="shrink-0 flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Componente principal ── */
const CrudPlatos = () => {
  const [platos,       setPlatos]       = useState([]);
  const [filterText,   setFilterText]   = useState("");
  const [selectedPlato, setSelectedPlato] = useState(null);
  const [isEdit,       setIsEdit]       = useState(false);
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [zoomImg,      setZoomImg]      = useState(null);
  const isMobile = useIsMobile();

  const columnsTable = [
    { name: "ID",    selector: (r) => r.Id_Plato, sortable: true, width: "70px" },
    {
      name: "Imagen",
      width: "100px",
      cell: (row) =>
        row.Img_Plato ? (
          <div
            className="relative group cursor-pointer py-1"
            onClick={() =>
              setZoomImg({ src: `${API_URL}/uploads/${row.Img_Plato}`, alt: row.Nom_Plato })
            }
          >
            <img
              src={`${API_URL}/uploads/${row.Img_Plato}`}
              alt={row.Nom_Plato}
              className="w-14 h-14 object-cover rounded-lg border group-hover:opacity-70 transition-opacity"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-4 h-4 text-white drop-shadow" />
            </div>
          </div>
        ) : (
          <span className="text-gray-300 text-xs flex items-center gap-1">
            <Image className="w-3.5 h-3.5" /> Sin imagen
          </span>
        ),
    },
    { name: "Nombre",      selector: (r) => r.Nom_Plato, sortable: true },
    { name: "Descripción", selector: (r) => r.Des_Plato,  grow: 2 },
    {
      name: "Tipo",
      selector: (r) => r.Tip_Plato,
      sortable: true,
      cell: (r) => (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${tipoBadge[r.Tip_Plato] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
          {r.Tip_Plato}
        </span>
      ),
    },
    {
      name: "Acciones",
      cell: (row) => (
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
          onClick={() => editPlato(row)}
        >
          <Pencil className="w-3 h-3" /> Editar
        </button>
      ),
    },
  ];

  useEffect(() => { getAllPlatos(); }, []);

  const getAllPlatos = async () => {
    try {
      const res = await apiAxios.get("/api/platos");
      setPlatos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const editPlato = (row) => {
    setSelectedPlato(row);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const hideModal = () => {
    setIsModalOpen(false);
    setSelectedPlato(null);
    setIsEdit(false);
  };

  const newList = platos.filter((p) => {
    const t = filterText.toLowerCase();
    return (
      p.Nom_Plato?.toLowerCase().includes(t) ||
      p.Tip_Plato?.toLowerCase().includes(t) ||
      p.Des_Plato?.toLowerCase().includes(t)
    );
  });

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: "#f8fafc",
        fontSize: "13px",
        fontWeight: "700",
        color: "#374151",
        borderBottom: "2px solid #e5e7eb",
      },
    },
    rows: {
      style: {
        fontSize: "13px",
        "&:hover": { backgroundColor: "#f0fdf4" },
        borderBottom: "1px solid #f3f4f6",
      },
    },
    pagination: { style: { borderTop: "1px solid #e5e7eb", fontSize: "13px" } },
  };

  return (
    <>
      <div className="w-full flex flex-col bg-gray-50 min-h-screen">

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                <UtensilsCrossed className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-base sm:text-lg leading-tight">Platos</h1>
                <p className="text-xs text-gray-400 hidden sm:block">{platos.length} platos</p>
              </div>
            </div>
            <button
              onClick={() => { setSelectedPlato(null); setIsEdit(false); setIsModalOpen(true); }}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 sm:px-5 rounded-xl text-sm font-semibold transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo Plato</span>
            </button>
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, tipo o descripción..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto">
          {isMobile ? (
            <div className="p-4 grid grid-cols-1 gap-4">
              {newList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                  <UtensilsCrossed className="w-10 h-10 mb-2" />
                  <p className="text-sm">No hay platos</p>
                </div>
              ) : (
                newList.map((p) => (
                  <PlatoCard key={p.Id_Plato} plato={p} onEdit={editPlato} onZoom={setZoomImg} />
                ))
              )}
            </div>
          ) : (
            <div className="p-4 lg:p-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <DataTable
                  columns={columnsTable}
                  data={newList}
                  pagination
                  highlightOnHover
                  striped
                  customStyles={customStyles}
                  noDataComponent={
                    <div className="flex flex-col items-center py-12 text-gray-300">
                      <UtensilsCrossed className="w-8 h-8 mb-2" />
                      <p className="text-sm">No hay platos</p>
                    </div>
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal crear/editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={hideModal} />
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 shrink-0">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  {isEdit ? <Pencil className="w-3.5 h-3.5 text-amber-600" /> : <Plus className="w-3.5 h-3.5 text-amber-600" />}
                </div>
                {isEdit ? "Editar Plato" : "Nuevo Plato"}
              </h2>
              <button onClick={hideModal} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto flex-1">
              <PlatosForm
                hideModal={hideModal}
                selectedPlato={selectedPlato}
                isEdit={isEdit}
                reload={getAllPlatos}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal zoom imagen */}
      {zoomImg && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={() => setZoomImg(null)}
        >
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <p className="font-semibold text-gray-800 text-sm truncate pr-4">{zoomImg.alt}</p>
              <button
                onClick={() => setZoomImg(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl p-2 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-gray-50 flex items-center justify-center p-4 max-h-[70vh]">
              <img
                src={zoomImg.src}
                alt={zoomImg.alt}
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            </div>
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
    </>
  );
};

export default CrudPlatos;