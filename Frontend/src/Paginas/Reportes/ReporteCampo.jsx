// Frontend/src/Paginas/Reportes/ReporteCampo.jsx
//
// Componente de Reportes Tab 4: Fichas en Jornada de Campo y SENA Empresa (Almuerzos Guardados).
// Permite a Coordinacion, Bienestar, Administracion, Instructores y SENA Empresa:
//   1. Monitorear las fichas en jornada de campo que solicitaron almuerzos guardados.
//   2. Visualizar KPIs de fichas atendidas, personas ofrecidas, entregados y cumplimiento.
//   3. Grafica de distribucion por Unidad Productiva de SENA Empresa.
//   4. Tabla de Actas oficiales (CAMPO-YYYYMM-XXXX) con detalle y justificacion.
//   5. Listado nominal completo de aprendices (clicable para ver historial individual).
//   6. Exportacion profesional a PDF y Excel con firmas institucionales.
//
// Codigo sin tildes ni emojis para aprendices de ADSO.

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Tractor,
  Calendar,
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Building2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Award
} from "lucide-react";
import apiAxios from "../../api/axiosConfig";
import ModalHistorialAprendiz from "./ModalHistorialAprendiz";
import { exportarAExcel, exportarAPDF, confirmarExportacion } from "../../utils/exportUtils";
import toast from "react-hot-toast";

const UNIDADES_OPCIONES = [
  { clave: "TODAS", label: "Todas las Unidades" },
  { clave: "GANADERIA", label: "Ganaderia" },
  { clave: "PISCICULTURA", label: "Piscicultura" },
  { clave: "PORCINOS", label: "Porcinos" },
  { clave: "AVICULTURA", label: "Avicultura" },
  { clave: "CULTIVOS_AGRICOLAS", label: "Cultivos Agricolas" },
  { clave: "MECANIZACION_AGRICOLA", label: "Mecanizacion Agricola" },
  { clave: "AGROINDUSTRIA", label: "Agroindustria" },
  { clave: "SENA_EMPRESA_GENERAL", label: "SENA Empresa General" },
  { clave: "SALIDA_PEDAGOGICA", label: "Salida Pedagogica" },
  { clave: "OTRA_UNIDAD", label: "Otra Unidad" }
];

const PERIODOS_OPCIONES = [
  { clave: "diario", label: "Diario" },
  { clave: "semanal", label: "Semanal" },
  { clave: "mensual", label: "Mensual" },
  { clave: "anual", label: "Anual" },
  { clave: "personalizado", label: "Personalizado" }
];

const ReporteCampo = () => {
  const [periodo, setPeriodo] = useState("diario");
  const fechaHoyStr = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
  const [fechaInicio, setFechaInicio] = useState(fechaHoyStr);
  const [fechaFin, setFechaFin] = useState(fechaHoyStr);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState("TODAS");
  const [busqueda, setBusqueda] = useState("");

  const [cargando, setCargando] = useState(false);
  const [datosReporte, setDatosReporte] = useState(null);
  const [mostrarGuia, setMostrarGuia] = useState(false);

  // Paginacion para tabla de aprendices nominales
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;

  // Aprendiz seleccionado para modal de historial individual
  const [aprendizSeleccionado, setAprendizSeleccionado] = useState(null);

  // Consulta de datos al backend
  const cargarReporte = useCallback(async () => {
    setCargando(true);
    try {
      const params = {
        periodo,
        fechaInicio: periodo === "personalizado" ? fechaInicio : undefined,
        fechaFin: periodo === "personalizado" ? fechaFin : undefined,
        unidad: unidadSeleccionada !== "TODAS" ? unidadSeleccionada : undefined
      };

      const res = await apiAxios.get("/api/Reportes/campo", { params });
      setDatosReporte(res.data);
      setPaginaActual(1);
    } catch (err) {
      console.error("Error al cargar reporte de campo:", err);
      toast.error("Error al consultar reporte de jornada de campo.");
    } finally {
      setCargando(false);
    }
  }, [periodo, fechaInicio, fechaFin, unidadSeleccionada]);

  useEffect(() => {
    cargarReporte();
  }, [cargarReporte]);

  // Resumen y listas
  const resumen = datosReporte?.resumen || {
    totalFichas: 0,
    totalAprendices: 0,
    totalEntregados: 0,
    totalNoReclamados: 0,
    totalUnidades: 0,
    porcentajeCumplimiento: 0
  };

  const actas = datosReporte?.actas || [];
  const aprendicesNominal = datosReporte?.aprendicesNominal || [];
  const distribucionUnidades = datosReporte?.distribucionUnidades || [];

  // Filtrado local por busqueda (en acta, ficha, programa o aprendiz)
  const actasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return actas;
    const term = busqueda.toLowerCase().trim();
    return actas.filter((a) =>
      (a.Codigo_Acta || "").toLowerCase().includes(term) ||
      (a.Num_Ficha || "").toLowerCase().includes(term) ||
      (a.Nom_Programa || "").toLowerCase().includes(term) ||
      (a.Unidad_Productiva || "").toLowerCase().includes(term) ||
      (a.Justificacion || "").toLowerCase().includes(term)
    );
  }, [actas, busqueda]);

  const aprendicesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return aprendicesNominal;
    const term = busqueda.toLowerCase().trim();
    return aprendicesNominal.filter((a) =>
      (a.NombreCompleto || "").toLowerCase().includes(term) ||
      (a.NumDoc || "").toLowerCase().includes(term) ||
      (a.Num_Ficha || "").toLowerCase().includes(term) ||
      (a.Nom_Programa || "").toLowerCase().includes(term) ||
      (a.Codigo_Acta || "").toLowerCase().includes(term) ||
      (a.Unidad_Productiva || "").toLowerCase().includes(term)
    );
  }, [aprendicesNominal, busqueda]);

  // Paginacion
  const totalPaginas = Math.ceil(aprendicesFiltrados.length / registrosPorPagina) || 1;
  const inicioIdx = (paginaActual - 1) * registrosPorPagina;
  const aprendicesPaginados = aprendicesFiltrados.slice(inicioIdx, inicioIdx + registrosPorPagina);

  // Exportar a Excel
  const handleExportarExcel = async () => {
    if (aprendicesNominal.length === 0 && actas.length === 0) {
      toast.error("No hay datos para exportar en este periodo.");
      return;
    }

    const confirmado = await confirmarExportacion({
      totalOriginal: aprendicesNominal.length,
      totalFiltrado: aprendicesFiltrados.length,
      tieneFiltrosActivos: Boolean(busqueda.trim() || unidadSeleccionada !== "TODAS"),
      formato: "Excel",
      nombreModulo: "aprendices en campo"
    });

    if (!confirmado) return;

    const listaAExportar = confirmado === "filtrados" ? aprendicesFiltrados : aprendicesNominal;

    const datosFormateados = listaAExportar.map((a) => ({
      "Fecha Servicio": a.Fecha || "",
      "Codigo Acta": a.Codigo_Acta || "",
      "Tipo Doc": a.TipDoc || "CC",
      "Documento": a.NumDoc || "",
      "Nombre Completo": a.NombreCompleto || "",
      "Rol": a.Rol || "",
      "N Ficha": a.Num_Ficha || "",
      "Programa Formacion": a.Nom_Programa || "",
      "Unidad Productiva": a.Unidad_Productiva || "",
      "Lugar Practica": a.Lugar_Practica || "",
      "Plato Reservado": a.Nom_Plato || "",
      "Bebida": a.Nom_Bebida || "",
      "Instructor Responsable": a.Instructor_Solicitante || "",
      "Hora Recogida": a.Hora_Recogida || "",
      "Estado Almuerzo": a.Estado || "",
      "Telefono": a.Tel_Usuario || "",
      "Correo": a.Cor_Usuario || ""
    }));

    exportarAExcel({
      datos: datosFormateados,
      nombreArchivo: `Reporte_Jornada_Campo_SENA_Empresa_${periodo}`,
      nombreHoja: "Almuerzos_Campo"
    });
  };

  // Exportar a PDF
  const handleExportarPDF = async () => {
    if (aprendicesNominal.length === 0 && actas.length === 0) {
      toast.error("No hay datos para exportar en este periodo.");
      return;
    }

    const confirmado = await confirmarExportacion({
      totalOriginal: aprendicesNominal.length,
      totalFiltrado: aprendicesFiltrados.length,
      tieneFiltrosActivos: Boolean(busqueda.trim() || unidadSeleccionada !== "TODAS"),
      formato: "PDF",
      nombreModulo: "aprendices en campo"
    });

    if (!confirmado) return;

    const listaAExportar = confirmado === "filtrados" ? aprendicesFiltrados : aprendicesNominal;

    const columnas = [
      "Fecha",
      "Acta",
      "Doc.",
      "Aprendiz",
      "Ficha",
      "Unidad Productiva",
      "Plato",
      "Bebida",
      "Hora",
      "Estado"
    ];

    const filas = listaAExportar.map((a) => [
      a.Fecha || "",
      a.Codigo_Acta || "",
      a.NumDoc || "",
      a.NombreCompleto || "",
      a.Num_Ficha || "",
      a.Unidad_Productiva || "",
      a.Nom_Plato || "",
      a.Nom_Bebida || "",
      a.Hora_Recogida || "",
      a.Estado || ""
    ]);

    exportarAPDF({
      titulo: "REPORTE DE ALMUERZOS GUARDADOS POR JORNADA DE CAMPO Y SENA EMPRESA",
      subtitulo: `Centro Agropecuario La Granja - Espinal Tolima | Periodo: ${periodo.toUpperCase()} | Fichas: ${resumen.totalFichas} | Aprendices: ${resumen.totalAprendices} | Entregados: ${resumen.totalEntregados}`,
      columnas,
      datos: filas,
      nombreArchivo: `Reporte_Campo_SENA_Empresa_${periodo}`,
      orientacion: "landscape"
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner Explicativo Desplegable */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-sm">
              <Tractor className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                🌾 Tab 4 — Fichas en Jornada de Campo y SENA Empresa
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                Control de almuerzos guardados por actividades agropecuarias con autorizacion y hora extendida.
              </p>
            </div>
          </div>
          <button
            onClick={() => setMostrarGuia(!mostrarGuia)}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-xl transition"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{mostrarGuia ? "Ocultar guia" : "¿Como funciona?"}</span>
            {mostrarGuia ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {mostrarGuia && (
          <div className="mt-4 pt-4 border-t border-emerald-200/60 text-xs sm:text-sm text-gray-700 space-y-2">
            <p>
              • <b>Horario de solicitud:</b> Los instructores o voceros solicitan el guardado de almuerzos hasta las <b>11:00 AM</b> del dia del servicio.
            </p>
            <p>
              • <b>Proteccion de vencimiento:</b> Estas raciones no se vencen a la 1:30 PM. El sistema extiende su vigencia hasta la hora fijada (maximo 3:00 PM / 15:00:00).
            </p>
            <p>
              • <b>Cruce de calidad:</b> Permite auditar que las fichas reportadas efectivamente estuvieran en practicas en unidades productivas avaladas.
            </p>
            <p>
              • <b>Historial individual:</b> Haz clic en cualquier aprendiz de la tabla para ver su ficha completa y descargar su historial en PDF o Excel.
            </p>
          </div>
        )}
      </div>

      {/* Barra de Filtros y Controles */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Selectores de Periodo */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
            {PERIODOS_OPCIONES.map((p) => (
              <button
                key={p.clave}
                onClick={() => setPeriodo(p.clave)}
                className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition ${
                  periodo === p.clave
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Botones de Exportacion */}
          <div className="flex items-center gap-2">
            <button
              onClick={cargarReporte}
              disabled={cargando}
              className="p-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition border border-gray-200"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-4 h-4 ${cargando ? "animate-spin text-emerald-600" : ""}`} />
            </button>
            <button
              onClick={handleExportarExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel</span>
            </button>
            <button
              onClick={handleExportarPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition"
            >
              <FileText className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>

        {/* Filtros secundarios: Fechas si es personalizado, Unidad Productiva y Buscador */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
          {periodo === "personalizado" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha Fin</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Unidad Productiva</label>
            <select
              value={unidadSeleccionada}
              onChange={(e) => setUnidadSeleccionada(e.target.value)}
              className="w-full text-xs sm:text-sm p-2 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {UNIDADES_OPCIONES.map((u) => (
                <option key={u.clave} value={u.clave}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>

          <div className={periodo === "personalizado" ? "sm:col-span-1" : "sm:col-span-2 lg:col-span-3"}>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Buscar Acta, Ficha o Aprendiz</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Ej. Ganaderia, Ficha 2994856, CAMPO-202610, Carlos..."
                className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de Metricas Clave (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Fichas Atendidas</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{resumen.totalFichas}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-800 rounded-xl">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Almuerzos Guardados</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-700">{resumen.totalAprendices}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-teal-100 text-teal-800 rounded-xl">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Reclamados / Entregados</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600">{resumen.totalEntregados}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">No Reclamados</p>
            <p className="text-xl sm:text-2xl font-bold text-amber-600">{resumen.totalNoReclamados}</p>
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-purple-800 rounded-xl">
            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">% Cumplimiento</p>
            <p className="text-xl sm:text-2xl font-bold text-purple-700">{resumen.porcentajeCumplimiento}%</p>
          </div>
        </div>
      </div>

      {/* Grafico Visual: Distribucion de Almuerzos por Unidad Productiva de SENA Empresa */}
      {distribucionUnidades.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
            <Tractor className="w-4 h-4 text-emerald-600" />
            Distribucion de Fichas y Almuerzos por Unidad Productiva
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {distribucionUnidades.map((u, idx) => {
              const porcentaje =
                u.totalAprendices > 0
                  ? Math.round((u.totalEntregados / u.totalAprendices) * 100)
                  : 0;
              return (
                <div key={idx} className="bg-gray-50 border border-gray-200 p-3.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                      {u.unidad.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {u.totalFichas} {u.totalFichas === 1 ? "ficha" : "fichas"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Guardados: <b>{u.totalAprendices}</b></span>
                    <span>Entregados: <b className="text-emerald-700">{u.totalEntregados}</b></span>
                  </div>

                  {/* Barra de progreso de entrega */}
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(porcentaje, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TABLA 1: Resumen de Fichas y Actas de Jornada de Campo */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Tabla 1: Actas y Vales Oficiales de Guardado en Campo
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Registros agrupados por Ficha, Instructor y Unidad Productiva
            </p>
          </div>
          <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-xl">
            {actasFiltradas.length} {actasFiltradas.length === 1 ? "acta" : "actas"}
          </span>
        </div>

        {actasFiltradas.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Tractor className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No se encontraron solicitudes de campo en este periodo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-100/80 text-gray-700 font-semibold uppercase text-[11px] tracking-wider border-b border-gray-200">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Codigo Acta</th>
                  <th className="p-3">Ficha</th>
                  <th className="p-3">Programa</th>
                  <th className="p-3">Unidad Productiva</th>
                  <th className="p-3">Justificacion</th>
                  <th className="p-3">Instructor / Vocero</th>
                  <th className="p-3 text-center">Guardados</th>
                  <th className="p-3 text-center">Entregados</th>
                  <th className="p-3">Recogida</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {actasFiltradas.map((acta) => (
                  <tr key={acta.Id_Solicitud_Campo} className="hover:bg-emerald-50/40 transition">
                    <td className="p-3 whitespace-nowrap font-medium text-gray-900">{acta.Fec_Servicio}</td>
                    <td className="p-3 whitespace-nowrap font-mono font-bold text-emerald-700">{acta.Codigo_Acta}</td>
                    <td className="p-3 whitespace-nowrap font-semibold text-gray-800">{acta.Num_Ficha}</td>
                    <td className="p-3 max-w-[180px] truncate" title={acta.Nom_Programa}>{acta.Nom_Programa}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-800">
                        {acta.Unidad_Productiva}
                      </span>
                    </td>
                    <td className="p-3 max-w-[200px] truncate text-gray-600" title={acta.Justificacion}>
                      {acta.Justificacion}
                    </td>
                    <td className="p-3 whitespace-nowrap text-gray-700">
                      {acta.solicitante ? `${acta.solicitante.Nom_Usuario} ${acta.solicitante.Ape_Usuario}` : acta.Rol_Solicitante}
                    </td>
                    <td className="p-3 text-center font-bold text-gray-900">{acta.Total_Aprendices_Guardados}</td>
                    <td className="p-3 text-center font-bold text-emerald-600">{acta.Total_Almuerzos_Entregados}</td>
                    <td className="p-3 whitespace-nowrap text-gray-600 font-mono">{acta.Hora_Estimada_Llegada}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                          acta.Estado_Solicitud === "ENTREGADA_COMPLETA"
                            ? "bg-slate-200 text-slate-700 border-slate-400"
                            : acta.Estado_Solicitud === "ENTREGADA_PARCIAL"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-amber-100 text-amber-800 border-amber-300"
                        }`}
                      >
                        {acta.Estado_Solicitud.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TABLA 2: Listado Nominal Completo de Aprendices en Campo */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50/70">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Tabla 2: Listado Nominal Detallado de Aprendices en Jornada de Campo
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Haz clic sobre cualquier aprendiz para ver su historial individual de consumo y justificaciones
            </p>
          </div>
          <div className="text-xs text-gray-500">
            Mostrando {aprendicesFiltrados.length === 0 ? 0 : inicioIdx + 1} -{" "}
            {Math.min(inicioIdx + registrosPorPagina, aprendicesFiltrados.length)} de{" "}
            <b>{aprendicesFiltrados.length}</b> aprendices
          </div>
        </div>

        {aprendicesFiltrados.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No hay aprendices registrados en jornada de campo para este periodo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-100/80 text-gray-700 font-semibold uppercase text-[11px] tracking-wider border-b border-gray-200">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Documento</th>
                  <th className="p-3">Nombre Completo</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Ficha</th>
                  <th className="p-3">Programa</th>
                  <th className="p-3">Unidad Productiva</th>
                  <th className="p-3">Plato</th>
                  <th className="p-3">Bebida</th>
                  <th className="p-3">Instructor</th>
                  <th className="p-3">Hora Limite</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {aprendicesPaginados.map((a, idx) => (
                  <tr
                    key={a.Id_Reserva || idx}
                    onClick={() => setAprendizSeleccionado(a)}
                    className="hover:bg-blue-50/60 cursor-pointer transition"
                    title="Clic para ver historial completo del aprendiz"
                  >
                    <td className="p-3 whitespace-nowrap text-gray-600 font-medium">{a.Fecha}</td>
                    <td className="p-3 whitespace-nowrap font-mono text-gray-800">{a.NumDoc}</td>
                    <td className="p-3 whitespace-nowrap font-semibold text-gray-900 hover:text-blue-600 transition">
                      {a.NombreCompleto}
                    </td>
                    <td className="p-3 whitespace-nowrap text-xs text-gray-600">{a.Rol}</td>
                    <td className="p-3 whitespace-nowrap font-mono font-bold text-gray-800">{a.Num_Ficha}</td>
                    <td className="p-3 max-w-[160px] truncate" title={a.Nom_Programa}>{a.Nom_Programa}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-800">
                        {a.Unidad_Productiva}
                      </span>
                    </td>
                    <td className="p-3 max-w-[140px] truncate text-gray-700" title={a.Nom_Plato}>{a.Nom_Plato}</td>
                    <td className="p-3 whitespace-nowrap text-gray-700">
                      <span className="text-xs">{a.Nom_Bebida}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap text-xs text-gray-600">{a.Instructor_Solicitante}</td>
                    <td className="p-3 whitespace-nowrap font-mono text-xs text-amber-700 font-semibold">{a.Hora_Recogida}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          a.Estado === "Consumido"
                            ? "bg-slate-200 text-slate-700 border-slate-400"
                            : a.Estado === "Generado" || a.Estado === "Verificado"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : "bg-rose-100 text-rose-800 border-rose-300"
                        }`}
                      >
                        {a.Estado === "Generado" ? "Guardado en Campo" : a.Estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginador */}
        {totalPaginas > 1 && (
          <div className="p-3 sm:p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/60">
            <button
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
            <span className="text-xs font-medium text-gray-600">
              Pagina {paginaActual} de {totalPaginas}
            </span>
            <button
              onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual === totalPaginas}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 transition"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Modal interactivo de Historial Individual del Aprendiz */}
      {aprendizSeleccionado && (
        <ModalHistorialAprendiz
          documento={aprendizSeleccionado.NumDoc}
          idUsuario={aprendizSeleccionado.Id_Usuario}
          nombreAprendiz={aprendizSeleccionado.NombreCompleto}
          aprendizInicial={aprendizSeleccionado}
          onClose={() => setAprendizSeleccionado(null)}
        />
      )}
    </div>
  );
};

export default ReporteCampo;
