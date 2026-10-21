// Frontend/src/Tablas/Fichas/CrudFichas.jsx
// Modulo de gestion de Fichas de formacion con soporte institucional
// Incluye botones universales de exportacion a Excel y PDF con confirmacion inteligente,
// calculo visual del estado de etapa lectiva (Lectiva vs Vencida/Productiva),
// conteo de aprendices asociados, guia de usuario y diseno totalmente responsivo.
// Codigo comentado didacticamente sin tildes ni emojis para aprendices de primer semestre.

import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import toast from "react-hot-toast";
import apiAxios from "../../api/axiosConfig";
import FichasForm from "./FichasForm";
import ImportarFichas from "./ImportarFichas.jsx";
import { exportarAExcel, exportarAPDF, confirmarExportacion } from "../../utils/exportUtils";
import GlobalLoader from "../../Components/GlobalLoader";
import {
  FileText, Pencil, Plus, Search, X, Users,
  Download, Upload, HelpCircle, ChevronDown, ChevronUp,
  Calendar, CheckCircle2, AlertCircle, Clock
} from "lucide-react";

/* ── Modal lista de aprendices por ficha ── */
const AprendicesModal = ({ ficha, aprendices, loading, onClose }) => {
  if (!ficha) return null;
  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center sm:p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10 animate-in fade-in">
        <div className="bg-blue-600 px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Users size={18} className="text-white" />
            </div>
            <div>
              <p className="text-blue-100 text-[10px] uppercase font-bold m-0">Aprendices en ficha</p>
              <h3 className="text-white font-bold text-sm m-0">Ficha #{ficha.Num_Ficha}</h3>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 border-0 cursor-pointer text-white flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <div className="bg-blue-50 px-5 py-2.5 border-b border-blue-100">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">
            {loading ? "Cargando..." : `${aprendices.length} aprendices vinculados`}
          </span>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-2.5">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : aprendices.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-slate-400">
              <Users size={32} className="opacity-20 mb-2" />
              <p className="text-xs">No hay aprendices registrados en esta ficha.</p>
            </div>
          ) : (
            aprendices.map((ap, idx) => {
              const nombre = `${ap.Nom_Usuario || ""} ${ap.Ape_Usuario || ""}`.trim();
              return (
                <div key={ap.Id_Usuario || idx} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                    {nombre.charAt(0) || "A"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-xs truncate m-0">{nombre}</p>
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

/* ── Componente Principal: CrudFichas ── */
const CrudFichas = () => {
  const [fichas, setFichas] = useState([]);
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [cargando, setCargando] = useState(true);

  // Modales
  const [selectedFicha, setSelectedFicha] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aprendicesModal, setAprendicesModal] = useState({ open: false, ficha: null });
  const [aprendicesList, setAprendicesList] = useState([]);
  const [aprendicesLoading, setAprendicesLoading] = useState(false);
  const [importModal, setImportModal] = useState(false);

  // Exportacion
  const [exportando, setExportando] = useState(false);

  // Acordeon didactico de guia
  const [mostrarGuia, setMostrarGuia] = useState(false);

  const hoyStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resFichas, resUsuarios] = await Promise.allSettled([
        apiAxios.get("/api/Fichas/"),
        apiAxios.get("/api/Usuarios/"),
      ]);

      if (resFichas.status === "fulfilled") {
        setFichas(Array.isArray(resFichas.value.data) ? resFichas.value.data : []);
      }
      if (resUsuarios.status === "fulfilled") {
        setTodosUsuarios(Array.isArray(resUsuarios.value.data) ? resUsuarios.value.data : []);
      }
    } catch (err) {
      console.error("Error al cargar fichas:", err);
      toast.error("Error al sincronizar lista de fichas");
    } finally {
      setCargando(false);
    }
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

  // Filtrado en memoria
  const newList = fichas.filter((f) => {
    const t = filterText.toLowerCase();
    return (
      String(f.Num_Ficha || "").toLowerCase().includes(t) ||
      String(f.programas?.Nom_Programa || "").toLowerCase().includes(t)
    );
  });

  const tieneFiltrosActivos = Boolean(filterText);

  // ── Exportar a Excel con Confirmacion Inteligente ──
  const handleExportarExcel = async () => {
    if (fichas.length === 0) {
      toast.error("No hay fichas para exportar.");
      return;
    }

    const decision = await confirmarExportacion({
      totalOriginal: fichas.length,
      totalFiltrado: newList.length,
      tieneFiltrosActivos,
      formato: "Excel",
      nombreModulo: "fichas"
    });

    if (!decision) return;

    setExportando(true);
    try {
      const registros = decision === "filtrados" ? newList : fichas;

      const datosFormateados = registros.map((f) => {
        const esVencida = f.FecFinLec_Ficha && f.FecFinLec_Ficha < hoyStr;
        const totalAps = contarAprendices(f.Id_Ficha);

        return {
          "ID Ficha": f.Id_Ficha,
          "N° Ficha": f.Num_Ficha,
          "ID Programa": f.Id_Programa || "",
          "Nombre Programa": f.programas?.Nom_Programa || "Sin programa",
          "Nivel Formacion": f.programas?.NivFor_Programa || "",
          "Area Programa": f.programas?.Are_Programa || "",
          "Inicio Etapa Lectiva": f.FecIniLec_Ficha || "",
          "Fin Etapa Lectiva": f.FecFinLec_Ficha || "",
          "Inicio Etapa Practica": f.FecIniPra_Ficha || "",
          "Fin Etapa Practica": f.FecFinPra_Ficha || "",
          "Estado Etapa Lectiva": esVencida ? "Vencida / En Practica" : "En Etapa Lectiva",
          "Total Aprendices": totalAps,
          "Fecha Creacion": f.createdat ? new Date(f.createdat).toLocaleString("es-CO") : "",
          "Ultima Actualizacion": f.updatedat ? new Date(f.updatedat).toLocaleString("es-CO") : ""
        };
      });

      const fecha = new Date().toISOString().split("T")[0];
      exportarAExcel({
        datos: datosFormateados,
        nombreArchivo: `Foodsys_Fichas_${decision}_${fecha}.xlsx`,
        nombreHoja: "Fichas"
      });

      toast.success(`Archivo Excel exportado con ${registros.length} fichas.`);
    } catch (err) {
      console.error("Error al exportar Excel:", err);
      toast.error("Error al generar el archivo Excel.");
    } finally {
      setExportando(false);
    }
  };

  // ── Exportar a PDF con Confirmacion Inteligente ──
  const handleExportarPDF = async () => {
    if (fichas.length === 0) {
      toast.error("No hay fichas para exportar.");
      return;
    }

    const decision = await confirmarExportacion({
      totalOriginal: fichas.length,
      totalFiltrado: newList.length,
      tieneFiltrosActivos,
      formato: "PDF",
      nombreModulo: "fichas"
    });

    if (!decision) return;

    setExportando(true);
    try {
      const registros = decision === "filtrados" ? newList : fichas;

      const columnasPDF = [
        { header: "N° Ficha", dataKey: "num" },
        { header: "Programa", dataKey: "programa" },
        { header: "Nivel", dataKey: "nivel" },
        { header: "Fin Lectiva", dataKey: "finLec" },
        { header: "Estado", dataKey: "estado" },
        { header: "Aprendices", dataKey: "aps" }
      ];

      const filasPDF = registros.map((f) => {
        const esVencida = f.FecFinLec_Ficha && f.FecFinLec_Ficha < hoyStr;
        return {
          num: f.Num_Ficha,
          programa: f.programas?.Nom_Programa || "Sin programa",
          nivel: f.programas?.NivFor_Programa || "—",
          finLec: f.FecFinLec_Ficha || "—",
          estado: esVencida ? "Vencida" : "Lectiva",
          aps: contarAprendices(f.Id_Ficha)
        };
      });

      const fecha = new Date().toISOString().split("T")[0];
      exportarAPDF({
        titulo: "Reporte Institucional de Fichas de Formacion",
        subtitulo: `Centro Agropecuario "La Granja" - Registros: ${registros.length} (${decision})`,
        columnas: columnasPDF,
        datos: filasPDF,
        nombreArchivo: `Foodsys_Fichas_${decision}_${fecha}.pdf`,
        orientacion: "landscape"
      });

      toast.success(`Archivo PDF generado con ${registros.length} fichas.`);
    } catch (err) {
      console.error("Error al exportar PDF:", err);
      toast.error("Error al generar el documento PDF.");
    } finally {
      setExportando(false);
    }
  };

  // Columnas para DataTable
  const columnsTable = [
    { name: "ID", selector: (r) => r.Id_Ficha, sortable: true, width: "65px" },
    {
      name: "N° Ficha",
      selector: (r) => r.Num_Ficha,
      sortable: true,
      minWidth: "110px",
      cell: (r) => (
        <span className="font-bold text-blue-700 text-xs tracking-tight whitespace-nowrap">
          {r.Num_Ficha}
        </span>
      ),
    },
    {
      name: "Programa",
      selector: (r) => r.programas?.Nom_Programa,
      sortable: true,
      grow: 2,
      minWidth: "220px",
      cell: (r) => (
        <div className="flex flex-col py-1">
          <span className="text-xs text-slate-800 font-semibold truncate block max-w-xs" title={r.programas?.Nom_Programa}>
            {r.programas?.Nom_Programa || "Sin programa"}
          </span>
          <span className="text-[11px] text-slate-400">
            {r.programas?.NivFor_Programa || "—"} · {r.programas?.Are_Programa || "General"}
          </span>
        </div>
      ),
    },
    {
      name: "Etapa Lectiva",
      selector: (r) => r.FecFinLec_Ficha,
      sortable: true,
      minWidth: "160px",
      cell: (r) => {
        const esVencida = r.FecFinLec_Ficha && r.FecFinLec_Ficha < hoyStr;
        return (
          <div className="flex flex-col gap-0.5 text-[11px]">
            <span className="text-slate-600 font-medium">
              {r.FecIniLec_Ficha || "—"} al {r.FecFinLec_Ficha || "—"}
            </span>
            <span
              className={`w-fit px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                esVencida
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
            >
              {esVencida ? "Vencida / En Practica" : "En Etapa Lectiva"}
            </span>
          </div>
        );
      },
    },
    {
      name: "Aprendices",
      center: true,
      minWidth: "100px",
      cell: (row) => {
        const count = contarAprendices(row.Id_Ficha);
        return (
          <button
            onClick={() => verAprendices(row)}
            className={`flex items-center gap-1 border-0 rounded-full px-2.5 py-1 text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
              count > 0 ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "bg-slate-100 text-slate-400"
            }`}
            title="Ver aprendices de esta ficha"
          >
            <Users size={12} /> {count}
          </button>
        );
      },
    },
    {
      name: "Acciones",
      minWidth: "100px",
      cell: (row) => (
        <button
          className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors whitespace-nowrap"
          onClick={() => { setSelectedFicha(row); setIsEdit(true); setIsModalOpen(true); }}
        >
          <Pencil size={12} /> Editar
        </button>
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
        "&:hover": { background: "#f0f9ff" },
      },
    },
    pagination: { style: { borderTop: "1px solid #e5e7eb", fontSize: 13 } },
  };

  return (
    <div className="w-full flex flex-col gap-4 p-3 sm:p-5 bg-slate-50 min-h-screen">
      {/* Acordeon Guia de Usuario */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <button
          onClick={() => setMostrarGuia(!mostrarGuia)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-0 cursor-pointer text-left transition-colors hover:from-blue-100 hover:to-indigo-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <HelpCircle size={18} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm m-0">¿Como usar el modulo de Fichas? (Guia paso a paso)</p>
              <p className="text-xs text-slate-500 m-0">Aprende a registrar, importar desde PE-04 y exportar en Excel o PDF</p>
            </div>
          </div>
          {mostrarGuia ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {mostrarGuia && (
          <div className="p-4 bg-white border-t border-slate-100 text-xs text-slate-600 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="font-bold text-blue-700 uppercase tracking-wide">1. Importacion Masiva (PE-04)</p>
              <p>Puedes subir el archivo oficial <strong>PE-04_1.xlsx</strong> directamente. El sistema filtrara unicamente Formacion Titulada y calculara las fechas faltantes restando 6 meses.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-indigo-700 uppercase tracking-wide">2. Vencimiento Automatico</p>
              <p>Al vencer la fecha de etapa lectiva, los aprendices de la ficha pasan a inactivos automaticamente para proteger las reservas del comedor.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-emerald-700 uppercase tracking-wide">3. Exportacion</p>
              <p>Usa <strong>Exportar Excel</strong> o <strong>Exportar PDF</strong> para generar el reporte de fichas respetando los filtros que tengas aplicados en pantalla.</p>
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
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <FileText size={20} />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 text-base sm:text-lg m-0">Gestion de Fichas</h1>
                <p className="text-xs text-slate-500 m-0">{fichas.length} fichas registradas en el sistema</p>
              </div>
            </div>

            {/* Botones de Accion */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setImportModal(true)}
                className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer hover:bg-emerald-100 transition-colors"
                title="Importar fichas desde plantilla o PE-04"
              >
                <Download size={14} /> Importar Excel
              </button>

              <button
                onClick={handleExportarExcel}
                disabled={exportando || fichas.length === 0}
                className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer hover:bg-blue-100 transition-colors disabled:opacity-50"
                title="Exportar fichas a Excel"
              >
                <Upload size={14} /> {exportando ? "Exportando..." : "Exportar Excel"}
              </button>

              <button
                onClick={handleExportarPDF}
                disabled={exportando || fichas.length === 0}
                className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer hover:bg-rose-100 transition-colors disabled:opacity-50"
                title="Exportar fichas a PDF"
              >
                <FileText size={14} /> Exportar PDF
              </button>

              <button
                onClick={() => { setSelectedFicha(null); setIsEdit(false); setIsModalOpen(true); }}
                className="inline-flex items-center gap-1.5 bg-blue-600 text-white rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus size={14} /> Nueva Ficha
              </button>
            </div>
          </div>

          {/* Busqueda */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por numero de ficha o nombre de programa..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-blue-400 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          {cargando ? (
            <div className="p-12 flex justify-center">
              <GlobalLoader mensaje="Cargando listado completo de fichas..." />
            </div>
          ) : (
            <DataTable
              columns={columnsTable}
              data={newList}
              keyField="Id_Ficha"
              pagination
              highlightOnHover
              responsive
              customStyles={customStyles}
              noDataComponent={
                <div className="flex flex-col items-center py-12 text-slate-400">
                  <FileText size={32} className="opacity-20 mb-2" />
                  <p className="text-xs">No se encontraron fichas registradas.</p>
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* Modal aprendices */}
      {aprendicesModal.open && (
        <AprendicesModal
          ficha={aprendicesModal.ficha}
          aprendices={aprendicesList}
          loading={aprendicesLoading}
          onClose={() => setAprendicesModal({ open: false, ficha: null })}
        />
      )}

      {/* Modal importar Excel */}
      {importModal && (
        <ImportarFichas onClose={() => setImportModal(false)} reload={cargarDatos} />
      )}

      {/* Modal crear / editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden z-10">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-base m-0">
                {isEdit ? "Actualizar Ficha" : "Registrar Nueva Ficha"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <FichasForm hideModal={() => setIsModalOpen(false)} selectedFicha={selectedFicha} isEdit={isEdit} reload={cargarDatos} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrudFichas;