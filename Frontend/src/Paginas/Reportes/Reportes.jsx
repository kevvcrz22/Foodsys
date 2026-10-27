// Frontend/src/Paginas/Reportes/Reportes.jsx
//
// Pagina principal del modulo de reportes estadisticos y seguimiento de Foodsys.
// Orquesta tres grandes apartados para administradores, coordinadores y Bienestar al Aprendiz:
//   1. Tab 1 - Consumos Reales (Estadisticas y Tabla Nominal de Aprendices)
//   2. Tab 2 - Inasistencias / No Consumieron (ReporteNoConsumidos.jsx)
//   3. Tab 3 - Alerta de Seguimiento Bienestar (ReporteSeguimientoBienestar.jsx - Deteccion temprana)
//
// Soporta norma ISO-8601 (semanas 1 a 52/53, de lunes a domingo), mensual, anual y personalizado.
// En todos los periodos incluye la Tabla Nominal de Consumidores con modal interactivo al hacer clic
// sobre cualquier aprendiz para revisar su historial individual y exportar a Excel y PDF.

import React, { useState, useEffect, useCallback } from "react";
import { BarChart3, TrendingUp, PieChart, UserX, HeartHandshake, Tractor } from "lucide-react";
import apiAxios from "../../api/axiosConfig";
import { useSocketListener } from "../../api/socket";

// Sub-componentes del modulo de reportes
import TarjetaEstadistica from "./TarjetaEstadistica";
import SelectorPeriodo from "./SelectorPeriodo";
import BotonesExportar from "./BotonesExportar";
import { GraficoBarras, GraficoLineas, GraficoPastel } from "./GraficosReportes";
import TablaReportes from "./TablaReportes";
import ReporteDiario from "./ReporteDiario";
import ReporteNoConsumidos from "./ReporteNoConsumidos";
import TablaConsumidoresNominales from "./TablaConsumidoresNominales";
import ReporteSeguimientoBienestar from "./ReporteSeguimientoBienestar";
import ReporteCampo from "./ReporteCampo";
import { descargarBlobUniversal, confirmarExportacion } from "../../utils/exportUtils";

