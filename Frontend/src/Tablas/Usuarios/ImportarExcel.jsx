// Frontend/src/Tablas/Usuarios/ImportarExcel.jsx
import { useState, useRef } from "react";
import apiAxios from "../../api/axiosConfig";
import toast from "react-hot-toast";
import {
  Upload, X, CheckCircle, AlertCircle,
  FileSpreadsheet, ChevronRight, FileCheck, Download,
  Search, ChevronLeft, Loader2
} from "lucide-react";

const ImportarExcel = ({ onClose, reload }) => {
  const [step, setStep]                   = useState("upload");
  const [archivo, setArchivo]             = useState(null);
  const [archivoNombre, setArchivoNombre] = useState("");
  const [guardando, setGuardando]         = useState(false);
  const [resultado, setResultado]         = useState(null);
  const [dragOver, setDragOver]           = useState(false);
  const [datos, setDatos]                 = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [errorArchivo, setErrorArchivo]   = useState("");
  const [soloActivos, setSoloActivos]     = useState(true);
  
  // Paginación y búsqueda rápida en la vista previa
  const [busqueda, setBusqueda]           = useState("");
  const [pagina, setPagina]               = useState(1);
  const filasPorPagina = 50;

  const fileRef = useRef();

  /* =========================
     DESCARGAR PLANTILLA
  ========================== */
  const descargarPlantilla = async () => {
    try {
      const res = await apiAxios.get("/api/Usuarios/plantilla-excel", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Plantilla_Aprendices_Foodsys.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Plantilla descargada correctamente");
    } catch {
      toast.error("No se pudo descargar la plantilla.");
    }
  };

  /* =========================
     LEER Y PREVISUALIZAR
  ========================== */
  const leerArchivo = async (file) => {
    if (!file) return;
    setErrorArchivo("");

    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xlsm", "xls", "csv"].includes(ext)) {
      setErrorArchivo("Formato no soportado. Usa .xlsx, .xlsm, .xls o .csv");
      return;
    }

    setArchivo(file);
    setArchivoNombre(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("soloActivos", soloActivos);

      const res = await apiAxios.post(`/api/Usuarios/preview-import?soloActivos=${soloActivos}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const lista = res.data.data ?? [];
      const validos = lista.filter(d => d.fichaValida !== false);
      setDatos(lista);
      // REGLA ESTRICTA: Solo preseleccionar aprendices cuya ficha SI existe en el sistema
      setSeleccionados(validos);
      setPagina(1);
      setBusqueda("");
      setStep("preview");

      if (res.data.invalidosSinFicha > 0) {
        toast.error(
          `${res.data.invalidosSinFicha} aprendices tienen fichas que NO existen en el sistema y no se podrán subir.`,
          { duration: 5000 }
        );
      } else {
        toast.success(`Se detectaron ${lista.length} aprendices en el archivo.`);
      }
    } catch (err) {
      setErrorArchivo(
        err?.response?.data?.message || "Error al leer el archivo. Verifica el formato del Excel."
      );
    }
  };

  /* =========================
     FILTRADO Y PAGINACIÓN
  ========================== */
  const datosFiltrados = datos.filter((d) => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase().trim();
    return (
      String(d.NumDoc_Usuario || "").includes(q) ||
      String(d.Nom_Usuario || "").toLowerCase().includes(q) ||
      String(d.Ape_Usuario || "").toLowerCase().includes(q) ||
      String(d.Num_Ficha || "").includes(q) ||
      String(d.Nom_Programa || "").toLowerCase().includes(q) ||
      String(d.Cor_Usuario || "").toLowerCase().includes(q)
    );
  });

  const totalPaginas = Math.ceil(datosFiltrados.length / filasPorPagina) || 1;
  const paginaSegura = Math.min(pagina, totalPaginas);
  const datosPaginados = datosFiltrados.slice(
    (paginaSegura - 1) * filasPorPagina,
    paginaSegura * filasPorPagina
  );

  /* =========================
     TOGGLE SELECCIÓN
  ========================== */
  const toggleSeleccion = (fila) => {
    // Si la ficha no existe, no permitir seleccionarla bajo ninguna circunstancia
    if (fila.fichaValida === false) return;
    setSeleccionados((prev) =>
      prev.includes(fila) ? prev.filter((f) => f !== fila) : [...prev, fila]
    );
  };

  const validosTotal = datos.filter((d) => d.fichaValida !== false);
  const todosValidosSeleccionados =
    validosTotal.length > 0 && validosTotal.every((v) => seleccionados.includes(v));

  const toggleTodos = () => {
    if (todosValidosSeleccionados) {
      setSeleccionados([]);
    } else {
      setSeleccionados(validosTotal);
    }
  };

  /* =========================
     IMPORTAR SELECCIONADOS
  ========================== */
  const importarSeleccionados = async () => {
    // Filtrar estrictamente solo los que tienen ficha valida registrada
    const aEnviar = seleccionados.filter((s) => s.fichaValida !== false);
    if (aEnviar.length === 0) {
      toast.error("No hay aprendices con ficha válida seleccionados para importar.");
      return;
    }
    setGuardando(true);
    try {
      const res = await apiAxios.post("/api/Usuarios/importar-seleccionados", {
        usuarios: aEnviar,
      });
      setResultado(res.data);
      setStep("result");
      toast.success("¡Importación completada exitosamente!");
      reload?.();
    } catch (err) {
      setResultado({
        creados: 0,
        omitidos: aEnviar.length,
        errores: [err?.response?.data?.message || "Error inesperado al importar."],
      });
      setStep("result");
    } finally {
      setGuardando(false);
    }
  };

  /* =========================
     STEPS UI
  ========================== */
  const steps   = ["upload", "preview", "result"];
  const stepIdx = steps.indexOf(step);
  const STEPS   = [
    { label: "Archivo", icon: Upload },
    { label: "Revisar", icon: FileCheck },
    { label: "Listo",   icon: CheckCircle },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9998] bg-slate-900/50 backdrop-blur-[2px]"
        onClick={!guardando ? onClose : undefined}
      />

      {/* Modal */}
      <div className="fixed bottom-0 left-0 right-0 mx-auto z-[9999] w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 flex flex-col overflow-hidden shadow-2xl max-h-[92vh]">

        {/* Handle */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-800 to-teal-800 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-sm">
              <FileSpreadsheet size={20} className="text-white" />
            </div>
            <div>
              <p className="text-[11px] text-emerald-200 font-bold uppercase tracking-wider m-0">Importación Masiva</p>
              <h2 className="font-bold text-white text-base m-0">Aprendices desde Excel / Base IQR</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Steps indicator */}
            <div className="hidden sm:flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full">
              {STEPS.map(({ label, icon: Icon }, i) => {
                const done    = i < stepIdx;
                const current = i === stepIdx;
                return (
                  <div key={label} className="flex items-center gap-1">
                    <span className={`text-[11px] font-bold ${current ? "text-white underline" : done ? "text-emerald-300" : "text-white/50"}`}>
                      {label}
                    </span>
                    {i < 2 && <ChevronRight size={10} className="text-white/40" />}
                  </div>
                );
              })}
            </div>

            <button
              onClick={onClose}
              disabled={guardando}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white border-0 cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── STEP 1: UPLOAD ── */}
        {step === "upload" && (
          <div className="p-6 flex flex-col gap-4 overflow-y-auto">

            {/* Checkbox inteligente para filtrar solo aprendices activos */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-3">
              <input
                type="checkbox"
                id="chkSoloActivos"
                checked={soloActivos}
                onChange={(e) => setSoloActivos(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-emerald-600 cursor-pointer shrink-0"
              />
              <label htmlFor="chkSoloActivos" className="text-xs text-emerald-950 cursor-pointer">
                <strong className="text-emerald-800">Filtrar automáticamente solo aprendices activos (En Formación / Inducción)</strong>
                <p className="text-[11px] text-emerald-700 m-0 mt-0.5">
                  Recomendado para bases oficiales como <em>Base_NO MODIFICAR_2026_SEPTIEMBRE.xlsm</em> (omite aprendices cancelados, certificados y retirados).
                </p>
              </label>
            </div>

            {/* Zona drag & drop */}
            <div
              className={[
                "border-2 border-dashed rounded-2xl py-8 px-6 text-center cursor-pointer transition-all",
                dragOver ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-slate-50/70 hover:bg-emerald-50/40 hover:border-emerald-300",
              ].join(" ")}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); leerArchivo(e.dataTransfer.files[0]); }}
            >
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto mb-3">
                <Upload size={26} className="text-emerald-600" />
              </div>
              <p className="font-bold text-slate-800 mb-1 text-sm">
                {archivo ? archivo.name : "Haz clic aquí o arrastra tu archivo Excel"}
              </p>
              <p className="text-xs text-slate-500 mb-4">
                Soporta archivos: <strong>.xlsx, .xlsm (con macros), .xls, .csv</strong>
              </p>
              <span className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-5 py-2.5 text-xs font-bold shadow-sm">
                <Upload size={14} /> Seleccionar Archivo
              </span>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xlsm,.xls,.csv"
                className="hidden"
                onChange={(e) => leerArchivo(e.target.files[0])}
              />
            </div>

            {/* Error de archivo */}
            {errorArchivo && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700 m-0">{errorArchivo}</p>
              </div>
            )}

            {/* Botón descargar plantilla oficial */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={descargarPlantilla}
                className="flex items-center justify-center gap-2 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:text-slate-900 rounded-xl py-2.5 px-4 text-xs font-bold transition-all shadow-sm"
              >
                <Download size={14} className="text-emerald-600" />
                Descargar Plantilla Oficial (.xlsx)
              </button>

              <p className="text-[11px] text-slate-400 m-0">
                Al subir, la contraseña inicial del aprendiz será su <strong>número de documento</strong>.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 2: PREVIEW ── */}
        {step === "preview" && (
          <div className="p-5 flex flex-col gap-3 overflow-hidden">

            {/* Alerta de fichas no existentes si las hay */}
            {datos.some((d) => d.fichaValida === false) && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-900">
                <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-red-800">
                    Atención: {datos.filter((d) => d.fichaValida === false).length} aprendices tienen fichas no registradas en el sistema.
                  </strong>
                  <p className="m-0 mt-0.5 text-red-700 text-[11px] leading-relaxed">
                    Por integridad de la base de datos, <strong>no se permite subir aprendices sin que su ficha exista previamente</strong>. Las filas no válidas han sido bloqueadas. Primero debe registrar o importar la ficha en el módulo de Fichas.
                  </p>
                </div>
              </div>
            )}

            {/* Barra superior con contador y buscador */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Buscar por documento, nombre o ficha..."
                  value={busqueda}
                  onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex items-center gap-2 justify-between sm:justify-end">
                <button
                  onClick={toggleTodos}
                  disabled={validosTotal.length === 0}
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-bold bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 border border-emerald-200 rounded-xl px-3 py-1.5 transition-colors cursor-pointer"
                >
                  {todosValidosSeleccionados ? "Deseleccionar todos" : `Seleccionar válidos (${validosTotal.length})`}
                </button>
              </div>
            </div>

            {/* Tabla preview paginada */}
            <div className="overflow-auto max-h-72 border border-slate-200 rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 sticky top-0 text-slate-600 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left w-8">
                      <input
                        type="checkbox"
                        checked={todosValidosSeleccionados}
                        onChange={toggleTodos}
                        disabled={validosTotal.length === 0}
                        className="rounded accent-emerald-600 cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-2 text-left font-bold">Documento</th>
                    <th className="px-3 py-2 text-left font-bold">Aprendiz</th>
                    <th className="px-3 py-2 text-left font-bold">Rol Asignado</th>
                    <th className="px-3 py-2 text-left font-bold">Ficha / Programa</th>
                    <th className="px-3 py-2 text-left font-bold">Convivencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {datosPaginados.map((fila, i) => {
                    const esValido = fila.fichaValida !== false;
                    const seleccionado = seleccionados.includes(fila);
                    const esInterno = fila.CenCon_Usuario === "Si" || fila.Rol_Asignado?.includes("Interno");
                    return (
                      <tr
                        key={fila.NumDoc_Usuario || i}
                        className={`transition-colors ${
                          !esValido
                            ? "bg-red-50/60 opacity-80 cursor-not-allowed"
                            : seleccionado
                              ? "bg-emerald-50/70 hover:bg-emerald-50 cursor-pointer"
                              : "hover:bg-slate-50 cursor-pointer"
                        }`}
                        onClick={() => esValido && toggleSeleccion(fila)}
                      >
                        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={seleccionado}
                            disabled={!esValido}
                            onChange={() => esValido && toggleSeleccion(fila)}
                            className="rounded accent-emerald-600 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="px-3 py-2 font-mono font-semibold text-slate-800">
                          {fila.NumDoc_Usuario}
                          <span className="text-[10px] text-slate-400 block font-normal">{fila.TipDoc_Usuario || "CC"}</span>
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-bold text-slate-800 m-0">
                            {[fila.Nom_Usuario, fila.Ape_Usuario].filter(Boolean).join(" ")}
                          </p>
                          <p className="text-[10px] text-slate-400 m-0 truncate max-w-[150px]">
                            {fila.Cor_Usuario || "Sin correo"}
                          </p>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            esInterno ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {fila.Rol_Asignado || "Aprendiz Externo"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold">Ficha #{fila.Num_Ficha || "—"}</span>
                            {esValido ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                ✓ Ficha registrada
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded" title={fila.errorFicha}>
                                ⚠️ Ficha NO registrada
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[170px] mt-0.5 font-medium" title={fila.Nom_Programa}>
                            {fila.Nom_Programa || "Por asociar"}
                          </span>
                          {!esValido && (
                            <span className="text-[10px] text-red-600 block mt-0.5 leading-tight font-normal">
                              {fila.errorFicha || "Ficha no existe en el sistema"}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center font-bold">
                          {esInterno ? (
                            <span className="text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-[10px]">Sí (3 comidas)</span>
                          ) : (
                            <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[10px]">No (Almuerzo)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación y resumen */}
            <div className="flex items-center justify-between text-xs text-slate-600 px-1">
              <span className="font-semibold text-slate-700">
                {seleccionados.length} de {validosTotal.length} válidos seleccionados ({datos.length} totales en archivo)
                {busqueda && ` (${datosFiltrados.length} filtrados)`}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={paginaSegura <= 1}
                  className="px-2.5 py-1 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[11px] font-bold">
                  Página {paginaSegura} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaSegura >= totalPaginas}
                  className="px-2.5 py-1 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setStep("upload"); setDatos([]); setSeleccionados([]); }}
                disabled={guardando}
                className="flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl py-2.5 text-xs font-bold cursor-pointer transition-colors"
              >
                Volver
              </button>
              <button
                onClick={importarSeleccionados}
                disabled={guardando || seleccionados.length === 0}
                className="flex-[2] bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
              >
                {guardando ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>Guardando aprendices ({seleccionados.length})...</span>
                  </>
                ) : (
                  `Confirmar e Importar (${seleccionados.length} Aprendices)`
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: RESULT ── */}
        {step === "result" && resultado && (
          <div className="p-8 flex flex-col items-center gap-5 overflow-y-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-300 mx-auto mb-3 flex items-center justify-center shadow-inner">
                <CheckCircle size={32} className="text-emerald-700" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg m-0">¡Proceso de Importación Finalizado!</h3>
              <p className="text-xs text-slate-500 m-0 mt-1">Los registros fueron sincronizados en la base de datos.</p>
            </div>

            <div className={`grid ${resultado.actualizados > 0 ? "grid-cols-3" : "grid-cols-2"} gap-3 w-full`}>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                <p className="text-3xl font-extrabold text-emerald-800 m-0">{resultado.creados ?? 0}</p>
                <p className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider m-0 mt-1">Nuevos Creados</p>
              </div>
              {resultado.actualizados > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-extrabold text-blue-800 m-0">{resultado.actualizados}</p>
                  <p className="text-[11px] text-blue-700 font-bold uppercase tracking-wider m-0 mt-1">Fichas Vinculadas</p>
                </div>
              )}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                <p className="text-3xl font-extrabold text-amber-800 m-0">{resultado.omitidos ?? 0}</p>
                <p className="text-[11px] text-amber-700 font-bold uppercase tracking-wider m-0 mt-1">Omitidos / Existían</p>
              </div>
            </div>

            {resultado.errores?.length > 0 && (
              <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 border-b border-slate-200">
                  <AlertCircle size={14} className="text-amber-600" />
                  <span className="text-xs font-bold text-slate-700">Detalles y observaciones ({resultado.errores.length})</span>
                </div>
                <div className="p-3 max-h-36 overflow-y-auto space-y-1">
                  {resultado.errores.slice(0, 100).map((err, i) => (
                    <p key={i} className="text-[11px] text-slate-600 m-0 leading-relaxed">• {err}</p>
                  ))}
                  {resultado.errores.length > 100 && (
                    <p className="text-[11px] text-slate-400 italic m-0 pt-1">
                      ... y {resultado.errores.length - 100} registros omitidos más (ya existentes en la base de datos).
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl py-3 text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-colors border-0"
            >
              Cerrar y Ver Lista de Aprendices
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ImportarExcel;