// Frontend/src/Paginas/Reportes/ModalHistorialAprendiz.jsx
// Modal interactivo para visualizar el historial completo de consumo de un aprendiz
// Permite filtrar por rango de fechas y tipo de comida, y exportar a PDF y Excel.
// Codigo comentado didacticamente sin tildes ni emojis para aprendices de primer semestre.

import { useState, useEffect, useMemo } from "react";
import apiAxios from "../../api/axiosConfig";
import toast from "react-hot-toast";
import {
  X, Calendar, Utensils, Download, FileText,
  CheckCircle2, AlertCircle, Clock, Filter,
  Phone, Mail, GraduationCap, Hash
} from "lucide-react";
import { exportarAExcel, exportarAPDF } from "../../utils/exportUtils";

const ColorEstado = (estado) => {
  if (estado === "Generado" || estado === "Generada") return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (estado === "Consumido" || estado === "Consumida") return "bg-slate-200 text-slate-700 border-slate-400";
  if (estado === "Verificado" || estado === "Verificada" || estado === "Pendiente") return "bg-amber-100 text-amber-800 border-amber-300";
  if (estado === "Vencido" || estado === "Vencida" || estado === "Cancelado" || estado === "Cancelada") return "bg-rose-100 text-rose-800 border-rose-300";
  return "bg-amber-100 text-amber-800 border-amber-300";
};

const ModalHistorialAprendiz = ({ documento, aprendizId, idUsuario, aprendizInicial = null, nombreAprendiz = "", onClose }) => {
  const [cargando, setCargando] = useState(true);
  const [aprendiz, setAprendiz] = useState(aprendizInicial);
  const [historial, setHistorial] = useState([]);
  
  // Filtros internos del modal
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [tipoComida, setTipoComida] = useState("Todos");
  const [exportando, setExportando] = useState(false);

  const docFinal = documento || aprendizInicial?.NumDoc || aprendizInicial?.NumDoc_Usuario || aprendiz?.NumDoc_Usuario;
  const idFinal = aprendizId || idUsuario || aprendizInicial?.Id_Usuario || aprendiz?.Id_Usuario;

  const cargarHistorial = useCallback(async () => {
    setCargando(true);
    try {
      let queryParam = "";
      if (docFinal) {
        queryParam = `documento=${encodeURIComponent(docFinal)}`;
      } else if (idFinal) {
        queryParam = `idUsuario=${encodeURIComponent(idFinal)}`;
      } else {
        setCargando(false);
        return;
      }

      const res = await apiAxios.get(`/api/Reportes/aprendiz?${queryParam}`);
      if (res.data?.perfil || res.data?.aprendiz) {
        setAprendiz(res.data.perfil || res.data.aprendiz);
      }
      setHistorial(Array.isArray(res.data?.historial) ? res.data.historial : []);
    } catch (err) {
      console.error("Error al cargar historial del aprendiz:", err);
      toast.error("Error al cargar el historial del aprendiz");
    } finally {
      setCargando(false);
    }
  }, [docFinal, idFinal]);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  // Filtrado de las reservas en memoria segun los filtros del modal
  const historialFiltrado = useMemo(() => {
    return historial.filter((item) => {
      const fecha = item.Fec_Reserva || "";
      const coincideInicio = !fechaInicio || fecha >= fechaInicio;
      const coincideFin = !fechaFin || fecha <= fechaFin;
      const coincideTipo = tipoComida === "Todos" || item.Tip_Reserva === tipoComida;
      return coincideInicio && coincideFin && coincideTipo;
    });
  }, [historial, fechaInicio, fechaFin, tipoComida]);

  // Calculo de metricas personales
  const totalR = historial.length;
  const consumidasR = historial.filter((h) => h.Est_Reserva === "Consumido").length;
  const canceladasR = historial.filter((h) => h.Est_Reserva === "Cancelado").length;
  const inasistenciasR = historial.filter((h) => h.Est_Reserva === "Vencido").length;
  const porcentajeCumplimiento = totalR > 0 ? Number(((consumidasR / totalR) * 100).toFixed(1)) : 0;

  // Exportar este historial puntual a Excel
  const handleExportarExcel = () => {
    if (historialFiltrado.length === 0) {
      toast.error("No hay registros en el rango seleccionado.");
      return;
    }
    setExportando(true);
    try {
      const nombreReal = aprendiz?.nombre || aprendiz?.nombreCompleto || nombreAprendiz || `Aprendiz_${docFinal || idFinal}`;
      const datos = historialFiltrado.map((h) => ({
        "ID Reserva": h.Id_Reserva,
        "Fecha": h.Fec_Reserva || "",
        "Tipo de Comida": h.Tip_Reserva || "",
        "Plato Consumido": h.plato?.Nom_Plato || "Sin plato",
        "Bebida": h.bebida?.Nom_Plato || "Ninguna",
        "Estado": h.Est_Reserva || "Generado",
        "Excepcional": h.Exc_Reserva || "No",
        "Hora Registro": h.createdAt ? new Date(h.createdAt).toLocaleTimeString("es-CO") : ""
      }));

      const fecha = new Date().toISOString().split("T")[0];
      exportarAExcel({
        datos,
        nombreArchivo: `Foodsys_Historial_${docFinal || idFinal}_${fecha}.xlsx`,
        nombreHoja: "Historial"
      });
      toast.success("Historial exportado a Excel.");
    } catch (err) {
      console.error(err);
      toast.error("Error al exportar Excel");
    } finally {
      setExportando(false);
    }
  };

  // Exportar este historial puntual a PDF
  const handleExportarPDF = () => {
    if (historialFiltrado.length === 0) {
      toast.error("No hay registros en el rango seleccionado.");
      return;
    }
    setExportando(true);
    try {
      const nombreReal = aprendiz?.nombre || aprendiz?.nombreCompleto || nombreAprendiz || `Doc: ${docFinal || idFinal}`;
      const columnas = [
        { header: "ID", dataKey: "id" },
        { header: "Fecha", dataKey: "fecha" },
        { header: "Tipo", dataKey: "tipo" },
        { header: "Plato Consumido", dataKey: "plato" },
        { header: "Bebida", dataKey: "bebida" },
        { header: "Estado", dataKey: "estado" }
      ];

      const filas = historialFiltrado.map((h) => ({
        id: h.Id_Reserva,
        fecha: h.Fec_Reserva || "—",
        tipo: h.Tip_Reserva || "—",
        plato: h.plato?.Nom_Plato || "Sin plato",
        bebida: h.bebida?.Nom_Plato || "Ninguna",
        estado: h.Est_Reserva || "Generado"
      }));

      const fecha = new Date().toISOString().split("T")[0];
      exportarAPDF({
        titulo: `Historial de Consumo — ${nombreReal}`,
        subtitulo: `Doc: ${docFinal || "N/A"} | Ficha: ${aprendiz?.ficha?.Num_Ficha || aprendiz?.Num_Ficha || "N/A"} | Cumplimiento: ${porcentajeCumplimiento}% (${consumidasR}/${totalR})`,
        columnas,
        datos: filas,
        nombreArchivo: `Foodsys_Historial_${docFinal || idFinal}_${fecha}.pdf`,
        orientacion: "portrait"
      });
      toast.success("Historial exportado a PDF.");
    } catch (err) {
      console.error(err);
      toast.error("Error al exportar PDF");
    } finally {
      setExportando(false);
    }
  };

  const nombreCompleto = aprendiz?.nombre || aprendiz?.nombreCompleto || nombreAprendiz || "Aprendiz";

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden z-10 animate-in fade-in">
        {/* Cabecera del Modal */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-base">
              {nombreCompleto.charAt(0) || "A"}
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-blue-100 m-0 tracking-wide">Trazabilidad Individual</p>
              <h2 className="text-white font-bold text-sm sm:text-base m-0">{nombreCompleto}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border-0 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Ficha tecnica del aprendiz */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="flex flex-col">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Hash size={12} /> Documento
            </span>
            <span className="font-bold text-slate-800">{docFinal || aprendiz?.NumDoc_Usuario || "—"}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <GraduationCap size={12} /> Ficha / Programa
            </span>
            <span className="font-bold text-slate-800 truncate" title={aprendiz?.programa || aprendiz?.Nom_Programa}>
              {aprendiz?.ficha?.Num_Ficha || aprendiz?.Num_Ficha || "Sin ficha"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Phone size={12} /> Telefono
            </span>
            <span className="font-bold text-slate-800">{aprendiz?.Tel_Usuario || "—"}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Mail size={12} /> Correo
            </span>
            <span className="font-bold text-slate-800 truncate" title={aprendiz?.Cor_Usuario}>{aprendiz?.Cor_Usuario || "—"}</span>
          </div>
        </div>

        {/* Resumen estadístico personal */}
        <div className="p-3 bg-white border-b border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Total Reservas</span>
            <span className="text-base font-black text-slate-800">{totalR}</span>
          </div>
          <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
            <span className="block text-[10px] uppercase font-bold text-emerald-700">Consumidas</span>
            <span className="text-base font-black text-emerald-700">{consumidasR}</span>
          </div>
          <div className="bg-amber-50 p-2 rounded-xl border border-amber-200">
            <span className="block text-[10px] uppercase font-bold text-amber-700">Canceladas</span>
            <span className="text-base font-black text-amber-700">{canceladasR}</span>
          </div>
          <div className="bg-rose-50 p-2 rounded-xl border border-rose-200">
            <span className="block text-[10px] uppercase font-bold text-rose-700">Inasistencias</span>
            <span className="text-base font-black text-rose-700">{inasistenciasR}</span>
          </div>
          <div className="bg-indigo-50 p-2 rounded-xl border border-indigo-200 col-span-2 sm:col-span-1">
            <span className="block text-[10px] uppercase font-bold text-indigo-700">% Cumplimiento</span>
            <span className="text-base font-black text-indigo-700">{porcentajeCumplimiento}%</span>
          </div>
        </div>

        {/* Barra de Filtros Internos y Botones de Exportar */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-3 items-end justify-between flex-wrap">
          <div className="flex gap-2 flex-wrap items-center w-full sm:w-auto">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Desde</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="px-2 py-1 border border-slate-200 rounded-lg text-xs bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Hasta</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="px-2 py-1 border border-slate-200 rounded-lg text-xs bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Comida</label>
              <select
                value={tipoComida}
                onChange={(e) => setTipoComida(e.target.value)}
                className="px-2 py-1 border border-slate-200 rounded-lg text-xs bg-slate-50"
              >
                <option value="Todos">Todas</option>
                <option value="Desayuno">Desayuno</option>
                <option value="Almuerzo">Almuerzo</option>
                <option value="Cena">Cena</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleExportarExcel}
              disabled={exportando || historialFiltrado.length === 0}
              className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-emerald-100 disabled:opacity-50"
            >
              <Download size={13} /> Excel
            </button>
            <button
              onClick={handleExportarPDF}
              disabled={exportando || historialFiltrado.length === 0}
              className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-rose-100 disabled:opacity-50"
            >
              <FileText size={13} /> PDF
            </button>
          </div>
        </div>

        {/* Tabla o Lista del Historial */}
        <div className="p-4 flex-1 overflow-y-auto">
          {cargando ? (
            <div className="py-12 flex justify-center">
              <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : historialFiltrado.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No se registraron consumos para este aprendiz con los filtros indicados.
            </div>
          ) : (
            <div className="space-y-2">
              {historialFiltrado.map((item) => (
                <div
                  key={item.Id_Reserva}
                  className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex items-center justify-between gap-3 hover:border-blue-200 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{item.Tip_Reserva}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ColorEstado(item.Est_Reserva)}`}>
                        {item.Est_Reserva}
                      </span>
                      {item.Exc_Reserva === "Si" && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                          Novedad
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-700 font-semibold m-0 mt-0.5 truncate">
                      🍽️ {item.plato?.Nom_Plato || "Plato del día"}
                    </p>
                    {item.bebida?.Nom_Plato && (
                      <p className="text-[11px] text-slate-500 font-medium m-0 mt-0.5 truncate flex items-center gap-1">
                        <span>🥤 {item.bebida.Nom_Plato}</span>
                        {item.bebida.Subtipo_Bebida && (
                          <span className="text-[10px] text-slate-400">
                            ({item.bebida.Subtipo_Bebida === 'FRIA' ? 'Bebida Fría' : 'Bebida Caliente'})
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-slate-700 m-0">{item.Fec_Reserva}</p>
                    <p className="text-[10px] text-slate-400 font-mono m-0">#{String(item.Id_Reserva).padStart(4, "0")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400">
          Mostrando {historialFiltrado.length} consumos registrados
        </div>
      </div>
    </div>
  );
};

export default ModalHistorialAprendiz;
