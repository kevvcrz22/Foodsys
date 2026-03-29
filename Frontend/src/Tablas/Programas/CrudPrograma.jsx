import apiNode from "../../api/axiosConfig";
import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import ProgramaForm from "./ProgramaForm.jsx";
import { BookOpen, Eye, Pencil, Plus, Search, X, Layers, GraduationCap } from "lucide-react";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
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
    { label: "Área", value: programa.Area },
    { label: "Nivel de Formación", value: programa.Niv_For_Programa },
  ];
  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
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
          <button
            onClick={() => { onEdit(programa); onClose(); }}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            <Pencil className="w-4 h-4" /> Editar Programa
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Tarjeta Móvil ── */
const ProgramaCard = ({ programa, onEdit, onView }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 active:scale-[0.99] transition-transform">
    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
      <BookOpen className="w-5 h-5 text-indigo-600" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-bold text-gray-900 text-sm truncate">{programa.Nom_Programa}</p>
      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 truncate">
        <Layers className="w-3 h-3 flex-shrink-0" />
        {programa.Area || "Sin área"}
      </p>
      <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${nivelColor(programa.Niv_For_Programa)}`}>
        {programa.Niv_For_Programa || "Sin nivel"}
      </span>
    </div>
    <div className="flex flex-col gap-2 flex-shrink-0">
      <button
        onClick={() => onView(programa)}
        className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
      >
        <Eye className="w-4 h-4 text-gray-500" />
      </button>
      <button
        onClick={() => onEdit(programa)}
        className="w-9 h-9 rounded-xl bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center transition-colors"
      >
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
  const isMobile = useIsMobile();

  const columnsTable = [
    { name: "N°", selector: (r) => r.Id_Programa, sortable: true, width: "70px" },
    { name: "Nombre Programa", selector: (r) => r.Nom_Programa, sortable: true, grow: 2 },
    { name: "Área", selector: (r) => r.Area, sortable: true },
    {
      name: "Nivel",
      selector: (r) => r.Niv_For_Programa,
      sortable: true,
      cell: (r) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${nivelColor(r.Niv_For_Programa)}`}>
          {r.Niv_For_Programa}
        </span>
      ),
    },
    {
      name: "Acciones",
      cell: (row) => (
        <button
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
          onClick={() => editPrograma(row)}
        >
          <Pencil className="w-3 h-3" /> Editar
        </button>
      ),
    },
  ];

  useEffect(() => { getAllPrograma(); }, []);

  const getAllPrograma = async () => {
    try {
      const response = await apiNode.get("/api/Programas/");
      setPrograma(response.data);
    } catch (error) {
      console.error("Error al obtener programas:", error);
    }
  };

  const editPrograma = (row) => { setProgramaSeleccionado(row); setIsModalOpen(true); };
  const hideModal = () => { setIsModalOpen(false); setProgramaSeleccionado(null); };

  const newList = Programa.filter((p) =>
    p.Nom_Programa.toLowerCase().includes(filterText.toLowerCase())
  );

  const customStyles = {
    headRow: { style: { backgroundColor: "#f8fafc", fontSize: "13px", fontWeight: "700", color: "#374151", borderBottom: "2px solid #e5e7eb" } },
    rows: { style: { fontSize: "13px", "&:hover": { backgroundColor: "#eef2ff" }, borderBottom: "1px solid #f3f4f6" } },
    pagination: { style: { borderTop: "1px solid #e5e7eb", fontSize: "13px" } },
  };

  return (
    <>
      <div className="w-full h-full flex flex-col bg-gray-50 min-h-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6 lg:py-4 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-gray-900 text-base lg:text-lg leading-tight">Programas</h1>
                <p className="text-xs text-gray-400 hidden sm:block">{Programa.length} registros</p>
              </div>
            </div>
            <button
              onClick={() => { setProgramaSeleccionado(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 lg:px-5 lg:py-2.5 rounded-xl text-sm font-semibold transition-colors flex-shrink-0 shadow-sm shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo Programa</span>
            </button>
          </div>
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar programa..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isMobile ? (
            <div className="p-3 space-y-2">
              {newList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <BookOpen className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">No hay programas para mostrar</p>
                </div>
              ) : (
                newList.map((p) => (
                  <ProgramaCard
                    key={p.Id_Programa}
                    programa={p}
                    onEdit={editPrograma}
                    onView={(prog) => { setProgDetalle(prog); setDetalleOpen(true); }}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="p-4 lg:p-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <DataTable
                  columns={columnsTable}
                  data={newList}
                  keyField="Id_Programa"
                  pagination
                  highlightOnHover
                  striped
                  customStyles={customStyles}
                  noDataComponent={
                    <div className="flex flex-col items-center py-12 text-gray-400">
                      <BookOpen className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-sm">No hay programas para mostrar</p>
                    </div>
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {detalleOpen && (
        <DetalleModal
          programa={progDetalle}
          onClose={() => setDetalleOpen(false)}
          onEdit={editPrograma}
        />
      )}

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