// Frontend/src/Tablas/Usuarios/CrudUsuarios.jsx
import apiAxios from "../../api/axiosConfig";
import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import UsuariosForm from "./UsuariosForm.jsx";
import ImportarExcel from "./ImportarExcel.jsx";
import { exportarUsuariosExcel } from "./ExportExcel.jsx";
import {
  Users, Eye, Pencil, Plus, Search, X,
  Mail, Hash, CheckCircle, XCircle, FileDown, Upload,
} from "lucide-react";

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
  const colors = ["#dbeafe", "#ede9fe", "#d1fae5", "#fef3c7", "#fee2e2", "#cffafe", "#e0e7ff"];
  const text   = ["#1d4ed8", "#6d28d9", "#065f46", "#92400e", "#991b1b", "#0e7490", "#3730a3"];
  let h = 0;
  for (let i = 0; i < (str || "").length; i++) h = str.charCodeAt(i) + h;
  const idx = h % colors.length;
  return { bg: colors[idx], color: text[idx] };
};

const EstadoBadge = ({ estado }) => {
  const activo = estado === "Activo" || estado === "activo" || estado === "En Formacion";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${activo ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
      {activo ? <CheckCircle size={11} /> : <XCircle size={11} />}
      {estado || "—"}
    </span>
  );
};

