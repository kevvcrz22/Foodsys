import apiAxios from "../../api/axiosConfig";
import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import PlatosForm from "./PlatosForm";
import { Pencil, Plus, X, ZoomIn, Search, UtensilsCrossed, Image } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isMobile;
};

const tipoBadge = {
  Desayuno: "bg-amber-50 text-amber-700 border-amber-200",
  Almuerzo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cena:     "bg-indigo-50 text-indigo-700 border-indigo-200",
};

/* ── Card móvil ── */
const PlatoCard = ({ plato, onEdit, onZoom }) => {
  const imgSrc = plato.Img_Plato ? `${API_URL}/uploads/${plato.Img_Plato}` : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden active:scale-[0.99] transition-transform">
      {/* Imagen */}
      <div
        className="relative h-44 bg-slate-100 cursor-pointer group"
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
          <div className="flex flex-col items-center justify-center h-full text-slate-300">
            <Image className="w-10 h-10 mb-1" />
            <p className="text-xs">Sin imagen</p>
          </div>
        )}

        {/* Badge tipo */}
        <div className="absolute top-2 left-2">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${tipoBadge[plato.Tip_Plato] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
            {plato.Tip_Plato}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 truncate">{plato.Nom_Plato}</p>
            {plato.Des_Plato && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{plato.Des_Plato}</p>
            )}
          </div>
          <button
            onClick={() => onEdit(plato)}
            className="shrink-0 flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
          >
            <Pencil size={12} />
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
    { name: "ID", selector: (r) => r.Id_Plato, sortable: true, width: "65px" },
    {
      name: "Imagen",
      width: "80px",
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
              className="w-12 h-12 object-cover rounded-lg border border-slate-200 group-hover:opacity-70 transition-opacity"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-4 h-4 text-white drop-shadow" />
            </div>
          </div>
        ) : (
          <span className="text-slate-300 text-xs flex items-center gap-1">
            <Image className="w-3.5 h-3.5" /> Sin imagen
          </span>
        ),
    },
    { name: "Nombre", selector: (r) => r.Nom_Plato, sortable: true, minWidth: "160px", cell: (r) => <span className="font-semibold text-[13px] text-slate-800 whitespace-nowrap">{r.Nom_Plato}</span> },
    { name: "Descripción", selector: (r) => r.Des_Plato, grow: 2, minWidth: "220px", cell: (r) => <span className="text-[12px] text-slate-600 truncate block max-w-[280px]" title={r.Des_Plato}>{r.Des_Plato || "—"}</span> },
    {
      name: "Tipo",
      selector: (r) => r.Tip_Plato,
      sortable: true,
      minWidth: "120px",
      cell: (r) => (
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${tipoBadge[r.Tip_Plato] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
          {r.Tip_Plato}
        </span>
      ),
    },
    {
      name: "Acciones",
      minWidth: "110px",
      cell: (row) => (
        <button
          className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          onClick={() => editPlato(row)}
        >
          <Pencil size={12} /> Editar
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
      toast.error("Error al cargar la lista de platos");
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
    table:      { style: { minWidth: "750px" } },
    headRow:    { style: { background: "#f8fafc", fontSize: 12, fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" } },
    headCells:  { style: { whiteSpace: "nowrap" } },
    cells:      { style: { whiteSpace: "nowrap" } },
    rows:       { style: { fontSize: 13, borderBottom: "1px solid #f3f4f6", "&:hover": { background: "#fefce8" } } },
    pagination: { style: { borderTop: "1px solid #e5e7eb", fontSize: 13 } },
  };

  return (
    <>
      <div className="w-full h-full flex flex-col bg-slate-50 min-h-0">

        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-5 py-4 shrink-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                <UtensilsCrossed size={18} className="text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-slate-800 text-base m-0">Platos</h1>
                <p className="text-xs text-slate-400 m-0">{platos.length} platos registrados</p>
              </div>
            </div>
            <button
              onClick={() => { setSelectedPlato(null); setIsEdit(false); setIsModalOpen(true); }}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white border-0 rounded-xl px-4 py-2 text-[13px] font-semibold cursor-pointer transition-colors shadow-sm"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Nuevo Plato</span>
            </button>
          </div>

          {/* Buscador */}
          <div className="mt-3 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, tipo o descripción..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50 text-slate-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 transition-all"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto">
          {isMobile ? (
            <div className="p-3 grid grid-cols-1 gap-3">
              {newList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <UtensilsCrossed size={40} className="mb-2 opacity-30" />
                  <p className="text-sm">No hay platos para mostrar</p>
                </div>
              ) : (
                newList.map((p) => (
                  <PlatoCard key={p.Id_Plato} plato={p} onEdit={editPlato} onZoom={setZoomImg} />
                ))
              )}
            </div>
          ) : (
            <div className="p-4 sm:p-5">
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <DataTable
                  columns={columnsTable}
                  data={newList}
                  keyField="Id_Plato"
                  pagination
                  highlightOnHover
                  responsive
                  customStyles={customStyles}
                  noDataComponent={
                    <div className="flex flex-col items-center py-12 text-slate-400">
                      <UtensilsCrossed size={32} className="opacity-30 mb-2" />
                      <p className="text-[13px]">No hay platos para mostrar</p>
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