import apiAxios from "../../api/axiosConfig";
import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import FichasForm from "./FichasForm";
import { FileText, Calendar, BookOpen, Eye, Pencil, Plus, Search, X, ChevronRight } from "lucide-react";

/* ── Hook para detectar móvil ── */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

/* ── Badge de estado ── */
const Badge = ({ text }) => {
  const colors = {
    Activo: "bg-emerald-100 text-emerald-700",
    Inactivo: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[text] || "bg-gray-100 text-gray-600"}`}>
      {text}
    </span>
  );
};

/* ── Modal Detalle ── */
const DetalleModal = ({ ficha, onClose, onEdit }) => {
  if (!ficha) return null;
  const rows = [
    { label: "ID", value: ficha.Id_Ficha },
    { label: "Número de Ficha", value: ficha.Num_Ficha },
    { label: "Programa", value: ficha.programa?.Nom_Programa || "—" },
    { label: "Inicio Lectiva", value: ficha.FecIniLec_Ficha },
    { label: "Fin Lectiva", value: ficha.FecFinLec_Ficha },
    { label: "Inicio Práctica", value: ficha.FecIniPra_Ficha },
    { label: "Fin Práctica", value: ficha.FecFinPra_Ficha },
    { label: "Creado", value: new Date(ficha.createdAt).toLocaleDateString() },
    { label: "Actualizado", value: new Date(ficha.updatedAt).toLocaleDateString() },
  ];
  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-500">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-blue-100 font-medium">Detalle</p>
              <p className="text-white font-bold text-sm">Ficha #{ficha.Num_Ficha}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex justify-between items-start gap-3 py-2 border-b border-gray-50 last:border-0">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide min-w-[110px]">{label}</span>
              <span className="text-sm text-gray-800 font-medium text-right">{value || "—"}</span>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => { onEdit(ficha); onClose(); }}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            <Pencil className="w-4 h-4" /> Editar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Tarjeta Móvil ── */
const FichaCard = ({ ficha, onEdit, onView }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 active:scale-[0.99] transition-transform">
    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
      <FileText className="w-5 h-5 text-blue-600" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-bold text-gray-900 text-sm">#{ficha.Num_Ficha}</span>
      </div>
      <p className="text-xs text-gray-500 truncate flex items-center gap-1">
        <BookOpen className="w-3 h-3 flex-shrink-0" />
        {ficha.programa?.Nom_Programa || "Sin programa"}
      </p>
      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
        <Calendar className="w-3 h-3 flex-shrink-0" />
        {ficha.FecIniLec_Ficha} → {ficha.FecFinLec_Ficha}
      </p>
    </div>
    <div className="flex flex-col gap-2 flex-shrink-0">
      <button
        onClick={() => onView(ficha)}
        className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
      >
        <Eye className="w-4 h-4 text-gray-500" />
      </button>
      <button
        onClick={() => onEdit(ficha)}
        className="w-9 h-9 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
      >
        <Pencil className="w-4 h-4 text-blue-600" />
      </button>
    </div>
  </div>
);

/* ─────────────── MAIN ─────────────── */
const CrudFichas = () => {
  const [Fichas, setFichas] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [selectedFicha, setSelectedFicha] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [fichaDetalle, setFichaDetalle] = useState(null);
  const isMobile = useIsMobile();

  const columnsTable = [
    { name: "ID", selector: (r) => r.Id_Ficha, sortable: true, width: "70px" },
    { name: "N° Ficha", selector: (r) => r.Num_Ficha, sortable: true },
    { name: "Inicio Lectiva", selector: (r) => r.FecIniLec_Ficha, sortable: true },
    { name: "Fin Lectiva", selector: (r) => r.FecFinLec_Ficha, sortable: true },
    { name: "Inicio Práctica", selector: (r) => r.FecIniPra_Ficha, sortable: true },
    { name: "Fin Práctica", selector: (r) => r.FecFinPra_Ficha, sortable: true },
    { name: "Programa", selector: (r) => r.programa?.Nom_Programa, sortable: true },
    { name: "Creado", selector: (r) => new Date(r.createdAt).toLocaleDateString(), sortable: true },
    { name: "Actualizado", selector: (r) => new Date(r.updatedAt).toLocaleDateString(), sortable: true },
    {
      name: "Acciones",
      cell: (row) => (
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
          onClick={() => editFicha(row)}
        >
          <Pencil className="w-3 h-3" /> Editar
        </button>
      ),
    },
  ];

  useEffect(() => { getAllFichas(); }, []);

  const getAllFichas = async () => {
    try {
      const response = await apiAxios.get("/api/Fichas/");
      setFichas(response.data);
    } catch (error) {
      console.error("Error al obtener las fichas:", error);
    }
  };

  const editFicha = (row) => {
    setSelectedFicha(row);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const newList = Fichas.filter((f) => {
    const t = filterText.toLowerCase();
    return (
      String(f.Num_Ficha || "").toLowerCase().includes(t) ||
      String(f.programa?.Nom_Programa || "").toLowerCase().includes(t)
    );
  });

  const hideModal = () => { setIsModalOpen(false); setSelectedFicha(null); setIsEdit(false); };

  const customStyles = {
    headRow: { style: { backgroundColor: "#f8fafc", fontSize: "13px", fontWeight: "700", color: "#374151", borderBottom: "2px solid #e5e7eb" } },
    rows: { style: { fontSize: "13px", "&:hover": { backgroundColor: "#f0f9ff" }, borderBottom: "1px solid #f3f4f6" } },
    pagination: { style: { borderTop: "1px solid #e5e7eb", fontSize: "13px" } },
  };

  return (
    <>
      <div className="w-full h-full flex flex-col bg-gray-50 min-h-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6 lg:py-4 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-gray-900 text-base lg:text-lg leading-tight">Fichas</h1>
                <p className="text-xs text-gray-400 hidden sm:block">{Fichas.length} registros</p>
              </div>
            </div>
            <button
              onClick={() => { setSelectedFicha(null); setIsEdit(false); setIsModalOpen(true); }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 lg:px-5 lg:py-2.5 rounded-xl text-sm font-semibold transition-colors flex-shrink-0 shadow-sm shadow-blue-200"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva Ficha</span>
            </button>
          </div>
          {/* Buscador */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número o programa..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto">
          {isMobile ? (
            /* ── Vista Móvil: Tarjetas ── */
            <div className="p-3 space-y-2">
              {newList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <FileText className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">No hay fichas para mostrar</p>
                </div>
              ) : (
                newList.map((f) => (
                  <FichaCard
                    key={f.Id_Ficha}
                    ficha={f}
                    onEdit={editFicha}
                    onView={(ficha) => { setFichaDetalle(ficha); setDetalleOpen(true); }}
                  />
                ))
              )}
            </div>
          ) : (
            /* ── Vista Desktop: Tabla ── */
            <div className="p-4 lg:p-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <DataTable
                  columns={columnsTable}
                  data={newList}
                  keyField="Id_Ficha"
                  pagination
                  highlightOnHover
                  striped
                  customStyles={customStyles}
                  noDataComponent={
                    <div className="flex flex-col items-center py-12 text-gray-400">
                      <FileText className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-sm">No hay fichas para mostrar</p>
                    </div>
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Detalle Móvil */}
      {detalleOpen && (
        <DetalleModal
          ficha={fichaDetalle}
          onClose={() => setDetalleOpen(false)}
          onEdit={editFicha}
        />
      )}

      {/* Modal Formulario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={hideModal} />
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 flex-shrink-0">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  {isEdit ? <Pencil className="w-3.5 h-3.5 text-blue-600" /> : <Plus className="w-3.5 h-3.5 text-blue-600" />}
                </div>
                {isEdit ? "Editar Ficha" : "Nueva Ficha"}
              </h2>
              <button onClick={hideModal} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto flex-1">
              <FichasForm hideModal={hideModal} selectedFicha={selectedFicha} isEdit={isEdit} reload={getAllFichas} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CrudFichas;