const Reportes = () => {
  // Detección de rol del usuario: Cocina solo tiene acceso a Consumos Reales (quienes consumieron)
  const rolActivo = (localStorage.getItem("rolActivo") || localStorage.getItem("rol") || "").trim().toLowerCase();
  const esRolCocina = rolActivo.includes("cocina") && !rolActivo.includes("admin") && !rolActivo.includes("coordinad");

  // Vista activa principal: "estadisticas" | "no_consumidos" | "seguimiento_bienestar"
  const [VistaActiva, Set_VistaActiva] = useState("estadisticas");

  // Si el rol es cocina, forzar siempre a vista de consumos reales
  useEffect(() => {
    if (esRolCocina && VistaActiva !== "estadisticas") {
      Set_VistaActiva("estadisticas");
    }
  }, [esRolCocina, VistaActiva]);

  // Periodo activo del modulo estadistico.
  // Se inicializa en "diario" para que el tab Diario sea lo primero que ve el usuario.
  const [Periodo, Set_Periodo] = useState("diario");

  // Datos recibidos del backend para los tabs no-diarios.
  const [Datos, Set_Datos] = useState([]);

  // Indicador de carga para los tabs no-diarios
  const [Cargando, Set_Cargando] = useState(false);

  // Estado del proceso de exportacion: "pdf" | "excel" | null
  const [Exportando, Set_Exportando] = useState(null);

  // Filtros de fecha y tiempo
  const fechaHoyStr = new Date().toISOString().split("T")[0];
  const [FechaInicio, Set_FechaInicio] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [FechaFin, Set_FechaFin] = useState(fechaHoyStr);

  // Selector ISO de semana y fecha
  const [Anio, Set_Anio] = useState(String(new Date().getFullYear()));
  const [SemanaISO, Set_SemanaISO] = useState("1");
  const [Mes, Set_Mes] = useState(String(new Date().getMonth() + 1));
  const [ModoSemana, Set_ModoSemana] = useState("iso");

  // Tipo de alimento para el filtro
  const [TipoAlimento, Set_TipoAlimento] = useState("Todos");

  // Cargar datos estadisticos de graficas para periodos no-diarios
  const Cargar_Datos = useCallback(async () => {
    if (Periodo === "diario" || VistaActiva !== "estadisticas") return;

    Set_Cargando(true);
    try {
      const Endpoint =
        Periodo === "personalizado"
          ? "/api/Reportes/personalizado"
          : `/api/Reportes/${Periodo}`;

      const Params = {
        periodo: Periodo,
        fechaInicio: FechaInicio,
        fechaFin: FechaFin,
        tipoAlimento: TipoAlimento !== "Todos" ? TipoAlimento : undefined,
        anio: Anio,
        semana: SemanaISO,
        mes: Mes
      };

      const Res = await apiAxios.get(Endpoint, { params: Params });
      Set_Datos(Array.isArray(Res.data) ? Res.data : []);
    } catch (Err) {
      console.error("Error cargando reporte estadistico:", Err);
      Set_Datos([]);
    } finally {
      Set_Cargando(false);
    }
  }, [Periodo, VistaActiva, FechaInicio, FechaFin, TipoAlimento, Anio, SemanaISO, Mes]);

  useEffect(() => {
    Cargar_Datos();
  }, [Cargar_Datos]);

  // Sockets para actualizacion en tiempo real
  useSocketListener("reservas:actualizadas", () => {
    Cargar_Datos();
  });

  // Calculos de totales
  const Datos_Array = Array.isArray(Datos) ? Datos : [];
  const Total_Reservas = Datos_Array.reduce((A, R) => A + Number(R.total || 0), 0);
  const Total_Desayunos = Datos_Array.reduce((A, R) => A + Number(R.desayuno || R.desayunos || 0), 0);
  const Total_Almuerzos = Datos_Array.reduce((A, R) => A + Number(R.almuerzo || R.almuerzos || 0), 0);
  const Total_Cenas = Datos_Array.reduce((A, R) => A + Number(R.cena || R.cenas || 0), 0);

  // Preparacion de datos para Google Charts
  const Datos_Barras = [
    [
      "Periodo",
      "Desayunos", { role: "annotation", type: "string" },
      "Almuerzos", { role: "annotation", type: "string" },
      "Cenas", { role: "annotation", type: "string" }
    ],
    ...Datos_Array.map((R) => [
      String(R.label || R.periodo || ""),
      Number(R.desayuno || R.desayunos || 0), String(R.desayuno || R.desayunos || 0),
      Number(R.almuerzo || R.almuerzos || 0), String(R.almuerzo || R.almuerzos || 0),
      Number(R.cena || R.cenas || 0), String(R.cena || R.cenas || 0),
    ]),
  ];
  const Datos_Lineas = [
    ["Periodo", "Total", { role: "annotation", type: "string" }],
    ...Datos_Array.map((R) => [String(R.label || R.periodo || ""), Number(R.total || 0), String(R.total || 0)]),
  ];
  const Datos_Pastel = [
    ["Tipo", "Cantidad"],
    ["Desayunos", Total_Desayunos],
    ["Almuerzos", Total_Almuerzos],
    ["Cenas", Total_Cenas],
  ];

  // Exportar estadisticas globales con confirmacion y descarga universal
  const Exportar = async (Formato) => {
    const totalRegistros = Datos_Array.length;
    if (totalRegistros === 0) {
      alert("No hay datos estadisticos para exportar en este periodo.");
      return;
    }

    const tieneFiltros = TipoAlimento !== "Todos" || Periodo === "personalizado";
    const confirmado = await confirmarExportacion({
      tieneFiltros,
      totalFiltrados: totalRegistros,
      totalRegistros: totalRegistros,
      formato: Formato.toUpperCase()
    });
    if (!confirmado) return;

    Set_Exportando(Formato);
    try {
      const Params = {
        periodo: Periodo,
        fechaInicio: FechaInicio,
        fechaFin: FechaFin,
        tipoAlimento: TipoAlimento !== "Todos" ? TipoAlimento : undefined,
        anio: Anio,
        semana: SemanaISO,
        mes: Mes
      };

      const Res = await apiAxios.get(`/api/Reportes/exportar/${Formato}`, {
        params: Params,
        responseType: "blob",
      });

      const Ext = Formato === "pdf" ? "pdf" : "xlsx";
      const Mime =
        Formato === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      descargarBlobUniversal(
        Res.data,
        `Reporte_${Periodo}_${new Date().toISOString().split("T")[0]}.${Ext}`,
        Mime
      );
    } catch (Err) {
      console.error("Error exportando reporte:", Err);
      alert("Error al exportar reporte. Verifica la conexion.");
    } finally {
      Set_Exportando(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8 space-y-6">
      {/* Cabecera del modulo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
            Reportes y Seguimiento Nutricional
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Control de reservas, inasistencias y seguimiento psicosocial para Bienestar
          </p>
        </div>

        {VistaActiva === "estadisticas" && Periodo !== "diario" && (
          <BotonesExportar
            Exportando={Exportando}
            Datos_Vacios={Datos.length === 0}
            Exportar={Exportar}
            Actualizar={Cargar_Datos}
          />
        )}
      </div>

      {/* Triple Conmutador de Enfoque para Administracion, Cocina y Bienestar */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => Set_VistaActiva("estadisticas")}
          className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center gap-2 border ${
            VistaActiva === "estadisticas"
              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Tab 1 — Consumos Reales</span>
        </button>

        {!esRolCocina && (
          <>
            <button
              onClick={() => Set_VistaActiva("no_consumidos")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center gap-2 border ${
                VistaActiva === "no_consumidos"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <UserX className="w-4 h-4 text-rose-300" />
              <span>Tab 2 — Inasistencias / No Consumieron</span>
            </button>

            <button
              onClick={() => Set_VistaActiva("seguimiento_bienestar")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center gap-2 border ${
                VistaActiva === "seguimiento_bienestar"
                  ? "bg-purple-700 text-white border-purple-700 shadow-sm shadow-purple-200"
                  : "bg-white text-purple-700 border-purple-200 hover:bg-purple-50"
              }`}
            >
              <HeartHandshake className="w-4 h-4 text-purple-300" />
              <span>Tab 3 — Alerta Seguimiento Bienestar</span>
            </button>

            <button
              onClick={() => Set_VistaActiva("campo")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center gap-2 border ${
                VistaActiva === "campo"
                  ? "bg-emerald-700 text-white border-emerald-700 shadow-sm shadow-emerald-200"
                  : "bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50"
              }`}
            >
              <Tractor className="w-4 h-4 text-emerald-500" />
              <span>Tab 4 — Jornada de Campo & SENA Empresa</span>
            </button>
          </>
        )}
      </div>

      {/* Renderizado segun el enfoque activo */}
      {VistaActiva === "no_consumidos" ? (
        <ReporteNoConsumidos />
      ) : VistaActiva === "seguimiento_bienestar" ? (
        <ReporteSeguimientoBienestar />
      ) : VistaActiva === "campo" ? (
        <ReporteCampo />
      ) : (
        <>
          {/* Selector de periodo ISO / fechas */}
          <SelectorPeriodo
            Periodo={Periodo}
            Set_Periodo={Set_Periodo}
            FechaInicio={FechaInicio}
            Set_FechaInicio={Set_FechaInicio}
            FechaFin={FechaFin}
            Set_FechaFin={Set_FechaFin}
            TipoAlimento={TipoAlimento}
            Set_TipoAlimento={Set_TipoAlimento}
            Anio={Anio}
            Set_Anio={Set_Anio}
            SemanaISO={SemanaISO}
            Set_SemanaISO={Set_SemanaISO}
            Mes={Mes}
            Set_Mes={Set_Mes}
            ModoSemana={ModoSemana}
            Set_ModoSemana={Set_ModoSemana}
          />

          {Periodo === "diario" ? (
            <ReporteDiario />
          ) : (
            <div className="space-y-6">
              {/* Tarjetas de Estadisticas */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <TarjetaEstadistica
                  Etiqueta="Total Reservas"
                  Valor={Total_Reservas}
                  Color="bg-indigo-600"
                  Icono={BarChart3}
                />
                <TarjetaEstadistica
                  Etiqueta="Desayunos"
                  Valor={Total_Desayunos}
                  Color="bg-purple-500"
                  Icono={TrendingUp}
                />
                <TarjetaEstadistica
                  Etiqueta="Almuerzos"
                  Valor={Total_Almuerzos}
                  Color="bg-emerald-600"
                  Icono={TrendingUp}
                />
                <TarjetaEstadistica
                  Etiqueta="Cenas"
                  Valor={Total_Cenas}
                  Color="bg-amber-500"
                  Icono={PieChart}
                />
              </div>

              {Cargando ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              ) : Datos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-200">
                  <BarChart3 className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-base font-medium">No hay datos estadisticos para este periodo</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <GraficoBarras Datos={Datos_Barras} Periodo={Periodo} />
                  <GraficoLineas Datos={Datos_Lineas} />
                  <GraficoPastel Datos={Datos_Pastel} />
                  <TablaReportes Datos={Datos} />
                </div>
              )}

              {/* TABLA NOMINAL DE CONSUMIDORES DEBAJO DE LOS GRAFICOS */}
              <TablaConsumidoresNominales
                periodo={Periodo}
                fecha={FechaInicio}
                anio={Anio}
                semana={SemanaISO}
                mes={Mes}
                fechaInicio={FechaInicio}
                fechaFin={FechaFin}
                tipoAlimento={TipoAlimento}
                estado="Todos"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reportes;