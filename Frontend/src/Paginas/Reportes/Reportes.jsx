// Paginas/Reportes/Reportes.jsx
// Pagina principal de reportes estadisticos
// Orquesta los sub-componentes de graficos y exportacion
// La transformacion de datos para graficos se realiza aqui

import { useState, useEffect, useCallback } from "react";
import { BarChart3, TrendingUp, PieChart } from "lucide-react";
import apiAxios from "../../api/axiosConfig";
import TarjetaEstadistica from "./TarjetaEstadistica";
import SelectorPeriodo from "./SelectorPeriodo";
import BotonesExportar from "./BotonesExportar";
import { GraficoBarras, GraficoLineas, GraficoPastel } from "./GraficosReportes";
import TablaReportes from "./TablaReportes";

const Reportes = () => {
  const [Periodo, Set_Periodo] = useState("mensual");
  const [Datos, Set_Datos] = useState([]);
  const [Cargando, Set_Cargando] = useState(true);
  const [Exportando, Set_Exportando] = useState(null);

  const [FechaInicio, Set_FechaInicio] = useState(new Date().toISOString().split("T")[0]);
  const [FechaFin, Set_FechaFin] = useState(new Date().toISOString().split("T")[0]);
  const [TipoAlimento, Set_TipoAlimento] = useState("Todos");

  // Carga los datos del periodo seleccionado
  const Cargar_Datos = useCallback(async () => {
    Set_Cargando(true);
    try {
      const endpoint = Periodo === "personalizado" ? `/api/reportes/personalizado` : `/api/reportes/${Periodo}`;
      const params = Periodo === "personalizado" ? { fechaInicio: FechaInicio, fechaFin: FechaFin, tipoAlimento: TipoAlimento } : {};
      const Res = await apiAxios.get(endpoint, { params });
      Set_Datos(Res.data);
    } catch (Err) { console.error("Error cargando reporte:", Err); }
    finally { Set_Cargando(false); }
  }, [Periodo, FechaInicio, FechaFin, TipoAlimento]);

  useEffect(() => { Cargar_Datos(); }, [Cargar_Datos]);

  // Totales calculados para las tarjetas de estadisticas
  const Total_Reservas = Datos.reduce((A, R) => A + Number(R.total || 0), 0);
  const Total_Desayunos = Datos.reduce((A, R) => A + Number(R.desayunos || 0), 0);
  const Total_Almuerzos = Datos.reduce((A, R) => A + Number(R.almuerzos || 0), 0);
  const Total_Cenas = Datos.reduce((A, R) => A + Number(R.cenas || 0), 0);

  // Datos formateados para los graficos de Google Charts
  const Datos_Barras = [
    ["Periodo", "Desayunos", "Almuerzos", "Cenas"],
    ...Datos.map(R => [String(R.label || R.periodo || ""), Number(R.desayunos || 0), Number(R.almuerzos || 0), Number(R.cenas || 0)]),
  ];
  const Datos_Lineas = [
    ["Periodo", "Total"],
    ...Datos.map(R => [String(R.label || R.periodo || ""), Number(R.total || 0)]),
  ];
  const Datos_Pastel = [
    ["Tipo", "Cantidad"],
    ["Desayunos", Total_Desayunos],
    ["Almuerzos", Total_Almuerzos],
    ["Cenas", Total_Cenas],
  ];

  // Exporta el reporte en el formato indicado (pdf/excel)
  const Exportar = async (Formato) => {
    Set_Exportando(Formato);
    try {
      const params = { periodo: Periodo };
      if (Periodo === "personalizado") {
        params.fechaInicio = FechaInicio;
        params.fechaFin = FechaFin;
        params.tipoAlimento = TipoAlimento;
      }
      
      const Res = await apiAxios.get(`/api/reportes/exportar/${Formato}`, {
        params, responseType: "blob",
      });
      const Ext = Formato === "pdf" ? "pdf" : "xlsx";
      const Mime = Formato === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const Blob_Arch = new Blob([Res.data], { type: Mime });
      const Url = URL.createObjectURL(Blob_Arch);
      const Enlace = document.createElement("a");
      Enlace.href = Url;
      Enlace.download = `Reporte_${Periodo}_${new Date().toISOString().split("T")[0]}.${Ext}`;
      Enlace.click();
      URL.revokeObjectURL(Url);
    } catch (Err) {
      console.error("Error exportando:", Err);
      alert("Error al exportar. Verifica la conexion con el servidor.");
    } finally { Set_Exportando(null); }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8 space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
            Reportes Estadisticos
          </h1>
          <p className="text-sm text-gray-500 mt-1">Analisis de reservas por periodo</p>
        </div>
        <BotonesExportar
          Exportando={Exportando}
          Datos_Vacios={Datos.length === 0}
          Exportar={Exportar}
          Actualizar={Cargar_Datos}
        />
      </div>

      <SelectorPeriodo 
        Periodo={Periodo} Set_Periodo={Set_Periodo} 
        FechaInicio={FechaInicio} Set_FechaInicio={Set_FechaInicio}
        FechaFin={FechaFin} Set_FechaFin={Set_FechaFin}
        TipoAlimento={TipoAlimento} Set_TipoAlimento={Set_TipoAlimento}
      />

      {/* Tarjetas de estadisticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <TarjetaEstadistica Etiqueta="Total Reservas" Valor={Total_Reservas} Color="bg-indigo-600" Icono={BarChart3} />
        <TarjetaEstadistica Etiqueta="Desayunos" Valor={Total_Desayunos} Color="bg-purple-500" Icono={TrendingUp} />
        <TarjetaEstadistica Etiqueta="Almuerzos" Valor={Total_Almuerzos} Color="bg-emerald-600" Icono={TrendingUp} />
        <TarjetaEstadistica Etiqueta="Cenas" Valor={Total_Cenas} Color="bg-amber-500" Icono={PieChart} />
      </div>

      {/* Contenido principal */}
      {Cargando ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : Datos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <BarChart3 className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-base font-medium">No hay datos para este periodo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <GraficoBarras Datos={Datos_Barras} Periodo={Periodo} />
          <GraficoLineas Datos={Datos_Lineas} />
          <GraficoPastel Datos={Datos_Pastel} />
          <TablaReportes Datos={Datos} />
        </div>
      )}
    </div>
  );
};

export default Reportes;