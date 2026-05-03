import apiAxios from "../../api/axiosConfig";
import { useState, useEffect } from "react";
import { Plus, X, Search, ChefHat, Pencil, Calendar, Coffee, Sun, Moon } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const TIPOS = ["Desayuno", "Almuerzo", "Cena"];

const tipoConfig = {
  Desayuno: {
    icon: Coffee,
    color: "text-amber-700",
    bg:   "bg-amber-50",
    border: "border-amber-200",
    headerBg: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800 border border-amber-300",
  },
  Almuerzo: {
    icon: Sun,
    color: "text-green-700",
    bg:   "bg-green-50",
    border: "border-green-200",
    headerBg: "bg-green-600",
    badge: "bg-green-100 text-green-800 border border-green-300",
  },
  Cena: {
    icon: Moon,
    color: "text-indigo-700",
    bg:   "bg-indigo-50",
    border: "border-indigo-200",
    headerBg: "bg-indigo-600",
    badge: "bg-indigo-100 text-indigo-800 border border-indigo-300",
  },
};

/* ─────────────────────────────────────────
   Formulario de nuevo/editar menú
───────────────────────────────────────── */
const MenusForm = ({ hideModal, selectedMenu, isEdit, reload, platosDisponibles }) => {
  const [Fec_Menu,  setFec_Menu]  = useState("");
  const [Tip_Menu,  setTip_Menu]  = useState("Almuerzo");
  const [platosSeleccionados, setPlatosSeleccionados] = useState([]); // max 2
  const [enviando, setEnviando] = useState(false);

  /* Filtrar platos por tipo */
  const platosFiltrados = platosDisponibles.filter((p) => p.Tip_Plato === Tip_Menu);

  useEffect(() => {
    if (isEdit && selectedMenu) {
      setFec_Menu(selectedMenu.Fec_Menu?.slice(0, 10) || "");
      setTip_Menu(selectedMenu.Tip_Menu || "Almuerzo");
      setPlatosSeleccionados(
        selectedMenu.Id_Plato ? [selectedMenu.Id_Plato] : []
      );
    } else {
      setFec_Menu("");
      setTip_Menu("Almuerzo");
      setPlatosSeleccionados([]);
    }
  }, [selectedMenu, isEdit]);

  /* Limpiar selección cuando cambia el tipo */
  useEffect(() => {
    setPlatosSeleccionados([]);
  }, [Tip_Menu]);

  const togglePlato = (id) => {
    setPlatosSeleccionados((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev; // máx 2
      return [...prev, id];
    });
  };

  const gestionarForm = async (e) => {
    e.preventDefault();

    if (platosSeleccionados.length === 0) {
      alert("Selecciona al menos un plato");
      return;
    }
    if (!Fec_Menu) {
      alert("Selecciona una fecha");
      return;
    }

    setEnviando(true);
    try {
      if (!isEdit) {
        // Crear un registro por cada plato seleccionado
        const promises = platosSeleccionados.map((Id_Plato) =>
          apiAxios.post("/api/menu", { Fec_Menu, Tip_Menu, Id_Plato })
        );
        await Promise.all(promises);
        alert(
          platosSeleccionados.length === 2
            ? "Menú creado con 2 platos correctamente"
            : "Menú creado correctamente"
        );
      } else {
        await apiAxios.put(`/api/menu/${selectedMenu.Id_Menu}`, {
          Fec_Menu,
          Tip_Menu,
          Id_Plato: platosSeleccionados[0],
        });
        alert("Menú actualizado correctamente");
      }
      reload();
      hideModal();
    } catch (err) {
      alert(err?.response?.data?.message || "Error al guardar");
    } finally {
      setEnviando(false);
    }
  };

  const cfg = tipoConfig[Tip_Menu];

  return (
    <form onSubmit={gestionarForm} className="space-y-4">

      {/* Fecha */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Fecha del menú
        </label>
        <input
          type="date"
          value={Fec_Menu}
          onChange={(e) => setFec_Menu(e.target.value)}
          required
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
        />
      </div>

      {/* Tipo */}
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
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  Tip_Menu === t
                    ? `${c.headerBg} text-white border-transparent`
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selección de platos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Platos — {Tip_Menu}
          </label>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
            {platosSeleccionados.length}/2 seleccionados
          </span>
        </div>

        {platosFiltrados.length === 0 ? (
          <div className={`rounded-xl p-4 text-center ${cfg.bg} border ${cfg.border}`}>
            <p className={`text-sm ${cfg.color}`}>
              No hay platos de {Tip_Menu} disponibles
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
            {platosFiltrados.map((p) => {
              const sel = platosSeleccionados.includes(p.Id_Plato);
              const imgSrc = p.Img_Plato ? `${API_URL}/uploads/${p.Img_Plato}` : null;
              const lleno  = !sel && platosSeleccionados.length >= 2;

              return (
                <button
                  key={p.Id_Plato}
                  type="button"
                  disabled={lleno}
                  onClick={() => togglePlato(p.Id_Plato)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border-2 text-left transition-all ${
                    lleno
                      ? "opacity-40 cursor-not-allowed border-gray-200 bg-gray-50"
                      : sel
                      ? `border-green-500 ${cfg.bg} shadow-sm`
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={p.Nom_Plato}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <ChefHat className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.Nom_Plato}</p>
                    {p.Des_Plato && (
                      <p className="text-xs text-gray-400 truncate">{p.Des_Plato}</p>
                    )}
                  </div>
                  {sel && (
                    <div className="shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {platosSeleccionados.length === 2 && (
          <p className="text-xs text-green-600 font-medium mt-1.5">
            ✓ Máximo de 2 platos seleccionados para este menú
          </p>
        )}
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={hideModal}
          className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando || platosSeleccionados.length === 0}
          className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
        >
          {enviando ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : null}
          {isEdit ? "Actualizar" : "Crear Menú"}
        </button>
      </div>
    </form>
  );
};

/* ─────────────────────────────────────────
   Card de menú (agrupado por tipo)
───────────────────────────────────────── */
const MenuCard = ({ menu, onEdit }) => {
  const cfg    = tipoConfig[menu.Tip_Menu] || tipoConfig.Almuerzo;
  const Icon   = cfg.icon;
  const imgSrc = menu.plato?.Img_Plato
    ? `${API_URL}/uploads/${menu.plato.Img_Plato}`
    : null;

  return (
    <div className={`rounded-2xl border ${cfg.border} overflow-hidden`}>
      <div className={`${cfg.bg} px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${cfg.color}`} />
          <span className={`text-sm font-semibold ${cfg.color}`}>{menu.Tip_Menu}</span>
        </div>
        <button
          onClick={() => onEdit(menu)}
          className="text-xs bg-white/60 hover:bg-white text-gray-600 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors"
        >
          <Pencil className="w-3 h-3" /> Editar
        </button>
      </div>
      <div className="bg-white p-3 flex items-center gap-3">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={menu.plato?.Nom_Plato}
            className="w-14 h-14 object-cover rounded-xl shrink-0"
          />
        ) : (
          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
            <ChefHat className="w-6 h-6 text-gray-300" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">
            {menu.plato?.Nom_Plato || "Sin plato"}
          </p>
          {menu.plato?.Des_Plato && (
            <p className="text-xs text-gray-400 truncate">{menu.plato.Des_Plato}</p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">ID #{menu.Id_Menu}</p>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   Componente principal
───────────────────────────────────────── */
const CrudMenus = () => {
  const [menus,        setMenus]        = useState([]);
  const [platos,       setPlatos]       = useState([]);
  const [filterText,   setFilterText]   = useState("");
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [isEdit,       setIsEdit]       = useState(false);
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [filtroTipo,   setFiltroTipo]   = useState("Todos");

  useEffect(() => {
    getAllMenus();
    getPlatos();
  }, []);

  const getAllMenus = async () => {
    try {
      const res = await apiAxios.get("/api/menu");
      setMenus(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getPlatos = async () => {
    try {
      const res = await apiAxios.get("/api/platos");
      setPlatos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const editMenu = (row) => {
    setSelectedMenu(row);
    setIsEdit(true);
    setIsModalOpen(true);
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

  /* Agrupar por fecha */
  const menusPorFecha = menusFiltrados.reduce((acc, m) => {
    if (!acc[m.Fec_Menu]) acc[m.Fec_Menu] = [];
    acc[m.Fec_Menu].push(m);
    return acc;
  }, {});
  const fechasOrdenadas = Object.keys(menusPorFecha).sort((a, b) => b.localeCompare(a));

  return (
    <>
      <div className="w-full flex flex-col bg-gray-50 min-h-screen">

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center shrink-0">
                <ChefHat className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-base sm:text-lg leading-tight">Menús</h1>
                <p className="text-xs text-gray-400 hidden sm:block">{menus.length} registros</p>
              </div>
            </div>
            <button
              onClick={() => { setSelectedMenu(null); setIsEdit(false); setIsModalOpen(true); }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 sm:px-5 rounded-xl text-sm font-semibold transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo Menú</span>
            </button>
          </div>

          {/* Búsqueda */}
          <div className="flex gap-2 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por fecha, tipo o plato..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
            {/* Filtro tipo */}
            <div className="flex gap-1.5">
              {["Todos", ...TIPOS].map((t) => (
                <button
                  key={t}
                  onClick={() => setFiltroTipo(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    filtroTipo === t
                      ? "bg-green-600 text-white border-transparent"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {t === "Todos" ? "Todos" : t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contenido agrupado por fecha */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          {fechasOrdenadas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300">
              <ChefHat className="w-10 h-10 mb-2" />
              <p className="text-sm">No hay menús registrados</p>
            </div>
          ) : (
            fechasOrdenadas.map((fecha) => (
              <div key={fecha}>
                {/* Encabezado fecha */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-1.5 shadow-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">
                      {new Date(fecha + "T12:00:00").toLocaleDateString("es-CO", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 shrink-0">
                    {menusPorFecha[fecha].length} plato{menusPorFecha[fecha].length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Grid de menús del día agrupados por tipo */}
                {TIPOS.map((tipo) => {
                  const menosTipo = menusPorFecha[fecha].filter((m) => m.Tip_Menu === tipo);
                  if (menosTipo.length === 0) return null;

                  const cfg  = tipoConfig[tipo];
                  const Icon = cfg.icon;

                  return (
                    <div key={tipo} className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                        <span className={`text-sm font-bold ${cfg.color}`}>{tipo}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.badge}`}>
                          {menosTipo.length} plato{menosTipo.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {menosTipo.map((menu) => (
                          <MenuCard key={menu.Id_Menu} menu={menu} onEdit={editMenu} />
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

      {/* Modal crear/editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={hideModal} />
          <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 shrink-0">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                  {isEdit ? <Pencil className="w-3.5 h-3.5 text-green-600" /> : <Plus className="w-3.5 h-3.5 text-green-600" />}
                </div>
                {isEdit ? "Editar Menú" : "Nuevo Menú"}
              </h2>
              <button onClick={hideModal} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto flex-1">
              <MenusForm
                hideModal={hideModal}
                selectedMenu={selectedMenu}
                isEdit={isEdit}
                reload={getAllMenus}
                platosDisponibles={platos}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CrudMenus;