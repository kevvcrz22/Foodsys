// Frontend/src/Paginas/Reportes/ReporteSeguimientoBienestar.jsx
//
// Componente de Alerta de Seguimiento para Bienestar al Aprendiz.
// Identifica y lista a los aprendices y pasantes activos (con prioridad para internos CenCon_Usuario = 'Si')
// que tienen 0 reservas o 0 consumos en el periodo seleccionado.
//
// Permite al equipo de Bienestar realizar contacto preventivo (depresion, enfermedad, desercion)
// mostrando su telefono, correo institucional, ficha, programa y ultima fecha en que consumio.
//
// Incluye botones de exportacion a Excel y PDF con confirmacion inteligente segun filtros.

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  HeartHandshake,
  AlertTriangle,
  Search,
  Phone,
  Mail,
  Home,
  UserCheck,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import apiAxios from "../../api/axiosConfig";
import toast from "react-hot-toast";
import ModalHistorialAprendiz from "./ModalHistorialAprendiz";
import { exportarAExcel, exportarAPDF, confirmarExportacion } from "../../utils/exportUtils";

const ReporteSeguimientoBienestar = () => {
  const [periodo, setPeriodo] = useState("semanal");
  const [fechaInicio, setFechaInicio] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split("T")[0]);
  const [soloInternos, setSoloInternos] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [registros, setRegistros] = useState([]);
  const [resumen, setResumen] = useState({ totalSinConsumo: 0, totalInternosAfectados: 0, totalExternosAfectados: 0 });
  const [cargando, setCargando] = useState(false);
  const [mostrarGuia, setMostrarGuia] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;

  // Aprendiz seleccionado para modal individual
  const [aprendizSeleccionado, setAprendizSeleccionado] = useState(null);

  // Cargar datos desde backend
  const cargarSeguimiento = useCallback(async () => {
    setCargando(true);
    try {
      const params = {
        periodo,
        fechaInicio,
        fechaFin,
        soloInternos: soloInternos ? "true" : undefined
      };

      const respuesta = await apiAxios.get("/api/Reportes/seguimiento-bienestar", { params });
      if (respuesta.data && Array.isArray(respuesta.data.registros)) {
        setRegistros(respuesta.data.registros);
        setResumen({
          totalSinConsumo: respuesta.data.totalSinConsumo || 0,
          totalInternosAfectados: respuesta.data.totalInternosAfectados || 0,
          totalExternosAfectados: respuesta.data.totalExternosAfectados || 0
        });
      } else {
        setRegistros([]);
        setResumen({ totalSinConsumo: 0, totalInternosAfectados: 0, totalExternosAfectados: 0 });
      }
    } catch (error) {
      console.error("Error al cargar seguimiento de bienestar:", error);
      setRegistros([]);
    } finally {
      setCargando(false);
    }
  }, [periodo, fechaInicio, fechaFin, soloInternos]);

  useEffect(() => {
    cargarSeguimiento();
    setPaginaActual(1);
  }, [cargarSeguimiento]);

  // Filtrado reactivo en memoria
  const registrosFiltrados = useMemo(() => {
    let lista = registros;
    if (soloInternos) {
      lista = lista.filter((r) => r.CenCon_Usuario === "Si");
    }
    if (!busqueda.trim()) return lista;
    const q = busqueda.trim().toLowerCase();
    return lista.filter((r) =>
      r.NombreCompleto.toLowerCase().includes(q) ||
      String(r.NumDoc).includes(q) ||
      String(r.Num_Ficha).includes(q) ||
      r.Nom_Programa.toLowerCase().includes(q) ||
      r.Cor_Usuario.toLowerCase().includes(q)
    );
  }, [registros, soloInternos, busqueda]);

  // Paginacion
  const totalPaginas = Math.ceil(registrosFiltrados.length / registrosPorPagina) || 1;
  const registrosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    return registrosFiltrados.slice(inicio, inicio + registrosPorPagina);
  }, [registrosFiltrados, paginaActual]);

  // Exportar Excel
  const manejarExportarExcel = async () => {
    if (registrosFiltrados.length === 0) {
      toast.error("No hay registros de alerta para exportar en el rango seleccionado.");
      return;
    }

    const tieneFiltros = busqueda.trim() !== "" || soloInternos;
    const datosAExportar = tieneFiltros ? registrosFiltrados : registros;

    const confirmado = await confirmarExportacion({
      tieneFiltros,
      totalFiltrados: datosAExportar.length,
      totalRegistros: registros.length,
      formato: "Excel"
    });

    if (!confirmado) return;

    const columnas = [
      { header: "Prioridad", key: "prioridad" },
      { header: "Tipo Doc", key: "TipDoc" },
      { header: "N° Documento", key: "NumDoc" },
      { header: "Nombre Completo", key: "NombreCompleto" },
      { header: "Rol", key: "Rol" },
      { header: "Centro de Convivencia", key: "CenCon_Usuario" },
      { header: "N° Ficha", key: "Num_Ficha" },
      { header: "Programa de Formacion", key: "Nom_Programa" },
      { header: "Telefono", key: "Tel_Usuario" },
      { header: "Correo Institucional", key: "Cor_Usuario" },
      { header: "Reservas en Periodo", key: "totalReservasPeriodo" },
      { header: "Consumos en Periodo", key: "totalConsumosPeriodo" },
      { header: "Ultima Fecha de Consumo", key: "ultimaFechaConsumo" }
    ];

    exportarAExcel({
      columnas,
      datos: datosAExportar,
      nombreArchivo: `Seguimiento_Bienestar_${new Date().toISOString().split("T")[0]}`,
      tituloHoja: "Alertas Bienestar"
    });
  };

  // Exportar PDF
  const manejarExportarPDF = async () => {
    if (registrosFiltrados.length === 0) {
      toast.error("No hay registros de alerta para exportar en el rango seleccionado.");
      return;
    }

    const tieneFiltros = busqueda.trim() !== "" || soloInternos;
    const datosAExportar = tieneFiltros ? registrosFiltrados : registros;

    const confirmado = await confirmarExportacion({
      tieneFiltros,
      totalFiltrados: datosAExportar.length,
      totalRegistros: registros.length,
      formato: "PDF"
    });

    if (!confirmado) return;

    const columnas = [
      { header: "Prioridad", key: "prioridad" },
      { header: "Documento", key: "NumDoc" },
      { header: "Nombre Completo", key: "NombreCompleto" },
      { header: "Rol", key: "Rol" },
      { header: "Ficha", key: "Num_Ficha" },
      { header: "Telefono", key: "Tel_Usuario" },
      { header: "Ultimo Consumo", key: "ultimaFechaConsumo" }
    ];

    exportarAPDF({
      columnas,
      datos: datosAExportar,
      nombreArchivo: `Seguimiento_Bienestar_${new Date().toISOString().split("T")[0]}`,
      titulo: "Alerta de Seguimiento de Bienestar al Aprendiz",
      subtitulo: `Aprendices activos con 0 consumos en el periodo (${fechaInicio} a ${fechaFin})`
    });
  };

  return (
    <div className="space-y-6">
      {/* Tarjeta explicativa y guia de Bienestar (Paleta pastel suave / Indigo-Slate para no cansar la vista) */}
      <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-blue-50 border border-indigo-200/80 rounded-2xl p-5 text-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200/70">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                Seguimiento Psicosocial y Nutricional (Bienestar al Aprendiz)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                Deteccion temprana de aprendices activos que no estan reservando ni asistiendo al comedor.
                Prioriza a los aprendices internos de Centro de Convivencia para acompanamiento y prevencion.
              </p>
            </div>
          </div>

          <button
            onClick={() => setMostrarGuia(!mostrarGuia)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition self-start sm:self-center shadow-2xs"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{mostrarGuia ? "Ocultar manual" : "Manual de uso"}</span>
            {mostrarGuia ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Acordeon del manual */}
        {mostrarGuia && (
          <div className="mt-4 pt-4 border-t border-indigo-200/60 text-xs sm:text-sm space-y-2 text-slate-700">
            <p className="font-semibold text-indigo-900">¿Como usar este modulo de alerta?</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Selecciona el rango de fechas para evaluar la inasistencia (por defecto ultimos 7 dias).</li>
              <li>Observa el semaforo de prioridad: los aprendices internos aparecen de primeros con prioridad alta.</li>
              <li>Haz clic sobre el nombre del aprendiz para ver su historial historico de consumo.</li>
              <li>Usa los numeros de telefono y correo para contactar al aprendiz o coordinar visita psicologica.</li>
              <li>Descarga el informe en Excel o PDF para soporte de gestion de Bienestar.</li>
            </ol>
          </div>
        )}
      </div>

      {/* Tarjetas de Resumen Estadistico */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Total Sin Consumos</p>
            <p className="text-2xl font-bold text-slate-900">{resumen.totalSinConsumo}</p>
            <p className="text-xs text-slate-400">En el periodo seleccionado</p>
          </div>
        </div>

        <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100/80 text-indigo-700 flex items-center justify-center font-bold">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-indigo-700 uppercase font-semibold">Internos Afectados</p>
            <p className="text-2xl font-bold text-indigo-900">{resumen.totalInternosAfectados}</p>
            <p className="text-xs text-indigo-600 font-medium">Prioridad Maxima (Convivencia)</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Externos Afectados</p>
            <p className="text-2xl font-bold text-slate-900">{resumen.totalExternosAfectados}</p>
            <p className="text-xs text-slate-400">Prioridad Media</p>
          </div>
        </div>
      </div>

      {/* Filtros de periodo y busqueda */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-end gap-3 justify-between">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Periodo</label>
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="text-xs sm:text-sm border border-gray-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="semanal">Semanal (Ultimos 7 dias)</option>
                <option value="mensual">Mensual (Ultimos 30 dias)</option>
                <option value="personalizado">Personalizado (Rango manual)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="text-xs sm:text-sm border border-gray-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha Fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="text-xs sm:text-sm border border-gray-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pb-2 text-xs font-medium text-gray-700">
              <input
                type="checkbox"
                checked={soloInternos}
                onChange={(e) => setSoloInternos(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
              <span>Mostrar solo Internos (Centro de Convivencia)</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={manejarExportarExcel}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={manejarExportarPDF}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>

        {/* Buscador rapido */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, documento, ficha o correo..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPaginaActual(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Tabla de Alertas */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-2" />
            <p className="text-xs">Consultando registros de seguimiento...</p>
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <HeartHandshake className="w-12 h-12 mb-2 text-emerald-400 opacity-60" />
            <p className="text-base font-semibold text-gray-700">Excelente noticia</p>
            <p className="text-xs text-gray-500 mt-1">
              Todos los aprendices evaluados estan reservando y consumiendo sus alimentos en el periodo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Prioridad</th>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Aprendiz / Pasante</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Ficha y Programa</th>
                  <th className="px-4 py-3">Telefono</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3">Ultimo Consumo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {registrosPaginados.map((item) => (
                  <tr
                    key={item.Id_Usuario}
                    onClick={() => setAprendizSeleccionado(item)}
                    className="hover:bg-indigo-50/40 cursor-pointer transition"
                    title="Clic para ver historial individual de este aprendiz"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          item.CenCon_Usuario === "Si"
                            ? "bg-rose-100 text-rose-800 border border-rose-200 animate-pulse"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {item.prioridad}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                      {item.TipDoc} {item.NumDoc}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-indigo-600 hover:underline">
                      {item.NombreCompleto}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                        {item.Rol}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-semibold text-gray-800">Ficha: {item.Num_Ficha}</p>
                      <p className="text-xs text-gray-500 truncate" title={item.Nom_Programa}>
                        {item.Nom_Programa}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a
                        href={`tel:${item.Tel_Usuario}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-emerald-700 font-medium hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{item.Tel_Usuario}</span>
                      </a>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a
                        href={`mailto:${item.Cor_Usuario}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-blue-700 hover:underline text-xs"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>{item.Cor_Usuario}</span>
                      </a>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                        {item.ultimaFechaConsumo}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginador */}
        {registrosFiltrados.length > registrosPorPagina && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Mostrando {registrosPaginados.length} de {registrosFiltrados.length} alertas
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                disabled={paginaActual === 1}
                className="p-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium">
                Pagina {paginaActual} de {totalPaginas}
              </span>
              <button
                onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                className="p-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Historial Individual del Aprendiz */}
      {aprendizSeleccionado && (
        <ModalHistorialAprendiz
          aprendizId={aprendizSeleccionado.Id_Usuario}
          nombreAprendiz={aprendizSeleccionado.NombreCompleto}
          onClose={() => setAprendizSeleccionado(null)}
        />
      )}
    </div>
  );
};

export default ReporteSeguimientoBienestar;