const DetalleModal = ({ usuario, onClose, onEdit }) => {
  if (!usuario) return null;
  const nombre = `${usuario.Nom_Usuario || ""} ${usuario.Ape_Usuario || ""}`.trim();
  const { bg, color } = avatarColor(nombre);
  const rows = [
    { label: "ID",           value: usuario.Id_Usuario },
    { label: "Tipo Doc.",    value: usuario.TipDoc_Usuario },
    { label: "N° Documento", value: usuario.NumDoc_Usuario },
    { label: "Nombres",      value: usuario.Nom_Usuario },
    { label: "Apellidos",    value: usuario.Ape_Usuario },
    { label: "Género",       value: usuario.Gen_Usuario },
    { label: "Correo",       value: usuario.Cor_Usuario },
    { label: "Teléfono",     value: usuario.Tel_Usuario },
    { label: "Centro Conv.", value: usuario.CenCon_Usuario },
    { label: "Estado",       value: usuario.Est_Usuario, isEstado: true },
    { label: "Sanción",      value: usuario.San_Usuario },
    { label: "Ficha",        value: usuario.ficha?.Num_Ficha || "Sin ficha" },
    { label: "Creado",       value: usuario.createdat ? new Date(usuario.createdat).toLocaleDateString("es-CO") : "—" },
  ];
  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden z-10">
        <div className="bg-blue-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
              <span className="font-semibold text-sm" style={{ color }}>{getInitials(usuario.Nom_Usuario, usuario.Ape_Usuario)}</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm m-0">{nombre}</p>
              <p className="text-blue-200 text-xs m-0">{usuario.Cor_Usuario || "—"}</p>
            </div>
          </div>
          <button onClick={onClose} className="bg-white/20 border-0 rounded-xl p-2 cursor-pointer text-white flex items-center">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {rows.map(({ label, value, isEstado }) => (
            <div key={label} className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide min-w-[90px]">{label}</span>
              {isEstado
                ? <EstadoBadge estado={value} />
                : <span className="text-[13px] text-slate-700 font-medium text-right break-words">{value || "—"}</span>}
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-slate-100">
          <button onClick={() => { onEdit(usuario); onClose(); }}
            className="w-full bg-blue-600 text-white border-0 rounded-xl py-3 text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
            <Pencil size={14} /> Editar Usuario
          </button>
        </div>
      </div>
    </div>
  );
};

const UsuarioCard = ({ usuario, onEdit, onView }) => {
  const nombre = `${usuario.Nom_Usuario || ""} ${usuario.Ape_Usuario || ""}`.trim();
  const { bg, color } = avatarColor(nombre);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3.5 flex items-center gap-3 shadow-sm">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
        <span className="font-semibold text-sm" style={{ color }}>{getInitials(usuario.Nom_Usuario, usuario.Ape_Usuario)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-800 text-sm">{nombre}</span>
          <EstadoBadge estado={usuario.Est_Usuario} />
        </div>
        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
          <Mail size={11} className="shrink-0" />{usuario.Cor_Usuario || "Sin correo"}
        </p>
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <Hash size={11} className="shrink-0" />{usuario.NumDoc_Usuario || "—"}
          {usuario.ficha && (
            <span className="ml-1.5 bg-violet-100 text-violet-700 rounded-lg px-1.5 py-px text-[11px]">
              Ficha {usuario.ficha.Num_Ficha}
            </span>
          )}
        </p>
      </div>
      <div className="flex flex-col gap-1.5 shrink-0">
        <button onClick={() => onView(usuario)}
          className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer flex items-center justify-center hover:bg-slate-100 transition-colors">
          <Eye size={14} className="text-slate-400" />
        </button>
        <button onClick={() => onEdit(usuario)}
          className="w-9 h-9 rounded-xl border-0 bg-blue-100 cursor-pointer flex items-center justify-center hover:bg-blue-200 transition-colors">
          <Pencil size={14} className="text-blue-700" />
        </button>
      </div>
    </div>
  );
};

const CrudUsuarios = () => {
  const [Usuarios,       setUsuarios]   = useState([]);
  const [filterText,     setFilterText] = useState("");
  const [selectedUsuario, setSelected] = useState(null);
  const [isEdit,         setIsEdit]     = useState(false);
  const [isModalOpen,    setIsModalOpen] = useState(false);
  const [detalleOpen,    setDetalleOpen] = useState(false);
  const [usuarioDetalle, setDetalle]    = useState(null);
  const [exportando,     setExportando] = useState(false);
  const [importModal,    setImportModal] = useState(false);
  const isMobile = useIsMobile();

  const columnsTable = [
    { name: "ID", selector: (r) => r.Id_Usuario, sortable: true, width: "60px" },
    {
      name: "Usuario",
      selector: (r) => `${r.Nom_Usuario} ${r.Ape_Usuario}`,
      sortable: true,
      grow: 2,
      cell: (r) => {
        const nombre = `${r.Nom_Usuario || ""} ${r.Ape_Usuario || ""}`.trim();
        const { bg, color } = avatarColor(nombre);
        return (
          <div className="flex items-center gap-2.5 py-1.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
              <span className="font-semibold text-[11px]" style={{ color }}>{getInitials(r.Nom_Usuario, r.Ape_Usuario)}</span>
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-[13px] m-0">{nombre}</p>
              <p className="text-[11px] text-slate-400 m-0">{r.Cor_Usuario || "—"}</p>
            </div>
          </div>
        );
      },
    },
    { name: "Documento", selector: (r) => r.NumDoc_Usuario, sortable: true, cell: (r) => <span className="text-[13px]">{r.NumDoc_Usuario || "—"}</span> },
    { name: "Teléfono",  selector: (r) => r.Tel_Usuario,    cell: (r) => <span className="text-[13px]">{r.Tel_Usuario || "—"}</span> },
    {
      name: "Ficha",
      selector: (r) => r.ficha?.Num_Ficha,
      sortable: true,
      cell: (r) => r.ficha?.Num_Ficha
        ? <span className="bg-violet-100 text-violet-700 rounded-lg px-2 py-0.5 text-xs font-semibold">{r.ficha.Num_Ficha}</span>
        : <span className="text-slate-400 text-xs">Sin ficha</span>,
    },
    { name: "Estado", selector: (r) => r.Est_Usuario, sortable: true, cell: (r) => <EstadoBadge estado={r.Est_Usuario} /> },
    {
      name: "Acciones",
      cell: (row) => (
        <button className="bg-blue-600 text-white border-0 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer flex items-center gap-1 hover:bg-blue-700 transition-colors"
          onClick={() => editUsuario(row)}>
          <Pencil size={12} /> Editar
        </button>
      ),
    },
  ];

  useEffect(() => { getAllUsuarios(); }, []);

  const getAllUsuarios = async () => {
    try {
      const res = await apiAxios.get("/api/Usuarios/");
      setUsuarios(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al obtener Usuarios:", error);
    }
  };

  const editUsuario = (row) => { setSelected(row); setIsEdit(true); setIsModalOpen(true); };
  const hideModal   = ()    => { setIsModalOpen(false); setSelected(null); setIsEdit(false); };

  const handleExportar = async () => {
    setExportando(true);
    try {
      exportarUsuariosExcel(filterText ? newList : Usuarios);
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
    headRow:    { style: { background: "#f8fafc", fontSize: 12, fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb", textTransform: "uppercase", letterSpacing: "0.05em" } },
    rows:       { style: { fontSize: 13, borderBottom: "1px solid #f3f4f6", "&:hover": { background: "#f0f9ff" } } },
    pagination: { style: { borderTop: "1px solid #e5e7eb", fontSize: 13 } },
  };

  return (
    <>
      <div className="w-full h-full flex flex-col bg-slate-50 min-h-0">

        {/* ── Header / Toolbar ── */}
        <div className="bg-white border-b border-slate-100 px-5 py-4 shrink-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                <Users size={18} className="text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-slate-800 text-base m-0">Usuarios</h1>
                <p className="text-xs text-slate-400 m-0">{Usuarios.length} registros</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setImportModal(true)}
                className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border-0 rounded-xl px-3.5 py-2 text-[13px] font-semibold cursor-pointer hover:bg-emerald-200 transition-colors">
                <Upload size={14} /> Importar Excel
              </button>
              <button onClick={handleExportar} disabled={exportando || Usuarios.length === 0}
                className="flex items-center gap-1.5 bg-blue-100 text-blue-700 border-0 rounded-xl px-3.5 py-2 text-[13px] font-semibold cursor-pointer hover:bg-blue-200 transition-colors disabled:opacity-50">
                <FileDown size={14} />
                <span className="hidden sm:inline">{exportando ? "Exportando..." : "Exportar"}</span>
              </button>
              <button onClick={() => { setSelected(null); setIsEdit(false); setIsModalOpen(true); }}
                className="flex items-center gap-1.5 bg-blue-600 text-white border-0 rounded-xl px-4 py-2 text-[13px] font-semibold cursor-pointer hover:bg-blue-700 transition-colors shadow-sm">
                <Plus size={14} /> Nuevo
              </button>
            </div>
          </div>
          <div className="mt-3 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Buscar por nombre, documento o ficha..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all"
              value={filterText} onChange={(e) => setFilterText(e.target.value)} />
          </div>
        </div>

        {/* ── Contenido ── */}
        <div className="flex-1 overflow-y-auto">
          {isMobile ? (
            <div className="p-3 flex flex-col gap-2">
              {newList.length === 0
                ? <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Users size={40} className="opacity-30 mb-2" />
                    <p className="text-sm">No hay usuarios para mostrar</p>
                  </div>
                : newList.map((u) => (
                  <UsuarioCard key={u.Id_Usuario} usuario={u} onEdit={editUsuario}
                    onView={(usr) => { setDetalle(usr); setDetalleOpen(true); }} />
                ))}
            </div>
          ) : (
            <div className="p-5">
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <DataTable columns={columnsTable} data={newList} keyField="Id_Usuario"
                  pagination highlightOnHover striped customStyles={customStyles}
                  noDataComponent={
                    <div className="flex flex-col items-center py-12 text-slate-400">
                      <Users size={32} className="opacity-30 mb-2" />
                      <p className="text-[13px]">No hay usuarios para mostrar</p>
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
        <DetalleModal usuario={usuarioDetalle} onClose={() => setDetalleOpen(false)} onEdit={editUsuario} />
      )}

      {/* ── Modal importar ── */}
      {importModal && (
        <ImportarExcel onClose={() => setImportModal(false)} reload={getAllUsuarios} />
      )}

      {/* ── Modal crear / editar ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={hideModal} />

          {/* Tarjeta del modal */}
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden z-10">

            {/* Cabecera */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0">
              <h2 className="font-semibold text-slate-800 text-[15px] m-0 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  {isEdit
                    ? <Pencil size={13} className="text-blue-700" />
                    : <Plus   size={13} className="text-blue-700" />}
                </div>
                {isEdit ? "Editar Usuario" : "Nuevo Usuario"}
              </h2>
              <button onClick={hideModal}
                className="bg-slate-100 border-0 rounded-lg p-2 cursor-pointer text-slate-500 flex items-center hover:bg-slate-200 transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* Cuerpo con el formulario */}
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