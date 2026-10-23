// Frontend/src/Paginas/Admin/PanelSincronizacion.jsx
// Panel administrativo de monitoreo de sincronizacion offline-first tipo OneDrive y contingencia 7+ dias sin internet
// Permite sincronizacion forzada (Puente movil 30s) y exportacion/importacion de paquetes .foodsys-sync
// Codigo comentado didacticamente sin tildes ni emojis para aprendices de primer semestre

import { useState, useEffect } from "react";
import {
  RefreshCw, Wifi, WifiOff, Cloud, Database, HardDrive,
  Download, Upload, CheckCircle2, AlertTriangle, ShieldCheck,
  Smartphone, ArrowUpDown, Clock, HelpCircle, ChevronDown, Loader2
} from "lucide-react";
import apiAxios from "../../api/axiosConfig";
import toast from "react-hot-toast";

const PanelSincronizacion = () => {
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [mostrarGuia, setMostrarGuia] = useState(false);

  // Consultar estado de sincronizacion actual
  const cargarEstado = async () => {
    setCargando(true);
    try {
      const respuesta = await apiAxios.get("/api/Sync/status");
      setEstado(respuesta.data);
    } catch (err) {
      console.error("Error al consultar estado sync:", err.message);
      toast.error("No se pudo obtener estado de sincronizacion");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEstado();
    // Sondeo de estado cada 20 segundos
    const timer = setInterval(cargarEstado, 20000);
    return () => clearInterval(timer);
  }, []);

  // Disparar sincronizacion inmediata (Puente movil 30 segundos)
  const handleTriggerSync = async () => {
    setSincronizando(true);
    try {
      const respuesta = await apiAxios.post("/api/Sync/trigger");
      const { push, pull } = respuesta.data || {};
      const totalPush = push?.totalSincronizados || 0;
      const totalPull = pull?.totalAplicados || 0;

      toast.success(
        `Sincronizacion completada: ${totalPush} eventos subidos, ${totalPull} novedades descargadas`,
        { duration: 6000 }
      );
      cargarEstado();
    } catch (err) {
      console.error("Error al forzar sync:", err.message);
      toast.error(err.response?.data?.mensaje || "Fallo la sincronizacion con Hetzner. Verifica conexion.");
    } finally {
      setSincronizando(false);
    }
  };

  // Exportar paquete manual .foodsys-sync
  const handleExportarPaquete = async () => {
    setExportando(true);
    try {
      const respuesta = await apiAxios.get("/api/Sync/package/export");
      const blob = new Blob([JSON.stringify(respuesta.data, null, 2)], {
        type: "application/json"
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `LaGranja_Novedades_${new Date().toISOString().split("T")[0]}.foodsys-sync`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Paquete .foodsys-sync exportado exitosamente");
    } catch (err) {
      console.error("Error al exportar paquete:", err.message);
      toast.error("Error al generar paquete de sincronizacion");
    } finally {
      setExportando(false);
    }
  };

  // Importar paquete manual .foodsys-sync
  const handleImportarPaquete = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportando(true);
    try {
      const lector = new FileReader();
      lector.onload = async (evento) => {
        try {
          const paqueteJson = JSON.parse(evento.target.result);
          const respuesta = await apiAxios.post("/api/Sync/package/import", paqueteJson);
          toast.success(respuesta.data?.mensaje || "Paquete importado y procesado correctamente");
          cargarEstado();
        } catch (errParse) {
          toast.error("El archivo seleccionado no tiene formato JSON valido.");
        } finally {
          setImportando(false);
          e.target.value = "";
        }
      };
      lector.readAsText(file);
    } catch (err) {
      console.error("Error al leer archivo:", err.message);
      toast.error("No se pudo leer el archivo");
      setImportando(false);
    }
  };

  const isOnline = estado?.conexionHetzner === "ONLINE";
  const esNodoLocal = estado?.nodoActual === "LOCAL";

  return (
    <div className="w-full space-y-6">

      {/* Encabezado del Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#0f3f80]/10 text-[#0f3f80]">
              <ArrowUpDown size={22} />
            </span>
            <h1 className="text-xl font-bold text-slate-800">
              Centro de Sincronizacion Offline
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Arquitectura de Doble Nodo · La Granja (LAN Local) ↔ Hetzner (Nube Web) · Tolerancia a fallos de red de 7+ dias
          </p>
        </div>

        {/* Boton de Accion Rapida: Puente Movil 30s */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleTriggerSync}
            disabled={sincronizando}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0f3f80] hover:bg-[#144f9e] shadow-sm transition-all disabled:opacity-50"
            title="Sincronizar ahora usando conexion compartida de celular o internet activo"
          >
            {sincronizando ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <Smartphone size={15} />
                Sincronizar Ahora (Puente Movil 30s)
              </>
            )}
          </button>

          <button
            type="button"
            onClick={cargarEstado}
            disabled={cargando}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            title="Recargar estado"
          >
            <RefreshCw size={15} className={cargando ? "animate-spin text-[#0f3f80]" : ""} />
          </button>
        </div>
      </div>

      {/* Guia desplegable sobre como opera la contingencia sin internet */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={() => setMostrarGuia(!mostrarGuia)}
          className="w-full flex items-center justify-between text-left font-bold text-[#0f3f80] text-xs"
        >
          <div className="flex items-center gap-2">
            <HelpCircle size={16} className="text-emerald-600" />
            <span>¿Como funciona la operacion sin internet en el Centro Agropecuario La Granja? (Guia paso a paso)</span>
          </div>
          <ChevronDown size={16} className={`transition-transform ${mostrarGuia ? "rotate-180" : ""}`} />
        </button>

        {mostrarGuia && (
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-2 leading-relaxed">
            <p><strong>1. Continuidad 100% Local:</strong> Durante cortes de fibra optica de 3 a 7+ dias seguidos, el servidor local de La Granja sigue operando en la red interna: aprendices reservan, cocina valida y supervisores registran consumos sin interrupcion.</p>
            <p><strong>2. Proteccion Antifraude Ed25519:</strong> Los aprendices que reservaron desde internet antes de llegar al centro tienen un codigo QR con firma criptografica que el servidor local verifica offline sin internet, impidiendo clonaciones o capturas viejas.</p>
            <p><strong>3. Puente Movil de 30 Segundos:</strong> Si el centro lleva varios dias sin internet fijo, el administrador puede compartir datos desde su celular por 30 segundos y presionar "Sincronizar Ahora". Como el paquete en JSON pesa menos de 300 KB, el cruce se realiza en segundos.</p>
            <p><strong>4. Conciliacion Sin Perdidas:</strong> Cuando regresa el internet, los consumos confirmados en comedor prevalecen sobre cualquier cambio tardio de la web, garantizando que jamas se cuente dos veces una misma racion.</p>
          </div>
        )}
      </div>

      {/* Tarjetas de Estado en Tiempo Real */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Estado de Conexion */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isOnline
            ? "bg-emerald-50/80 border-emerald-200"
            : "bg-amber-50/80 border-amber-200"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Conexion con Hetzner
            </span>
            {isOnline ? (
              <Wifi size={18} className="text-emerald-600" />
            ) : (
              <WifiOff size={18} className="text-amber-600" />
            )}
          </div>
          <p className="text-xl font-black mt-2 text-slate-800">
            {isOnline ? "ONLINE (Conectado)" : "MODO CONTINGENCIA (LAN)"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {isOnline ? "Comunicacion fluida con la nube" : "Operando 100% en red local La Granja"}
          </p>
        </div>

        {/* Eventos Pendientes en Outbox */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Cola de Salida (sync_outbox)
            </span>
            <HardDrive size={18} className="text-[#0f3f80]" />
          </div>
          <p className="text-xl font-black mt-2 text-slate-800">
            {estado?.pendientesOutbox || 0} operaciones
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Se enviaran automaticamente al volver la red
          </p>
        </div>

        {/* Ultima Sincronizacion Exitosa */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Ultima Sincronizacion
            </span>
            <Clock size={18} className="text-emerald-600" />
          </div>
          <p className="text-base font-bold mt-2 text-slate-800 truncate">
            {estado?.configCentro?.Ultima_Sincronizacion
              ? new Date(estado.configCentro.Ultima_Sincronizacion).toLocaleString("es-CO")
              : "Pendiente"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Centro SENA {estado?.configCentro?.Codigo_Centro_Sena || "9121"}
          </p>
        </div>

        {/* Asignacion de Cupos en Contingencia */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Cupo Local de Contingencia
            </span>
            <ShieldCheck size={18} className="text-[#0f3f80]" />
          </div>
          <p className="text-xl font-black mt-2 text-slate-800">
            {estado?.configCentro?.Porcentaje_Cupo_Local_Offline || 75}% asignado
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Reserva cupo en contingencia para el comedor
          </p>
        </div>

      </div>

      {/* Seccion de Exportacion / Importacion de Paquetes .foodsys-sync */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Download size={16} className="text-[#0f3f80]" />
              Respaldo y Cruce Manual de Datos (.foodsys-sync)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Utiliza esta opcion si el centro durara mas de 1 semana incomunicado y requieres trasladar novedades en memoria USB o red local
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">

          {/* Exportar Paquete */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div>
              <p className="text-xs font-bold text-slate-800">Descargar Paquete de Salida</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Genera un archivo cifrado .foodsys-sync con todos los consumos, novedades y reservas locales pendientes.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportarPaquete}
              disabled={exportando}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 shadow-2xs transition-all disabled:opacity-50"
            >
              {exportando ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Download size={13} />
                  Descargar Paquete .foodsys-sync
                </>
              )}
            </button>
          </div>

          {/* Importar Paquete */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div>
              <p className="text-xs font-bold text-slate-800">Cargar Paquete de Novedades</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Carga un archivo .foodsys-sync generado en la otra sede para conciliar de forma segura e idempotente.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 shadow-2xs transition-all cursor-pointer">
              <Upload size={13} />
              <span>{importando ? "Procesando..." : "Cargar Archivo .foodsys-sync"}</span>
              <input
                type="file"
                accept=".foodsys-sync,.json"
                onChange={handleImportarPaquete}
                disabled={importando}
                className="hidden"
              />
            </label>
          </div>

        </div>
      </div>

    </div>
  );
};

export default PanelSincronizacion;
