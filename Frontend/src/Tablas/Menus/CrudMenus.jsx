// Frontend/src/Tablas/Menus/CrudMenus.jsx
// Modulo de gestion y programacion de Menus diarios en Foodsys.
// Incluye botones de exportacion universal a Excel y PDF con confirmacion inteligente,
// agrupacion por fecha y tipo de comida, guia interactiva y diseno responsivo.
// Codigo comentado didacticamente sin tildes ni emojis para aprendices de primer semestre.

import apiAxios from "../../api/axiosConfig";
import { useState, useEffect } from "react";
import {
  Plus, X, Search, ChefHat, Pencil, Trash2, Calendar,
  Coffee, Sun, Moon, Undo2, Upload, FileText, HelpCircle,
  ChevronDown, ChevronUp
} from "lucide-react";
import toast from "react-hot-toast";
import { exportarAExcel, exportarAPDF, confirmarExportacion } from "../../utils/exportUtils";
import GlobalLoader from "../../Components/GlobalLoader";
import DescripcionExpandible from "../../Components/DescripcionExpandible";

const API_URL = import.meta.env.VITE_API_URL || "";

/* ─────────────────────────────────────────
   Configuracion visual por tipo de comida
───────────────────────────────────────── */
const TIPOS = ["Desayuno", "Almuerzo", "Cena"];

const tipoConfig = {
  Desayuno: {
    icon: Coffee,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    headerBg: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800 border border-amber-300",
  },
  Almuerzo: {
    icon: Sun,
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    headerBg: "bg-green-600",
    badge: "bg-green-100 text-green-800 border border-green-300",
  },
  Cena: {
    icon: Moon,
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    headerBg: "bg-indigo-600",
    badge: "bg-indigo-100 text-indigo-800 border border-indigo-300",
  },
};

/* ─────────────────────────────────────────
   Formulario de nuevo / editar menu
───────────────────────────────────────── */
const MenusForm = ({ hideModal, selectedMenu, isEdit, reload, platosDisponibles }) => {
  const [Fec_Menu, setFec_Menu] = useState("");
  const [Tip_Menu, setTip_Menu] = useState("Almuerzo");
  const [platosSeleccionados, setPlatosSeleccionados] = useState([]);
  const [enviando, setEnviando] = useState(false);

  /* Filtrar solo platos fuertes asignables al turno seleccionado */
  const platosFuertes = platosDisponibles.filter(
    (p) =>
      p.Tipo_Item !== "BEBIDA" &&
      (p.Tip_Plato === Tip_Menu || p.Tip_Comida_Item === Tip_Menu)
  );

  useEffect(() => {
    if (isEdit && selectedMenu) {
      setFec_Menu(selectedMenu.Fec_Menu?.slice(0, 10) || "");
      setTip_Menu(selectedMenu.Tip_Menu || "Almuerzo");
      setPlatosSeleccionados(selectedMenu.Id_Plato ? [selectedMenu.Id_Plato] : []);
    } else {
      setFec_Menu("");
      setTip_Menu("Almuerzo");
      setPlatosSeleccionados([]);
    }
  }, [selectedMenu, isEdit]);

  /* Limpiar seleccion al cambiar de turno */
  useEffect(() => {
    if (!isEdit) {
      setPlatosSeleccionados([]);
    }
  }, [Tip_Menu, isEdit]);

  const togglePlato = (id) => {
    setPlatosSeleccionados((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 2) {
        toast.error("El menú solo permite un máximo de 2 opciones de plato.");
        return prev;
      }
      return [...prev, id];
    });
  };

  const gestionarForm = async (e) => {
    e.preventDefault();

    if (!Fec_Menu) {
      toast.error("Selecciona una fecha para el menu");
      return;
    }

    const fechaHoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

    if (Fec_Menu < fechaHoy) {
      toast.error("No se pueden crear menus para fechas pasadas");
      return;
    }

    if (platosSeleccionados.length === 0) {
      toast.error("Debes seleccionar al menos una opción de plato (máximo 2)");
      return;
    }

    if (platosSeleccionados.length > 2) {
      toast.error("El menú solo permite un máximo de 2 opciones de plato.");
      return;
    }

    setEnviando(true);
    try {
      if (!isEdit) {
        await apiAxios.post("/api/Menus", {
          Fec_Menu,
          Tip_Menu,
          platos: platosSeleccionados,
        });
        toast.success(`Menu creado con ${platosSeleccionados.length} opciones de plato`);
      } else {
        await apiAxios.put(`/api/Menus/${selectedMenu.Id_Menu}`, {
          Fec_Menu,
          Tip_Menu,
          Id_Plato: platosSeleccionados[0],
        });
        toast.success("Menu actualizado correctamente");
      }
      reload();
      hideModal();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error al guardar el menu");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={gestionarForm} className="space-y-4">
      {/* Fecha */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Fecha del menu
        </label>
        <input
          type="date"
          value={Fec_Menu}
          onChange={(e) => setFec_Menu(e.target.value)}
          min={new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" })}
          required
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
        />
      </div>

      {/* Tipo de comida */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Tipo de comida
        </label>
        <div className="flex gap-2">
          {TIPOS.map((t) => {
            const c = tipoConfig[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTip_Menu(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  Tip_Menu === t
                    ? `${c.headerBg} text-white border-transparent shadow-sm`
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* SELECCION DE PLATOS FUERTES (MAXIMO 2 OPCIONES) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
            Platos Disponibles (Máximo 2 Opciones)
          </label>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
            platosSeleccionados.length === 2
              ? "bg-amber-100 text-amber-800 border border-amber-300"
              : "bg-emerald-100 text-emerald-800"
          }`}>
            {platosSeleccionados.length} / 2 seleccionados
          </span>
        </div>

        {platosFuertes.length === 0 ? (
          <div className="rounded-xl p-3 text-center bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500 m-0">No hay platos registrados para {Tip_Menu}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {platosFuertes.map((p) => {
              const sel = platosSeleccionados.includes(p.Id_Plato);
              const imgSrc = p.Img_Plato ? `${API_URL}/uploads/${p.Img_Plato}` : null;

              return (
                <button
                  key={p.Id_Plato}
                  type="button"
                  onClick={() => togglePlato(p.Id_Plato)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    sel
                      ? "border-emerald-500 bg-emerald-50 shadow-xs"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  {imgSrc ? (
                    <img src={imgSrc} alt={p.Nom_Plato} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <ChefHat className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 m-0 leading-snug">{p.Nom_Plato}</p>
                    {p.Des_Plato && (
                      <DescripcionExpandible
                        texto={p.Des_Plato}
                        limite={40}
                        color="emerald"
                        className="mt-0.5"
                      />
                    )}
                  </div>
                  {sel && (
                    <div className="shrink-0 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Botones de accion */}
      <div className="flex gap-3 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={hideModal}
          className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs cursor-pointer border-0"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando || platosSeleccionados.length === 0}
          className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border-0 shadow-md shadow-emerald-600/20"
        >
          {enviando && (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          )}
          {isEdit ? "Actualizar Menu" : `Crear Menu (${platosSeleccionados.length} plato${platosSeleccionados.length === 1 ? "" : "s"})`}
        </button>
      </div>
    </form>
  );
};

/* ─────────────────────────────────────────
   Card de menu (agrupado por tipo)
───────────────────────────────────────── */
const MenuCard = ({ menu, onEdit, onDelete, ocultarEditar, ocultarEliminar }) => {
  const cfg = tipoConfig[menu.Tip_Menu] || tipoConfig.Almuerzo;
  const Icon = cfg.icon;
  const imgSrc = menu.plato?.Img_Plato
    ? `${API_URL}/uploads/${menu.plato.Img_Plato}`
    : null;

  return (
    <div className={`rounded-2xl border ${cfg.border} overflow-hidden shadow-xs hover:shadow-md transition-shadow`}>
      <div className={`${cfg.bg} px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${cfg.color}`} />
          <span className={`text-sm font-semibold ${cfg.color}`}>{menu.Tip_Menu}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {!ocultarEditar && (
            <button
              onClick={() => onEdit(menu)}
              title="Editar menu"
              className="text-xs bg-white/70 hover:bg-white text-gray-700 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors font-medium cursor-pointer shadow-xs border-0"
            >
              <Pencil className="w-3 h-3 text-blue-600" /> Editar
            </button>
          )}
          {!ocultarEliminar && (
            <button
              onClick={() => onDelete(menu)}
              title="Eliminar menu (si nadie ha realizado reservas)"
              className="text-xs bg-white/70 hover:bg-rose-50 text-rose-600 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors font-medium cursor-pointer shadow-xs border border-transparent hover:border-rose-200"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            </button>
          )}
        </div>
      </div>
      <div className="bg-white p-3 flex items-center gap-3">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={menu.plato?.Nom_Plato}
            className="w-14 h-14 object-cover rounded-xl shrink-0 border border-slate-100"
          />
        ) : (
          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
            <ChefHat className="w-6 h-6 text-gray-300" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate m-0">
            {menu.plato?.Nom_Plato || "Sin plato"}
          </p>
          {menu.plato?.Des_Plato && (
            <p className="text-xs text-gray-400 truncate m-0 mt-0.5">{menu.plato.Des_Plato}</p>
          )}
          <p className="text-xs text-gray-400 mt-1 m-0">ID #{menu.Id_Menu}</p>
        </div>
      </div>
    </div>
  );
};

/* ───────────────────────────────────────────
   Componente principal: CrudMenus
─────────────────────────────────────────── */
const CrudMenus = ({ soloLectura = false, soloCrear = false }) => {
  const [menus, setMenus] = useState([]);
  const [platos, setPlatos] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [cargando, setCargando] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [exportando, setExportando] = useState(false);
  const [mostrarGuia, setMostrarGuia] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resMenus, resPlatos] = await Promise.allSettled([
        apiAxios.get("/api/Menus"),
        apiAxios.get("/api/platos"),
      ]);

      if (resMenus.status === "fulfilled") {
        setMenus(Array.isArray(resMenus.value.data) ? resMenus.value.data : []);
      }
      if (resPlatos.status === "fulfilled") {
        setPlatos(Array.isArray(resPlatos.value.data) ? resPlatos.value.data : []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar los menus");
    } finally {
      setCargando(false);
    }
  };

  const editMenu = (row) => {
    setSelectedMenu(row);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const deleteMenuHandler = (menu) => {
    const nombrePlato = menu.plato?.Nom_Plato || "este plato";

    toast(
      (t) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 320, padding: "4px 2px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "#fee2e2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Trash2 size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, color: "#1e293b", fontSize: 14, margin: 0 }}>
                ¿Eliminar menu?
              </p>
              <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0 0", lineHeight: 1.3 }}>
                <strong>{nombrePlato}</strong> &middot; {menu.Tip_Menu} ({menu.Fec_Menu})
              </p>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0 0" }}>
                Solo se eliminara si ningun aprendiz ha realizado reservas para esta opcion.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                toast("Eliminacion cancelada", {
                  icon: <Undo2 size={16} className="text-slate-500" />,
                  duration: 1500,
                });
              }}
              style={{
                background: "#f1f5f9",
                color: "#475569",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.15s",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const toastId = toast.loading("Eliminando menu...");
                try {
                  await apiAxios.delete(`/api/Menus/${menu.Id_Menu}`);
                  toast.success("Menu eliminado correctamente", { id: toastId });
                  cargarDatos();
                } catch (err) {
                  toast.error(err?.response?.data?.message || "No se pudo eliminar el menu", { id: toastId });
                }
              }}
              style={{
                background: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "6px 16px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                transition: "background 0.15s",
              }}
            >
              Confirmar
            </button>
          </div>
        </div>
      ),
      { duration: 8000 }
    );
  };

  const hideModal = () => {
    setIsModalOpen(false);
    setSelectedMenu(null);
    setIsEdit(false);
  };

  /* Filtrar y agrupar */
  const menusFiltrados = menus.filter((m) => {
    const t = filterText.toLowerCase();
    const matchText =
      m.Fec_Menu?.includes(t) ||
      m.Tip_Menu?.toLowerCase().includes(t) ||
      m.plato?.Nom_Plato?.toLowerCase().includes(t);
    const matchTipo = filtroTipo === "Todos" || m.Tip_Menu === filtroTipo;
    return matchText && matchTipo;
  });

  const tieneFiltrosActivos = Boolean(filterText || filtroTipo !== "Todos");

  // Exportar a Excel con confirmacion inteligente
  const handleExportarExcel = async () => {
    if (menus.length === 0) {
      toast.error("No hay menus para exportar.");
      return;
    }

    const decision = await confirmarExportacion({
      totalOriginal: menus.length,
      totalFiltrado: menusFiltrados.length,
      tieneFiltrosActivos,
      formato: "Excel",
      nombreModulo: "menus"
    });

    if (!decision) return;

    setExportando(true);
    try {
      const registros = decision === "filtrados" ? menusFiltrados : menus;

      const datosFormateados = registros.map((m) => ({
        "ID Menu": m.Id_Menu,
        "Fecha del Menu": m.Fec_Menu || "",
        "Tipo de Comida": m.Tip_Menu || "",
        "ID Plato": m.Id_Plato || "",
        "Plato Asignado": m.plato?.Nom_Plato || "Sin plato",
        "Descripcion Plato": m.plato?.Des_Plato || "",
        "Fecha Creacion": m.createdat ? new Date(m.createdat).toLocaleString("es-CO") : "",
        "Ultima Actualizacion": m.updatedat ? new Date(m.updatedat).toLocaleString("es-CO") : ""
      }));

      const fecha = new Date().toISOString().split("T")[0];
      exportarAExcel({
        datos: datosFormateados,
        nombreArchivo: `Foodsys_Menus_${decision}_${fecha}.xlsx`,
        nombreHoja: "Menus"
      });

      toast.success(`Archivo Excel exportado con ${registros.length} menus.`);
    } catch (err) {
      console.error("Error al exportar Excel:", err);
      toast.error("Error al generar el archivo Excel.");
    } finally {
      setExportando(false);
    }
  };

  // Exportar a PDF con confirmacion inteligente
  const handleExportarPDF = async () => {
    if (menus.length === 0) {
      toast.error("No hay menus para exportar.");
      return;
    }

    const decision = await confirmarExportacion({
      totalOriginal: menus.length,
      totalFiltrado: menusFiltrados.length,
      tieneFiltrosActivos,
      formato: "PDF",
      nombreModulo: "menus"
    });

    if (!decision) return;

    setExportando(true);
    try {
      const registros = decision === "filtrados" ? menusFiltrados : menus;

      const columnasPDF = [
        { header: "Fecha", dataKey: "fecha" },
        { header: "Tipo", dataKey: "tipo" },
        { header: "Plato Asignado", dataKey: "plato" },
        { header: "ID Menu", dataKey: "id" }
      ];

      const filasPDF = registros.map((m) => ({
        fecha: m.Fec_Menu || "—",
        tipo: m.Tip_Menu || "—",
        plato: m.plato?.Nom_Plato || "Sin plato",
        id: m.Id_Menu
      }));

      const fecha = new Date().toISOString().split("T")[0];
      exportarAPDF({
        titulo: "Programacion Institucional de Menus",
        subtitulo: `Centro Agropecuario "La Granja" - Registros: ${registros.length} (${decision})`,
        columnas: columnasPDF,
        datos: filasPDF,
        nombreArchivo: `Foodsys_Menus_${decision}_${fecha}.pdf`,
        orientacion: "portrait"
      });

      toast.success(`Archivo PDF generado con ${registros.length} menus.`);
    } catch (err) {
      console.error("Error al exportar PDF:", err);
      toast.error("Error al generar el documento PDF.");
    } finally {
      setExportando(false);
    }
  };

  /* Agrupar por fecha */
  const menusPorFecha = menusFiltrados.reduce((acc, m) => {
    if (!acc[m.Fec_Menu]) acc[m.Fec_Menu] = [];
    acc[m.Fec_Menu].push(m);
    return acc;
  }, {});
  const fechasOrdenadas = Object.keys(menusPorFecha).sort((a, b) => b.localeCompare(a));

  return (
    <div className="w-full flex flex-col gap-4 p-3 sm:p-5 bg-slate-50 min-h-screen">
      {/* Guia Didactica */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <button
          onClick={() => setMostrarGuia(!mostrarGuia)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 border-0 cursor-pointer text-left transition-colors hover:from-emerald-100 hover:to-green-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-green-600 text-white flex items-center justify-center">
              <HelpCircle size={18} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm m-0">¿Como programar los Menus? (Guia paso a paso)</p>
              <p className="text-xs text-slate-500 m-0">Aprende a programar opciones de comidas diarias y exportar la minuta</p>
            </div>
          </div>
          {mostrarGuia ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {mostrarGuia && (
          <div className="p-4 bg-white border-t border-slate-100 text-xs text-slate-600 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="font-bold text-green-700 uppercase tracking-wide">1. Regla de 2 Platos</p>
              <p>Cada menu debe contar con exactamente 2 opciones de platos diferentes para que los aprendices elijan su preferencia.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-teal-700 uppercase tracking-wide">2. Anticipacion</p>
              <p>Programa los menus con anticipacion. Los aprendices tienen plazo hasta las 6:30 PM del dia anterior para reservar.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-blue-700 uppercase tracking-wide">3. Exportar Minuta</p>
              <p>Descarga la minuta en Excel o PDF para control del supervisor del contrato y el equipo de cocina.</p>
            </div>
          </div>
        )}
      </div>

      {/* Panel Principal */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <ChefHat size={18} />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 text-base sm:text-lg m-0">Programacion de Menus</h1>
                <p className="text-xs text-slate-500 m-0">{menus.length} opciones programadas</p>
              </div>
            </div>

            {/* Botones de Accion */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleExportarExcel}
                disabled={exportando || menus.length === 0}
                className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer hover:bg-blue-100 transition-colors disabled:opacity-50"
                title="Exportar menus a Excel"
              >
                <Upload size={14} /> {exportando ? "Exportando..." : "Exportar Excel"}
              </button>

              <button
                onClick={handleExportarPDF}
                disabled={exportando || menus.length === 0}
                className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer hover:bg-rose-100 transition-colors disabled:opacity-50"
                title="Exportar minuta a PDF"
              >
                <FileText size={14} /> Exportar PDF
              </button>

              {!soloLectura && (
                <button
                  onClick={() => { setSelectedMenu(null); setIsEdit(false); setIsModalOpen(true); }}
                  className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white border-0 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                >
                  <Plus size={14} /> Nuevo Menu
                </button>
              )}
            </div>
          </div>

          {/* Busqueda y Filtros */}
          <div className="flex gap-2 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por fecha (YYYY-MM-DD), tipo o nombre de plato..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-green-400 focus:outline-none transition-all"
              />
            </div>
            <div className="flex gap-1.5 items-center flex-wrap">
              {["Todos", ...TIPOS].map((t) => (
                <button
                  key={t}
                  onClick={() => setFiltroTipo(t)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    filtroTipo === t
                      ? "bg-green-600 text-white border-transparent shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contenido agrupado por fecha */}
        <div className="p-4 sm:p-6 space-y-6">
          {cargando ? (
            <div className="p-12 flex justify-center">
              <GlobalLoader mensaje="Cargando programacion de menus..." />
            </div>
          ) : fechasOrdenadas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <ChefHat size={36} className="opacity-20 mb-2" />
              <p className="text-xs">No hay menus registrados para los criterios seleccionados.</p>
            </div>
          ) : (
            fechasOrdenadas.map((fecha) => (
              <div key={fecha} className="space-y-3">
                {/* Encabezado Fecha */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
                    <Calendar size={14} className="text-slate-500" />
                    <span className="text-xs font-bold text-slate-700 capitalize">
                      {new Date(fecha + "T12:00:00").toLocaleDateString("es-CO", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400">
                    {menusPorFecha[fecha].length} opcion{menusPorFecha[fecha].length !== 1 ? "es" : ""}
                  </span>
                </div>

                {/* Grid por Tipo */}
                {TIPOS.map((tipo) => {
                  const menosTipo = menusPorFecha[fecha].filter((m) => m.Tip_Menu === tipo);
                  if (menosTipo.length === 0) return null;

                  const cfg = tipoConfig[tipo];
                  const Icon = cfg.icon;

                  return (
                    <div key={tipo} className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                        <span className={`text-xs font-bold ${cfg.color}`}>{tipo}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                          {menosTipo.length} plato{menosTipo.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {menosTipo.map((menu) => (
                          <MenuCard
                            key={menu.Id_Menu}
                            menu={menu}
                            onEdit={editMenu}
                            onDelete={deleteMenuHandler}
                            ocultarEditar={soloLectura || soloCrear}
                            ocultarEliminar={soloLectura}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal crear / editar */}
      {isModalOpen && !soloLectura && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={hideModal} />
          <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 max-h-[95vh] overflow-hidden flex flex-col animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 shrink-0">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2 m-0">
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                  {isEdit ? <Pencil className="w-3.5 h-3.5 text-green-600" /> : <Plus className="w-3.5 h-3.5 text-green-600" />}
                </div>
                {isEdit ? "Editar Menu" : "Programar Nuevo Menu"}
              </h2>
              <button onClick={hideModal} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors border-0 cursor-pointer text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto flex-1">
              <MenusForm
                hideModal={hideModal}
                selectedMenu={selectedMenu}
                isEdit={isEdit}
                reload={cargarDatos}
                platosDisponibles={platos}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrudMenus;