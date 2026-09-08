// Frontend/src/Tablas/RolesUsuarios/CrudUsuariosRoles.jsx
import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig.js";
import DataTable from "react-data-table-component";
import toast from "react-hot-toast";
import UsuariosRolesForm from "../RolesUsuarios/UsuariosRolesForm.jsx";
import { Shield, Plus, Search, X, Pencil, Users } from "lucide-react";

const rolColors = {
  "Administrador":    { bg: "#fce7f3", color: "#9d174d" },
  "Coordinador":      { bg: "#ede9fe", color: "#6d28d9" },
  "Supervisor":       { bg: "#fef3c7", color: "#92400e" },
  "Aprendiz Interno": { bg: "#d1fae5", color: "#065f46" },
  "Aprendiz Externo": { bg: "#dbeafe", color: "#1e3a5f" },
  "Bienestar":        { bg: "#fce7f3", color: "#9d174d" },
  "Monitor":          { bg: "#fff7ed", color: "#9a3412" },
};

const RolBadge = ({ nombre }) => {
  const c = rolColors[nombre] || { bg: "#f3f4f6", color: "#374151" };
  return (
    <span style={{ background: c.bg, color: c.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
      <Shield size={10} />{nombre}
    </span>
  );
};

const CrudUsuariosRoles = () => {
  const [usuariosRol, setUsuariosRol] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [editar, setEditar] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cargando, setCargando] = useState(true);

  const columnsTable = [
    { name: "ID", selector: (row) => row.Id_UsuariosRol, sortable: true, width: "65px" },
    {
      name: "Usuario",
      selector: (row) => `${row.usuario?.Nom_Usuario || ""} ${row.usuario?.Ape_Usuario || ""}`,
      sortable: true,
      grow: 2,
      minWidth: "220px",
      cell: (row) => {
        const nombre = `${row.usuario?.Nom_Usuario || ""} ${row.usuario?.Ape_Usuario || ""}`.trim();
        const initials = nombre.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
        return (
          <div className="flex items-center gap-2.5 py-1.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
              <span className="text-violet-700 font-semibold text-[11px]">{initials || "?"}</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 text-[13px] m-0 truncate">{nombre || "—"}</p>
              <p className="text-[11px] text-slate-400 m-0 truncate">{row.usuario?.NumDoc_Usuario || "—"}</p>
            </div>
          </div>
        );
      },
    },
    {
      name: "Rol",
      selector: (row) => row.rol?.Nom_Rol,
      sortable: true,
      minWidth: "150px",
      cell: (row) => row.rol?.Nom_Rol ? <RolBadge nombre={row.rol.Nom_Rol} /> : <span className="text-slate-400 text-xs whitespace-nowrap">Sin rol</span>,
    },
    {
      name: "Acciones",
      minWidth: "120px",
      cell: (row) => (
        <button
          className="bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors whitespace-nowrap"
          onClick={() => editItem(row)}
        >
          <Pencil size={12} /> Editar
        </button>
      ),
    },
  ];

  useEffect(() => { getAllUsuariosRol(); }, []);

  const getAllUsuariosRol = async () => {
    setCargando(true);
    try {
      const response = await apiAxios.get("/api/UsuariosRoles");
      const data = Array.isArray(response.data) ? response.data.map((item) => ({
        ...item,
        rol: item.rol || item.rolUsuario || null,
      })) : [];
      setUsuariosRol(data);
    } catch (error) {
      console.error("Error al cargar UsuariosRol:", error);
      toast.error("Error al cargar asignaciones de roles");
    } finally {
      setCargando(false);
    }
  };

  const editItem = (row) => { setSelectedItem(row); setEditar(true); setIsModalOpen(true); };
  const hideModal = () => { setIsModalOpen(false); setSelectedItem(null); setEditar(false); };

  const newList = usuariosRol.filter((item) => {
    const text = filterText.toLowerCase();
    return (
      String(item.usuario?.NumDoc_Usuario || "").includes(text) ||
      String(item.usuario?.Nom_Usuario || "").toLowerCase().includes(text) ||
      String(item.usuario?.Ape_Usuario || "").toLowerCase().includes(text) ||
      String(item.rol?.Nom_Rol || "").toLowerCase().includes(text)
    );
  });

  const customStyles = {
    table:      { style: { minWidth: "600px" } },
    headRow:    { style: { background: "#f8fafc", fontSize: 12, fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" } },
    headCells:  { style: { whiteSpace: "nowrap" } },
    cells:      { style: { whiteSpace: "nowrap" } },
    rows:       { style: { fontSize: 13, borderBottom: "1px solid #f3f4f6", "&:hover": { background: "#f5f3ff" } } },
    pagination: { style: { borderTop: "1px solid #e5e7eb", fontSize: 13 } },
  };

  return (
    <>
      <div className="w-full h-full flex flex-col bg-slate-50 min-h-0">
        <div className="bg-white border-b border-slate-100 px-5 py-4 shrink-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
                <Shield size={18} className="text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-slate-800 text-base m-0">Usuarios - Roles</h1>
                <p className="text-xs text-slate-400 m-0">{usuariosRol.length} asignaciones</p>
              </div>
            </div>
            <button
              onClick={() => { setSelectedItem(null); setEditar(false); setIsModalOpen(true); }}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white border-0 rounded-xl px-4 py-2 text-[13px] font-semibold cursor-pointer transition-colors shadow-sm"
            >
              <Plus size={14} /> Asignar Rol
            </button>
          </div>
          <div className="mt-3 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por usuario, documento o rol..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50 text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10 transition-all"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="w-7 h-7 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-2" />
              <p className="text-sm">Cargando asignaciones...</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <DataTable
                columns={columnsTable}
                data={newList}
                keyField="Id_UsuariosRol"
                pagination
                highlightOnHover
                responsive
                customStyles={customStyles}
                noDataComponent={
                  <div className="flex flex-col items-center py-12 text-slate-400">
                    <Users size={32} className="opacity-30 mb-2" />
                    <p className="text-[13px]">No hay asignaciones para mostrar</p>
                  </div>
                }
              />
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={hideModal} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden z-10">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0">
              <h2 className="font-semibold text-slate-800 text-[15px] m-0 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                  {editar ? <Pencil size={13} className="text-violet-700" /> : <Plus size={13} className="text-violet-700" />}
                </div>
                {editar ? "Editar Asignación" : "Asignar Rol a Usuario"}
              </h2>
              <button onClick={hideModal} className="bg-slate-100 border-0 rounded-lg p-2 cursor-pointer text-slate-500 flex items-center hover:bg-slate-200 transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto flex-1">
              <UsuariosRolesForm hideModal={hideModal} data={selectedItem} Edit={editar} reload={getAllUsuariosRol} />
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

export default CrudUsuariosRoles;