// Frontend/src/Tablas/Platos/CrudPlatos.jsx
// Modulo de administracion del catalogo de Platos en Foodsys
// Incluye botones de exportacion a Excel y PDF con confirmacion inteligente,
// visor de imagen ampliada, guia interactiva paso a paso y diseno responsivo.
// Codigo comentado didacticamente sin tildes ni emojis para aprendices de primer semestre.

import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import toast from "react-hot-toast";
import apiAxios from "../../api/axiosConfig";
import PlatosForm from "./PlatosForm";
import { exportarAExcel, exportarAPDF, confirmarExportacion } from "../../utils/exportUtils";
import GlobalLoader from "../../Components/GlobalLoader";
import {
  Pencil, Plus, X, ZoomIn, Search, UtensilsCrossed, Image,
  Upload, FileText, HelpCircle, ChevronDown, ChevronUp
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isMobile;
};

const tipoBadge = {
  Desayuno: "bg-amber-50 text-amber-700 border-amber-200",
  Almuerzo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cena:     "bg-indigo-50 text-indigo-700 border-indigo-200",
};

/* ── Card movil ── */
const PlatoCard = ({ plato, onEdit, onZoom }) => {
  const imgSrc = plato.Img_Plato ? `${API_URL}/uploads/${plato.Img_Plato}` : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden active:scale-[0.99] transition-transform">
      <div
        className="relative h-44 bg-slate-100 cursor-pointer group"
        onClick={() => imgSrc && onZoom({ src: imgSrc, alt: plato.Nom_Plato })}
      >
        {imgSrc ? (
          <>
            <img
              src={imgSrc}
              alt={plato.Nom_Plato}
              className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/50 rounded-full p-2">
                <ZoomIn className="w-5 h-5 text-white" />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-300">
            <Image className="w-10 h-10 mb-1" />
            <p className="text-xs">Sin imagen</p>
          </div>
        )}

        <div className="absolute top-2 left-2">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${tipoBadge[plato.Tip_Plato] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
            {plato.Tip_Plato}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 truncate m-0">{plato.Nom_Plato}</p>
            {plato.Des_Plato && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 m-0">{plato.Des_Plato}</p>
            )}
          </div>
          <button
            onClick={() => onEdit(plato)}
            className="shrink-0 flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Pencil size={12} /> Editar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Componente principal ── */
const CrudPlatos = () => {
  const [platos, setPlatos] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [cargando, setCargando] = useState(true);
  const [selectedPlato, setSelectedPlato] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomImg, setZoomImg] = useState(null);
  const [exportando, setExportando] = useState(false);
  const [mostrarGuia, setMostrarGuia] = useState(false);

  const isMobile = useIsMobile();

  useEffect(() => {
    getAllPlatos();
  }, []);

  const getAllPlatos = async () => {
    setCargando(true);
    try {
      const res = await apiAxios.get("/api/Platos/");
      setPlatos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error al cargar platos:", err);
      toast.error("Error al sincronizar catalogo de platos");
    } finally {
      setCargando(false);
    }
  };

  const editPlato = (row) => {
    setSelectedPlato(row);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  // Filtrado de platos
  const newList = platos.filter((p) => {
    const t = filterText.toLowerCase();
    return (
      p.Nom_Plato?.toLowerCase().includes(t) ||
      p.Tip_Plato?.toLowerCase().includes(t) ||
      p.Des_Plato?.toLowerCase().includes(t)
    );
  });

  const tieneFiltrosActivos = Boolean(filterText);

  // Exportar a Excel
  const handleExportarExcel = async () => {
    if (platos.length === 0) {
      toast.error("No hay platos para exportar.");
      return;
    }

    const decision = await confirmarExportacion({
      totalOriginal: platos.length,
      totalFiltrado: newList.length,
      tieneFiltrosActivos,
      formato: "Excel",
      nombreModulo: "platos"
    });

    if (!decision) return;

    setExportando(true);
    try {
      const registros = decision === "filtrados" ? newList : platos;

      const datosFormateados = registros.map((p) => ({
        "ID Plato": p.Id_Plato,
        "Nombre del Plato": p.Nom_Plato || "",
        "Tipo de Comida": p.Tip_Plato || "",
        "Descripcion": p.Des_Plato || "",
        "Nombre Archivo Imagen": p.Img_Plato || "Sin imagen",
        "Fecha Creacion": p.createdat ? new Date(p.createdat).toLocaleString("es-CO") : "",
        "Ultima Actualizacion": p.updatedat ? new Date(p.updatedat).toLocaleString("es-CO") : ""
      }));

      const fecha = new Date().toISOString().split("T")[0];
      exportarAExcel({
        datos: datosFormateados,
        nombreArchivo: `Foodsys_Platos_${decision}_${fecha}.xlsx`,
        nombreHoja: "Platos"
      });

      toast.success(`Archivo Excel exportado con ${registros.length} platos.`);
    } catch (err) {
      console.error("Error al exportar Excel:", err);
      toast.error("Error al generar el archivo Excel.");
    } finally {
      setExportando(false);
    }
  };

  // Exportar a PDF
  const handleExportarPDF = async () => {
    if (platos.length === 0) {
      toast.error("No hay platos para exportar.");
      return;
    }

    const decision = await confirmarExportacion({
      totalOriginal: platos.length,
      totalFiltrado: newList.length,
      tieneFiltrosActivos,
      formato: "PDF",
      nombreModulo: "platos"
    });

    if (!decision) return;

    setExportando(true);
    try {
      const registros = decision === "filtrados" ? newList : platos;

      const columnasPDF = [
        { header: "ID", dataKey: "id" },
        { header: "Nombre del Plato", dataKey: "nombre" },
        { header: "Tipo de Comida", dataKey: "tipo" },
        { header: "Descripcion", dataKey: "descripcion" }
      ];

      const filasPDF = registros.map((p) => ({
        id: p.Id_Plato,
        nombre: p.Nom_Plato || "",
        tipo: p.Tip_Plato || "—",
        descripcion: p.Des_Plato || "—"
      }));

      const fecha = new Date().toISOString().split("T")[0];
      exportarAPDF({
        titulo: "Catalogo Institucional de Platos",
        subtitulo: `Centro Agropecuario "La Granja" - Registros: ${registros.length} (${decision})`,
        columnas: columnasPDF,
        datos: filasPDF,
        nombreArchivo: `Foodsys_Platos_${decision}_${fecha}.pdf`,
        orientacion: "portrait"
      });

      toast.success(`Archivo PDF generado con ${registros.length} platos.`);
    } catch (err) {
      console.error("Error al exportar PDF:", err);
      toast.error("Error al generar el documento PDF.");
    } finally {
      setExportando(false);
    }
  };

  const columnsTable = [
    { name: "ID", selector: (r) => r.Id_Plato, sortable: true, width: "65px" },
    {
      name: "Imagen",
      width: "80px",
      cell: (r) => {
        const imgSrc = r.Img_Plato ? `${API_URL}/uploads/${r.Img_Plato}` : null;
        return imgSrc ? (
          <div
            className="w-10 h-10 rounded-xl overflow-hidden cursor-pointer relative group my-1 border border-slate-200"
            onClick={() => setZoomImg({ src: imgSrc, alt: r.Nom_Plato })}
          >
            <img src={imgSrc} alt={r.Nom_Plato} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300 border border-slate-200">
            <Image size={16} />
          </div>
        );
      },
    },
    {
      name: "Nombre del Plato",
      selector: (r) => r.Nom_Plato,
      sortable: true,
      grow: 2,
      minWidth: "200px",
      cell: (r) => (
        <div className="py-1">
          <p className="font-semibold text-slate-800 text-xs sm:text-sm m-0">{r.Nom_Plato}</p>
          {r.Des_Plato && <p className="text-[11px] text-slate-400 line-clamp-1 m-0">{r.Des_Plato}</p>}
        </div>
      ),
    },
    {
      name: "Tipo de Comida",
      selector: (r) => r.Tip_Plato,
      sortable: true,
      width: "140px",
      cell: (r) => (
        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${tipoBadge[r.Tip_Plato] || "bg-gray-100 text-gray-700"}`}>
          {r.Tip_Plato}
        </span>
      ),
    },
    {
      name: "Acciones",
      width: "110px",
      cell: (row) => (
        <button
          className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors whitespace-nowrap"
          onClick={() => editPlato(row)}
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
        "&:hover": { background: "#fefce8" },
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
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-0 cursor-pointer text-left transition-colors hover:from-amber-100 hover:to-orange-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center">
              <HelpCircle size={18} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm m-0">¿Como gestionar los Platos? (Guia paso a paso)</p>
              <p className="text-xs text-slate-500 m-0">Crea nuevos platos, sube fotografias de comida y exporta a Excel o PDF</p>
            </div>
          </div>
          {mostrarGuia ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {mostrarGuia && (
          <div className="p-4 bg-white border-t border-slate-100 text-xs text-slate-600 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="font-bold text-amber-700 uppercase tracking-wide">1. Catalogo de Alimentos</p>
              <p>Cada plato registrado aqui podra ser asignado en los Menus diarios por el equipo de cocina o la administracion.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-orange-700 uppercase tracking-wide">2. Imagenes Reales</p>
              <p>Puedes subir fotografias en formato JPG o PNG para que los aprendices visualicen el menu antes de reservar.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-emerald-700 uppercase tracking-wide">3. Exportacion</p>
              <p>Genera listados en Excel o PDF para control de minuta y requerimientos de insumos con los proveedores.</p>
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
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                <UtensilsCrossed size={20} />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 text-base sm:text-lg m-0">Catalogo de Platos</h1>
                <p className="text-xs text-slate-500 m-0">{platos.length} platos registrados</p>
              </div>
            </div>

            {/* Botones de Accion */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleExportarExcel}
                disabled={exportando || platos.length === 0}
                className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer hover:bg-blue-100 transition-colors disabled:opacity-50"
                title="Exportar platos a Excel"
              >
                <Upload size={14} /> {exportando ? "Exportando..." : "Exportar Excel"}
              </button>

              <button
                onClick={handleExportarPDF}
                disabled={exportando || platos.length === 0}
                className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer hover:bg-rose-100 transition-colors disabled:opacity-50"
                title="Exportar platos a PDF"
              >
                <FileText size={14} /> Exportar PDF
              </button>

              <button
                onClick={() => { setSelectedPlato(null); setIsEdit(false); setIsModalOpen(true); }}
                className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer transition-colors shadow-sm"
              >
                <Plus size={14} /> Nuevo Plato
              </button>
            </div>
          </div>

          {/* Busqueda */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, tipo o descripcion del plato..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-amber-400 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Contenido (Cards en movil o DataTable en escritorio) */}
        <div className="overflow-x-auto">
          {cargando ? (
            <div className="p-12 flex justify-center">
              <GlobalLoader mensaje="Cargando catalogo de platos..." />
            </div>
          ) : isMobile ? (
            <div className="p-3 grid grid-cols-1 gap-3">
              {newList.map((p) => (
                <PlatoCard key={p.Id_Plato} plato={p} onEdit={editPlato} onZoom={setZoomImg} />
              ))}
              {newList.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">No hay platos para mostrar.</div>
              )}
            </div>
          ) : (
            <DataTable
              columns={columnsTable}
              data={newList}
              keyField="Id_Plato"
              pagination
              highlightOnHover
              responsive
              customStyles={customStyles}
              noDataComponent={
                <div className="flex flex-col items-center py-12 text-slate-400">
                  <UtensilsCrossed size={32} className="opacity-20 mb-2" />
                  <p className="text-xs">No se encontraron platos registrados.</p>
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* Modal Zoom Imagen */}
      {zoomImg && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setZoomImg(null)}
        >
          <div className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img src={zoomImg.src} alt={zoomImg.alt} className="w-full max-h-[75vh] object-contain bg-black/5" />
            <div className="p-4 flex items-center justify-between border-t border-slate-100">
              <p className="font-bold text-slate-800 text-sm m-0">{zoomImg.alt}</p>
              <button
                onClick={() => setZoomImg(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 border-0 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden z-10">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-base m-0">
                {isEdit ? "Actualizar Plato" : "Registrar Nuevo Plato"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <PlatosForm
                hideModal={() => setIsModalOpen(false)}
                selectedPlato={selectedPlato}
                isEdit={isEdit}
                reload={getAllPlatos}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrudPlatos;