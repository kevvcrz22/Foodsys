import apiNode from "../../api/axiosConfig";
import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import RolesForm from "./RolesForm.jsx";
import { Shield, Eye, Pencil, Plus, Search, X, Hash } from "lucide-react";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

const rolColor = (idx) => {
  const colors = [
    "from-blue-500 to-blue-600",
    "from-purple-500 to-purple-600",
    "from-emerald-500 to-emerald-600",
    "from-amber-500 to-amber-600",
    "from-rose-500 to-rose-600",
    "from-cyan-500 to-cyan-600",
  ];
  return colors[idx % colors.length];
};

/* ── Modal Detalle ── */
const DetalleModal = ({ rol, onClose, onEdit }) => {
  if (!rol) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-600 to-purple-500">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-violet-100 font-medium">Detalle</p>
              <p className="text-white font-bold text-sm">{rol.Nom_Rol}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">ID</span>
            <span className="text-sm text-gray-800 font-bold">{rol.Id_Rol}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Nombre</span>
            <span className="text-sm text-gray-800 font-semibold">{rol.Nom_Rol}</span>
          </div>
        </div>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => { onEdit(rol); onClose(); }}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            <Pencil className="w-4 h-4" /> Editar Rol
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Tarjeta Móvil ── */
const RolCard = ({ rol, index, onEdit, onView }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 active:scale-[0.99] transition-transform">
    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${rolColor(index)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
      <Shield className="w-5 h-5 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-bold text-gray-900 text-sm">{rol.Nom_Rol}</p>
      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
        <Hash className="w-3 h-3" /> ID: {rol.Id_Rol}
      </p>
    </div>
    <div className="flex flex-col gap-2 flex-shrink-0">
      <button
        onClick={() => onView(rol)}
        className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
      >
        <Eye className="w-4 h-4 text-gray-500" />
      </button>
      <button
        onClick={() => onEdit(rol)}
        className="w-9 h-9 rounded-xl bg-violet-50 hover:bg-violet-100 flex items-center justify-center transition-colors"
      >
        <Pencil className="w-4 h-4 text-violet-600" />
      </button>
    </div>
  </div>
);

/* ─────────────── MAIN ─────────────── */
const CrudRoles = () => {
  const [Roles, setRoles] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [RolSeleccionado, setRolSeleccionado] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [rolDetalle, setRolDetalle] = useState(null);
  const isMobile = useIsMobile();

  const columnsTable = [
    { name: "ID", selector: (r) => r.Id_Rol, sortable: true, width: "80px" },
    {
      name: "Nombre Rol",
      selector: (r) => r.Nom_Rol,
      sortable: true,
      grow: 2,
      cell: (r) => (
        <div className="flex items-center gap-2 py-1">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${rolColor(r.Id_Rol)} flex items-center justify-center flex-shrink-0`}>
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-medium text-gray-800">{r.Nom_Rol}</span>
        </div>
      ),
    },
    {
      name: "Acciones",
      cell: (row) => (
        <button
          className="bg-violet-500 hover:bg-violet-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
          onClick={() => editRol(row)}
        >
          <Pencil className="w-3 h-3" /> Editar
        </button>
      ),
    },
  ];

  useEffect(() => { getAllRoles(); }, []);

  const getAllRoles = async () => {
    try {
      const response = await apiNode.get("/api/Roles/");
      setRoles(response.data);
    } catch (error) {
      console.error("Error al obtener roles:", error);
    }
  };

  const editRol = (row) => { setRolSeleccionado(row); setIsModalOpen(true); };
  const hideModal = () => { setIsModalOpen(false); setRolSeleccionado(null); };

  const newList = Roles.filter((p) =>
    p.Nom_Rol.toLowerCase().includes(filterText.toLowerCase())
  );

  const customStyles = {
    headRow: { style: { backgroundColor: "#f8fafc", fontSize: "13px", fontWeight: "700", color: "#374151", borderBottom: "2px solid #e5e7eb" } },
    rows: { style: { fontSize: "13px", "&:hover": { backgroundColor: "#f5f3ff" }, borderBottom: "1px solid #f3f4f6" } },
    pagination: { style: { borderTop: "1px solid #e5e7eb", fontSize: "13px" } },
  };

  return (
    <>
      <div className="w-full h-full flex flex-col bg-gray-50 min-h-0">
        <div className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6 lg:py-4 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-base lg:text-lg leading-tight">Roles</h1>
                <p className="text-xs text-gray-400 hidden sm:block">{Roles.length} registros</p>
              </div>
            </div>
            <button
              onClick={() => { setRolSeleccionado(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 lg:px-5 lg:py-2.5 rounded-xl text-sm font-semibold transition-colors flex-shrink-0 shadow-sm shadow-violet-200"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo Rol</span>
            </button>
          </div>
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar rol..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50"
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
                  <Shield className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">No hay roles para mostrar</p>
                </div>
              ) : (
                newList.map((r, i) => (
                  <RolCard
                    key={r.Id_Rol}
                    rol={r}
                    index={i}
                    onEdit={editRol}
                    onView={(rol) => { setRolDetalle(rol); setDetalleOpen(true); }}
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
                  keyField="Id_Rol"
                  pagination
                  highlightOnHover
                  striped
                  customStyles={customStyles}
                  noDataComponent={
                    <div className="flex flex-col items-center py-12 text-gray-400">
                      <Shield className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-sm">No hay roles para mostrar</p>
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
          rol={rolDetalle}
          onClose={() => setDetalleOpen(false)}
          onEdit={editRol}
        />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={hideModal} />
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 flex-shrink-0">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                  {RolSeleccionado ? <Pencil className="w-3.5 h-3.5 text-violet-600" /> : <Plus className="w-3.5 h-3.5 text-violet-600" />}
                </div>
                {RolSeleccionado ? "Editar Rol" : "Nuevo Rol"}
              </h2>
              <button onClick={hideModal} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto flex-1">
              <RolesForm hideModal={hideModal} programa={RolSeleccionado} actualizarLista={getAllRoles} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CrudRoles;