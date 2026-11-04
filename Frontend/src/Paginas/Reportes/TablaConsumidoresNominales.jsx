// Frontend/src/Paginas/Reportes/TablaConsumidoresNominales.jsx
//
// Componente de tabla nominal de consumidores para el modulo de Reportes.
// Muestra el listado detallado de aprendices y pasantes que consumieron alimentos
// en el periodo seleccionado (Diario, Semanal ISO, Mensual, Anual o Personalizado).
//
// Al hacer clic en cualquier fila o nombre de aprendiz, abre el modal interactivo
// con el historial completo de consumo de ese aprendiz (ModalHistorialAprendiz.jsx).
//
// Incluye botones de exportacion a Excel y PDF con confirmacion inteligente segun filtros.

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, UserCheck, Utensils, Download, FileSpreadsheet, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import apiAxios from "../../api/axiosConfig";
import ModalHistorialAprendiz from "./ModalHistorialAprendiz";
import { exportarAExcel, exportarAPDF, confirmarExportacion } from "../../utils/exportUtils";

const TablaConsumidoresNominales = ({
  periodo = "semanal",
  fecha = "",
  anio = "",
  semana = "",
  mes = "",
  fechaInicio = "",
  fechaFin = "",
  tipoAlimento = "Todos",
  idPlato = "Todos",
  estado = "Consumido"
}) => {
  const rolActivo = (localStorage.getItem("rolActivo") || localStorage.getItem("rol") || "").trim().toLowerCase();
  const esRolCocina = rolActivo.includes("cocina") && !rolActivo.includes("admin") && !rolActivo.includes("coordinad");

  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;

  // Aprendiz seleccionado para abrir el modal de historial individual
  const [aprendizSeleccionado, setAprendizSeleccionado] = useState(null);

  // Cargar registros nominales desde el backend
  const cargarNominales = useCallback(async () => {
    setCargando(true);
    try {
      const params = {
        periodo,
        fecha,
        anio,
        semana,
        mes,
        fechaInicio,
        fechaFin,
        tipoAlimento: tipoAlimento !== "Todos" ? tipoAlimento : undefined,
        idPlato: idPlato !== "Todos" ? idPlato : undefined,
        estado: estado !== "Todos" ? estado : undefined
      };

      const respuesta = await apiAxios.get("/api/Reportes/consumidores-nominales", { params });
      if (respuesta.data && Array.isArray(respuesta.data.registros)) {
        setRegistros(respuesta.data.registros);
      } else {
        setRegistros([]);
      }
    } catch (error) {
      console.error("Error al cargar consumidores nominales:", error);
      setRegistros([]);
    } finally {
      setCargando(false);
    }
  }, [periodo, fecha, anio, semana, mes, fechaInicio, fechaFin, tipoAlimento, idPlato, estado]);

  useEffect(() => {
    cargarNominales();
    setPaginaActual(1);
  }, [cargarNominales]);

  // Filtrado reactivo en memoria por busqueda en tiempo real
  const registrosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return registros;
    const q = busqueda.trim().toLowerCase();
    return registros.filter((item) =>
      item.NombreCompleto.toLowerCase().includes(q) ||
      String(item.NumDoc).includes(q) ||
      String(item.Num_Ficha).includes(q) ||
      item.Programa.toLowerCase().includes(q) ||
      item.Plato.toLowerCase().includes(q)
    );
  }, [registros, busqueda]);

  // Paginacion
  const totalPaginas = Math.ceil(registrosFiltrados.length / registrosPorPagina) || 1;
  const registrosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    return registrosFiltrados.slice(inicio, inicio + registrosPorPagina);
  }, [registrosFiltrados, paginaActual]);

  // Exportar a Excel
  const manejarExportarExcel = async () => {
    if (registros.length === 0) {
      toast.error("No hay registros para exportar en el periodo actual.");
      return;
    }

    const tieneFiltros = busqueda.trim() !== "";
    const datosBase = tieneFiltros ? registrosFiltrados : registros;
    const datosAExportar = esRolCocina
      ? datosBase.map((item) => ({
          ...item,
          NumDoc: `***${String(item.NumDoc || "000").slice(-3)}`,
          NombreCompleto: `Comensal #${item.Id_Reserva || item.Id_Usuario}`
        }))
      : datosBase;

    const confirmado = await confirmarExportacion({
      tieneFiltros,
      totalFiltrados: datosAExportar.length,
      totalRegistros: registros.length,
      formato: "Excel"
    });

    if (!confirmado) return;

    const columnas = [
      { header: "Fecha", key: "Fecha" },
      { header: "Tipo Doc", key: "TipDoc" },
      { header: "N° Documento", key: "NumDoc" },
      { header: "Nombre Completo", key: "NombreCompleto" },
      { header: "Rol", key: "Rol" },
      { header: "Centro Convivencia", key: "CenCon_Usuario" },
      { header: "N° Ficha", key: "Num_Ficha" },
      { header: "Programa de Formacion", key: "Programa" },
      { header: "Tipo de Comida", key: "Tipo_Comida" },
      { header: "Plato Consumido", key: "Plato" },
      { header: "Bebida", key: "Bebida" },
      { header: "Estado", key: "Estado" }
    ];

    exportarAExcel({
      columnas,
      datos: datosAExportar,
      nombreArchivo: `Consumidores_${periodo}_${new Date().toISOString().split("T")[0]}`,
      tituloHoja: "Consumidores Nominales"
    });
  };

  // Exportar a PDF
  const manejarExportarPDF = async () => {
    if (registros.length === 0) {
      toast.error("No hay registros para exportar en el periodo actual.");
      return;
    }

    const tieneFiltros = busqueda.trim() !== "";
    const datosBase = tieneFiltros ? registrosFiltrados : registros;
    const datosAExportar = esRolCocina
      ? datosBase.map((item) => ({
          ...item,
          NumDoc: `***${String(item.NumDoc || "000").slice(-3)}`,
          NombreCompleto: `Comensal #${item.Id_Reserva || item.Id_Usuario}`
        }))
      : datosBase;

    const confirmado = await confirmarExportacion({
      tieneFiltros,
      totalFiltrados: datosAExportar.length,
      totalRegistros: registros.length,
      formato: "PDF"
    });

    if (!confirmado) return;

    const columnas = [
      { header: "Fecha", key: "Fecha" },
      { header: "Documento", key: "NumDoc" },
      { header: "Nombre Completo", key: "NombreCompleto" },
      { header: "Rol", key: "Rol" },
      { header: "Ficha", key: "Num_Ficha" },
      { header: "Comida", key: "Tipo_Comida" },
      { header: "Plato", key: "Plato" },
      { header: "Bebida", key: "Bebida" },
      { header: "Estado", key: "Estado" }
    ];

    exportarAPDF({
      columnas,
      datos: datosAExportar,
      nombreArchivo: `Consumidores_${periodo}_${new Date().toISOString().split("T")[0]}`,
      titulo: `Listado Nominal de Consumidores (${periodo.toUpperCase()})`,
      subtitulo: `Total de consumos registrados: ${datosAExportar.length}`
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-6">
      {/* Cabecera con titulo y botones */}
      <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              Tabla Nominal de Consumidores
            </h3>
            <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              {registrosFiltrados.length} consumos
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Haz clic en cualquier aprendiz para ver su historial completo de consumo y reservas
          </p>
        </div>

        {/* Buscador y botones de exportacion */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, documento o ficha..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <button
            onClick={manejarExportarExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition"
            title="Exportar listado a Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={manejarExportarPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition"
            title="Exportar listado a PDF"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* Contenido de la tabla */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-2" />
          <p className="text-xs">Cargando consumidores nominales...</p>
        </div>
      ) : registrosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Utensils className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-sm font-medium">No se encontraron consumos para los filtros seleccionados</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Aprendiz / Pasante</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Ficha</th>
                <th className="px-4 py-3">Programa</th>
                <th className="px-4 py-3">Comida</th>
                <th className="px-4 py-3">Plato</th>
                <th className="px-4 py-3">Bebida</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {registrosPaginados.map((item) => (
                <tr
                  key={item.Id_Reserva}
                  onClick={() => {
                    if (!esRolCocina) setAprendizSeleccionado(item);
                  }}
                  className={`transition ${esRolCocina ? "" : "hover:bg-indigo-50/50 cursor-pointer"}`}
                  title={esRolCocina ? "Datos personales anonimizados para Cocina" : "Clic para ver historial individual de este aprendiz"}
                >
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                    {item.Fecha}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                    {esRolCocina ? `***${String(item.NumDoc || "000").slice(-3)}` : `${item.TipDoc} ${item.NumDoc}`}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap font-medium ${esRolCocina ? "text-slate-700" : "text-indigo-600 hover:underline"}`}>
                    {esRolCocina ? `Comensal #${item.Id_Reserva || item.Id_Usuario}` : item.NombreCompleto}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.CenCon_Usuario === "Si"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {item.Rol}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                    {item.Num_Ficha}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-gray-600" title={item.Programa}>
                    {item.Programa}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-semibold text-gray-800">{item.Tipo_Comida}</span>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-gray-600 font-medium">
                    {item.Plato}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-gray-600 font-medium">
                    {item.Bebida || "Ninguna"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                        item.Estado === "Generado"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : item.Estado === "Consumido"
                          ? "bg-slate-200 text-slate-700 border-slate-400"
                          : item.Estado === "Verificado" || item.Estado === "Pendiente"
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : "bg-rose-100 text-rose-800 border-rose-300"
                      }`}
                    >
                      {item.Estado}
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
            Mostrando {registrosPaginados.length} de {registrosFiltrados.length} registros
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
              disabled={paginaActual === 1}
              className="p-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Pagina {paginaActual} de {totalPaginas}
            </span>
            <button
              onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas}
              className="p-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Historial Individual del Aprendiz */}
      {aprendizSeleccionado && (
        <ModalHistorialAprendiz
          documento={aprendizSeleccionado.NumDoc}
          aprendizId={aprendizSeleccionado.Id_Usuario}
          nombreAprendiz={aprendizSeleccionado.NombreCompleto}
          aprendizInicial={aprendizSeleccionado}
          onClose={() => setAprendizSeleccionado(null)}
        />
      )}
    </div>
  );
};

export default TablaConsumidoresNominales;
