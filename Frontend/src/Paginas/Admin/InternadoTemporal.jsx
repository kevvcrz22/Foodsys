// Frontend/src/Paginas/Admin/InternadoTemporal.jsx
// Modulo de Gestion de Internado Temporal SENA Empresa
// Permite a Administrador, SENA Empresa, Bienestar y Coordinador registrar
// aprendices externos que se internan por un periodo definido de tiempo.
// Al cumplirse la fecha fin, el sistema los revierte automaticamente a externos.
// Comentarios didacticos sin tildes ni emojis para aprendices de primer semestre.

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar, Clock, Upload, Plus, Search, CheckCircle2,
  AlertTriangle, RefreshCw, Trash2, FileSpreadsheet, Download,
  Users, UserCheck, ShieldAlert, Sparkles, Eye, ArrowRight,
  Info, Check, X, Building2, HelpCircle
} from "lucide-react";
import apiAxios from "../../api/axiosConfig";
import FoodsysToast from "../../Components/UI/FoodsysToast";
import FoodsysConfirmModal from "../../Components/UI/FoodsysConfirmModal";
import GlobalLoader from "../../Components/GlobalLoader";
import * as XLSX from "xlsx";

const UNIDADES_SENA_EMPRESA = [
  "GANADERIA",
  "PISCICULTURA",
  "PORCINOS",
  "AVICULTURA",
  "CULTIVOS_AGRICOLAS",
  "MECANIZACION_AGRICOLA",
  "AGROINDUSTRIA",
  "SENA_EMPRESA_GENERAL",
  "SALIDA_PEDAGOGICA",
  "OTRA_UNIDAD"
];

