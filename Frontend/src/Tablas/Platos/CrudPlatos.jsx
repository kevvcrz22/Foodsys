// Frontend/src/Tablas/Platos/CrudPlatos.jsx
// Modulo unificado de administracion de "Platos y Bebidas" (Frias y Calientes) en Foodsys.
// Soporta catalogos ilimitados, optimizacion masiva de imagenes, exportacion a Excel/PDF y diseno 100% responsivo.
// Comentarios didacticos sin tildes ni emojis para aprendices de primer semestre.

import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import toast from "react-hot-toast";
import apiAxios from "../../api/axiosConfig";
import PlatosForm from "./PlatosForm";
import { exportarAExcel, exportarAPDF, confirmarExportacion } from "../../utils/exportUtils";
import GlobalLoader from "../../Components/GlobalLoader";
import DescripcionExpandible from "../../Components/DescripcionExpandible";
import {
  Pencil, Plus, X, ZoomIn, Search, UtensilsCrossed, Image as ImageIcon,
  FileText, HelpCircle, ChevronDown, ChevronUp, Coffee, Snowflake, Flame,
  Sparkles, RefreshCw
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
  Todas:    "bg-sky-50 text-sky-700 border-sky-200"
};

/* ── Card movil de Plato ── */
const ItemCard = ({ item, onEdit, onZoom }) => {
  const imgSrc = item.Img_Plato ? `${API_URL}/uploads/${item.Img_Plato}` : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden active:scale-[0.99] transition-transform">
      <div
        className="relative h-44 bg-slate-100 cursor-pointer group"
        onClick={() => imgSrc && onZoom({ src: imgSrc, alt: item.Nom_Plato })}
      >
        {imgSrc ? (
          <>
            <img
              src={imgSrc}
              alt={item.Nom_Plato}
              className="w-full h-full object-cover group-hover:opacity-85 transition-opacity"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/50 rounded-full p-2">
                <ZoomIn className="w-5 h-5 text-white" />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-300">
            <ImageIcon className="w-10 h-10 mb-1" />
            <p className="text-xs">Sin imagen</p>
          </div>
        )}

        <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${tipoBadge[item.Tip_Plato] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
            {item.Tip_Plato || "Almuerzo"}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-sm m-0 leading-snug">{item.Nom_Plato}</p>
            {item.Des_Plato && (
              <DescripcionExpandible
                texto={item.Des_Plato}
                limite={60}
                color="emerald"
                className="mt-1"
              />
            )}
          </div>
          <button
            onClick={() => onEdit(item)}
            className="shrink-0 flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Pencil size={12} /> Editar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Componente principal de Platos y Bebidas ── */
const CrudPlatos = () => {
  const [items, setItems] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [cargando, setCargando] = useState(true);
  const [selectedPlato, setSelectedPlato] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomImg, setZoomImg] = useState(null);
  const [exportando, setExportando] = useState(false);
  const [optimizando, setOptimizando] = useState(false);
  const [mostrarGuia, setMostrarGuia] = useState(false);

  const isMobile = useIsMobile();

  useEffect(() => {
    getAllItems();
  }, []);

  const getAllItems = async () => {
    setCargando(true);
    try {
      const res = await apiAxios.get("/api/platos/");
      const soloPlatos = (Array.isArray(res.data) ? res.data : []).filter(
        (i) => i.Tipo_Item !== "BEBIDA"
      );
      setItems(soloPlatos);
    } catch (err) {
      console.error("Error al cargar catalogo:", err);
      toast.error("Error al sincronizar el catalogo de platos");
    } finally {
      setCargando(false);
    }
  };

  const handleOptimizarImagenes = async () => {
    setOptimizando(true);
    try {
      const res = await apiAxios.post("/api/platos/optimizar-imagenes");
      const { totalOptimizados = 0, bytesAhorradosKB = 0 } = res.data;
      toast.success(
        `Optimizacion completada: ${totalOptimizados} imagenes comprimidas (${bytesAhorradosKB} KB ahorrados)`,
        { duration: 5000 }
      );
      getAllItems();
    } catch (err) {
      console.error("Error optimizando imagenes:", err);
      toast.error("No se pudo completar la optimizacion de imagenes");
    } finally {
      setOptimizando(false);
    }
  };

  const editItem = (row) => {
    setSelectedPlato(row);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const nuevoItem = () => {
    setSelectedPlato(null);
    setIsEdit(false);
    setIsModalOpen(true);
  };

  // Filtrar luego por texto de busqueda
  const itemsFiltrados = items.filter((p) => {
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
    if (items.length === 0) {
      toast.error("No hay platos para exportar.");
      return;
    }

    const decision = await confirmarExportacion({
      totalOriginal: items.length,
      totalFiltrado: itemsFiltrados.length,
      tieneFiltrosActivos,
      formato: "Excel",
      nombreModulo: "platos"
    });

    if (!decision) return;

    setExportando(true);
    try {
      const registros = decision === "filtrados" ? itemsFiltrados : items;

      const datosFormateados = registros.map((p) => ({
        "ID": p.Id_Plato,
        "Nombre Oficial": p.Nom_Plato || "",
        "Turno de Comida": p.Tip_Plato || "Almuerzo",
        "Descripcion": p.Des_Plato || "",
        "Archivo Imagen": p.Img_Plato || "Sin imagen",
        "Fecha Registro": p.createdAt ? new Date(p.createdAt).toLocaleString("es-CO") : ""
      }));

      const fecha = new Date().toISOString().split("T")[0];
      exportarAExcel({
        datos: datosFormateados,
        nombreArchivo: `Foodsys_Platos_${decision}_${fecha}.xlsx`,
        nombreHoja: "Platos"
      });
      toast.success("Archivo Excel descargado exitosamente");
    } catch (err) {
      console.error(err);
      toast.error("Error al exportar a Excel");
    } finally {
      setExportando(false);
    }
  };

  // Columnas para DataTable de escritorio
  const columns = [
    {
      name: "Foto",
      width: "80px",
      cell: (row) => {
        const imgSrc = row.Img_Plato ? `${API_URL}/uploads/${row.Img_Plato}` : null;
        return imgSrc ? (
          <div
            onClick={() => setZoomImg({ src: imgSrc, alt: row.Nom_Plato })}
            className="w-11 h-11 rounded-xl overflow-hidden cursor-pointer relative group border border-slate-200"
          >
            <img src={imgSrc} alt={row.Nom_Plato} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn size={14} className="text-white" />
            </div>
          </div>
        ) : (
          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300 border border-slate-200">
            <ImageIcon size={18} />
          </div>
        );
      }
    },
    {
      name: "Nombre del Plato",
      selector: (row) => row.Nom_Plato,
      sortable: true,
      cell: (row) => (
        <div className="py-2 min-w-0 max-w-sm">
          <p className="font-bold text-slate-800 text-sm m-0">{row.Nom_Plato}</p>
          {row.Des_Plato && (
            <DescripcionExpandible
              texto={row.Des_Plato}
              limite={50}
              color="emerald"
              className="mt-0.5"
            />
          )}
        </div>
      )
    },
    {
      name: "Turno Asignado",
      selector: (row) => row.Tip_Plato,
      sortable: true,
      width: "150px",
      cell: (row) => {
        const comida = row.Tip_Plato || "Almuerzo";
        return (
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${tipoBadge[comida] || "bg-gray-100 text-gray-700"}`}>
            {comida}
          </span>
        );
      }
    },
    {
      name: "Acciones",
      width: "100px",
      cell: (row) => (
        <button
          onClick={() => editItem(row)}
          className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <Pencil size={12} /> Editar
        </button>
      )
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Encabezado Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <UtensilsCrossed size={16} /> Catalogo Oficial del Comedor
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight m-0">
            Administración de Platos
          </h1>
          <p className="text-sm text-slate-500 mt-1 m-0">
            Administra los platos del comedor para Desayuno, Almuerzo y Cena con soporte de fotos e ingredientes.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOptimizarImagenes}
            disabled={optimizando}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer border border-slate-200"
            title="Comprime todas las imagenes pesadas a formato WebP ligero"
          >
            <Sparkles size={14} className={optimizando ? "animate-spin text-amber-500" : "text-amber-500"} />
            <span>{optimizando ? "Optimizando..." : "Optimizar Imagenes"}</span>
          </button>

          <button
            onClick={nuevoItem}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Nuevo Plato</span>
          </button>
        </div>
      </div>

      {/* Buscador y Exportaciones */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar platos por nombre o turno..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportarExcel}
            disabled={exportando}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileText size={14} /> Exportar Excel
          </button>
          <button
            onClick={getAllItems}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Refrescar datos"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Contenido: Cards en movil o Tabla en escritorio */}
      {cargando ? (
        <GlobalLoader />
      ) : itemsFiltrados.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
          <p className="text-slate-400 font-semibold text-sm m-0">
            No se encontraron platos registrados.
          </p>
        </div>
      ) : isMobile ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {itemsFiltrados.map((item) => (
            <ItemCard key={item.Id_Plato} item={item} onEdit={editItem} onZoom={setZoomImg} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <DataTable
            columns={columns}
            data={itemsFiltrados}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 20, 50]}
            highlightOnHover
            noDataComponent={<p className="p-6 text-slate-400 text-sm">Sin registros disponibles</p>}
          />
        </div>
      )}

      {/* Modal Formulario de Creacion / Edicion */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <PlatosForm
              hideModal={() => setIsModalOpen(false)}
              selectedPlato={selectedPlato}
              isEdit={isEdit}
              reload={getAllItems}
            />
          </div>
        </div>
      )}

      {/* Modal de Zoom de Imagen */}
      {zoomImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs cursor-pointer"
          onClick={() => setZoomImg(null)}
        >
          <div className="relative max-w-2xl w-full bg-transparent rounded-2xl overflow-hidden p-2">
            <img
              src={zoomImg.src}
              alt={zoomImg.alt}
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
            />
            <p className="text-white text-center text-sm font-semibold mt-2">{zoomImg.alt}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrudPlatos;