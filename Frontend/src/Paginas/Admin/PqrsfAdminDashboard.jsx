// Frontend/src/Paginas/Admin/PqrsfAdminDashboard.jsx
// Panel administrativo de gestion integral de PQRSF, semaforo SLA, ranking de frecuencia y actas de interventoria
// Codigo comentado didacticamente sin tildes ni emojis para aprendices de primer semestre

import { useState, useEffect, useMemo } from "react";
import {
  FileText, Search, Download, AlertTriangle, CheckCircle2, Clock,
  Flame, TrendingDown, Star, MessageSquare, ChevronDown, Filter,
  Eye, RefreshCw, Sparkles, ShieldAlert, Award, Calendar, Send, X, Loader2
} from "lucide-react";
import apiAxios from "../../api/axiosConfig";
import toast from "react-hot-toast";

const CONFIG_PRIORIDAD = {
  CRITICA: {
    bg: "bg-rose-100 text-rose-800 border-rose-300 font-extrabold",
    dot: "bg-rose-600",
    label: "CRITICA (4h SLA)"
  },
  ALTA: {
    bg: "bg-amber-100 text-amber-800 border-amber-300 font-bold",
    dot: "bg-amber-500",
    label: "ALTA (24h SLA)"
  },
  MEDIA: {
    bg: "bg-yellow-50 text-yellow-800 border-yellow-200 font-semibold",
    dot: "bg-yellow-500",
    label: "MEDIA (48h SLA)"
  },
  BAJA: {
    bg: "bg-blue-50 text-blue-800 border-blue-200",
    dot: "bg-blue-500",
    label: "BAJA (72h SLA)"
  },
  POSITIVA: {
    bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
    label: "POSITIVA (Reconocimiento)"
  }
};

const CONFIG_ESTADO = {
  Abierta: "bg-rose-50 text-rose-700 border-rose-200",
  "En Revision": "bg-amber-50 text-amber-700 border-amber-200",
  Respondida: "bg-blue-50 text-blue-700 border-blue-200",
  Cerrada: "bg-emerald-50 text-emerald-700 border-emerald-200"
};

