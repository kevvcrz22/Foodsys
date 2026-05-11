// Frontend/src/Tablas/Usuarios/ImportarExcel.jsx
import { useState, useRef } from "react";
import apiAxios from "../../api/axiosConfig";
import {
  Upload, X, CheckCircle, AlertCircle,
  FileSpreadsheet, ChevronRight, FileCheck, Download,
} from "lucide-react";

const ImportarExcel = ({ onClose, reload }) => {
  const [step, setStep]               = useState("upload");
  const [archivo, setArchivo]         = useState(null);
  const [archivoNombre, setArchivoNombre] = useState("");
  const [guardando, setGuardando]     = useState(false);
  const [resultado, setResultado]     = useState(null);
  const [dragOver, setDragOver]       = useState(false);
  const [datos, setDatos]             = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [errorArchivo, setErrorArchivo]   = useState("");
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
      link.setAttribute("download", "plantilla_aprendices.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("No se pudo descargar la plantilla.");
    }
  };

  /* =========================
     LEER Y PREVISUALIZAR
  ========================== */
  const leerArchivo = async (file) => {
    if (!file) return;
    setErrorArchivo("");

    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      setErrorArchivo("Formato no soportado. Usa .xlsx, .xls o .csv");
      return;
    }

    setArchivo(file);
    setArchivoNombre(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file); // ✅ usa el parámetro "file", no el estado

      const res = await apiAxios.post("/api/Usuarios/preview-import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setDatos(res.data.data ?? []);
      // Pre-seleccionar todos
      setSeleccionados(res.data.data ?? []);
      setStep("preview");
    } catch (err) {
      setErrorArchivo(
        err?.response?.data?.message || "Error al leer el archivo. Verifica que uses la plantilla oficial."
      );
    }
  };

  /* =========================
     TOGGLE SELECCIÓN
  ========================== */
  const toggleSeleccion = (fila) => {
    setSeleccionados((prev) =>
      prev.includes(fila) ? prev.filter((f) => f !== fila) : [...prev, fila]
    );
  };

  const toggleTodos = () => {
    setSeleccionados((prev) => (prev.length === datos.length ? [] : [...datos]));
  };

  /* =========================
     IMPORTAR SELECCIONADOS
  ========================== */
  const importarSeleccionados = async () => {
    if (seleccionados.length === 0) return;
    setGuardando(true);
    try {
      const res = await apiAxios.post("/api/Usuarios/importar-seleccionados", {
        usuarios: seleccionados,
      });
      setResultado(res.data);
      setStep("result");
      reload();
    } catch (err) {
      setResultado({
        creados: 0,
        omitidos: seleccionados.length,
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
    { label: "Revisar",  icon: FileCheck },
    { label: "Listo",    icon: CheckCircle },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9998] bg-slate-900/50 backdrop-blur-[2px]"
        onClick={!guardando ? onClose : undefined}
      />

      {/* Modal */}
      <div className="fixed bottom-0 left-0 right-0 mx-auto z-[9999] w-full max-w-[560px] bg-white rounded-t-2xl flex flex-col overflow-hidden shadow-[0_-4px_32px_rgba(15,23,42,0.18)] max-h-[90vh]">

        {/* Handle */}
        <div className="w-8 h-[3px] bg-slate-200 rounded-full mx-auto mt-3" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <FileSpreadsheet size={17} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 text-[15px]">Importar desde Excel</h2>
              {archivoNombre && (
                <p className="text-[11px] text-slate-400 font-mono truncate max-w-[160px]">{archivoNombre}</p>
              )}
            </div>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center gap-1.5">
            {STEPS.map(({ label, icon: Icon }, i) => {
              const done    = i < stepIdx;
              const current = i === stepIdx;
              return (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={[
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold",
                    done    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : current ? "bg-blue-600 text-white"
                    :           "bg-slate-100 text-slate-400",
                  ].join(" ")}>
                    {done ? <CheckCircle size={10} /> : <Icon size={10} />}
                    <span>{label}</span>
                  </div>
                  {i < 2 && <ChevronRight size={12} className="text-slate-300" />}
                </div>
              );
            })}
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
          >
            <X size={14} className="text-slate-500" />
          </button>
        </div>

        {/* ── STEP 1: UPLOAD ── */}
        {step === "upload" && (
          <div className="p-6 flex flex-col gap-4">

            {/* Zona drag & drop */}
            <div
              className={[
                "border-2 border-dashed rounded-xl py-10 px-8 text-center cursor-pointer transition-all",
                dragOver ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-slate-300",
              ].join(" ")}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); leerArchivo(e.dataTransfer.files[0]); }}
            >
              <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto mb-4">
                <Upload size={24} className="text-slate-400" />
              </div>
              <p className="font-semibold text-slate-700 mb-1">Arrastra tu archivo aquí</p>
              <p className="text-xs text-slate-400 mb-5">Formatos soportados: .xlsx, .xls, .csv</p>
              <span className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2.5 text-xs font-semibold">
                <Upload size={12} /> Seleccionar archivo
              </span>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => leerArchivo(e.target.files[0])}
              />
            </div>

            {/* Error de archivo */}
            {errorArchivo && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-600">{errorArchivo}</p>
              </div>
            )}

            {/* Botón descargar plantilla */}
            <button
              onClick={descargarPlantilla}
              className="flex items-center justify-center gap-2 w-full border border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:text-slate-800 rounded-xl py-2.5 text-xs font-semibold transition-all"
            >
              <Download size={13} />
              Descargar plantilla oficial (.xlsx)
            </button>

            {/* Recomendaciones */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1">
              <p className="text-[11px] font-semibold text-amber-700 mb-1.5">📋 Recomendaciones</p>
              {[
                "Usa solo la plantilla oficial (.xlsx).",
                "No repitas correos ni documentos.",
                "Evita dejar celdas vacías obligatorias.",
                "La ficha del aprendiz ya debe existir en el sistema.",
              ].map((r) => (
                <p key={r} className="text-[11px] text-amber-600">• {r}</p>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: PREVIEW ── */}
        {step === "preview" && (
          <div className="p-6 flex flex-col gap-4 overflow-hidden">

            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-700 text-sm">
                {datos.length} registro{datos.length !== 1 ? "s" : ""} encontrado{datos.length !== 1 ? "s" : ""}
              </h3>
              <button
                onClick={toggleTodos}
                className="text-[11px] text-blue-600 hover:underline font-medium"
              >
                {seleccionados.length === datos.length ? "Deseleccionar todos" : "Seleccionar todos"}
              </button>
            </div>

            {/* Tabla preview */}
            <div className="overflow-auto max-h-64 border border-slate-200 rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left w-8">
                      <input
                        type="checkbox"
                        checked={seleccionados.length === datos.length && datos.length > 0}
                        onChange={toggleTodos}
                        className="rounded"
                      />
                    </th>
                    <th className="px-3 py-2 text-left text-slate-500 font-semibold">Documento</th>
                    <th className="px-3 py-2 text-left text-slate-500 font-semibold">Nombre</th>
                    <th className="px-3 py-2 text-left text-slate-500 font-semibold">Correo</th>
                    <th className="px-3 py-2 text-left text-slate-500 font-semibold">Ficha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {datos.map((fila, i) => {
                    const seleccionado = seleccionados.includes(fila);
                    return (
                      <tr
                        key={i}
                        className={seleccionado ? "bg-blue-50/60" : "hover:bg-slate-50"}
                        onClick={() => toggleSeleccion(fila)}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={seleccionado}
                            onChange={() => toggleSeleccion(fila)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded"
                          />
                        </td>
                        <td className="px-3 py-2 text-slate-600 font-mono">{fila.NumDoc_Usuario ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-700 font-medium">
                          {[fila.Nom_Usuario, fila.Ape_Usuario].filter(Boolean).join(" ") || "Sin nombre"}
                        </td>
                        <td className="px-3 py-2 text-slate-500">{fila.Cor_Usuario ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-500">{fila.Id_Ficha ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Contador seleccionados */}
            <p className="text-[11px] text-slate-400 text-center">
              {seleccionados.length} de {datos.length} seleccionados
            </p>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={() => { setStep("upload"); setDatos([]); setSeleccionados([]); }}
                className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl py-2.5 text-xs font-semibold"
              >
                Volver
              </button>
              <button
                onClick={importarSeleccionados}
                disabled={guardando || seleccionados.length === 0}
                className="flex-[2] bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
              >
                {guardando ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Importando…
                  </>
                ) : (
                  `Importar ${seleccionados.length} registro${seleccionados.length !== 1 ? "s" : ""}`
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: RESULT ── */}
        {step === "result" && resultado && (
          <div className="p-8 flex flex-col items-center gap-5">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle size={30} className="text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-800 text-lg">Importación completada</h3>
              <p className="text-xs text-slate-400">El proceso finalizó correctamente</p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
                <p className="text-4xl font-bold text-emerald-700">{resultado.creados ?? 0}</p>
                <p className="text-xs text-emerald-600 font-medium">Creados</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
                <p className="text-4xl font-bold text-red-600">{resultado.omitidos ?? 0}</p>
                <p className="text-xs text-red-500 font-medium">Omitidos</p>
              </div>
            </div>

            {resultado.errores?.length > 0 && (
              <div className="w-full rounded-xl border border-red-200 bg-red-50 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-red-100">
                  <AlertCircle size={12} className="text-red-500" />
                  <span className="text-xs font-semibold text-red-700">Detalle de errores</span>
                </div>
                <div className="p-3 max-h-40 overflow-y-auto space-y-1">
                  {resultado.errores.map((err, i) => (
                    <p key={i} className="text-[11px] text-red-600">• {err}</p>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-semibold"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ImportarExcel;