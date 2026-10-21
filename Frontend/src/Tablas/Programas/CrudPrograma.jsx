// Frontend/src/Tablas/Programas/CrudPrograma.jsx
// Modulo de gestion y administracion de Programas de Formacion en Foodsys.
// Incluye botones de exportacion universal a Excel y PDF con confirmacion inteligente,
// guia interactiva paso a paso, activacion e inactivacion no destructiva y diseno responsivo.
// Codigo comentado didacticamente sin tildes ni emojis para aprendices de primer semestre.

import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import toast from "react-hot-toast";
import apiNode from "../../api/axiosConfig";
import ProgramaForm from "./ProgramaForm.jsx";
import ImportarProgramas from "./ImportarProgramas.jsx";
import { exportarAExcel, exportarAPDF, confirmarExportacion } from "../../utils/exportUtils";
import GlobalLoader from "../../Components/GlobalLoader";
import {
  BookOpen, Pencil, Plus, Search, X, Layers, Eye, Download,
  Ban, CheckCircle2, Upload, Undo2, HelpCircle, ChevronDown, ChevronUp, FileText
} from "lucide-react";

/* ── Hook para detectar vista movil ── */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

/* ── Asignacion de colores por nivel de formacion ── */
const nivelColor = (nivel) => {
  const map = {
    TECNOLOGO: "bg-purple-100 text-purple-800 border-purple-200",
    TECNICO: "bg-blue-100 text-blue-800 border-blue-200",
    OPERARIO: "bg-emerald-100 text-emerald-800 border-emerald-200",
    AUXILIAR: "bg-amber-100 text-amber-800 border-amber-200",
    ESPECIALIZACION: "bg-indigo-100 text-indigo-800 border-indigo-200",
  };
  const normalizado = String(nivel || "").toUpperCase();
  return map[normalizado] || "bg-slate-100 text-slate-700 border-slate-200";
};

