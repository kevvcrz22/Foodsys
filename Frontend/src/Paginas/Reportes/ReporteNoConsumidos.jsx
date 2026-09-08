// Paginas/Reportes/ReporteNoConsumidos.jsx
//
// Componente para visualizar y exportar el listado de aprendices que reservaron
// pero NO consumieron sus alimentos (Desayuno, Almuerzo, Cena).
//
// Características:
//   1. Consulta por periodo: Diario, Semanal, Mensual, Anual y Personalizado.
//   2. Filtro por tipo de comida: Todos, Desayuno, Almuerzo, Cena.
//   3. Búsqueda instantánea por nombre, documento o ficha.
//   4. Tarjetas con métricas y contadores de inasistencias.
//   5. Tabla interactiva con datos completos del aprendiz y plato reservado.
//   6. Descargas institucionales en formatos PDF y Excel.
//   7. Integración con Socket.IO para actualización en tiempo real sin recargar página.

import { useState, useEffect, useCallback, useMemo } from "react";
import apiAxios from "../../api/axiosConfig";
import {
  UserX,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Calendar,
  Utensils,
  AlertTriangle,
  Users,
  IdCard,
  Coffee,
  Sun,
  Moon,
} from "lucide-react";
import { useSocketListener } from "../../api/socket";

const PERIODOS = [
  { clave: "diario", etiqueta: "Diario" },
  { clave: "semanal", etiqueta: "Semanal" },
  { clave: "mensual", etiqueta: "Mensual" },
  { clave: "anual", etiqueta: "Anual" },
  { clave: "personalizado", etiqueta: "Personalizado" },
];

const MESES = [
  { num: 1, nombre: "Enero" },
  { num: 2, nombre: "Febrero" },
  { num: 3, nombre: "Marzo" },
  { num: 4, nombre: "Abril" },
  { num: 5, nombre: "Mayo" },
  { num: 6, nombre: "Junio" },
  { num: 7, nombre: "Julio" },
  { num: 8, nombre: "Agosto" },
  { num: 9, nombre: "Septiembre" },
  { num: 10, nombre: "Octubre" },
  { num: 11, nombre: "Noviembre" },
  { num: 12, nombre: "Diciembre" },
];

