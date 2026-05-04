// Frontend/src/Tablas/Usuarios/Aprendices.jsx
import apiAxios from "../../api/axiosConfig";
import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import UsuariosForm from "./UsuariosForm.jsx";
import {
  Users, Pencil, Search, X,
  CheckCircle, XCircle
} from "lucide-react";

// Genera iniciales para el avatar del usuario
const getInitials = (nom, ape) =>
  `${(nom || "").charAt(0).toUpperCase()}${(ape || "").charAt(0).toUpperCase()}` || "??";

// Asigna un color determinista al avatar basado en el nombre
const avatarColor = (str) => {
  const colors = ["#dbeafe", "#ede9fe", "#d1fae5", "#fef3c7", "#fee2e2", "#cffafe", "#e0e7ff"];
  const text   = ["#1d4ed8", "#6d28d9", "#065f46", "#92400e", "#991b1b", "#0e7490", "#3730a3"];
  let hash = 0;
  for (let i = 0; i < (str || "").length; i++) hash = str.charCodeAt(i) + hash;
  const idx = hash % colors.length;
  return { bg: colors[idx], color: text[idx] };
};

// Componente para mostrar el estado del aprendiz (Activo/Inactivo)
const EstadoBadge = ({ estado }) => {
  const activo = estado === "Activo" || estado === "En Formacion";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${activo ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
      {activo ? <CheckCircle size={11} /> : <XCircle size={11} />}
      {estado || "—"}
    </span>
  );
};