const PqrsfAdminDashboard = () => {
  const [tabActivo, setTabActivo] = useState("ranking"); // 'ranking' o 'bandeja'
  const [listaPqrsf, setListaPqrsf] = useState([]);
  const [rankingData, setRankingData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [descargando, setDescargando] = useState(false);

  // Filtros de bandeja
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("TODAS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [filtroPrioridad, setFiltroPrioridad] = useState("TODAS");

  // Modal de detalle y respuesta
  const [pqrsfSeleccionada, setPqrsfSeleccionada] = useState(null);
  const [respuestaAdmin, setRespuestaAdmin] = useState("");
  const [nuevoEstado, setNuevoEstado] = useState("Respondida");
  const [guardandoRespuesta, setGuardandoRespuesta] = useState(false);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resLista, resRanking] = await Promise.all([
        apiAxios.get("/api/Pqrsf"),
        apiAxios.get("/api/Pqrsf/ranking")
      ]);
      setListaPqrsf(resLista.data?.pqrsfs || []);
      setRankingData(resRanking.data);
    } catch (err) {
      console.error("Error al cargar datos PQRSF:", err.message);
      toast.error("Error al cargar modulo de PQRSF");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Filtrado reactivo de la bandeja
  const listaFiltrada = useMemo(() => {
    return listaPqrsf.filter((item) => {
      const matchBusqueda =
        (item.Radicado || "").toLowerCase().includes(busqueda.toLowerCase()) ||
        (item.Nombre_Reportante || "").toLowerCase().includes(busqueda.toLowerCase()) ||
        (item.Descripcion || "").toLowerCase().includes(busqueda.toLowerCase()) ||
        (item.Subcategoria || "").toLowerCase().includes(busqueda.toLowerCase());

      const matchCat = filtroCategoria === "TODAS" || item.Categoria_Estandar === filtroCategoria;
      const matchEst = filtroEstado === "TODOS" || item.Estado_Pqrsf === filtroEstado;
      const matchPrio = filtroPrioridad === "TODAS" || item.Nivel_Prioridad === filtroPrioridad;

      return matchBusqueda && matchCat && matchEst && matchPrio;
    });
  }, [listaPqrsf, busqueda, filtroCategoria, filtroEstado, filtroPrioridad]);

  // Descarga de reporte en Excel con 2 hojas
  const handleExportarExcel = async () => {
    setDescargando(true);
    try {
      const respuesta = await apiAxios.get("/api/Pqrsf/exportar/excel", {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([respuesta.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Foodsys_PQRSF_Ranking_${new Date().toISOString().split("T")[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success("Excel con Ranking y Detalle nominal descargado");
    } catch (err) {
      console.error("Error al exportar Excel:", err.message);
      toast.error("No se pudo generar el archivo Excel");
    } finally {
      setDescargando(false);
    }
  };

  // Descarga de acta ejecutiva en PDF
  const handleExportarPdf = async () => {
    setDescargando(true);
    try {
      const respuesta = await apiAxios.get("/api/Pqrsf/exportar/pdf", {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([respuesta.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Foodsys_Acta_Interventoria_PQRSF_${new Date().toISOString().split("T")[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success("Acta Ejecutiva de Interventoria en PDF descargada");
    } catch (err) {
      console.error("Error al exportar PDF:", err.message);
      toast.error("No se pudo generar el PDF");
    } finally {
      setDescargando(false);
    }
  };

  // Guardar respuesta y cerrar caso
  const handleGuardarRespuesta = async () => {
    if (!respuestaAdmin.trim()) {
      toast.error("Escribe una respuesta institucional antes de guardar");
      return;
    }

    setGuardandoRespuesta(true);
    try {
      await apiAxios.put(`/api/Pqrsf/${pqrsfSeleccionada.Id_Pqrsf}/responder`, {
        respuesta: respuestaAdmin.trim(),
        nuevoEstado
      });
      toast.success(`Caso ${pqrsfSeleccionada.Radicado} actualizado a ${nuevoEstado}`);
      setPqrsfSeleccionada(null);
      setRespuestaAdmin("");
      cargarDatos();
    } catch (err) {
      console.error("Error al responder PQRSF:", err.message);
      toast.error(err.response?.data?.mensaje || "Error al registrar respuesta");
    } finally {
      setGuardandoRespuesta(false);
    }
  };

  return (
    <div className="w-full space-y-6">

      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#0f3f80]/10 text-[#0f3f80]">
              <MessageSquare size={22} />
            </span>
            <h1 className="text-xl font-bold text-slate-800">
              Gestion de PQRSF e Interventoria
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centro Agropecuario La Granja · Matriz estandar de calidad, semaforo SLA y ranking de quejas frecuentes
          </p>
        </div>

        {/* Botones de Exportacion Dual */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportarExcel}
            disabled={descargando}
            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3.5 py-2 rounded-xl transition-all shadow-2xs disabled:opacity-50"
          >
            <Download size={14} />
            Exportar Excel (Ranking + Detalle)
          </button>

          <button
            type="button"
            onClick={handleExportarPdf}
            disabled={descargando}
            className="inline-flex items-center gap-2 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-300 px-3.5 py-2 rounded-xl transition-all shadow-2xs disabled:opacity-50"
          >
            <FileText size={14} />
            Acta Interventoria PDF
          </button>

          <button
            type="button"
            onClick={cargarDatos}
            disabled={cargando}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Recargar datos"
          >
            <RefreshCw size={15} className={cargando ? "animate-spin text-[#0f3f80]" : ""} />
          </button>
        </div>
      </div>

      {/* Selector de Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setTabActivo("ranking")}
          className={`py-3 px-5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            tabActivo === "ranking"
              ? "border-[#0f3f80] text-[#0f3f80]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Flame size={16} />
          Ranking y Termometro de Interventoria
        </button>

        <button
          type="button"
          onClick={() => setTabActivo("bandeja")}
          className={`py-3 px-5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            tabActivo === "bandeja"
              ? "border-[#0f3f80] text-[#0f3f80]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText size={16} />
          Bandeja de Gestion Nominal ({listaPqrsf.length})
        </button>
      </div>

      {/* TAB 1: RANKING Y TERMOMETRO */}
      {tabActivo === "ranking" && (
        <div className="space-y-6">

          {/* Tarjetas de Resumen Global */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Total PQRSF</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{rankingData?.totalPqrsf || listaPqrsf.length}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Historial acumulado</p>
            </div>

            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 shadow-xs">
              <p className="text-[11px] font-bold text-rose-700 uppercase">Casos Criticos</p>
              <p className="text-2xl font-black text-rose-800 mt-1">
                {listaPqrsf.filter(p => p.Nivel_Prioridad === 'CRITICA').length}
              </p>
              <p className="text-[10px] text-rose-600 mt-0.5">SLA maximo 4 horas</p>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-xs">
              <p className="text-[11px] font-bold text-amber-700 uppercase">Pendientes / Revision</p>
              <p className="text-2xl font-black text-amber-800 mt-1">
                {listaPqrsf.filter(p => p.Estado_Pqrsf === 'Abierta' || p.Estado_Pqrsf === 'En Revision').length}
              </p>
              <p className="text-[10px] text-amber-600 mt-0.5">Requieren respuesta</p>
            </div>

            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-xs">
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Resueltas / Cerradas</p>
              <p className="text-2xl font-black text-emerald-800 mt-1">
                {listaPqrsf.filter(p => p.Estado_Pqrsf === 'Respondida' || p.Estado_Pqrsf === 'Cerrada').length}
              </p>
              <p className="text-[10px] text-emerald-600 mt-0.5">Atendidas con exito</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Top 5 Causas mas Frecuentes */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Flame size={16} className="text-amber-500" />
                  Ranking de Quejas mas Frecuentes
                </h3>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                  Frecuencia de quejas
                </span>
              </div>

              <div className="space-y-3">
                {(rankingData?.topCausasFrecuentes || []).length > 0 ? (
                  rankingData.topCausasFrecuentes.slice(0, 6).map((causa, idx) => {
                    const totalCasos = rankingData.totalPqrsf || 1;
                    const porcentaje = Math.round((Number(causa.total) / totalCasos) * 100);

                    return (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">
                            #{idx + 1} {causa.Subcategoria}
                          </span>
                          <span className="font-extrabold text-[#0f3f80]">
                            {causa.total} reportes ({porcentaje}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              idx === 0 ? "bg-rose-500" : idx === 1 ? "bg-amber-500" : "bg-[#0f3f80]"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(8, porcentaje))}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Categoria: {causa.Categoria_Estandar} · Impacto promedio: {Math.round(causa.impacto_promedio || 50)} pts
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    No hay suficientes reportes registrados para generar el ranking aun.
                  </p>
                )}
              </div>
            </div>

            {/* Resumen por Categoria Principal */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShieldAlert size={16} className="text-[#0f3f80]" />
                Distribucion por Area de Atencion
              </h3>

              <div className="space-y-2.5">
                {(rankingData?.resumenCategorias || []).map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/70 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{cat.Categoria_Estandar}</p>
                      <p className="text-[10px] text-slate-400">
                        {cat.pendientes} pendientes · {cat.resueltas} resueltas
                      </p>
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                      {cat.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: BANDEJA DE GESTION NOMINAL */}
      {tabActivo === "bandeja" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">

          {/* Barra de Filtros */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por radicado, nombre o descripcion..."
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3f80] bg-white"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl border border-slate-300 bg-white"
              >
                <option value="TODAS">Todas las Categorias</option>
                <option value="CALIDAD_ALIMENTACION">Calidad Alimentacion</option>
                <option value="ESTADO_PLATO_MENAJE">Plato / Menaje</option>
                <option value="MOBILIARIO_MESAS_SILLAS">Mobiliario / Higiene</option>
                <option value="ATENCION_SERVICIO">Atencion del Servicio</option>
                <option value="PLATAFORMA_RESERVAS">Plataforma Foodsys</option>
                <option value="RECONOCIMIENTO">Reconocimientos</option>
              </select>

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl border border-slate-300 bg-white"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="Abierta">Abierta</option>
                <option value="En Revision">En Revision</option>
                <option value="Respondida">Respondida</option>
                <option value="Cerrada">Cerrada</option>
              </select>

              <select
                value={filtroPrioridad}
                onChange={(e) => setFiltroPrioridad(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl border border-slate-300 bg-white"
              >
                <option value="TODAS">Todas las Prioridades</option>
                <option value="CRITICA">Critica</option>
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Media</option>
                <option value="BAJA">Baja</option>
                <option value="POSITIVA">Positiva</option>
              </select>
            </div>
          </div>

          {/* Tabla de Registros */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Radicado</th>
                  <th className="py-3 px-4">Fecha / Turno</th>
                  <th className="py-3 px-4">Reportante</th>
                  <th className="py-3 px-4">Categoria / Subcategoria</th>
                  <th className="py-3 px-4">Prioridad / SLA</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listaFiltrada.length > 0 ? (
                  listaFiltrada.map((item) => {
                    const prio = CONFIG_PRIORIDAD[item.Nivel_Prioridad] || CONFIG_PRIORIDAD.MEDIA;
                    const estClase = CONFIG_ESTADO[item.Estado_Pqrsf] || "bg-slate-50 text-slate-700";

                    return (
                      <tr key={item.Id_Pqrsf} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-[#0f3f80]">
                          {item.Radicado}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="font-semibold text-slate-800">{item.Fec_Hecho}</p>
                          <p className="text-[10px] text-slate-400">{item.Tip_Comida}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800">{item.Nombre_Reportante || "Anonimo"}</p>
                          <p className="text-[10px] text-slate-400">{item.Correo_Reportante || "Sin correo"}</p>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-semibold text-slate-800 truncate">{item.Subcategoria}</p>
                          <p className="text-[10px] text-slate-400">{item.Categoria_Estandar}</p>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] ${prio.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
                            {prio.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${estClase}`}>
                            {item.Estado_Pqrsf}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setPqrsfSeleccionada(item);
                              setRespuestaAdmin(item.Respuesta_Administracion || "");
                              setNuevoEstado(item.Estado_Pqrsf === "Cerrada" ? "Cerrada" : "Respondida");
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-bold text-[#0f3f80] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                          >
                            <Eye size={12} />
                            Ver / Responder
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                      No se encontraron solicitudes que coincidan con los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Modal de Detalle y Respuesta Institucional */}
      {pqrsfSeleccionada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setPqrsfSeleccionada(null); }}
        >
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">

            {/* Cabecera del modal */}
            <div className="bg-gradient-to-r from-[#0f3f80] to-[#1e5bb0] p-5 text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">
                  Gestion de Radicado {pqrsfSeleccionada.Radicado}
                </h2>
                <p className="text-xs text-blue-100">
                  {pqrsfSeleccionada.Tipo_Solicitud} · {pqrsfSeleccionada.Categoria_Estandar}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPqrsfSeleccionada(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Reportante</p>
                    <p className="font-bold text-slate-800 text-sm">{pqrsfSeleccionada.Nombre_Reportante || "Anonimo"}</p>
                    <p className="text-slate-500">{pqrsfSeleccionada.Correo_Reportante || "Sin correo electronico"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Fecha del Hecho</p>
                    <p className="font-bold text-slate-800">{pqrsfSeleccionada.Fec_Hecho} ({pqrsfSeleccionada.Tip_Comida})</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Descripcion del Usuario</p>
                  <p className="text-slate-700 leading-relaxed mt-1 font-medium bg-white p-3 rounded-lg border border-slate-100">
                    {pqrsfSeleccionada.Descripcion}
                  </p>
                </div>

                {pqrsfSeleccionada.Persona_Servicio_Ref && (
                  <p className="text-[11px] text-slate-500">
                    <strong>Persona referenciada:</strong> {pqrsfSeleccionada.Persona_Servicio_Ref}
                  </p>
                )}
              </div>

              {/* Formulario de Respuesta */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Respuesta Institucional (Bienestar al Aprendiz / Administracion) *
                </label>
                <textarea
                  rows={4}
                  value={respuestaAdmin}
                  onChange={(e) => setRespuestaAdmin(e.target.value)}
                  placeholder="Escribe la respuesta formal, acciones correctivas aplicadas con el contratista de alimentacion o aclaraciones..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3f80] resize-none"
                />

                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-700">Estado posterior:</label>
                  <select
                    value={nuevoEstado}
                    onChange={(e) => setNuevoEstado(e.target.value)}
                    className="text-xs p-2 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    <option value="En Revision">En Revision</option>
                    <option value="Respondida">Respondida</option>
                    <option value="Cerrada">Cerrada</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Pie del modal */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPqrsfSeleccionada(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarRespuesta}
                disabled={guardandoRespuesta}
                className="px-5 py-2 text-xs font-bold text-white bg-[#0f3f80] hover:bg-[#144f9e] rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {guardandoRespuesta ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Guardar Respuesta
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PqrsfAdminDashboard;
