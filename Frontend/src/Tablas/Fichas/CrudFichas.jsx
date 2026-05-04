// Frontend/src/Tablas/Fichas/CrudFichas.jsx
import apiAxios from "../../api/axiosConfig";
import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import FichasForm from "./FichasForm";
import { FileText, Pencil, Plus, Search, X, Users } from "lucide-react";

// Modal que muestra la lista de aprendices vinculados a una ficha especifica
const AprendicesModal = ({ ficha, aprendices, loading, onClose }) => {
  if (!ficha) return null;
  return (
    <div className="fixed inset-0 z-10000 flex items-end sm:items-center justify-center sm:p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10">
        <div className="bg-blue-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Users size={18} className="text-white" />
            </div>
            <div>
              <p className="text-blue-100 text-[10px] uppercase font-bold m-0">Aprendices en ficha</p>
              <p className="text-white font-semibold text-sm m-0">#{ficha.Num_Ficha}</p>
            </div>
          </div>
          <button onClick={onClose} className="bg-white/20 border-0 rounded-xl p-2 cursor-pointer text-white flex items-center">
            <X size={16} />
          </button>
        </div>
        
        <div className="bg-blue-50 px-5 py-2 border-b border-blue-100">
          <span className="text-[11px] font-bold text-blue-700 uppercase">
            {loading ? "Cargando..." : `${aprendices.length} aprendices registrados`}
          </span>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : aprendices.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-slate-400">
              <Users size={32} className="opacity-20 mb-2" />
              <p className="text-xs">No hay aprendices en esta ficha</p>
            </div>
          ) : (
            aprendices.map((ap, idx) => {
              const nombre = `${ap.Nom_Usuario || ""} ${ap.Ape_Usuario || ""}`.trim();
              return (
                <div key={ap.Id_Usuario || idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-blue-700 text-xs font-bold uppercase">{nombre.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm m-0">{nombre}</p>
                    <p className="text-[11px] text-slate-400 m-0">Doc: {ap.NumDoc_Usuario || "—"}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const CrudFichas = () => {
  const [Fichas, setFichas] = useState([]);
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [selectedFicha, setSelectedFicha] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aprendicesModal, setAprendicesModal] = useState({ open: false, ficha: null });
  const [aprendicesList, setAprendicesList] = useState([]);
  const [aprendicesLoading, setAprendicesLoading] = useState(false);
  
  useEffect(() => {
    getAllFichas();
    getAllUsuarios();
  }, []);

  const getAllFichas = async () => {
    try {
      const res = await apiAxios.get("/api/Fichas/");
      setFichas(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  const getAllUsuarios = async () => {
    try {
      const res = await apiAxios.get("/api/Usuarios/");
      setTodosUsuarios(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  const contarAprendices = (fichaId) =>
    todosUsuarios.filter((u) => u.Id_Ficha === fichaId || u.ficha?.Id_Ficha === fichaId).length;

  const verAprendices = (ficha) => {
    setAprendicesModal({ open: true, ficha });
    setAprendicesLoading(true);
    const lista = todosUsuarios.filter((u) => u.Id_Ficha === ficha.Id_Ficha || u.ficha?.Id_Ficha === ficha.Id_Ficha);
    setAprendicesList(lista);
    setAprendicesLoading(false);
  };

  const columnsTable = [
    { name: "ID", selector: (r) => r.Id_Ficha, sortable: true, width: "70px" },
    { 
      name: "N° Ficha", 
      selector: (r) => r.Num_Ficha, 
      sortable: true,
      cell: (r) => <span className="font-bold text-blue-600 text-sm tracking-tight">{r.Num_Ficha}</span> 
    },
    { 
      name: "Programa", 
      selector: (r) => r.programas?.Nom_Programa,
      sortable: true,
      grow: 2,
      cell: (r) => <span className="text-[12px] text-slate-600 font-medium leading-tight">{r.programas?.Nom_Programa || "Sin programa"}</span> 
    },
    { 
      name: "Aprendices", 
      center: true,
      cell: (row) => {
        const count = contarAprendices(row.Id_Ficha);
        return (
          <button onClick={() => verAprendices(row)} 
            className={`flex items-center gap-1.5 border-0 rounded-full px-3 py-1 text-xs font-bold cursor-pointer transition-all ${count > 0 ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "bg-slate-100 text-slate-400"}`}>
            <Users size={12} />{count}
          </button>
        );
      },
    },
    { 
      name: "Fechas Lectiva", 
      cell: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-slate-400 font-bold uppercase">Inicio: {r.FecIniLec_Ficha?.slice(0, 10) || "—"}</span>
          <span className="text-[11px] text-slate-400 font-bold uppercase">Fin: {r.FecFinLec_Ficha?.slice(0, 10) || "—"}</span>
        </div>
      )
    },
    {
      name: "Acciones",
      cell: (row) => (
        <button className="bg-blue-600 text-white border-0 rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer flex items-center gap-2 hover:bg-blue-700 transition-colors"
          onClick={() => { setSelectedFicha(row); setIsEdit(true); setIsModalOpen(true); }}>
          <Pencil size={12} /> Editar
        </button>
      ),
    },
  ];

  const customStyles = {
    headRow:    { style: { background: "#f8fafc", fontSize: 12, fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb", textTransform: "uppercase", letterSpacing: "0.05em" } },
    rows:       { style: { fontSize: 13, borderBottom: "1px solid #f3f4f6", "&:hover": { background: "#f0f9ff" } } },
    pagination: { style: { borderTop: "1px solid #e5e7eb", fontSize: 13 } },
  };

  const newList = Fichas.filter((f) => {
    const t = filterText.toLowerCase();
    return String(f.Num_Ficha || "").toLowerCase().includes(t) || String(f.programas?.Nom_Programa || "").toLowerCase().includes(t);
  });

  return (
    <>
      <div className="w-full h-full flex flex-col bg-slate-50 min-h-0">
        <div className="bg-white border-b border-slate-100 px-5 py-4 shrink-0">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
                <FileText size={18} className="text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-slate-800 text-base m-0">Gestión de Fichas</h1>
                <p className="text-xs text-slate-400 m-0">{Fichas.length} fichas registradas</p>
              </div>
            </div>
            <button onClick={() => { setSelectedFicha(null); setIsEdit(false); setIsModalOpen(true); }}
              className="flex items-center gap-2 bg-blue-600 text-white border-0 rounded-xl px-5 py-2.5 text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-all shadow-md active:scale-95">
              <Plus size={16} /><span>Nueva Ficha</span>
            </button>
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Buscar por número de ficha o programa..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all"
              value={filterText} onChange={(e) => setFilterText(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <DataTable columns={columnsTable} data={newList} keyField="Id_Ficha"
              pagination highlightOnHover striped customStyles={customStyles}
              noDataComponent={
                <div className="flex flex-col items-center py-12 text-slate-400">
                  <FileText size={32} className="opacity-20 mb-2" />
                  <p className="text-sm font-medium">No se encontraron fichas</p>
                </div>
              }
            />
          </div>
        </div>
      </div>

      {aprendicesModal.open && <AprendicesModal ficha={aprendicesModal.ficha} aprendices={aprendicesList} loading={aprendicesLoading} onClose={() => setAprendicesModal({ open: false, ficha: null })} />}

      {isModalOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden z-10">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0">
              <h2 className="font-semibold text-slate-800 text-[15px] m-0">{isEdit ? "Actualizar Ficha" : "Registrar Nueva Ficha"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 border-0 rounded-lg p-2 cursor-pointer text-slate-500 hover:bg-slate-200">
                <X size={15} />
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto flex-1">
              <FichasForm hideModal={() => setIsModalOpen(false)} selectedFicha={selectedFicha} isEdit={isEdit} reload={getAllFichas} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CrudFichas;