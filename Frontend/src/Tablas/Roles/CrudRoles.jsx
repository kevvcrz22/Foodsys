// Frontend/src/Tablas/Roles/CrudRoles.jsx
// Modulo de administracion de Roles del sistema Foodsys.
// Incluye botones de exportacion a Excel y PDF con confirmacion inteligente,
// guia didactica para administradores y diseno adaptable para movil y escritorio.
// Codigo comentado didacticamente sin tildes ni emojis para aprendices de primer semestre.

import apiNode from "../../api/axiosConfig";
import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import toast from "react-hot-toast";
import RolesForm from "./RolesForm.jsx";
import { exportarAExcel, exportarAPDF, confirmarExportacion } from "../../utils/exportUtils";
import GlobalLoader from "../../Components/GlobalLoader";
import {
  Shield, Eye, Pencil, Plus, Search, X, Hash, Upload, FileText,
  HelpCircle, ChevronDown, ChevronUp
} from "lucide-react";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
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
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col animate-in fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-700 to-purple-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-violet-100 font-bold m-0 uppercase tracking-wide">Detalle de Rol</p>
              <h3 className="text-white font-bold text-sm m-0">{rol.Nom_Rol}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white border-0 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3 bg-slate-50">
          <div className="flex justify-between items-center py-2.5 bg-white p-3 rounded-xl border border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">ID Rol</span>
            <span className="text-xs text-slate-800 font-mono font-bold">#{rol.Id_Rol}</span>
          </div>
          <div className="flex justify-between items-center py-2.5 bg-white p-3 rounded-xl border border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Nombre del Rol</span>
            <span className="text-xs text-violet-700 font-bold">{rol.Nom_Rol}</span>
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 bg-white">
          <button
            onClick={() => { onEdit(rol); onClose(); }}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer border-0 shadow-sm"
          >
            <Pencil className="w-4 h-4" /> Editar Informacion del Rol
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Tarjeta Movil ── */
const RolCard = ({ rol, index, onEdit, onView }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 transition-all hover:border-violet-200">
    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${rolColor(index)} flex items-center justify-center shrink-0 shadow-sm text-white`}>
      <Shield className="w-5 h-5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-bold text-gray-900 text-xs sm:text-sm m-0">{rol.Nom_Rol}</p>
      <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1 m-0">
        <Hash className="w-3 h-3" /> ID #{rol.Id_Rol}
      </p>
    </div>
    <div className="flex flex-col gap-1.5 shrink-0">
      <button onClick={() => onView(rol)} className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center cursor-pointer border-0 text-gray-500">
        <Eye className="w-4 h-4" />
      </button>
      <button onClick={() => onEdit(rol)} className="w-8 h-8 rounded-xl bg-violet-50 hover:bg-violet-100 flex items-center justify-center cursor-pointer border-0 text-violet-600">
        <Pencil className="w-4 h-4" />
      </button>
    </div>
  </div>
);

/* ── Componente Principal: CrudRoles ── */
const CrudRoles = () => {
  const [roles, setRoles] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [cargando, setCargando] = useState(true);
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [rolDetalle, setRolDetalle] = useState(null);
  const [exportando, setExportando] = useState(false);
  const [mostrarGuia, setMostrarGuia] = useState(false);

  const isMobile = useIsMobile();

  useEffect(() => {
    getAllRoles();
  }, []);

  const getAllRoles = async () => {
    setCargando(true);
    try {
      const res = await apiNode.get("/api/Roles/");
      setRoles(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al obtener roles:", error);
      toast.error("Error al cargar la lista de roles");
    } finally {
      setCargando(false);
    }
  };

  const editRol = (row) => { setRolSeleccionado(row); setIsModalOpen(true); };
  const hideModal = () => { setIsModalOpen(false); setRolSeleccionado(null); };

  const newList = roles.filter((p) =>
    p.Nom_Rol.toLowerCase().includes(filterText.toLowerCase())
  );

  const tieneFiltrosActivos = Boolean(filterText);

  // Exportar a Excel
  const handleExportarExcel = async () => {
    if (roles.length === 0) {
      toast.error("No hay roles para exportar.");
      return;
    }

    const decision = await confirmarExportacion({
      totalOriginal: roles.length,
      totalFiltrado: newList.length,
      tieneFiltrosActivos,
      formato: "Excel",
      nombreModulo: "roles"
    });

    if (!decision) return;

    setExportando(true);
    try {
      const registros = decision === "filtrados" ? newList : roles;

      const datosFormateados = registros.map((r) => ({
        "ID Rol": r.Id_Rol,
        "Nombre del Rol": r.Nom_Rol || "",
        "Fecha Creacion": r.createdat ? new Date(r.createdat).toLocaleString("es-CO") : "",
        "Ultima Actualizacion": r.updatedat ? new Date(r.updatedat).toLocaleString("es-CO") : ""
      }));

      const fecha = new Date().toISOString().split("T")[0];
      exportarAExcel({
        datos: datosFormateados,
        nombreArchivo: `Foodsys_Roles_${decision}_${fecha}.xlsx`,
        nombreHoja: "Roles"
      });

      toast.success(`Archivo Excel exportado con ${registros.length} roles.`);
    } catch (err) {
      console.error("Error al exportar Excel:", err);
      toast.error("Error al generar el archivo Excel.");
    } finally {
      setExportando(false);
    }
  };

  // Exportar a PDF
  const handleExportarPDF = async () => {
    if (roles.length === 0) {
      toast.error("No hay roles para exportar.");
      return;
    }

    const decision = await confirmarExportacion({
      totalOriginal: roles.length,
      totalFiltrado: newList.length,
      tieneFiltrosActivos,
      formato: "PDF",
      nombreModulo: "roles"
    });

    if (!decision) return;

    setExportando(true);
    try {
      const registros = decision === "filtrados" ? newList : roles;

      const columnasPDF = [
        { header: "ID Rol", dataKey: "id" },
        { header: "Nombre del Rol", dataKey: "nombre" }
      ];

      const filasPDF = registros.map((r) => ({
        id: r.Id_Rol,
        nombre: r.Nom_Rol || ""
      }));

      const fecha = new Date().toISOString().split("T")[0];
      exportarAPDF({
        titulo: "Catalogo Institucional de Roles",
        subtitulo: `Centro Agropecuario "La Granja" - Registros: ${registros.length} (${decision})`,
        columnas: columnasPDF,
        datos: filasPDF,
        nombreArchivo: `Foodsys_Roles_${decision}_${fecha}.pdf`,
        orientacion: "portrait"
      });

      toast.success(`Archivo PDF generado con ${registros.length} roles.`);
    } catch (err) {
      console.error("Error al exportar PDF:", err);
      toast.error("Error al generar el documento PDF.");
    } finally {
      setExportando(false);
    }
  };

  const columnsTable = [
    { name: "ID", selector: (r) => r.Id_Rol, sortable: true, width: "70px" },
    {
      name: "Nombre del Rol",
      selector: (r) => r.Nom_Rol,
      sortable: true,
      grow: 2,
      cell: (r) => (
        <div className="flex items-center gap-2.5 py-1.5">
          <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-semibold text-slate-800 text-xs sm:text-sm">{r.Nom_Rol}</span>
        </div>
      ),
    },
    {
      name: "Acciones",
      width: "150px",
      cell: (row) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <button
            onClick={() => { setRolDetalle(row); setDetalleOpen(true); }}
            className="bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer inline-flex items-center gap-1 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> Detalle
          </button>
          <button
            onClick={() => editRol(row)}
            className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer inline-flex items-center gap-1 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Editar
          </button>
        </div>
      ),
    },
  ];

  const customStyles = {
    headRow: {
      style: {
        background: "#f8fafc",
        fontSize: 11,
        fontWeight: 700,
        color: "#6b7280",
        borderBottom: "1px solid #e5e7eb",
        textTransform: "uppercase",
      },
    },
    rows: {
      style: {
        fontSize: 13,
        borderBottom: "1px solid #f3f4f6",
        "&:hover": { background: "#f5f3ff" },
      },
    },
    pagination: { style: { borderTop: "1px solid #e5e7eb", fontSize: 13 } },
  };

  return (
    <div className="w-full flex flex-col gap-4 p-3 sm:p-5 bg-slate-50 min-h-screen">
      {/* Guia Didactica */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <button
          onClick={() => setMostrarGuia(!mostrarGuia)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-purple-50 border-0 cursor-pointer text-left transition-colors hover:from-violet-100 hover:to-purple-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center">
              <HelpCircle size={18} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm m-0">¿Como gestionar los Roles? (Guia paso a paso)</p>
              <p className="text-xs text-slate-500 m-0">Controla los perfiles de acceso y permisos dentro de Foodsys</p>
            </div>
          </div>
          {mostrarGuia ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {mostrarGuia && (
          <div className="p-4 bg-white border-t border-slate-100 text-xs text-slate-600 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="font-bold text-violet-700 uppercase tracking-wide">1. Perfiles del Sistema</p>
              <p>Define los roles autorizados: Administrador, Coordinador, Bienestar, Supervisor, Cocina, Aprendices y Pasantes.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-purple-700 uppercase tracking-wide">2. Asignacion</p>
              <p>Los roles se vinculan a los usuarios en el modulo de <strong>Asignar Roles</strong> para otorgarles acceso a sus vistas correspondientes.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-emerald-700 uppercase tracking-wide">3. Exportacion</p>
              <p>Genera reportes de roles en Excel o PDF para control de seguridad y permisos de software.</p>
            </div>
          </div>
        )}
      </div>

      {/* Panel Principal */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-sm">
                <Shield size={20} />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 text-base sm:text-lg m-0">Gestion de Roles</h1>
                <p className="text-xs text-slate-500 m-0">{roles.length} roles registrados</p>
              </div>
            </div>

            {/* Botones de Accion */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleExportarExcel}
                disabled={exportando || roles.length === 0}
                className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer hover:bg-blue-100 transition-colors disabled:opacity-50"
                title="Exportar roles a Excel"
              >
                <Upload size={14} /> {exportando ? "Exportando..." : "Exportar Excel"}
              </button>

              <button
                onClick={handleExportarPDF}
                disabled={exportando || roles.length === 0}
                className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer hover:bg-rose-100 transition-colors disabled:opacity-50"
                title="Exportar roles a PDF"
              >
                <FileText size={14} /> Exportar PDF
              </button>

              <button
                onClick={() => { setRolSeleccionado(null); setIsModalOpen(true); }}
                className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer transition-colors shadow-sm"
              >
                <Plus size={14} /> Nuevo Rol
              </button>
            </div>
          </div>

          {/* Busqueda */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre de rol..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-violet-400 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Contenido (Cards en movil o DataTable en escritorio) */}
        <div className="overflow-x-auto">
          {cargando ? (
            <div className="p-12 flex justify-center">
              <GlobalLoader mensaje="Cargando listado de roles..." />
            </div>
          ) : isMobile ? (
            <div className="p-3 space-y-2">
              {newList.map((r, i) => (
                <RolCard
                  key={r.Id_Rol}
                  rol={r}
                  index={i}
                  onEdit={editRol}
                  onView={(rol) => { setRolDetalle(rol); setDetalleOpen(true); }}
                />
              ))}
              {newList.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">No se encontraron roles.</div>
              )}
            </div>
          ) : (
            <DataTable
              columns={columnsTable}
              data={newList}
              keyField="Id_Rol"
              pagination
              highlightOnHover
              responsive
              customStyles={customStyles}
              noDataComponent={
                <div className="flex flex-col items-center py-12 text-slate-400">
                  <Shield size={32} className="opacity-20 mb-2" />
                  <p className="text-xs">No se encontraron roles registrados.</p>
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* Modal Detalle */}
      {detalleOpen && (
        <DetalleModal
          rol={rolDetalle}
          onClose={() => setDetalleOpen(false)}
          onEdit={editRol}
        />
      )}

      {/* Modal Crear / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={hideModal} />
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 max-h-[95vh] overflow-hidden flex flex-col animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 shrink-0">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2 m-0">
                <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                  {rolSeleccionado ? <Pencil className="w-3.5 h-3.5 text-violet-600" /> : <Plus className="w-3.5 h-3.5 text-violet-600" />}
                </div>
                {rolSeleccionado ? "Editar Rol" : "Registrar Nuevo Rol"}
              </h2>
              <button onClick={hideModal} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors border-0 cursor-pointer text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto flex-1">
              <RolesForm hideModal={hideModal} rol={rolSeleccionado} selectedRole={rolSeleccionado} actualizarLista={getAllRoles} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrudRoles;