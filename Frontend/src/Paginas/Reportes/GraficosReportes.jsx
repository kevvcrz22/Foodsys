// Paginas/Reportes/GraficosReportes.jsx
// Componentes de graficos (barras, lineas, pastel)
// usando react-google-charts

import { Chart } from "react-google-charts";
import { BarChart3, TrendingUp, PieChart } from "lucide-react";

// Envoltorio de grafico reutilizable
// eslint-disable-next-line no-unused-vars
const EnvoltorioGrafico = ({ Titulo, Icono: Comp_Icono, Color_Icono, children }) => (
  <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-5">
    <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2 text-sm">
      <Comp_Icono className={`w-4 h-4 ${Color_Icono}`} />
      {Titulo}
    </h3>
    {children}
  </div>
);

// Opciones base de los graficos con etiquetas numericas directas
const Opciones_Base = {
  Barras: {
    chartArea: { width: "75%", height: "65%" },
    colors: ["#6366f1", "#10b981", "#f59e0b"],
    legend: { position: "bottom" },
    hAxis: { textStyle: { fontSize: 11 } },
    vAxis: { minValue: 0, textStyle: { fontSize: 11 } },
    annotations: {
      alwaysOutside: true,
      textStyle: {
        fontSize: 10,
        bold: true,
        color: "#1f2937",
        auraColor: "none",
      },
    },
  },
  Lineas: {
    chartArea: { width: "75%", height: "65%" },
    colors: ["#6366f1"],
    legend: { position: "none" },
    curveType: "function",
    pointSize: 6,
    annotations: {
      textStyle: {
        fontSize: 11,
        bold: true,
        color: "#4338ca",
        auraColor: "none",
      },
    },
  },
  Pastel: {
    colors: ["#6366f1", "#10b981", "#f59e0b"],
    chartArea: { width: "85%", height: "80%" },
    legend: { position: "right" },
    pieHole: 0.4,
    pieSliceText: "value", // Muestra el numero directamente sobre cada rebanada
    sliceVisibilityThreshold: 0,
  },
};

export const GraficoBarras = ({ Datos, Periodo }) => {
  // Transforma los datos para inyectar la columna de anotacion (numero visible) si no esta presente
  let datosConAnotaciones = Datos;
  if (Array.isArray(Datos) && Datos.length > 1 && Datos[0].length === 4) {
    const cabecera = [
      Datos[0][0],
      Datos[0][1], { role: "annotation", type: "string" },
      Datos[0][2], { role: "annotation", type: "string" },
      Datos[0][3], { role: "annotation", type: "string" },
    ];
    const filas = Datos.slice(1).map((r) => [
      r[0],
      Number(r[1] || 0), String(r[1] || 0),
      Number(r[2] || 0), String(r[2] || 0),
      Number(r[3] || 0), String(r[3] || 0),
    ]);
    datosConAnotaciones = [cabecera, ...filas];
  }

  return (
    <EnvoltorioGrafico Titulo="Reservas por tipo" Icono={BarChart3} Color_Icono="text-indigo-500">
      <Chart
        chartType="BarChart"
        data={datosConAnotaciones}
        options={{ ...Opciones_Base.Barras, title: `Reservas por tipo - ${Periodo}` }}
        width="100%" height="320px"
      />
    </EnvoltorioGrafico>
  );
};

export const GraficoLineas = ({ Datos }) => {
  // Transforma los datos para inyectar la columna de anotacion si no esta presente
  let datosConAnotaciones = Datos;
  if (Array.isArray(Datos) && Datos.length > 1 && Datos[0].length === 2) {
    const cabecera = [Datos[0][0], Datos[0][1], { role: "annotation", type: "string" }];
    const filas = Datos.slice(1).map((r) => [r[0], Number(r[1] || 0), String(r[1] || 0)]);
    datosConAnotaciones = [cabecera, ...filas];
  }

  return (
    <EnvoltorioGrafico Titulo="Evolucion total" Icono={TrendingUp} Color_Icono="text-emerald-500">
      <Chart
        chartType="LineChart"
        data={datosConAnotaciones}
        options={Opciones_Base.Lineas}
        width="100%" height="320px"
      />
    </EnvoltorioGrafico>
  );
};

export const GraficoPastel = ({ Datos }) => (
  <EnvoltorioGrafico Titulo="Distribucion por tipo" Icono={PieChart} Color_Icono="text-amber-500">
    <Chart
      chartType="PieChart"
      data={Datos}
      options={Opciones_Base.Pastel}
      width="100%" height="320px"
    />
  </EnvoltorioGrafico>
);
