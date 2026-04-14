import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig";
import { RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ReporteAprendices = () => {
  const [fecha, setFecha] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [busqueda, setBusqueda] = useState("");
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ TOTAL DEL DÍA
  const calcularTotal = (row) =>
    (row.desayuno || 0) +
    (row.almuerzo || 0) +
    (row.cena || 0);

  // ✅ TOTAL GLOBAL
  const calcularTotalGlobal = (row) =>
    (row.desayuno_global || 0) +
    (row.almuerzo_global || 0) +
    (row.cena_global || 0);

  // ✅ FORMATO HISTÓRICO
  const formatoGlobal = (row) =>
    `D: ${row.desayuno_global || 0} | A: ${row.almuerzo_global || 0} | C: ${row.cena_global || 0}`;

  // ✅ CARGAR DATOS
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await apiAxios.get(
        "/api/reservas/reportes/aprendices",
        {
          params: { fecha, busqueda }
        }
      );
      setDatos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error cargando reporte:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [fecha, busqueda]);

  // ✅ EXPORTAR EXCEL
  const exportarExcel = () => {
    const datosExcel = datos.map((row) => ({
      Aprendiz: row.aprendiz,
      Fecha: row.fecha,
      Desayuno: row.desayuno || 0,
      Almuerzo: row.almuerzo || 0,
      Cena: row.cena || 0,
      Total: calcularTotal(row),
      TotalGlobal: calcularTotalGlobal(row),
      Total_Tipo: formatoGlobal(row),
    }));

    const worksheet = XLSX.utils.json_to_sheet(datosExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(file, "reporte_aprendices.xlsx");
  };

  // ✅ EXPORTAR PDF
  const exportarPDF = () => {
  const doc = new jsPDF();

  const tabla = datos.map((row) => [
    row.aprendiz,
    row.fecha,
    row.desayuno || 0,
    row.almuerzo || 0,
    row.cena || 0,
    calcularTotal(row),
    calcularTotalGlobal(row),
    formatoGlobal(row),
  ]);

  doc.text("Reporte de Aprendices", 14, 10);

  autoTable(doc, {
    head: [[
      "Aprendiz",
      "Fecha",
      "Desayuno",
      "Almuerzo",
      "Cena",
      "Total Día",
      "Total Global",
      "Total por Tipo"
    ]],
    body: tabla,
    startY: 20,
  });

  doc.save("reporte_aprendices.pdf");
};

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Reporte de Aprendices
        </h1>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportarExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 transition"
          >
            Excel
          </button>

          <button
            onClick={exportarPDF}
            className="px-4 py-2 bg-red-600 text-white rounded-xl shadow hover:bg-red-700 transition"
          >
            PDF
          </button>

          <button
            onClick={cargarDatos}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 transition"
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 md:items-center">

        <div className="flex flex-col">
          <label className="text-sm text-gray-500 mb-1">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border border-gray-300 px-4 py-2 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div className="flex flex-col w-full md:w-80">
          <label className="text-sm text-gray-500 mb-1">Buscar</label>
          <input
            type="text"
            placeholder="Nombre o documento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="border border-gray-300 px-4 py-2 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-400"
          />
        </div>

      </div>

      {/* TABLA */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">

        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-700">
            Reporte diario de reservas
          </h2>
        </div>

        <div className="overflow-x-auto">

          {loading ? (
            <p className="p-6 text-gray-500">Cargando...</p>
          ) : (
            <table className="w-full text-sm">

              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left">Aprendiz</th>
                  <th className="px-6 py-3 text-left">Fecha</th>
                  <th className="px-6 py-3 text-center">Desayuno</th>
                  <th className="px-6 py-3 text-center">Almuerzo</th>
                  <th className="px-6 py-3 text-center">Cena</th>
                  <th className="px-6 py-3 text-center">Total Día</th>
                  <th className="px-6 py-3 text-center">Total Global</th>
                  <th className="px-6 py-3 text-center">Total por Tipo</th>
                </tr>
              </thead>

              <tbody>
                {datos.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50 transition">

                    <td className="px-6 py-4 font-medium text-gray-800">
                      {row.aprendiz}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {row.fecha}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {row.desayuno || 0}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {row.almuerzo || 0}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {row.cena || 0}
                    </td>

                    <td className="px-6 py-4 text-center font-bold text-indigo-600">
                      {calcularTotal(row)}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                        {calcularTotalGlobal(row)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center text-xs text-gray-600">
                      {formatoGlobal(row)}
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          )}

        </div>
      </div>
    </div>
  );
};

export default ReporteAprendices;