// Función para obtener el número de semana ISO actual (1-53)
const getSemanaActual = (fecha = new Date()) => {
  const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const ReporteNoConsumidos = () => {
  const hoy = new Date();
  const fechaHoyStr = hoy.toISOString().split("T")[0];

  // Estados de filtros
  const [periodo, setPeriodo] = useState("diario");
  const [fecha, setFecha] = useState(fechaHoyStr);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [semana, setSemana] = useState(getSemanaActual());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [fechaInicio, setFechaInicio] = useState(fechaHoyStr);
  const [fechaFin, setFechaFin] = useState(fechaHoyStr);
  const [tipoAlimento, setTipoAlimento] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");

  // Estados de datos
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [exportando, setExportando] = useState(null); // "pdf" | "excel" | null

  // Cargar datos desde el backend
  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setErrorMsg(null);

      const params = {
        periodo,
        tipoAlimento,
      };

      if (periodo === "diario") params.fecha = fecha;
      if (periodo === "semanal") {
        params.anio = anio;
        params.semana = semana;
      }
      if (periodo === "mensual") {
        params.anio = anio;
        params.mes = mes;
      }
      if (periodo === "anual") params.anio = anio;
      if (periodo === "personalizado") {
        params.fechaInicio = fechaInicio;
        params.fechaFin = fechaFin;
      }

      const res = await apiAxios.get("/api/Reportes/no-consumidos", { params });
      setDatos(res.data);
    } catch (err) {
      console.error("[ReporteNoConsumidos] Error al cargar:", err);
      setErrorMsg(err.response?.data?.message || "Error al obtener el listado de inasistencias");
      setDatos(null);
    } finally {
      setCargando(false);
    }
  }, [periodo, fecha, anio, semana, mes, fechaInicio, fechaFin, tipoAlimento]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Socket.IO: Recargar automáticamente si hay cambios en reservas (turnos vencidos, etc.)
  useSocketListener("reservas:actualizadas", () => {
    cargarDatos();
  });

  // Filtro de búsqueda local asegurando que solo se listen reservas con estado 'Vencido'
  const registrosFiltrados = useMemo(() => {
    if (!datos?.registros) return [];
    const soloVencidos = datos.registros.filter((r) => r.Est_Reserva === "Vencido");
    if (!busqueda.trim()) return soloVencidos;

    const q = busqueda.trim().toLowerCase();
    return soloVencidos.filter((r) => {
      const nombre = (r.aprendiz?.nombreCompleto || "").toLowerCase();
      const doc = String(r.aprendiz?.NumDoc_Usuario || "");
      const ficha = String(r.aprendiz?.Num_Ficha || "");
      const plato = (r.plato?.Nom_Plato || "").toLowerCase();
      return nombre.includes(q) || doc.includes(q) || ficha.includes(q) || plato.includes(q);
    });
  }, [datos, busqueda]);

  // Exportar a PDF o Excel
  const exportar = async (formato) => {
    try {
      setExportando(formato);
      const params = {
        periodo,
        tipoAlimento,
      };

      if (periodo === "diario") params.fecha = fecha;
      if (periodo === "semanal") {
        params.anio = anio;
        params.semana = semana;
      }
      if (periodo === "mensual") {
        params.anio = anio;
        params.mes = mes;
      }
      if (periodo === "anual") params.anio = anio;
      if (periodo === "personalizado") {
        params.fechaInicio = fechaInicio;
        params.fechaFin = fechaFin;
      }

      const res = await apiAxios.get(`/api/Reportes/no-consumidos/exportar/${formato}`, {
        params,
        responseType: "blob",
      });

      const ext = formato === "pdf" ? "pdf" : "xlsx";
      const mime =
        formato === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      const blob = new Blob([res.data], { type: mime });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `Inasistencias_${periodo}_${fechaHoyStr}.${ext}`;
      enlace.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[ReporteNoConsumidos] Error al exportar:", err);
      alert("Error al descargar el archivo. Verifica la conexión con el servidor.");
    } finally {
      setExportando(null);
    }
  };

  const resumen = datos?.resumen || {
    totalNoConsumidos: 0,
    desayunos: 0,
    almuerzos: 0,
    cenas: 0,
    totalAprendicesUnicos: 0,
    totalSancionados: 0,
  };

  return (
    <div className="space-y-6">
      {/* ─── Encabezado y Acciones ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <UserX className="w-5 h-5" />
              </span>
              Inasistencias y Reservas No Consumidas
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Control de aprendices que reservaron pero no se presentaron a reclamar su alimento
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={cargarDatos}
              disabled={cargando}
              className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition flex items-center gap-1.5 disabled:opacity-60"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargando ? "animate-spin" : ""}`} />
              Actualizar
            </button>

            <button
              onClick={() => exportar("pdf")}
              disabled={exportando !== null || registrosFiltrados.length === 0}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm shadow-red-200 transition flex items-center gap-1.5 disabled:opacity-60"
            >
              {exportando === "pdf" ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              Descargar PDF
            </button>

            <button
              onClick={() => exportar("excel")}
              disabled={exportando !== null || registrosFiltrados.length === 0}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-200 transition flex items-center gap-1.5 disabled:opacity-60"
            >
              {exportando === "excel" ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5" />
              )}
              Descargar Excel
            </button>
          </div>
        </div>

        {/* ─── Selectores de Periodo ─── */}
        <div className="mt-5 pt-5 border-t border-gray-100 flex flex-col gap-4">
          <div className="flex gap-2 flex-wrap">
            {PERIODOS.map(({ clave, etiqueta }) => (
              <button
                key={clave}
                onClick={() => setPeriodo(clave)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition border ${
                  periodo === clave
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>

          {/* ─── Controles Dinámicos por Periodo y Comida ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
            {periodo === "diario" && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-500" /> Fecha del reporte
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            )}

            {periodo === "semanal" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Año</label>
                  <input
                    type="number"
                    min="2020"
                    max="2035"
                    value={anio}
                    onChange={(e) => setAnio(parseInt(e.target.value) || hoy.getFullYear())}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Semana (1-53)</label>
                  <input
                    type="number"
                    min="1"
                    max="53"
                    value={semana}
                    onChange={(e) => setSemana(parseInt(e.target.value) || getSemanaActual())}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </>
            )}

            {periodo === "mensual" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Mes</label>
                  <select
                    value={mes}
                    onChange={(e) => setMes(parseInt(e.target.value))}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {MESES.map((m) => (
                      <option key={m.num} value={m.num}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Año</label>
                  <input
                    type="number"
                    min="2020"
                    max="2035"
                    value={anio}
                    onChange={(e) => setAnio(parseInt(e.target.value) || hoy.getFullYear())}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </>
            )}

            {periodo === "anual" && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Año</label>
                <input
                  type="number"
                  min="2020"
                  max="2035"
                  value={anio}
                  onChange={(e) => setAnio(parseInt(e.target.value) || hoy.getFullYear())}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            )}

            {periodo === "personalizado" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha Fin</label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                <Utensils className="w-3 h-3 text-blue-500" /> Tipo de Comida
              </label>
              <select
                value={tipoAlimento}
                onChange={(e) => setTipoAlimento(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Todos">Todos los alimentos</option>
                <option value="Desayuno">Desayuno</option>
                <option value="Almuerzo">Almuerzo</option>
                <option value="Cena">Cena</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                <Search className="w-3 h-3 text-blue-500" /> Buscar aprendiz
              </label>
              <input
                type="text"
                placeholder="Nombre, documento o ficha..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* ─── Tarjetas de Resumen Estadístico ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Inasistencias</span>
            <span className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-red-600 mt-2">{resumen.totalNoConsumidos}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Desayunos</span>
            <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Coffee className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-purple-600 mt-2">{resumen.desayunos}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Almuerzos</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sun className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{resumen.almuerzos}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Cenas</span>
            <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{resumen.cenas}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Sancionados</span>
            <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{resumen.totalSancionados}</p>
        </div>
      </div>

      {/* ─── Tabla Detallada ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <span>Listado detallado de inasistencias</span>
            <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5 rounded-full font-medium">
              {registrosFiltrados.length} registro{registrosFiltrados.length !== 1 ? "s" : ""}
            </span>
          </h3>
          {busqueda && (
            <span className="text-xs text-gray-400">
              Filtrado por: &quot;{busqueda}&quot;
            </span>
          )}
        </div>

        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-9 h-9 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-2" />
            <p className="text-xs font-medium">Consultando inasistencias...</p>
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-12 h-12 bg-red-50 text-red-400 rounded-full flex items-center justify-center mb-2">
              <UserX className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-gray-700">No se encontraron inasistencias</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Todos los aprendices que reservaron reclamaron su alimento en este período o no hubo reservas vencidas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3 text-center">#</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Aprendiz</th>
                  <th className="py-3 px-4">Ficha / Programa</th>
                  <th className="py-3 px-3 text-center">Comida</th>
                  <th className="py-3 px-4">Plato Reservado</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                  <th className="py-3 px-3 text-center">Sanción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registrosFiltrados.map((item, idx) => (
                  <tr key={item.Id_Reserva} className="hover:bg-red-50/20 transition">
                    <td className="py-3.5 px-3 text-center text-gray-400 font-medium">{idx + 1}</td>
                    <td className="py-3.5 px-4 text-gray-700 font-medium whitespace-nowrap">
                      {item.Fec_Reserva}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-gray-900 leading-tight">
                        {item.aprendiz.nombreCompleto}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <IdCard className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>
                          {item.aprendiz.TipDoc_Usuario} {item.aprendiz.NumDoc_Usuario}
                        </span>
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-gray-800 text-xs">
                        Ficha: <span className="font-bold text-gray-900">{item.aprendiz.Num_Ficha}</span>
                      </p>
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                        {item.aprendiz.Nom_Programa}
                      </p>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.Tip_Reserva === "Desayuno"
                            ? "bg-purple-100 text-purple-700"
                            : item.Tip_Reserva === "Almuerzo"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.Tip_Reserva === "Desayuno" && <Coffee className="w-3 h-3" />}
                        {item.Tip_Reserva === "Almuerzo" && <Sun className="w-3 h-3" />}
                        {item.Tip_Reserva === "Cena" && <Moon className="w-3 h-3" />}
                        {item.Tip_Reserva}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {item.plato.Img_Plato ? (
                          <img
                            src={
                              item.plato.Img_Plato.startsWith("http") ||
                              item.plato.Img_Plato.startsWith("data:")
                                ? item.plato.Img_Plato
                                : item.plato.Img_Plato.startsWith("/uploads/")
                                ? item.plato.Img_Plato
                                : `/uploads/${item.plato.Img_Plato}`
                            }
                            alt={item.plato.Nom_Plato}
                            className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://placehold.co/60x60?text=Plato";
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                            <Utensils className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <span className="text-gray-700 font-medium text-xs line-clamp-1">
                          {item.plato.Nom_Plato}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                        {item.Est_Reserva || "Vencido"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          item.aprendiz.San_Usuario === "Si"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.aprendiz.San_Usuario === "Si" ? "Sí (Sancionado)" : "No"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReporteNoConsumidos;
