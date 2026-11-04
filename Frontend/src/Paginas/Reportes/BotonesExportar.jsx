// Paginas/Reportes/BotonesExportar.jsx
// Botones para exportar reportes a PDF y Excel
// La descarga se realiza desde el backend

import { FileText, FileSpreadsheet, RefreshCw } from "lucide-react";

// Spinner reutilizable para estado de carga
const Spinner = () => (
  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
);

const BotonesExportar = ({
  Exportando, Datos_Vacios,
  Exportar, Actualizar,
}) => (
  <div className="flex gap-2">
    <button
      onClick={Actualizar}
      className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
    >
      <RefreshCw className="w-4 h-4" />
      <span className="hidden sm:inline">Actualizar</span>
    </button>
    <button
      onClick={() => Exportar("pdf")}
      disabled={Exportando === "pdf" || Datos_Vacios}
      className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
    >
      {Exportando === "pdf" ? <Spinner /> : <FileText className="w-4 h-4" />}
      <span className="hidden sm:inline">PDF</span>
    </button>
    <button
      onClick={() => Exportar("excel")}
      disabled={Exportando === "excel" || Datos_Vacios}
      className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
    >
      {Exportando === "excel" ? <Spinner /> : <FileSpreadsheet className="w-4 h-4" />}
      <span className="hidden sm:inline">Excel</span>
    </button>
  </div>
);

export default BotonesExportar;
