// Frontend/src/Tablas/Usuarios/CrudUsuarios.jsx
import apiAxios from "../../api/axiosConfig";
import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import UsuariosForm from "./UsuariosForm.jsx";
import { exportarUsuariosExcel } from "./ExportExcel.jsx";
import {
  Users, Eye, Pencil, Plus, Search, X,
  Mail, Hash, CheckCircle, XCircle, FileDown,
} from "lucide-react";

/* ── helpers ── */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isMobile;
};

const getInitials = (nom, ape) =>
  `${(nom || "").charAt(0).toUpperCase()}${(ape || "").charAt(0).toUpperCase()}` || "??";

const avatarColor = (str) => {
  const colors = [
    "from-blue-500 to-blue-600", "from-purple-500 to-purple-600",
    "from-emerald-500 to-emerald-600", "from-amber-500 to-amber-600",
    "from-rose-500 to-rose-600", "from-cyan-500 to-cyan-600",
    "from-indigo-500 to-indigo-600",
  ];
  let h = 0;
  for (let i = 0; i < (str || "").length; i++) h = str.charCodeAt(i) + h;
  return colors[h % colors.length];
};

const EstadoBadge = ({ estado }) => {
  const activo = estado === "Activo" || estado === "activo";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full
      ${activo ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
      {activo ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {estado}
    </span>
  );
};

/* ── Modal Detalle ── */
const DetalleModal = ({ usuario, onClose, onEdit }) => {
  if (!usuario) return null;
  const nombre = `${usuario.Nom_Usuario || ""} ${usuario.Ape_Usuario || ""}`.trim();
  const rows = [
    { label: "ID",          value: usuario.Id_Usuario },
    { label: "Tipo Doc.",   value: usuario.TipDoc_Usuario },
    { label: "N° Documento",value: usuario.NumDoc_Usuario },
    { label: "Nombres",     value: usuario.Nom_Usuario },
    { label: "Apellidos",   value: usuario.Ape_Usuario },
    { label: "Género",      value: usuario.Gen_Usuario },
    { label: "Correo",      value: usuario.Cor_Usuario },
    { label: "Teléfono",    value: usuario.Tel_Usuario },
    { label: "Centro Conv.",value: usuario.CenCon_Usuario },
    { label: "Estado",      value: usuario.Est_Usuario, isEstado: true },
    { label: "Sanción",     value: usuario.San_Usuario },
    { label: "Ficha",       value: usuario.ficha?.Num_Ficha || "Sin ficha" },
    { label: "Creado",      value: usuario.CreateData ? new Date(usuario.CreateData).toLocaleDateString() : "—" },
    { label: "Actualizado", value: usuario.UpdateData ? new Date(usuario.UpdateData).toLocaleDateString() : "—" },
  ];
  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-500">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarColor(nombre)} flex items-center justify-center flex-shrink-0 shadow-lg`}>
              <span className="text-white font-bold text-sm">{getInitials(usuario.Nom_Usuario, usuario.Ape_Usuario)}</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">{nombre}</p>
              <p className="text-blue-100 text-xs">{usuario.Cor_Usuario}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-2">
          {rows.map(({ label, value, isEstado }) => (
            <div key={label} className="flex justify-between items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide min-w-[90px]">{label}</span>
              {isEstado
                ? <EstadoBadge estado={value} />
                : <span className="text-sm text-gray-800 font-medium text-right break-all">{value || "—"}</span>
              }
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => { onEdit(usuario); onClose(); }}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            <Pencil className="w-4 h-4" /> Editar Usuario
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Tarjeta Móvil ── */
const UsuarioCard = ({ usuario, onEdit, onView }) => {
  const nombre = `${usuario.Nom_Usuario || ""} ${usuario.Ape_Usuario || ""}`.trim();
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3 active:scale-[0.99] transition-transform">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarColor(nombre)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <span className="text-white font-bold text-sm">{getInitials(usuario.Nom_Usuario, usuario.Ape_Usuario)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-gray-900 text-sm truncate">{nombre}</span>
          <EstadoBadge estado={usuario.Est_Usuario} />
        </div>
        <p className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-1">
          <Mail className="w-3 h-3 flex-shrink-0" />{usuario.Cor_Usuario || "Sin correo"}
        </p>
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Hash className="w-3 h-3 flex-shrink-0" />{usuario.NumDoc_Usuario || "—"}
        </p>
      </div>
      <div className="flex flex-col gap-2 flex-shrink-0">
        <button onClick={() => onView(usuario)} className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
          <Eye className="w-4 h-4 text-gray-500" />
        </button>
        <button onClick={() => onEdit(usuario)} className="w-9 h-9 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors">
          <Pencil className="w-4 h-4 text-blue-600" />
        </button>
      </div>
    </div>
  );
};

/* ─────────────── MAIN ─────────────── */
const CrudUsuarios = () => {
  const [Usuarios, setUsuarios]           = useState([]);
  const [filterText, setFilterText]       = useState("");
  const [selectedUsuario, setSelected]    = useState(null);
  const [isEdit, setIsEdit]               = useState(false);
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [detalleOpen, setDetalleOpen]     = useState(false);
  const [usuarioDetalle, setDetalle]      = useState(null);
  const [exportando, setExportando]       = useState(false);
  const isMobile = useIsMobile();

  const columnsTable = [
    { name: "ID", selector: (r) => r.Id_Usuario, sortable: true, width: "65px" },
    {
      name: "Usuario",
      selector: (r) => `${r.Nom_Usuario} ${r.Ape_Usuario}`,
      sortable: true,
      grow: 2,
      cell: (r) => {
        const nombre = `${r.Nom_Usuario || ""} ${r.Ape_Usuario || ""}`.trim();
        return (
          <div className="flex items-center gap-2 py-1">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${avatarColor(nombre)} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white font-bold text-xs">{getInitials(r.Nom_Usuario, r.Ape_Usuario)}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm leading-tight">{nombre}</p>
              <p className="text-xs text-gray-400">{r.Cor_Usuario}</p>
            </div>
          </div>
        );
      },
    },
    { name: "Documento",  selector: (r) => r.NumDoc_Usuario, sortable: true },
    { name: "Teléfono",   selector: (r) => r.Tel_Usuario, sortable: true },
    { name: "Estado",     selector: (r) => r.Est_Usuario, sortable: true, cell: (r) => <EstadoBadge estado={r.Est_Usuario} /> },
    { name: "Ficha",      selector: (r) => r.ficha?.Num_Ficha || "Sin ficha", sortable: true },
    { name: "Sanción",    selector: (r) => r.San_Usuario },
    {
      name: "Acciones",
      cell: (row) => (
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
          onClick={() => editUsuario(row)}
        >
          <Pencil className="w-3 h-3" /> Editar
        </button>
      ),
    },
  ];

  useEffect(() => { getAllUsuarios(); }, []);

  const getAllUsuarios = async () => {
    try {
      const res = await apiAxios.get("/api/Usuarios/");
      setUsuarios(res.data);
    } catch (error) {
      console.error("Error al obtener Usuarios:", error);
    }
  };

  const editUsuario = (row) => { setSelected(row); setIsEdit(true); setIsModalOpen(true); };
  const hideModal   = ()    => { setIsModalOpen(false); setSelected(null); setIsEdit(false); };

  /* ── Exportar Excel ── */
  const handleExportar = async () => {
    setExportando(true);
    try {
      // Si ya tenemos datos cargados los usamos directamente; 
      // si el filtro está activo exportamos solo los filtrados
      const datos = filterText ? newList : Usuarios;
      exportarUsuariosExcel(datos);
    } catch (err) {
      console.error(err);
      alert("Error al exportar Excel");
    } finally {
      setExportando(false);
    }
  };

  const newList = Usuarios.filter((a) => {
    const t = filterText.toLowerCase();
    return (
      String(a.NumDoc_Usuario || "").toLowerCase().includes(t) ||
      String(a.Nom_Usuario    || "").toLowerCase().includes(t) ||
      String(a.Ape_Usuario    || "").toLowerCase().includes(t) ||
      String(a.ficha?.Num_Ficha || "").toLowerCase().includes(t)
    );
  });

  const customStyles = {
    headRow: { style: { backgroundColor: "#f8fafc", fontSize: "13px", fontWeight: "700", color: "#374151", borderBottom: "2px solid #e5e7eb" } },
    rows:    { style: { fontSize: "13px", "&:hover": { backgroundColor: "#eff6ff" }, borderBottom: "1px solid #f3f4f6" } },
    pagination: { style: { borderTop: "1px solid #e5e7eb", fontSize: "13px" } },
  };

  return (
    <>
      <div className="w-full h-full flex flex-col bg-gray-50 min-h-0">

        {/* ── Cabecera ── */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6 lg:py-4 flex-shrink-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-base lg:text-lg leading-tight">Usuarios</h1>
                <p className="text-xs text-gray-400 hidden sm:block">{Usuarios.length} registros</p>
              </div>
            </div>

            {/* Botones: Exportar + Nuevo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* ✅ BOTÓN EXPORTAR EXCEL */}
              <button
                onClick={handleExportar}
                disabled={exportando || Usuarios.length === 0}
                title="Exportar a Excel"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-2 lg:px-4 lg:py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-emerald-200"
              >
                {exportando
                  ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <FileDown className="w-4 h-4" />
                }
                <span className="hidden sm:inline">{exportando ? "Exportando..." : "Exportar Excel"}</span>
              </button>

              {/* Nuevo Usuario */}
              <button
                onClick={() => { setSelected(null); setIsEdit(false); setIsModalOpen(true); }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 lg:px-5 lg:py-2.5 rounded-xl text-sm font-semibold transition-colors flex-shrink-0 shadow-sm shadow-blue-200"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo Usuario</span>
              </button>
            </div>
          </div>

          {/* Buscador */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, documento o ficha..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        </div>

        {/* ── Contenido ── */}
        <div className="flex-1 overflow-y-auto">
          {isMobile ? (
            <div className="p-3 space-y-2">
              {newList.length === 0
                ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Users className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm">No hay usuarios para mostrar</p>
                  </div>
                )
                : newList.map((u) => (
                  <UsuarioCard
                    key={u.Id_Usuario}
                    usuario={u}
                    onEdit={editUsuario}
                    onView={(usr) => { setDetalle(usr); setDetalleOpen(true); }}
                  />
                ))
              }
            </div>
          ) : (
            <div className="p-4 lg:p-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <DataTable
                  title="Usuarios"
                  columns={columnsTable}
                  data={newList}
                  keyField="Id_Usuario"
                  pagination
                  highlightOnHover
                  striped
                  customStyles={customStyles}
                  noDataComponent={
                    <div className="flex flex-col items-center py-12 text-gray-400">
                      <Users className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-sm">No hay usuarios para mostrar</p>
                    </div>
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Detalle */}
      {detalleOpen && (
        <DetalleModal
          usuario={usuarioDetalle}
          onClose={() => setDetalleOpen(false)}
          onEdit={editUsuario}
        />
      )}

      {/* Modal Formulario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={hideModal} />
          <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 flex-shrink-0">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  {isEdit ? <Pencil className="w-3.5 h-3.5 text-blue-600" /> : <Plus className="w-3.5 h-3.5 text-blue-600" />}
                </div>
                {isEdit ? "Editar Usuario" : "Nuevo Usuario"}
              </h2>
              <button onClick={hideModal} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto flex-1">
              <UsuariosForm
                hideModal={hideModal}
                UsuarioSeleccionado={selectedUsuario}
                Editar={isEdit}
                reload={getAllUsuarios}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CrudUsuarios;