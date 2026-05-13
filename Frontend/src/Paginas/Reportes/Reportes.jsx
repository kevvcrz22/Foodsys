// Paginas/Reportes/Reportes.jsx
//
// Pagina principal del modulo de reportes estadisticos de Foodsys.
// Orquesta los tabs: Diario, Semanal, Mensual, Anual y Personalizado.
//
// Comportamiento clave:
//   - Al ingresar al modulo, el tab DIARIO se muestra activo por defecto.
//   - El tab Diario (ReporteDiario.jsx) tiene su propio selector de fecha,
//     filtro de tipo, tabla y graficas. No depende de los estados de este componente.
//   - Los tabs Semanal, Mensual, Anual y Personalizado mantienen la logica
//     existente (graficas de Google Charts, tarjetas estadisticas, exportacion).
//
// Cambios respecto a la version anterior:
//   1. Se agrego el tab "Diario" como primer elemento del selector de periodo.
//   2. El estado inicial de Periodo cambio a "diario".
//   3. Cuando Periodo === "diario" se renderiza el componente ReporteDiario
//      en lugar del panel de graficas general.
//   4. Cuando el periodo es distinto de "diario" el comportamiento es identico
//      al archivo Reportes.jsx original sin ninguna modificacion de logica.
//
// La transformacion de datos para graficas y todos los calculos de totales
// se realizan en este componente, no en el backend, porque son operaciones
// de presentacion sobre datos ya recibidos (sumas de arrays).

import { useState, useEffect, useCallback } from "react";
import { BarChart3, TrendingUp, PieChart } from "lucide-react";
import apiAxios from "../../api/axiosConfig";

// Sub-componentes del modulo de reportes
import TarjetaEstadistica from "./TarjetaEstadistica";
import SelectorPeriodo from "./SelectorPeriodo";
import BotonesExportar from "./BotonesExportar";
import { GraficoBarras, GraficoLineas, GraficoPastel } from "./GraficosReportes";
import TablaReportes from "./TablaReportes";
import ReporteDiario from "./ReporteDiario";

// ---------------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------------

const Reportes = () => {

  // Periodo activo del modulo.
  // Se inicializa en "diario" para que el tab Diario sea lo primero que ve el Coordinador.
  const [Periodo, Set_Periodo] = useState("diario");

  // Datos recibidos del backend para los tabs no-diarios.
  // Estructura de cada elemento: { label, periodo, total, desayunos, almuerzos, cenas }
  const [Datos, Set_Datos] = useState([]);

  // Indicador de carga para los tabs no-diarios
  const [Cargando, Set_Cargando] = useState(false);

  // Estado del proceso de exportacion: "pdf" | "excel" | null
  const [Exportando, Set_Exportando] = useState(null);

  // Fechas para el periodo personalizado
  const [FechaInicio, Set_FechaInicio] = useState(new Date().toISOString().split("T")[0]);
  const [FechaFin, Set_FechaFin] = useState(new Date().toISOString().split("T")[0]);

  // Tipo de alimento para el filtro del periodo personalizado
  const [TipoAlimento, Set_TipoAlimento] = useState("Todos");

  // ---------------------------------------------------------------------------
  // FUNCION: Cargar_Datos
  // Solo se ejecuta para periodos distintos de "diario".
  // El tab Diario gestiona sus propias peticiones internamente.
  // ---------------------------------------------------------------------------
  const Cargar_Datos = useCallback(async () => {
    // Si el tab activo es Diario, no hacer ninguna peticion desde aqui.
    // El componente ReporteDiario se encarga de sus propios datos.
    if (Periodo === "diario") return;

    Set_Cargando(true);
    try {
      // Determinar el endpoint segun el periodo seleccionado
      const Endpoint =
        Periodo === "personalizado"
          ? "/api/Reportes/personalizado"
          : `/api/Reportes/${Periodo}`;

      // Los parametros extra solo aplican para el periodo personalizado
      const Params =
        Periodo === "personalizado"
          ? { fechaInicio: FechaInicio, fechaFin: FechaFin, tipoAlimento: TipoAlimento }
          : {};

      const Res = await apiAxios.get(Endpoint, { params: Params });
      Set_Datos(Res.data);
    } catch (Err) {
      console.error("Error cargando reporte:", Err);
    } finally {
      Set_Cargando(false);
    }
  }, [Periodo, FechaInicio, FechaFin, TipoAlimento]);

  // Ejecutar la carga de datos cada vez que cambia el periodo o los filtros
  useEffect(() => { Cargar_Datos(); }, [Cargar_Datos]);

  // ---------------------------------------------------------------------------
  // CALCULOS DE TOTALES PARA TARJETAS DE ESTADISTICAS
  // Se calculan sumando los campos del array Datos recibido del backend.
  // El operador Number() evita errores si el backend retorna strings numericos.
  // ---------------------------------------------------------------------------
  const Total_Reservas = Datos.reduce((A, R) => A + Number(R.total || 0), 0);
  const Total_Desayunos = Datos.reduce((A, R) => A + Number(R.desayunos || 0), 0);
  const Total_Almuerzos = Datos.reduce((A, R) => A + Number(R.almuerzos || 0), 0);
  const Total_Cenas = Datos.reduce((A, R) => A + Number(R.cenas || 0), 0);

  // ---------------------------------------------------------------------------
  // PREPARACION DE DATOS PARA GRAFICAS DE GOOGLE CHARTS
  // Cada grafica requiere un array donde la primera fila es el encabezado.
  // String() asegura que el eje X sea texto (algunos periodos llegan como numeros).
  // ---------------------------------------------------------------------------
  const Datos_Barras = [
    ["Periodo", "Desayunos", "Almuerzos", "Cenas"],
    ...Datos.map((R) => [
      String(R.label || R.periodo || ""),
      Number(R.desayunos || 0),
      Number(R.almuerzos || 0),
      Number(R.cenas || 0),
    ]),
  ];
  const Datos_Lineas = [
    ["Periodo", "Total"],
    ...Datos.map((R) => [String(R.label || R.periodo || ""), Number(R.total || 0)]),
  ];
  const Datos_Pastel = [
    ["Tipo", "Cantidad"],
    ["Desayunos", Total_Desayunos],
    ["Almuerzos", Total_Almuerzos],
    ["Cenas", Total_Cenas],
  ];

  // ---------------------------------------------------------------------------
  // FUNCION: Exportar
  // Solicita al backend el archivo en el formato indicado y lo descarga.
  // Se reutiliza para todos los periodos incluyendo el personalizado.
  // ---------------------------------------------------------------------------
  const Exportar = async (Formato) => {
    Set_Exportando(Formato);
    try {
      // Construir los parametros de la peticion con el periodo activo
      const Params = { periodo: Periodo };
      if (Periodo === "personalizado") {
        Params.fechaInicio = FechaInicio;
        Params.fechaFin = FechaFin;
        Params.tipoAlimento = TipoAlimento;
      }

      // La opcion responseType: "blob" indica a axios que la respuesta es binaria
      const Res = await apiAxios.get(`/api/Reportes/exportar/${Formato}`, {
        params: Params,
        responseType: "blob",
      });

      // Determinar la extension y el MIME type segun el formato solicitado
      const Ext = Formato === "pdf" ? "pdf" : "xlsx";
      const Mime =
        Formato === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      // Crear una URL temporal para el blob y simular un clic de descarga
      const Blob_Arch = new Blob([Res.data], { type: Mime });
      const Url = URL.createObjectURL(Blob_Arch);
      const Enlace = document.createElement("a");
      Enlace.href = Url;
      Enlace.download = `Reporte_${Periodo}_${new Date().toISOString().split("T")[0]}.${Ext}`;
      Enlace.click();

      // Liberar la URL temporal para evitar fugas de memoria en el navegador
      URL.revokeObjectURL(Url);
    } catch (Err) {
      console.error("Error exportando:", Err);
      alert("Error al exportar. Verifica la conexion con el servidor.");
    } finally {
      Set_Exportando(null);
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8 space-y-6">

      {/* ===================================================================
          CABECERA DEL MODULO
          Titulo principal + botones de actualizar, PDF y Excel.
          Los botones de exportacion solo son relevantes para tabs no-diarios;
          en el tab Diario los botones de exportacion estan dentro del propio
          componente ReporteDiario con los filtros de fecha correctos.
      ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
            Reportes Estadisticos
          </h1>
          <p className="text-sm text-gray-500 mt-1">Analisis de reservas por periodo</p>
        </div>

        {/* Mostrar botones globales solo cuando el tab activo NO es el diario.
            En el tab Diario los botones de exportacion estan dentro del componente. */}
        {Periodo !== "diario" && (
          <BotonesExportar
            Exportando={Exportando}
            Datos_Vacios={Datos.length === 0}
            Exportar={Exportar}
            Actualizar={Cargar_Datos}
          />
        )}
      </div>

      {/* ===================================================================
          SELECTOR DE PERIODO
          Botones: Diario | Semanal | Mensual | Anual | Personalizado.
          El componente SelectorPeriodo solo renderiza los filtros de fecha
          cuando el periodo es "personalizado".
          El tab Diario tiene sus propios filtros dentro de ReporteDiario.
      ==================================================================== */}
      <SelectorPeriodo
        Periodo={Periodo}
        Set_Periodo={Set_Periodo}
        FechaInicio={FechaInicio}
        Set_FechaInicio={Set_FechaInicio}
        FechaFin={FechaFin}
        Set_FechaFin={Set_FechaFin}
        TipoAlimento={TipoAlimento}
        Set_TipoAlimento={Set_TipoAlimento}
      />

      {/* ===================================================================
          CONTENIDO PRINCIPAL SEGUN EL TAB ACTIVO
      ==================================================================== */}

      {Periodo === "diario" ? (
        /* ---------------------------------------------------------------
           TAB DIARIO
           Se delega completamente al componente ReporteDiario que tiene
           su propio selector de fecha, filtros, tabla y graficas.
           No necesita Datos ni ningun estado de este componente.
        --------------------------------------------------------------- */
        <ReporteDiario />

      ) : (
        /* ---------------------------------------------------------------
           TABS: SEMANAL, MENSUAL, ANUAL, PERSONALIZADO
           Logica identica al Reportes.jsx original.
           Las tarjetas de estadisticas y graficas usan el array Datos
           cargado por Cargar_Datos.
        --------------------------------------------------------------- */
        <>
          {/* Tarjetas de estadisticas numericas del periodo */}
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

          {/* Estado de carga: spinner centrado mientras el backend responde */}
          {Cargando ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>

            /* Estado vacio: no hay datos para el periodo seleccionado */
          ) : Datos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <BarChart3 className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-base font-medium">No hay datos para este periodo</p>
            </div>

            /* Estado con datos: renderizar graficas y tabla */
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Grafica de barras agrupadas por tipo de comida */}
              <GraficoBarras Datos={Datos_Barras} Periodo={Periodo} />

              {/* Grafica de linea con la evolucion total del periodo */}
              <GraficoLineas Datos={Datos_Lineas} />

              {/* Grafica de pastel con distribucion de tipos de comida */}
              <GraficoPastel Datos={Datos_Pastel} />

              {/* Tabla de datos con columnas: Periodo, Total, Desayuno, Almuerzo, Cena */}
              <TablaReportes Datos={Datos} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reportes;