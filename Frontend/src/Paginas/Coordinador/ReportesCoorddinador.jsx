// Frontend/src/Paginas/Administrador/ReportesAdministrador.jsx
import { useState, useEffect, useCallback } from "react";
import { Chart } from "react-google-charts";
import apiAxios from "../../api/axiosConfig";
import {
  BarChart3, TrendingUp, PieChart, Calendar,
  Download, FileText, FileSpreadsheet, RefreshCw,
} from "lucide-react";

/* ── Período de selección ── */
const PERIODOS = [
  { key: "diario",   label: "Diario",   icon: Calendar },
  { key: "semanal",  label: "Semanal",  icon: Calendar },
  { key: "mensual",  label: "Mensual",  icon: Calendar },
  { key: "anual",    label: "Anual",    icon: Calendar },
];

/* ── Tarjeta stat ── */
const StatCard = ({ label, value, color, icon: Icon }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
    <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  </div>
);

const ReportesCoordinador = () => {
  const [periodo,    setPeriodo]    = useState("mensual");
  const [datos,      setDatos]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [exportando, setExportando] = useState(null); // "pdf" | "excel" | null

  /* ── Fetch datos ── */
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiAxios.get(`/api/reportes/${periodo}`);
      setDatos(res.data);
    } catch (err) {
      console.error("Error cargando reporte:", err);
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  /* ── Estadísticas resumen ── */
  const totalReservas  = datos.reduce((a, r) => a + Number(r.total      || 0), 0);
  const totalDesayunos = datos.reduce((a, r) => a + Number(r.desayunos  || 0), 0);
  const totalAlmuerzos = datos.reduce((a, r) => a + Number(r.almuerzos  || 0), 0);
  const totalCenas     = datos.reduce((a, r) => a + Number(r.cenas      || 0), 0);

  /* ── Datos para Google Charts ── */
  const barData = [
    ["Período", "Desayunos", "Almuerzos", "Cenas"],
    ...datos.map((r) => [
      String(r.label || r.periodo || ""),
      Number(r.desayunos || 0),
      Number(r.almuerzos || 0),
      Number(r.cenas     || 0),
    ]),
  ];

  const lineData = [
    ["Período", "Total"],
    ...datos.map((r) => [
      String(r.label || r.periodo || ""),
      Number(r.total || 0),
    ]),
  ];

  const pieData = [
    ["Tipo", "Cantidad"],
    ["Desayunos", totalDesayunos],
    ["Almuerzos", totalAlmuerzos],
    ["Cenas",     totalCenas    ],
  ];

  const chartOptions = {
    bar: {
      title: `Reservas por tipo — ${periodo}`,
      chartArea: { width: "75%", height: "65%" },
      colors: ["#6366f1", "#10b981", "#f59e0b"],
      legend: { position: "bottom" },
      hAxis: { textStyle: { fontSize: 11 } },
      vAxis: { minValue: 0, textStyle: { fontSize: 11 } },
    },
    line: {
      title: "Evolución total de reservas",
      chartArea: { width: "75%", height: "65%" },
      colors: ["#6366f1"],
      legend: { position: "none" },
      hAxis: { textStyle: { fontSize: 11 } },
      vAxis: { minValue: 0, textStyle: { fontSize: 11 } },
      curveType: "function",
      pointSize: 5,
    },
    pie: {
      title: "Distribución por tipo de comida",
      colors: ["#6366f1", "#10b981", "#f59e0b"],
      chartArea: { width: "85%", height: "80%" },
      legend: { position: "right" },
      pieHole: 0.4,
    },
  };

  /* ── Exportar ── */
  const exportar = async (formato) => {
    setExportando(formato);
    try {
      const res = await apiAxios.get(`/api/reportes/exportar/${formato}`, {
        params: { periodo },
        responseType: "blob",
      });
      const ext      = formato === "pdf" ? "pdf" : "xlsx";
      const mimeType = formato === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const blob = new Blob([res.data], { type: mimeType });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `Reporte_${periodo}_${new Date().toISOString().split("T")[0]}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exportando:", err);
      alert("Error al exportar. Verifica la conexión con el servidor.");
    } finally {
      setExportando(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8 space-y-6">

      {/* ── Cabecera ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Reportes Estadísticos
          </h1>
          <p className="text-sm text-gray-500 mt-1">Análisis de reservas por período</p>
        </div>
        <div className="flex gap-2">
          <button onClick={cargarDatos} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
          {/* ── Exportar PDF ── */}
          <button
            onClick={() => exportar("pdf")}
            disabled={exportando === "pdf" || datos.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            {exportando === "pdf"
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <FileText className="w-4 h-4" />
            }
            <span className="hidden sm:inline">PDF</span>
          </button>
          {/* ── Exportar Excel ── */}
          <button
            onClick={() => exportar("excel")}
            disabled={exportando === "excel" || datos.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            {exportando === "excel"
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <FileSpreadsheet className="w-4 h-4" />
            }
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>

      {/* ── Selector de período ── */}
      <div className="flex gap-2 flex-wrap">
        {PERIODOS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriodo(key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors border ${
              periodo === key
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Estadísticas resumen ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Reservas"  value={totalReservas}  color="bg-indigo-600" icon={BarChart3}   />
        <StatCard label="Desayunos"       value={totalDesayunos} color="bg-purple-500" icon={TrendingUp}  />
        <StatCard label="Almuerzos"       value={totalAlmuerzos} color="bg-emerald-600" icon={TrendingUp} />
        <StatCard label="Cenas"           value={totalCenas}     color="bg-amber-500"  icon={PieChart}    />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : datos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <BarChart3 className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-base font-medium">No hay datos para este período</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Gráfico de Barras ── */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" /> Reservas por tipo
            </h3>
            <Chart
              chartType="BarChart"
              data={barData}
              options={chartOptions.bar}
              width="100%"
              height="320px"
            />
          </div>

          {/* ── Gráfico de Líneas ── */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Evolución total
            </h3>
            <Chart
              chartType="LineChart"
              data={lineData}
              options={chartOptions.line}
              width="100%"
              height="320px"
            />
          </div>

          {/* ── Gráfico de Pastel ── */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-500" /> Distribución por tipo
            </h3>
            <Chart
              chartType="PieChart"
              data={pieData}
              options={chartOptions.pie}
              width="100%"
              height="320px"
            />
          </div>

          {/* ── Tabla de datos ── */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Download className="w-4 h-4 text-gray-500" /> Datos del período
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["Período", "Total", "Desayuno", "Almuerzo", "Cena"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {datos.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-700">{row.label || row.periodo}</td>
                      <td className="px-3 py-2 font-bold text-indigo-600">{row.total}</td>
                      <td className="px-3 py-2 text-purple-600">{row.desayunos}</td>
                      <td className="px-3 py-2 text-emerald-600">{row.almuerzos}</td>
                      <td className="px-3 py-2 text-amber-600">{row.cenas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default ReportesCoordinador;