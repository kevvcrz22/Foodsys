// Paginas/Reportes/TablaReportes.jsx
// Tabla de datos del periodo con columnas
// Periodo, Total, Desayuno, Almuerzo, Cena

import { Download } from "lucide-react";

const COLUMNAS = [
  "Periodo", "Total", "Desayuno", "Almuerzo", "Cena",
];

const TablaReportes = ({ Datos }) => (
  <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-5">
    <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2 text-sm">
      <Download className="w-4 h-4 text-gray-500" />
      Datos del periodo
    </h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {COLUMNAS.map(H => (
              <th key={H} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                {H}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {Datos.map((Fila, I) => (
            <tr key={I} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-medium text-gray-700">
                {Fila.label || Fila.periodo}
              </td>
              <td className="px-3 py-2 font-bold text-indigo-600">
                {Fila.total}
              </td>
              <td className="px-3 py-2 text-purple-600">
                {Fila.desayunos}
              </td>
              <td className="px-3 py-2 text-emerald-600">
                {Fila.almuerzos}
              </td>
              <td className="px-3 py-2 text-amber-600">
                {Fila.cenas}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default TablaReportes;
