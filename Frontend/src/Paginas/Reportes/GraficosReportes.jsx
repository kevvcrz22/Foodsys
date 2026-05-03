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

// Opciones base de los graficos
const Opciones_Base = {
  Barras: {
    chartArea: { width: "75%", height: "65%" },
    colors: ["#6366f1", "#10b981", "#f59e0b"],
    legend: { position: "bottom" },
    hAxis: { textStyle: { fontSize: 11 } },
    vAxis: { minValue: 0, textStyle: { fontSize: 11 } },
  },
  Lineas: {
    chartArea: { width: "75%", height: "65%" },
    colors: ["#6366f1"],
    legend: { position: "none" },
    curveType: "function",
    pointSize: 5,
  },
  Pastel: {
    colors: ["#6366f1", "#10b981", "#f59e0b"],
    chartArea: { width: "85%", height: "80%" },
    legend: { position: "right" },
    pieHole: 0.4,
  },
};

export const GraficoBarras = ({ Datos, Periodo }) => (
  <EnvoltorioGrafico Titulo="Reservas por tipo" Icono={BarChart3} Color_Icono="text-indigo-500">
    <Chart
      chartType="BarChart"
      data={Datos}
      options={{ ...Opciones_Base.Barras, title: `Reservas por tipo - ${Periodo}` }}
      width="100%" height="320px"
    />
  </EnvoltorioGrafico>
);

export const GraficoLineas = ({ Datos }) => (
  <EnvoltorioGrafico Titulo="Evolucion total" Icono={TrendingUp} Color_Icono="text-emerald-500">
    <Chart
      chartType="LineChart"
      data={Datos}
      options={Opciones_Base.Lineas}
      width="100%" height="320px"
    />
  </EnvoltorioGrafico>
);

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