/* ── Modal Detalle de Programa ── */
const DetalleModal = ({ programa, onClose, onEdit }) => {
  if (!programa) return null;
  const rows = [
    { label: "ID Programa", value: programa.Id_Programa },
    { label: "Nombre", value: programa.Nom_Programa },
    { label: "Area", value: programa.Are_Programa || "General" },
    { label: "Nivel de Formacion", value: programa.NivFor_Programa || "No especificado" },
    { label: "Estado", value: programa.Est_Programa || "Activo" },
    { label: "Fecha Creacion", value: programa.createdat ? new Date(programa.createdat).toLocaleString("es-CO") : "—" },
    { label: "Ultima Actualizacion", value: programa.updatedat ? new Date(programa.updatedat).toLocaleString("es-CO") : "—" },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-700 to-blue-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-indigo-100 font-bold m-0 uppercase tracking-wide">Detalle de Programa</p>
              <h3 className="text-white font-bold text-sm truncate max-w-[200px] m-0">{programa.Nom_Programa}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white border-0 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-3 bg-slate-50">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex justify-between items-start gap-3 py-2 border-b border-gray-100 last:border-0 bg-white p-3 rounded-xl border">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide min-w-[120px]">{label}</span>
              <span className="text-xs text-gray-800 font-semibold text-right">{value || "—"}</span>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100 bg-white">
          <button
            onClick={() => { onEdit(programa); onClose(); }}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer border-0 shadow-sm"
          >
            <Pencil className="w-4 h-4" /> Editar Informacion del Programa
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Tarjeta para Celulares Pequenos ── */
const ProgramaCard = ({ programa, onEdit, onView, onToggleEstado }) => {
  const esActivo = programa.Est_Programa !== "Inactivo";
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 transition-all hover:border-indigo-200">
      <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
        <BookOpen className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-xs sm:text-sm truncate m-0">{programa.Nom_Programa}</p>
        <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1 truncate m-0">
          <Layers className="w-3 h-3 shrink-0" />
          {programa.Are_Programa || "Area General"}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${nivelColor(programa.NivFor_Programa)}`}>
            {programa.NivFor_Programa || "Sin nivel"}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            esActivo ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
          }`}>
            {esActivo ? "Activo" : "Inactivo"}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 shrink-0">
        <button onClick={() => onView(programa)} className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center cursor-pointer border-0 text-gray-500">
          <Eye className="w-4 h-4" />
        </button>
        <button onClick={() => onEdit(programa)} className="w-8 h-8 rounded-xl bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center cursor-pointer border-0 text-indigo-600">
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onToggleEstado(programa)}
          className={`w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer border-0 ${
            esActivo ? "bg-amber-50 hover:bg-amber-100 text-amber-600" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
          }`}
        >
          {esActivo ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

/* ── COMPONENTE PRINCIPAL ── */
const CrudPrograma = () => {
  const [programa, setPrograma] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [cargando, setCargando] = useState(true);

  // Modales
  const [programaSeleccionado, setProgramaSeleccionado] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [progDetalle, setProgDetalle] = useState(null);
  const [importModal, setImportModal] = useState(false);

  // Exportacion
  const [exportando, setExportando] = useState(false);

  // Acordeon didactico
  const [mostrarGuia, setMostrarGuia] = useState(false);

  const isMobile = useIsMobile();

  useEffect(() => {
    getAllPrograma();
  }, []);

  const getAllPrograma = async () => {
    setCargando(true);
    try {
      const res = await apiNode.get("/api/Programa/");
      setPrograma(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error al cargar programas:", err);
      toast.error("Error al sincronizar programas");
    } finally {
      setCargando(false);
    }
  };

  const handleToggleEstado = (prog) => {
    const esActivo = prog.Est_Programa !== "Inactivo";
    const accion = esActivo ? "inactivar" : "activar";

    toast.custom((t) => (
      <div className="max-w-md w-full bg-white shadow-2xl rounded-2xl p-4 border border-slate-200">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            esActivo ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
          }`}>
            {esActivo ? <Ban size={20} /> : <CheckCircle2 size={20} />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-800 m-0">¿{esActivo ? "Inactivar" : "Activar"} programa?</h4>
            <p className="text-xs text-slate-500 mt-1 mb-0 leading-relaxed">
              ¿Confirmas que deseas {accion} el programa <span className="font-semibold text-slate-700">"{prog.Nom_Programa}"</span>?
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              toast("Accion cancelada", { icon: <Undo2 size={16} className="text-slate-500" />, duration: 1500 });
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer border-0"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              procederCambioEstado(prog, esActivo ? "Inactivo" : "Activo");
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm cursor-pointer border-0 ${
              esActivo ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            Si, {accion}
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const procederCambioEstado = async (prog, nuevoEstado) => {
    try {
      await apiNode.patch(`/api/Programa/${prog.Id_Programa}/estado`, { estado: nuevoEstado });
      toast.success(`Programa ${nuevoEstado === "Activo" ? "activado" : "inactivado"} correctamente`);
      getAllPrograma();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al actualizar estado del programa");
    }
  };

  // Filtrado de programas por busqueda
  const newList = programa.filter((p) => {
    const t = filterText.toLowerCase();
    return (
      String(p.Nom_Programa || "").toLowerCase().includes(t) ||
      String(p.Are_Programa || "").toLowerCase().includes(t) ||
      String(p.NivFor_Programa || "").toLowerCase().includes(t)
    );
  });

  const tieneFiltrosActivos = Boolean(filterText);

  // ── Exportar a Excel con Confirmacion Inteligente ──
  const handleExportarExcel = async () => {
    if (programa.length === 0) {
      toast.error("No hay programas para exportar.");
      return;
    }

    const decision = await confirmarExportacion({
      totalOriginal: programa.length,
      totalFiltrado: newList.length,
      tieneFiltrosActivos,
      formato: "Excel",
      nombreModulo: "programas"
    });

    if (!decision) return;

    setExportando(true);
    try {
      const registros = decision === "filtrados" ? newList : programa;

      const datosFormateados = registros.map((p) => ({
        "ID Programa": p.Id_Programa,
        "Nombre Programa": p.Nom_Programa || "",
        "Nivel Formacion": p.NivFor_Programa || "",
        "Area": p.Are_Programa || "",
        "Estado": p.Est_Programa || "Activo",
        "Fecha Creacion": p.createdat ? new Date(p.createdat).toLocaleString("es-CO") : "",
        "Ultima Actualizacion": p.updatedat ? new Date(p.updatedat).toLocaleString("es-CO") : ""
      }));

      const fecha = new Date().toISOString().split("T")[0];
      exportarAExcel({
        datos: datosFormateados,
        nombreArchivo: `Foodsys_Programas_${decision}_${fecha}.xlsx`,
        nombreHoja: "Programas"
      });

      toast.success(`Archivo Excel exportado con ${registros.length} programas.`);
    } catch (err) {
      console.error("Error al exportar Excel:", err);
      toast.error("Error al generar el archivo Excel.");
    } finally {
      setExportando(false);
    }
  };

  // ── Exportar a PDF con Confirmacion Inteligente ──
  const handleExportarPDF = async () => {
    if (programa.length === 0) {
      toast.error("No hay programas para exportar.");
      return;
    }

    const decision = await confirmarExportacion({
      totalOriginal: programa.length,
      totalFiltrado: newList.length,
      tieneFiltrosActivos,
      formato: "PDF",
      nombreModulo: "programas"
    });

    if (!decision) return;

    setExportando(true);
    try {
      const registros = decision === "filtrados" ? newList : programa;

      const columnasPDF = [
        { header: "ID", dataKey: "id" },
        { header: "Nombre Programa", dataKey: "nombre" },
        { header: "Nivel", dataKey: "nivel" },
        { header: "Area", dataKey: "area" },
        { header: "Estado", dataKey: "estado" }
      ];

      const filasPDF = registros.map((p) => ({
        id: p.Id_Programa,
        nombre: p.Nom_Programa || "",
        nivel: p.NivFor_Programa || "—",
        area: p.Are_Programa || "General",
        estado: p.Est_Programa || "Activo"
      }));

      const fecha = new Date().toISOString().split("T")[0];
      exportarAPDF({
        titulo: "Catalogo Institucional de Programas de Formacion",
        subtitulo: `Centro Agropecuario "La Granja" - Registros: ${registros.length} (${decision})`,
        columnas: columnasPDF,
        datos: filasPDF,
        nombreArchivo: `Foodsys_Programas_${decision}_${fecha}.pdf`,
        orientacion: "portrait"
      });

      toast.success(`Archivo PDF generado con ${registros.length} programas.`);
    } catch (err) {
      console.error("Error al exportar PDF:", err);
      toast.error("Error al generar el documento PDF.");
    } finally {
      setExportando(false);
    }
  };

  // Columnas para DataTable
  const columnsTable = [
    { name: "ID", selector: (r) => r.Id_Programa, sortable: true, width: "65px" },
    {
      name: "Nombre Programa",
      selector: (r) => r.Nom_Programa,
      sortable: true,
      grow: 2,
      minWidth: "240px",
      cell: (r) => (
        <div className="flex items-center gap-2.5 py-1.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="font-semibold text-slate-800 text-xs sm:text-sm truncate">{r.Nom_Programa}</span>
        </div>
      ),
    },
    {
      name: "Area",
      selector: (r) => r.Are_Programa,
      sortable: true,
      minWidth: "140px",
      cell: (r) => <span className="text-xs text-slate-600 font-medium whitespace-nowrap">{r.Are_Programa || "General"}</span>,
    },
    {
      name: "Nivel",
      selector: (r) => r.NivFor_Programa,
      sortable: true,
      minWidth: "140px",
      cell: (r) => (
        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${nivelColor(r.NivFor_Programa)}`}>
          {r.NivFor_Programa || "—"}
        </span>
      ),
    },
    {
      name: "Estado",
      selector: (r) => r.Est_Programa,
      sortable: true,
      width: "120px",
      cell: (r) => {
        const esActivo = r.Est_Programa !== "Inactivo";
        return (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
            esActivo ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
          }`}>
            {esActivo ? "Activo" : "Inactivo"}
          </span>
        );
      },
    },
    {
      name: "Acciones",
      minWidth: "180px",
      cell: (row) => {
        const esActivo = row.Est_Programa !== "Inactivo";
        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <button
              className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer inline-flex items-center gap-1 transition-colors"
              onClick={() => { setProgDetalle(row); setDetalleOpen(true); }}
            >
              <Eye className="w-3.5 h-3.5" /> Detalle
            </button>
            <button
              className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer inline-flex items-center gap-1 transition-colors"
              onClick={() => { setProgramaSeleccionado(row); setIsModalOpen(true); }}
            >
              <Pencil className="w-3.5 h-3.5" /> Editar
            </button>
            <button
              className={`rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer inline-flex items-center gap-1 transition-colors ${
                esActivo ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              }`}
              onClick={() => handleToggleEstado(row)}
            >
              {esActivo ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        );
      },
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
        "&:hover": { background: "#f0f9ff" },
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
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-0 cursor-pointer text-left transition-colors hover:from-indigo-100 hover:to-blue-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <HelpCircle size={18} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm m-0">¿Como usar el modulo de Programas? (Guia paso a paso)</p>
              <p className="text-xs text-slate-500 m-0">Administra los programas de formacion y exporta a Excel o PDF</p>
            </div>
          </div>
          {mostrarGuia ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {mostrarGuia && (
          <div className="p-4 bg-white border-t border-slate-100 text-xs text-slate-600 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="font-bold text-indigo-700 uppercase tracking-wide">1. Normalizacion Automatica</p>
              <p>Al importar programas desde Excel o PE-04, el sistema limpia tildes, mayusculas, puntos finales y espacios duplicados para que jamas existan repetidos.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-blue-700 uppercase tracking-wide">2. Memoria en Fichas</p>
              <p>Cada vez que se registra una ficha, el programa queda vinculado automaticamente en la memoria del sistema sin necesidad de digitar codigos manuales.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-emerald-700 uppercase tracking-wide">3. Exportacion</p>
              <p>Descarga el catalogo completo o los programas filtrados en Excel o PDF para auditorias y reportes a Coordinacion Academica.</p>
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
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                <BookOpen size={20} />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 text-base sm:text-lg m-0">Programas de Formacion</h1>
                <p className="text-xs text-slate-500 m-0">{programa.length} programas registrados en el centro</p>
              </div>
            </div>

            {/* Botones de Accion */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setImportModal(true)}
                className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer hover:bg-emerald-100 transition-colors"
                title="Importar programas desde Excel"
              >
                <Download size={14} /> Importar Excel
              </button>

              <button
                onClick={handleExportarExcel}
                disabled={exportando || programa.length === 0}
                className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer hover:bg-blue-100 transition-colors disabled:opacity-50"
                title="Exportar catalogo a Excel"
              >
                <Upload size={14} /> {exportando ? "Exportando..." : "Exportar Excel"}
              </button>

              <button
                onClick={handleExportarPDF}
                disabled={exportando || programa.length === 0}
                className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer hover:bg-rose-100 transition-colors disabled:opacity-50"
                title="Exportar catalogo a PDF"
              >
                <FileText size={14} /> Exportar PDF
              </button>

              <button
                onClick={() => { setProgramaSeleccionado(null); setIsModalOpen(true); }}
                className="inline-flex items-center gap-1.5 bg-indigo-600 text-white rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus size={14} /> Nuevo Programa
              </button>
            </div>
          </div>

          {/* Busqueda */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre de programa, area o nivel de formacion..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-indigo-400 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Contenido (Cards en movil o DataTable en escritorio) */}
        <div className="overflow-x-auto">
          {cargando ? (
            <div className="p-12 flex justify-center">
              <GlobalLoader mensaje="Cargando programas de formacion..." />
            </div>
          ) : isMobile ? (
            <div className="p-3 space-y-2">
              {newList.map((prog) => (
                <ProgramaCard
                  key={prog.Id_Programa}
                  programa={prog}
                  onEdit={(p) => { setProgramaSeleccionado(p); setIsModalOpen(true); }}
                  onView={(p) => { setProgDetalle(p); setDetalleOpen(true); }}
                  onToggleEstado={handleToggleEstado}
                />
              ))}
              {newList.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">No se encontraron programas.</div>
              )}
            </div>
          ) : (
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
                  <BookOpen size={32} className="opacity-20 mb-2" />
                  <p className="text-xs">No se encontraron programas registrados.</p>
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* Modal Detalle */}
      {detalleOpen && (
        <DetalleModal
          programa={progDetalle}
          onClose={() => setDetalleOpen(false)}
          onEdit={(p) => { setProgramaSeleccionado(p); setIsModalOpen(true); }}
        />
      )}

      {/* Modal Importar */}
      {importModal && (
        <ImportarProgramas onClose={() => setImportModal(false)} reload={getAllPrograma} />
      )}

      {/* Modal Crear / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden z-10">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-base m-0">
                {programaSeleccionado ? "Actualizar Programa" : "Registrar Nuevo Programa"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <ProgramaForm
                hideModal={() => setIsModalOpen(false)}
                ProgramaSeleccionado={programaSeleccionado}
                reload={getAllPrograma}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrudPrograma;