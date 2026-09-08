// Frontend/src/Tablas/Programas/CrudPrograma.jsx
import apiNode from "../../api/axiosConfig";
import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import toast from "react-hot-toast";
import ProgramaForm from "./ProgramaForm.jsx";
import ImportarProgramas from "./ImportarProgramas.jsx";
import { BookOpen, Pencil, Plus, Search, X, Layers, Eye, Download } from "lucide-react";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

const nivelColor = (nivel) => {
  const map = {
    Tecnólogo: "bg-purple-100 text-purple-700",
    Técnico: "bg-blue-100 text-blue-700",
    Especialización: "bg-amber-100 text-amber-700",
  };
  return map[nivel] || "bg-gray-100 text-gray-600";
};

/* ── Modal Detalle ── */
const DetalleModal = ({ programa, onClose, onEdit }) => {
  if (!programa) return null;
  const rows = [
    { label: "ID", value: programa.Id_Programa },
    { label: "Nombre", value: programa.Nom_Programa },
    { label: "Area", value: programa.Are_Programa },
    { label: "Nivel de Formacion", value: programa.NivFor_Programa },
  ];
  return (
    <div className="fixed inset-0 z-9999 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-indigo-500">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-indigo-100 font-medium">Detalle</p>
              <p className="text-white font-bold text-sm truncate max-w-[180px]">{programa.Nom_Programa}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex justify-between items-start gap-3 py-2 border-b border-gray-50 last:border-0">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide min-w-[120px]">{label}</span>
              <span className="text-sm text-gray-800 font-medium text-right">{value || "—"}</span>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100">
          <button onClick={() => { onEdit(programa); onClose(); }}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
            <Pencil className="w-4 h-4" /> Editar Programa
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Tarjeta Movil ── */
const ProgramaCard = ({ programa, onEdit, onView }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 active:scale-[0.99] transition-transform">
    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
      <BookOpen className="w-5 h-5 text-indigo-600" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-bold text-gray-900 text-sm truncate">{programa.Nom_Programa}</p>
      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 truncate">
        <Layers className="w-3 h-3 flex-shrink-0" />
        {programa.Are_Programa || "Sin area"}
      </p>
      <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${nivelColor(programa.NivFor_Programa)}`}>
        {programa.NivFor_Programa || "Sin nivel"}
      </span>
    </div>
    <div className="flex flex-col gap-2 flex-shrink-0">
      <button onClick={() => onView(programa)}
        className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
        <Eye className="w-4 h-4 text-gray-500" />
      </button>
      <button onClick={() => onEdit(programa)}
        className="w-9 h-9 rounded-xl bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center transition-colors">
        <Pencil className="w-4 h-4 text-indigo-600" />
      </button>
    </div>
  </div>
);

/* ─────────────── MAIN ─────────────── */
const CrudPrograma = () => {
  const [Programa, setPrograma] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [ProgramaSeleccionado, setProgramaSeleccionado] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [progDetalle, setProgDetalle] = useState(null);
  const [importModal, setImportModal] = useState(false);
  const isMobile = useIsMobile();

  const columnsTable = [
    { name: "ID", selector: (r) => r.Id_Programa, sortable: true, width: "65px" },
    {
      name: "Nombre Programa",
      selector: (r) => r.Nom_Programa,
      sortable: true,
      grow: 2,
      minWidth: "220px",
      cell: (r) => (
        <div className="flex items-center gap-2.5 py-1.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-indigo-700" />
          </div>
          <span className="font-semibold text-slate-800 text-[13px] truncate">{r.Nom_Programa}</span>
        </div>
      ),
    },
    {
      name: "Área",
      selector: (r) => r.Are_Programa,
      sortable: true,
      minWidth: "140px",
      cell: (r) => <span className="text-[13px] text-slate-600 font-medium whitespace-nowrap">{r.Are_Programa || "—"}</span>,
    },
    {
      name: "Nivel Formación",
      selector: (r) => r.NivFor_Programa,
      sortable: true,
      minWidth: "150px",
      cell: (r) => (
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
          r.NivFor_Programa === "Tecnólogo" ? "bg-purple-50 text-purple-700 border-purple-200" :
          r.NivFor_Programa === "Técnico" ? "bg-blue-50 text-blue-700 border-blue-200" :
          "bg-amber-50 text-amber-700 border-amber-200"
        }`}>
          {r.NivFor_Programa || "—"}
        </span>
      ),
    },
    {
      name: "Acciones",
      minWidth: "120px",
      cell: (row) => (
        <button
          className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
          onClick={() => editPrograma(row)}
        >
          <Pencil size={12} /> Editar
        </button>
      ),
    },
  ];

  useEffect(() => { getAllPrograma(); }, []);

  const getAllPrograma = async () => {
    try {
      const response = await apiNode.get("/api/Programa/");
      setPrograma(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error al obtener programas:", error);
      toast.error("Error al cargar la lista de programas");
    }
  };

  const editPrograma = (row) => { setProgramaSeleccionado(row); setIsModalOpen(true); };
  const hideModal = () => { setIsModalOpen(false); setProgramaSeleccionado(null); };

  const newList = Programa.filter((p) =>
    (p.Nom_Programa || "").toLowerCase().includes(filterText.toLowerCase()) ||
    (p.Are_Programa || "").toLowerCase().includes(filterText.toLowerCase()) ||
    (p.NivFor_Programa || "").toLowerCase().includes(filterText.toLowerCase())
  );

  const customStyles = {
    table:      { style: { minWidth: "700px" } },
    headRow:    { style: { background: "#f8fafc", fontSize: 12, fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" } },
    headCells:  { style: { whiteSpace: "nowrap" } },
    cells:      { style: { whiteSpace: "nowrap" } },
    rows:       { style: { fontSize: 13, borderBottom: "1px solid #f3f4f6", "&:hover": { background: "#f5f3ff" } } },
    pagination: { style: { borderTop: "1px solid #e5e7eb", fontSize: 13 } },
  };

  return (
    <>
      <div className="w-full h-full flex flex-col bg-slate-50 min-h-0">

        {/* ── Header ── */}
        <div className="bg-white border-b border-slate-100 px-5 py-4 shrink-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                <BookOpen size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="font-semibold text-slate-800 text-base m-0">Programas</h1>
                <p className="text-xs text-slate-400 m-0">{Programa.length} registros</p>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setImportModal(true)}
                className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border-0 rounded-xl px-3.5 py-2 text-[13px] font-semibold cursor-pointer hover:bg-emerald-200 transition-colors">
                <Download size={14} />
                <span className="hidden sm:inline">Importar Excel</span>
              </button>

              <button onClick={() => { setProgramaSeleccionado(null); setIsModalOpen(true); }}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border-0 rounded-xl px-4 py-2 text-[13px] font-semibold cursor-pointer transition-colors shadow-sm">
                <Plus size={14} />
                <span className="hidden sm:inline">Nuevo Programa</span>
              </button>
            </div>
          </div>

          <div className="mt-3 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Buscar por programa o área..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50 text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition-all"
              value={filterText} onChange={(e) => setFilterText(e.target.value)} />
          </div>
        </div>

        {/* ── Contenido ── */}
        <div className="flex-1 overflow-y-auto">
          {isMobile ? (
            <div className="p-3 space-y-2">
              {newList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <BookOpen size={40} className="mb-2 opacity-30" />
                  <p className="text-sm">No hay programas para mostrar</p>
                </div>
              ) : (
                newList.map((p) => (
                  <ProgramaCard key={p.Id_Programa} programa={p}
                    onEdit={editPrograma}
                    onView={(prog) => { setProgDetalle(prog); setDetalleOpen(true); }} />
                ))
              )}
            </div>
          ) : (
            <div className="p-4 sm:p-5">
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <DataTable
                  columns={columnsTable}
                  data={newList}
                  keyField="Id_Programa"
                  pagination
                  highlightOnHover
                  responsive
                  customStyles={customStyles}
                  noDataComponent={
                    <div className="flex flex-col items-center py-12 text-slate-400">
                      <BookOpen size={32} className="mb-2 opacity-30" />
                      <p className="text-[13px]">No hay programas para mostrar</p>
                    </div>
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal detalle ── */}
      {detalleOpen && (
        <DetalleModal programa={progDetalle} onClose={() => setDetalleOpen(false)} onEdit={editPrograma} />
      )}

      {/* ── Modal importar Excel ── */}
      {importModal && (
        <ImportarProgramas onClose={() => setImportModal(false)} reload={getAllPrograma} />
      )}

      {/* ── Modal crear / editar ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={hideModal} />
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 flex-shrink-0">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                  {ProgramaSeleccionado ? <Pencil className="w-3.5 h-3.5 text-indigo-600" /> : <Plus className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                {ProgramaSeleccionado ? "Editar Programa" : "Nuevo Programa"}
              </h2>
              <button onClick={hideModal} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto flex-1">
              <ProgramaForm hideModal={hideModal} programa={ProgramaSeleccionado} actualizarLista={getAllPrograma} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CrudPrograma;