const Aprendices = () => {
  const [Usuarios, setUsuarios] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [filtroReserva, setFiltroReserva] = useState("todos");
  const [selectedUsuario, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cargando, setCargando] = useState(true);
  
  const rolActivo = localStorage.getItem("rolActivo") || "";
  const canToggleSan = rolActivo === "Administrador" || rolActivo === "Coordinador";

  // Cambia el estado de sancion del aprendiz (Inactivar/Reactivar)
  const toggleSancion = async (usuario) => {
    try {
      const nuevaSancion = usuario.Estado_Sancion === 1 ? 0 : 1;
      await apiAxios.put(`/api/Usuarios/${usuario.Id_Usuario}`, { Estado_Sancion: nuevaSancion });
      getAllUsuarios();
    } catch {
      alert("Error al actualizar el estado de sancion");
    }
  };

  const columnsTable = [
    {
      name: "Aprendiz",
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
    {
      name: "Ficha",
      selector: (r) => r.ficha?.Num_Ficha,
      sortable: true,
      cell: (r) => r.ficha?.Num_Ficha
        ? <span className="bg-violet-100 text-violet-700 rounded-lg px-2 py-0.5 text-xs font-semibold">{r.ficha.Num_Ficha}</span>
        : <span className="text-slate-400 text-xs">Sin ficha</span>,
    },
    {
      name: "Programa",
      selector: (r) => r.ficha?.programas?.Nom_Programa,
      sortable: true,
      cell: (r) => <span className="text-[12px] text-slate-600 line-clamp-1">{r.ficha?.programas?.Nom_Programa || "Sin programa"}</span>,
    },
    {
      name: "Reserva",
      center: true,
      cell: (r) => (
        <span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold ${r.tieneReserva ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
          {r.tieneReserva ? r.tipoComida : "Sin reserva"}
        </span>
      ),
    },
    { name: "Estado", selector: (r) => r.Est_Usuario, cell: (r) => <EstadoBadge estado={r.Est_Usuario} /> },
    {
      name: "Acciones",
      cell: (row) => (
        <div className="flex gap-2">
          <button className="bg-blue-600 text-white border-0 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer flex items-center gap-1 hover:bg-blue-700 transition-colors"
            onClick={() => { setSelected(row); setIsEdit(true); setIsModalOpen(true); }}>
            <Pencil size={12} /> Editar
          </button>
          {canToggleSan && (
            <button className={`${row.Estado_Sancion === 1 ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"} text-white border-0 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors`}
              onClick={() => toggleSancion(row)}>
              {row.Estado_Sancion === 1 ? "Reactivar" : "Inactivar"}
            </button>
          )}
        </div>
      ),
    },
  ];

  useEffect(() => { getAllUsuarios(); }, []);

  const getAllUsuarios = async () => {
    setCargando(true);
    try {
      const res = await apiAxios.get("/api/Usuarios/aprendices");
      const aprendices = Array.isArray(res.data) ? res.data : [];

      // Obtener reservas para marcar quienes tienen hoy
      let reservas = [];
      try {
        const resR = await apiAxios.get("/api/Reservas/");
        reservas = Array.isArray(resR.data) ? resR.data : [];
      } catch (err) { console.warn("Error al cargar reservas", err); }

      const hoy = new Date().toISOString().split("T")[0];
      const dataFull = aprendices.map(u => {
        const resHoy = reservas.find(r => r.Id_Usuario === u.Id_Usuario && r.Fec_Reserva === hoy);
        return {
          ...u,
          tieneReserva: !!resHoy,
          tipoComida: resHoy?.Tip_Reserva || ""
        };
      });

      setUsuarios(dataFull);
    } catch (error) {
      console.error("Error al obtener aprendices:", error);
    } finally {
      setCargando(false);
    }
  };

  // Filtrado de la lista por texto y por estado de reserva
  let filtered = Usuarios;
  if (filtroReserva === "con") filtered = filtered.filter(u => u.tieneReserva);
  else if (filtroReserva === "sin") filtered = filtered.filter(u => !u.tieneReserva);

  const newList = filtered.filter((u) => {
    const t = filterText.toLowerCase();
    return (
      String(u.NumDoc_Usuario || "").toLowerCase().includes(t) ||
      String(u.Nom_Usuario    || "").toLowerCase().includes(t) ||
      String(u.Ape_Usuario    || "").toLowerCase().includes(t) ||
      String(u.ficha?.Num_Ficha || "").toLowerCase().includes(t)
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
        
        {/* Toolbar con buscador y filtros */}
        <div className="bg-white border-b border-slate-100 px-5 py-4 shrink-0">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                <Users size={18} className="text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-slate-800 text-base m-0">Aprendices</h1>
                <p className="text-xs text-slate-400 m-0">{cargando ? "Cargando..." : `${Usuarios.length} registros`}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button onClick={() => setFiltroReserva("todos")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${filtroReserva === "todos" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                Todos
              </button>
              <button onClick={() => setFiltroReserva("con")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${filtroReserva === "con" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                Con Reserva
              </button>
              <button onClick={() => setFiltroReserva("sin")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${filtroReserva === "sin" ? "bg-red-500 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                Sin Reserva
              </button>
            </div>
          </div>

          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Buscar aprendiz por nombre, documento o ficha..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all"
              value={filterText} onChange={(e) => setFilterText(e.target.value)} />
          </div>
        </div>

        {/* Tabla de datos */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <DataTable columns={columnsTable} data={newList} keyField="Id_Usuario"
              pagination highlightOnHover striped customStyles={customStyles}
              progressPending={cargando}
              noDataComponent={
                <div className="flex flex-col items-center py-12 text-slate-400">
                  <Users size={32} className="opacity-30 mb-2" />
                  <p className="text-[13px]">No se encontraron aprendices</p>
                </div>
              }
            />
          </div>
        </div>
      </div>

      {/* Modal para Edicion */}
      {isModalOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden z-10">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0">
              <h2 className="font-semibold text-slate-800 text-[15px] m-0">Editar Aprendiz</h2>
              <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 border-0 rounded-lg p-2 cursor-pointer text-slate-500 hover:bg-slate-200">
                <X size={15} />
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto flex-1">
              <UsuariosForm hideModal={() => setIsModalOpen(false)} UsuarioSeleccionado={selectedUsuario} Editar={isEdit} reload={getAllUsuarios} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Aprendices;