export default function InternadoTemporal() {
  const hoyBogotaStr = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

  // Pestana activa: 'LISTADO' | 'MANUAL' | 'EXCEL'
  const [tabActivo, setTabActivo] = useState("LISTADO");

  // Estado del listado
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS"); // 'TODOS' | 'ACTIVO' | 'PROGRAMADO' | 'VENCIDO'
  const [revisandoVencidos, setRevisandoVencidos] = useState(false);

  // Registro manual y busqueda en tiempo real por documento
  const [numDocManual, setNumDocManual] = useState("");
  const [aprendizEncontrado, setAprendizEncontrado] = useState(null);
  const [buscandoAprendiz, setBuscandoAprendiz] = useState(false);
  const [errorBusquedaDoc, setErrorBusquedaDoc] = useState("");
  const [fechaInicioManual, setFechaInicioManual] = useState(hoyBogotaStr);
  const [fechaFinManual, setFechaFinManual] = useState(hoyBogotaStr);
  const [unidadManual, setUnidadManual] = useState("SENA_EMPRESA_GENERAL");
  const [observacionesManual, setObservacionesManual] = useState("");
  const [guardandoManual, setGuardandoManual] = useState(false);
  const [idEditandoManual, setIdEditandoManual] = useState(null);

  // Importacion Excel
  const [archivoExcel, setArchivoExcel] = useState(null);
  const [previewDatosExcel, setPreviewDatosExcel] = useState(null);
  const [importandoExcel, setImportandoExcel] = useState(false);
  const [descargandoPlantilla, setDescargandoPlantilla] = useState(false);

  // Modal para revertir turno (sin eliminacion fisica)
  const [registroAEliminar, setRegistroAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Busqueda reactiva de aprendiz al escribir el documento
  useEffect(() => {
    const docLimpio = numDocManual.trim().replace(/\D/g, "");
    if (docLimpio.length < 5) {
      setAprendizEncontrado(null);
      setErrorBusquedaDoc("");
      return;
    }

    const timer = setTimeout(async () => {
      setBuscandoAprendiz(true);
      setErrorBusquedaDoc("");
      try {
        const res = await apiAxios.get(`/api/Usuarios/buscar-documento/${docLimpio}`);
        if (res.data?.encontrado && res.data?.usuario) {
          setAprendizEncontrado(res.data.usuario);
        } else {
          setAprendizEncontrado(null);
          setErrorBusquedaDoc("No se encontró ningún usuario con este documento.");
        }
      } catch (err) {
        setAprendizEncontrado(null);
        setErrorBusquedaDoc(
          err.response?.data?.message || "No se encontró ningún aprendiz con ese documento."
        );
      } finally {
        setBuscandoAprendiz(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [numDocManual]);

  // Calcular Lunes y Viernes para Turno Rutinario Semanal (semana actual o siguiente)
  const aplicarTurnoRutinarioSemanal = (offsetSemanas = 0) => {
    const base = new Date(`${hoyBogotaStr}T12:00:00-05:00`);
    const diaSemana = base.getDay(); // 0=Dom, 1=Lun ... 6=Sab
    const diffLunes = (diaSemana === 0 ? -6 : 1 - diaSemana) + offsetSemanas * 7;
    const lunes = new Date(base);
    lunes.setDate(base.getDate() + diffLunes);
    const viernes = new Date(lunes);
    viernes.setDate(lunes.getDate() + 4);

    const fmt = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(d);
    const fLun = fmt(lunes);
    const fVie = fmt(viernes);
    setFechaInicioManual(fLun);
    setFechaFinManual(fVie);
    setObservacionesManual(
      `Turno Rutinario Semanal (Lunes ${fLun} a Viernes ${fVie}) - SENA Empresa`
    );
    FoodsysToast.info(`Rango semanal aplicado: Lunes ${fLun} a Viernes ${fVie}`);
  };

  // Cargar lista de internados temporales
  const cargarRegistros = useCallback(async () => {
    setCargando(true);
    try {
      const res = await apiAxios.get("/api/internado-temporal/listar");
      const lista = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.registros)
        ? res.data.registros
        : [];
      setRegistros(lista);
    } catch (err) {
      console.error("Error al cargar internado temporal:", err);
      FoodsysToast.error("Error al cargar la lista de internado temporal.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarRegistros();
  }, [cargarRegistros]);

  // Ejecutar revision de vencidos manualmente
  const handleRevisarVencidos = async () => {
    setRevisandoVencidos(true);
    try {
      const res = await apiAxios.post("/api/internado-temporal/revisar-vencidos");
      const rev = res.data?.revertidos ?? res.data?.resultado?.revertidos ?? 0;
      const act = res.data?.activados ?? res.data?.resultado?.activados ?? 0;
      FoodsysToast.success(
        `Revisión completada: ${act} turnos activados hoy y ${rev} aprendices vencidos revertidos.`
      );
      cargarRegistros();
    } catch (err) {
      console.error("Error al revisar vencidos:", err);
      FoodsysToast.error("Error al ejecutar la revision de vencimientos.");
    } finally {
      setRevisandoVencidos(false);
    }
  };

  // Descargar plantilla oficial en Excel
  const handleDescargarPlantilla = async () => {
    setDescargandoPlantilla(true);
    try {
      const res = await apiAxios.get("/api/internado-temporal/plantilla", {
        responseType: "blob"
      });
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Plantilla_Oficial_Internado_Temporal_SENA_Empresa.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      FoodsysToast.success("Plantilla oficial descargada con éxito.");
    } catch (err) {
      console.error("Error al descargar plantilla:", err);
      FoodsysToast.error("No se pudo descargar la plantilla oficial.");
    } finally {
      setDescargandoPlantilla(false);
    }
  };

  // Previsualizar archivo Excel localmente antes de importar
  const handleSeleccionarArchivo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArchivoExcel(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Localizar encabezados en las primeras 20 filas
        if (jsonData.length > 1) {
          let headerIdx = 0;
          for (let i = 0; i < Math.min(20, jsonData.length); i++) {
            const rowStr = (jsonData[i] || []).map((c) => String(c).toUpperCase()).join(" ");
            if (rowStr.includes("DOCUMENTO") || rowStr.includes("CEDULA") || rowStr.includes("NOMBRES") || rowStr.includes("FICHA")) {
              headerIdx = i;
              break;
            }
          }
          const encabezados = jsonData[headerIdx] || [];
          const filasDatos = jsonData.slice(headerIdx + 1).filter((r) => Array.isArray(r) && r.some((cell) => cell !== undefined && cell !== ""));
          const filas = filasDatos.slice(0, 10);
          setPreviewDatosExcel({ encabezados, filas, total: filasDatos.length });
          FoodsysToast.success(`Archivo cargado: ${filasDatos.length} filas de datos detectadas.`);
        } else {
          FoodsysToast.warning("El archivo parece estar vacío.");
        }
      } catch (err) {
        console.error("Error al leer Excel:", err);
        FoodsysToast.error("Error al interpretar el archivo de Excel.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Subir archivo e importar en backend
  const handleImportarExcel = async () => {
    if (!archivoExcel) {
      FoodsysToast.warning("Selecciona un archivo Excel antes de importar.");
      return;
    }

    setImportandoExcel(true);
    try {
      const formData = new FormData();
      formData.append("archivo", archivoExcel);

      const res = await apiAxios.post("/api/internado-temporal/importar-excel", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const totalImportados = res.data?.totalImportados ?? res.data?.resultado?.creadosOActualizados ?? 0;
      const totalActivadosHoy = res.data?.totalActivadosHoy ?? res.data?.resultado?.activadosHoy ?? 0;
      const totalOmitidos = res.data?.totalOmitidos ?? (res.data?.resultado?.noEncontradosEnBd?.length || 0);
      FoodsysToast.success(
        `Importación exitosa: ${totalImportados} turnos registrados, ${totalActivadosHoy} activados hoy como internos (${totalOmitidos} no encontrados en sistema).`,
        { duration: 6000 }
      );

      setArchivoExcel(null);
      setPreviewDatosExcel(null);
      setTabActivo("LISTADO");
      cargarRegistros();
    } catch (err) {
      console.error("Error al importar Excel:", err);
      const msg = err.response?.data?.message || err.message || "Error al procesar el archivo Excel";
      FoodsysToast.error(msg);
    } finally {
      setImportandoExcel(false);
    }
  };

  // Abrir formulario manual en modo edicion de turno
  const handleAbrirEditarTurno = (r) => {
    setIdEditandoManual(r.Id_Internado_Temporal);
    setNumDocManual(String(r.NumDoc_Usuario || ""));
    setFechaInicioManual(r.Fecha_Inicio || hoyBogotaStr);
    setFechaFinManual(r.Fecha_Fin || hoyBogotaStr);
    setUnidadManual(r.Unidad_Sena_Empresa || r.Unidad_Productiva || "SENA_EMPRESA_GENERAL");
    setObservacionesManual(r.Observaciones || "");
    setTabActivo("MANUAL");
  };

  // Guardar registro manual (Crear o Editar)
  const handleGuardarManual = async (e) => {
    e.preventDefault();
    const docLimpio = numDocManual.trim().replace(/\D/g, "");

    if (!docLimpio) {
      FoodsysToast.warning("Ingresa un número de documento válido.");
      return;
    }

    if (fechaInicioManual > fechaFinManual) {
      FoodsysToast.warning("La fecha de inicio no puede ser posterior a la fecha de fin.");
      return;
    }

    setGuardandoManual(true);
    try {
      if (idEditandoManual) {
        const res = await apiAxios.put(`/api/internado-temporal/${idEditandoManual}`, {
          Fecha_Inicio: fechaInicioManual,
          Fecha_Fin: fechaFinManual,
          Unidad_Sena_Empresa: unidadManual,
          Observaciones: observacionesManual
        });
        FoodsysToast.success(res.data?.message || "Turno de internado temporal actualizado con éxito.");
      } else {
        const res = await apiAxios.post("/api/internado-temporal/crear", {
          NumDoc_Usuario: docLimpio,
          Fecha_Inicio: fechaInicioManual,
          Fecha_Fin: fechaFinManual,
          Unidad_Sena_Empresa: unidadManual,
          Observaciones: observacionesManual
        });
        FoodsysToast.success(res.data?.message || "Aprendiz asignado a internado temporal con éxito.");
      }

      setIdEditandoManual(null);
      setNumDocManual("");
      setAprendizEncontrado(null);
      setObservacionesManual("");
      setTabActivo("LISTADO");
      cargarRegistros();
    } catch (err) {
      console.error("Error en registro manual:", err);
      const msg = err.response?.data?.message || err.message || "Error al registrar aprendiz";
      FoodsysToast.error(msg);
    } finally {
      setGuardandoManual(false);
    }
  };

  // Revertir turno (sin eliminacion fisica)
  const handleConfirmarEliminar = async () => {
    if (!registroAEliminar) return;

    setEliminando(true);
    try {
      await apiAxios.patch(`/api/internado-temporal/${registroAEliminar.Id_Internado_Temporal}/revocar`);
      FoodsysToast.success("Turno finalizado y usuario revertido a su estado original.");
      setRegistroAEliminar(null);
      cargarRegistros();
    } catch (err) {
      console.error("Error al revertir turno:", err);
      const msg = err.response?.data?.message || "Error al revertir el turno";
      FoodsysToast.error(msg);
    } finally {
      setEliminando(false);
    }
  };

  // Metricas resumidas
  const metricas = useMemo(() => {
    const total = registros.length;
    const activos = registros.filter((r) => r.estadoCalculado === "ACTIVO").length;
    const programados = registros.filter((r) => r.estadoCalculado === "PROGRAMADO").length;
    const vencidos = registros.filter((r) => r.estadoCalculado === "VENCIDO").length;
    return { total, activos, programados, vencidos };
  }, [registros]);

  // Filtrado de registros
  const registrosFiltrados = useMemo(() => {
    return registros.filter((r) => {
      // Filtro por estado
      if (filtroEstado !== "TODOS" && r.estadoCalculado !== filtroEstado) {
        return false;
      }
      // Filtro por texto
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const doc = String(r.NumDoc_Usuario || "");
        const nom = `${r.usuario?.Nom_Usuario || ""} ${r.usuario?.Ape_Usuario || ""}`.toLowerCase();
        const uni = (r.Unidad_Sena_Empresa || "").toLowerCase();
        return doc.includes(q) || nom.includes(q) || uni.includes(q);
      }
      return true;
    });
  }, [registros, filtroEstado, busqueda]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ============================================================
          BANNER PRINCIPAL
      ============================================================ */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              <Clock size={16} /> Gestión Especial de Convivencia y Turnos
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight m-0">
              Internado Temporal SENA Empresa
            </h1>
            <p className="text-sm text-slate-500 m-0 max-w-2xl leading-relaxed">
              Habilita temporalmente a aprendices externos como <strong>Internos</strong> durante sus turnos rotativos
              en SENA Empresa. Al vencer su periodo asignado, el sistema los revierte automáticamente a su estado original.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleRevisarVencidos}
              disabled={revisandoVencidos}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl text-xs font-semibold transition border border-slate-200 cursor-pointer"
              title="Verifica vencimientos a hoy y revierte a externos si vencio su fecha"
            >
              <RefreshCw size={14} className={revisandoVencidos ? "animate-spin text-emerald-600" : "text-slate-500"} />
              <span>{revisandoVencidos ? "Revisando..." : "Revisar Vencidos"}</span>
            </button>
            <button
              type="button"
              onClick={handleDescargarPlantilla}
              disabled={descargandoPlantilla}
              className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer"
            >
              <Download size={14} />
              <span>Descargar Plantilla Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          TARJETAS DE METRICAS
      ============================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold m-0">Activos Hoy</p>
            <p className="text-2xl font-black text-slate-800 m-0">{metricas.activos}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold m-0">Programados Próximos</p>
            <p className="text-2xl font-black text-slate-800 m-0">{metricas.programados}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold m-0">Histórico Vencido</p>
            <p className="text-2xl font-black text-slate-800 m-0">{metricas.vencidos}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold m-0">Total Registros</p>
            <p className="text-2xl font-black text-slate-800 m-0">{metricas.total}</p>
          </div>
        </div>
      </div>

      {/* ============================================================
          PESTANAS DE NAVEGACION
      ============================================================ */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setTabActivo("LISTADO")}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer ${
            tabActivo === "LISTADO"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <Users size={16} />
          <span>Listado de Aprendices en Turno ({metricas.total})</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActivo("EXCEL")}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer ${
            tabActivo === "EXCEL"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <Upload size={16} />
          <span>Importar Archivo Excel Gestores</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActivo("MANUAL")}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer ${
            tabActivo === "MANUAL"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <Plus size={16} />
          <span>Registrar Aprendiz Individual</span>
        </button>
      </div>

      {/* ============================================================
          PESTANA 1: LISTADO DE TURNOS E INTERNOS
      ============================================================ */}
      {tabActivo === "LISTADO" && (
        <div className="space-y-4">
          {/* Barra de Filtros y Busqueda */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por documento, nombre o unidad..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {["TODOS", "ACTIVO", "PROGRAMADO", "VENCIDO"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFiltroEstado(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    filtroEstado === st
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {st === "TODOS" ? "Todos los estados" : st}
                </button>
              ))}

              <button
                type="button"
                onClick={cargarRegistros}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition cursor-pointer"
                title="Refrescar listado"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* Tabla de Registros */}
          {cargando ? (
            <GlobalLoader />
          ) : registrosFiltrados.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 space-y-2">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-slate-500 font-bold text-sm m-0">No se encontraron registros de internado temporal</p>
              <p className="text-slate-400 text-xs m-0">
                Puedes importar el Excel de SENA Empresa o registrar aprendices manualmente.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Aprendiz</th>
                      <th className="py-3 px-3">Documento</th>
                      <th className="py-3 px-3">Unidad / Área</th>
                      <th className="py-3 px-3">Fecha Inicio</th>
                      <th className="py-3 px-3">Fecha Fin</th>
                      <th className="py-3 px-3 text-center">Días Restantes</th>
                      <th className="py-3 px-3 text-center">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {registrosFiltrados.map((r) => {
                      const esActivo = r.estadoCalculado === "ACTIVO";
                      const esProgramado = r.estadoCalculado === "PROGRAMADO";
                      const esVencido = r.estadoCalculado === "VENCIDO";

                      return (
                        <tr key={r.Id_Internado_Temporal} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {r.usuario
                              ? `${r.usuario.Nom_Usuario} ${r.usuario.Ape_Usuario}`
                              : "Aprendiz no vinculado"}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">
                            {r.NumDoc_Usuario}
                          </td>
                          <td className="py-3 px-3 text-slate-700 font-medium">
                            {r.Unidad_Sena_Empresa || "SENA Empresa"}
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {r.Fecha_Inicio}
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-semibold">
                            {r.Fecha_Fin}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {esActivo && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                {r.diasRestantes} día{r.diasRestantes === 1 ? "" : "s"}
                              </span>
                            )}
                            {esProgramado && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                En {Math.abs(r.diasRestantes)} día{Math.abs(r.diasRestantes) === 1 ? "" : "s"}
                              </span>
                            )}
                            {esVencido && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                Terminado
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {esActivo && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-xs">
                                <Sparkles size={11} /> ACTIVO
                              </span>
                            )}
                            {esProgramado && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                PROGRAMADO
                              </span>
                            )}
                            {esVencido && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700">
                                VENCIDO
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAbrirEditarTurno(r)}
                                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2.5 py-1 rounded-lg transition border border-transparent hover:border-indigo-200 cursor-pointer"
                                title="Editar fechas o unidad del turno"
                              >
                                Editar
                              </button>
                              {!esVencido && (
                                <button
                                  type="button"
                                  onClick={() => setRegistroAEliminar(r)}
                                  className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 hover:bg-amber-50 px-2.5 py-1 rounded-lg transition border border-transparent hover:border-amber-200 cursor-pointer"
                                  title="Finalizar turno y revertir inmediatamente al estado original"
                                >
                                  <RefreshCw size={12} /> Revertir
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          PESTANA 2: IMPORTAR ARCHIVO EXCEL GESTORES
      ============================================================ */}
      {tabActivo === "EXCEL" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-lg font-extrabold text-slate-900 m-0 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Cargar y Sincronizar Archivo de Turnos SENA Empresa
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed m-0">
              Sube el archivo Excel proporcionado por los gestores de SENA Empresa (por ejemplo,{" "}
              <code>APRENDICES EXTERNOS, QUE PASAN A INTERNARSE POR UN TIEMPO SEGUN SENA EMPRESA.xlsx</code>)
              o utiliza la plantilla oficial normalizada de Foodsys.
            </p>
          </div>

          {/* Zona de Dropzone / Input de archivo */}
          <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-3xl p-8 text-center bg-slate-50 hover:bg-emerald-50/20 transition-colors">
            <input
              type="file"
              id="inputExcelInternado"
              accept=".xlsx,.xls"
              onChange={handleSeleccionarArchivo}
              className="hidden"
            />
            <label
              htmlFor="inputExcelInternado"
              className="flex flex-col items-center justify-center gap-3 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                <Upload size={28} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 m-0">
                  {archivoExcel ? archivoExcel.name : "Haz clic aquí para seleccionar el archivo Excel"}
                </p>
                <p className="text-xs text-slate-400 mt-1 m-0">
                  Formatos aceptados: .xlsx o .xls (Máximo 15 MB)
                </p>
              </div>
            </label>
          </div>

          {/* Previsualizacion de primeras filas */}
          {previewDatosExcel?.filas?.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye size={14} className="text-emerald-600" /> Previsualización (Primeras 10 filas)
                </h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {previewDatosExcel.total} registros en total
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-64">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      {previewDatosExcel.encabezados.map((h, i) => (
                        <th key={i} className="py-2 px-3 whitespace-nowrap">
                          {String(h || `Col ${i + 1}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewDatosExcel.filas.map((fila, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        {fila.map((val, colIdx) => (
                          <td key={colIdx} className="py-2 px-3 whitespace-nowrap text-slate-700">
                            {String(val !== undefined ? val : "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={handleImportarExcel}
                  disabled={importandoExcel}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-xs py-3 px-6 rounded-2xl transition shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {importandoExcel && (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  )}
                  <span>{importandoExcel ? "Procesando e Importando..." : "Confirmar e Importar al Sistema"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          PESTANA 3: REGISTRO MANUAL DE APRENDIZ
      ============================================================ */}
      {tabActivo === "MANUAL" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6 max-w-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-extrabold text-slate-900 m-0 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                {idEditandoManual ? "Editar Turno de Internado Temporal" : "Asignar Turno de Internado Temporal Manualmente"}
              </h2>
              <p className="text-xs text-slate-500 m-0">
                Ingresa el documento del aprendiz para autocompletar sus datos o asigna un Turno Rutinario Semanal (Lunes a Viernes).
              </p>
            </div>
            {idEditandoManual && (
              <button
                type="button"
                onClick={() => {
                  setIdEditandoManual(null);
                  setNumDocManual("");
                  setAprendizEncontrado(null);
                  setObservacionesManual("");
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl self-start"
              >
                Nuevo Registro
              </button>
            )}
          </div>

          {/* Botones rapidos: Turno Rutinario Semanal (Lunes a Viernes) */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-3.5 space-y-2">
            <p className="text-xs font-bold text-indigo-900 m-0 flex items-center gap-1.5">
              <Calendar size={14} className="text-indigo-700" />
              Turno Rutinario (Semanal: Lunes a Viernes — Internos y Externos)
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => aplicarTurnoRutinarioSemanal(0)}
                className="px-3 py-1.5 bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                Esta Semana (Lunes a Viernes)
              </button>
              <button
                type="button"
                onClick={() => aplicarTurnoRutinarioSemanal(1)}
                className="px-3 py-1.5 bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                Próxima Semana (Lunes a Viernes)
              </button>
            </div>
          </div>

          <form onSubmit={handleGuardarManual} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Número de Documento del Aprendiz *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={numDocManual}
                  onChange={(e) => setNumDocManual(e.target.value)}
                  disabled={Boolean(idEditandoManual)}
                  placeholder="Ej: 1109381233 (escribe para buscar datos del aprendiz en tiempo real)"
                  required
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none disabled:bg-slate-100"
                />
                {buscandoAprendiz && (
                  <span className="absolute right-3 top-2.5 text-[11px] text-emerald-600 font-semibold animate-pulse">
                    Buscando...
                  </span>
                )}
              </div>

              {/* Tarjeta autocompletada con informacion completa del aprendiz */}
              {aprendizEncontrado && (
                <div className="mt-2.5 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-emerald-950 text-sm">
                      {aprendizEncontrado.Nom_Usuario} {aprendizEncontrado.Ape_Usuario}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {(aprendizEncontrado.roles || []).join(", ") || (aprendizEncontrado.CenCon_Usuario === "Si" ? "Interno" : "Externo")}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-700 pt-1 border-t border-emerald-200/60">
                    <div>
                      <span className="text-slate-400 block">Ficha / Programa:</span>
                      <span className="font-semibold text-slate-800">
                        {aprendizEncontrado.Num_Ficha || "Sin ficha"} · {aprendizEncontrado.Nom_Programa || "Sin programa"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Estado Formativo:</span>
                      <span className="font-semibold text-slate-800">{aprendizEncontrado.Est_Usuario}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Convivencia Actual:</span>
                      <span className="font-semibold text-slate-800">
                        {aprendizEncontrado.CenCon_Usuario === "Si" ? "Interno (Sí)" : "Externo (No)"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {errorBusquedaDoc && !aprendizEncontrado && (
                <p className="mt-1.5 text-[11px] font-semibold text-rose-600 m-0">
                  {errorBusquedaDoc}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fecha de Inicio del Turno *
                </label>
                <input
                  type="date"
                  value={fechaInicioManual}
                  onChange={(e) => setFechaInicioManual(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fecha de Fin del Turno (Reversión automática) *
                </label>
                <input
                  type="date"
                  value={fechaFinManual}
                  onChange={(e) => setFechaFinManual(e.target.value)}
                  min={fechaInicioManual}
                  required
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unidad Productiva / Área SENA Empresa *
              </label>
              <select
                value={unidadManual}
                onChange={(e) => setUnidadManual(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer"
              >
                {UNIDADES_SENA_EMPRESA.map((u) => (
                  <option key={u} value={u}>
                    {u.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observaciones o Justificación (Opcional)
              </label>
              <textarea
                rows={2}
                value={observacionesManual}
                onChange={(e) => setObservacionesManual(e.target.value)}
                placeholder="Ej: Turno rotativo de ordeño y lechería asignado por SENA Empresa"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIdEditandoManual(null);
                  setTabActivo("LISTADO");
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardandoManual}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                {guardandoManual && (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                <span>{idEditandoManual ? "Actualizar Turno" : "Guardar Asignación"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================
          MODAL DE CONFIRMACION PARA REVERTIR TURNO (SIN ELIMINAR)
      ============================================================ */}
      <FoodsysConfirmModal
        isOpen={Boolean(registroAEliminar)}
        onClose={() => setRegistroAEliminar(null)}
        onConfirm={handleConfirmarEliminar}
        title="Revertir Aprendiz a Estado Original"
        message={`¿Estás seguro de finalizar anticipadamente el internado temporal para el aprendiz ${
          registroAEliminar?.usuario
            ? `${registroAEliminar.usuario.Nom_Usuario} ${registroAEliminar.usuario.Ape_Usuario}`
            : registroAEliminar?.NumDoc_Usuario
        }? El registro pasará a estado VENCIDO y su estado formativo volverá a 'Formación'.`}
        confirmText="Sí, Revertir Estado"
        cancelText="Conservar Turno"
        type="danger"
        loading={eliminando}
      />
    </div>
  );
}
