// Frontend/src/Tablas/Usuarios/ImportarExcel.jsx
// REDISEÑO: Corporativo profesional — azul/gris neutro, Tailwind CSS

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import apiAxios from "../../api/axiosConfig";
import {
  Upload, X, CheckCircle, AlertCircle, Edit2, Save,
  Trash2, FileSpreadsheet, RefreshCw, AlertTriangle, ChevronRight,
  FileCheck, ArrowLeft,
} from "lucide-react";

/* ─── MAPEO FLEXIBLE ─── */
const EXCEL_MAP = {
  tipdocusuario: "TipDoc_Usuario", tipodocumento: "TipDoc_Usuario",
  tipo_documento: "TipDoc_Usuario", tipodoc: "TipDoc_Usuario", tipo: "TipDoc_Usuario",
  numdocusuario: "NumDoc_Usuario", numerodocumento: "NumDoc_Usuario",
  numero_documento: "NumDoc_Usuario", numdoc: "NumDoc_Usuario", documento: "NumDoc_Usuario",
  cedula: "NumDoc_Usuario", nrodocumento: "NumDoc_Usuario", "n° documento": "NumDoc_Usuario",
  "no documento": "NumDoc_Usuario", "num doc": "NumDoc_Usuario",
  nomusuario: "Nom_Usuario", nombre: "Nom_Usuario", nombres: "Nom_Usuario", nom: "Nom_Usuario",
  apeusuario: "Ape_Usuario", apellido: "Ape_Usuario", apellidos: "Ape_Usuario", ape: "Ape_Usuario",
  genusuario: "Gen_Usuario", genero: "Gen_Usuario", género: "Gen_Usuario", gen: "Gen_Usuario", sexo: "Gen_Usuario",
  corusuario: "Cor_Usuario", correo: "Cor_Usuario", email: "Cor_Usuario",
  correoelectronico: "Cor_Usuario", "correo electronico": "Cor_Usuario",
  telusuario: "Tel_Usuario", telefono: "Tel_Usuario", teléfono: "Tel_Usuario",
  tel: "Tel_Usuario", celular: "Tel_Usuario",
  idficha: "Id_Ficha", ficha: "Id_Ficha", numficha: "Id_Ficha",
  numeroficha: "Id_Ficha", nroficha: "Id_Ficha", "num ficha": "Id_Ficha",
  cenconusuario: "CenCon_Usuario", centrodeconvivencia: "CenCon_Usuario",
  centroconvivencia: "CenCon_Usuario", cencon: "CenCon_Usuario",
  estusuario: "Est_Usuario", estado: "Est_Usuario",
  sanusuario: "San_Usuario", sancion: "San_Usuario", sanción: "San_Usuario", san: "San_Usuario",
};

const COLUMNAS_REQUERIDAS = ["NumDoc_Usuario", "Nom_Usuario", "Ape_Usuario", "TipDoc_Usuario"];

const COLUMN_LABELS = {
  TipDoc_Usuario: "Tipo Doc.", NumDoc_Usuario: "N° Documento",
  Nom_Usuario: "Nombres", Ape_Usuario: "Apellidos",
  Gen_Usuario: "Género", Cor_Usuario: "Correo",
  Tel_Usuario: "Teléfono", CenCon_Usuario: "Centro Conv.",
  Est_Usuario: "Estado", San_Usuario: "Sanción", Id_Ficha: "Ficha",
};

const normalizeHeader = (h) =>
  String(h ?? "").trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

const defaultRow = () => ({
  TipDoc_Usuario: "CC", NumDoc_Usuario: "", Nom_Usuario: "", Ape_Usuario: "",
  Gen_Usuario: "", Cor_Usuario: "", Tel_Usuario: "", CenCon_Usuario: "No",
  Est_Usuario: "En Formacion", San_Usuario: "No", Id_Ficha: "",
  _error: "", _fichaValida: null, _id: Math.random().toString(36).slice(2),
});

const validarFila = (fila) => {
  const errores = [];
  if (!fila.NumDoc_Usuario) errores.push("N° documento requerido");
  if (!fila.Nom_Usuario)    errores.push("Nombre requerido");
  if (!fila.Ape_Usuario)    errores.push("Apellido requerido");
  if (!fila.TipDoc_Usuario) errores.push("Tipo doc requerido");
  if (fila.Id_Ficha && fila._fichaValida === false) errores.push("Ficha no existe");
  return errores.join(" · ");
};

const ImportarExcel = ({ onClose, reload }) => {
  const [step,            setStep]            = useState("upload");
  const [filas,           setFilas]           = useState([]);
  const [editIdx,         setEditIdx]         = useState(null);
  const [editData,        setEditData]        = useState({});
  const [guardando,       setGuardando]       = useState(false);
  const [resultado,       setResultado]       = useState(null);
  const [archivoNombre,   setArchivoNombre]   = useState("");
  const [validandoFichas, setValidandoFichas] = useState(false);
  const [dragOver,        setDragOver]        = useState(false);
  const [colsDetectadas,  setColsDetectadas]  = useState([]);
  const [colsNoMapeadas,  setColsNoMapeadas]  = useState([]);
  const [mapeoManual,     setMapeoManual]     = useState({});
  const [rawData,         setRawData]         = useState([]);
  const fileRef = useRef();

  const validarFichas = async (rows) => {
    setValidandoFichas(true);
    const fichasUnicas = [...new Set(rows.map((r) => r.Id_Ficha).filter(Boolean))];
    const fichaSet = new Set();
    await Promise.allSettled(
      fichasUnicas.map(async (num) => {
        try {
          const res  = await apiAxios.get(`/api/Fichas/?Num_Ficha=${num}`);
          const data = res.data?.results ?? res.data;
          if (Array.isArray(data) ? data.length > 0 : !!data) fichaSet.add(String(num));
        } catch { /* ignorar */ }
      })
    );
    const updated = rows.map((r) => {
      if (!r.Id_Ficha) return { ...r, _fichaValida: null };
      const base = { ...r, _fichaValida: fichaSet.has(String(r.Id_Ficha)) };
      base._error = validarFila(base);
      return base;
    });
    setFilas(updated);
    setValidandoFichas(false);
    return updated;
  };

  const aplicarMapeo = (raw, mapeoExtra = {}) =>
    raw.map((row) => {
      const mapped = defaultRow();
      Object.keys(row).forEach((k) => {
        const campo = EXCEL_MAP[normalizeHeader(k)] || mapeoExtra[k];
        if (campo) mapped[campo] = String(row[k] ?? "").trim();
      });
      mapped._error = validarFila(mapped);
      mapped._id    = Math.random().toString(36).slice(2);
      return mapped;
    });

  const leerArchivo = async (file) => {
    if (!file) return;
    setArchivoNombre(file.name);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const wb  = XLSX.read(e.target.result, { type: "array" });
        const ws  = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (!raw.length) { alert("El archivo está vacío."); return; }
        setRawData(raw);
        const keysExcel    = Object.keys(raw[0] || {});
        const infoColumnas = keysExcel.map((k) => ({ original: k, normalizada: normalizeHeader(k), campo: EXCEL_MAP[normalizeHeader(k)] || null }));
        setColsDetectadas(infoColumnas);
        setColsNoMapeadas(infoColumnas.filter((c) => !c.campo).map((c) => c.original));
        const mappedRows = aplicarMapeo(raw, {});
        setFilas(mappedRows);
        setStep("preview");
        await validarFichas(mappedRows);
      } catch (err) { alert("Error al leer el archivo: " + err.message); }
    };
    reader.readAsArrayBuffer(file);
  };

  const aplicarMapeoManual = async () => {
    const mappedRows = aplicarMapeo(rawData, mapeoManual);
    setFilas(mappedRows);
    await validarFichas(mappedRows);
  };

  const iniciarEdicion = (idx) => { setEditIdx(idx); setEditData({ ...filas[idx] }); };
  const guardarEdicion  = async () => {
    let updated = { ...editData };
    if (updated.Id_Ficha) {
      try {
        const res  = await apiAxios.get(`/api/Fichas/?Num_Ficha=${updated.Id_Ficha}`);
        const data = res.data?.results ?? res.data;
        updated._fichaValida = Array.isArray(data) ? data.length > 0 : !!data;
      } catch { updated._fichaValida = false; }
    } else { updated._fichaValida = null; }
    updated._error = validarFila(updated);
    setFilas((prev) => prev.map((f, i) => (i === editIdx ? updated : f)));
    setEditIdx(null);
  };
  const eliminarFila = (idx) => { setFilas((prev) => prev.filter((_, i) => i !== idx)); if (editIdx === idx) setEditIdx(null); };

  const confirmarImportacion = async () => {
    const validas = filas.filter((f) => !f._error);
    if (!validas.length) { alert("No hay filas válidas para importar."); return; }
    setGuardando(true);
    let creados = 0, omitidos = 0;
    const errores = [];
    for (const fila of validas) {
      const { _error, _id, _fichaValida, ...data } = fila;
      try {
        await apiAxios.post("/api/Usuarios/", { ...data, password: String(data.NumDoc_Usuario) });
        creados++;
      } catch (err) {
        omitidos++;
        errores.push(err.response?.data?.message || `Error en doc ${data.NumDoc_Usuario}`);
      }
    }
    setResultado({ creados, omitidos, errores });
    setGuardando(false);
    setStep("result");
    reload();
  };

  const validas   = filas.filter((f) => !f._error).length;
  const invalidas = filas.length - validas;
  const visibleCols = ["TipDoc_Usuario", "NumDoc_Usuario", "Nom_Usuario", "Ape_Usuario", "Id_Ficha", "Est_Usuario"];
  const steps       = ["upload", "preview", "result"];
  const stepIdx     = steps.indexOf(step);
  const camposRequeridosSinMapear = COLUMNAS_REQUERIDAS.filter((campo) => {
    const hayAuto   = colsDetectadas.some((c) => c.campo === campo);
    const hayManual = Object.values(mapeoManual).includes(campo);
    return !hayAuto && !hayManual;
  });

  /* ── Etiquetas de pasos ── */
  const STEPS = [
    { label: "Archivo",  icon: Upload },
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
      <div
        className={[
          "fixed bottom-0 left-1/2 -translate-x-1/2 z-[9999] w-full bg-white",
          "rounded-t-2xl flex flex-col overflow-hidden",
          "shadow-[0_-4px_32px_rgba(15,23,42,0.18)]",
          "transition-[max-width] duration-300",
          step === "preview" ? "max-w-[980px] max-h-[94vh]" : "max-w-[540px] max-h-[90vh]",
        ].join(" ")}
        style={{ animation: "slideUp 0.3s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        {/* Drag handle */}
        <div className="w-8 h-[3px] bg-slate-200 rounded-full mx-auto mt-3 shrink-0" />

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <FileSpreadsheet size={17} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 text-[15px] leading-tight m-0">
                Importar desde Excel
              </h2>
              {archivoNombre && (
                <p className="text-[11px] text-slate-400 m-0 mt-0.5 font-mono">{archivoNombre}</p>
              )}
            </div>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((
              // eslint-disable-next-line no-unused-vars
              { label, icon: Icon }, i
            ) => {
              const done    = i < stepIdx;
              const current = i === stepIdx;
              return (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={[
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-200",
                    done    ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                    current ? "bg-blue-600 text-white shadow-sm" :
                              "bg-slate-100 text-slate-400",
                  ].join(" ")}>
                    {done
                      ? <CheckCircle size={10} />
                      : <Icon size={10} />
                    }
                    <span>{label}</span>
                  </div>
                  {i < 2 && (
                    <ChevronRight size={12} className={done ? "text-slate-300" : "text-slate-200"} />
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer border-0"
          >
            <X size={14} className="text-slate-500" />
          </button>
        </div>

        {/* ══════════════════════════════
            PASO 1: Upload
        ══════════════════════════════ */}
        {step === "upload" && (
          <div className="p-6 flex flex-col gap-5 overflow-y-auto">

            {/* Drop zone */}
            <div
              className={[
                "border-2 border-dashed rounded-xl py-12 px-8 text-center cursor-pointer transition-all duration-200",
                dragOver
                  ? "border-blue-500 bg-blue-50/60"
                  : "border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-50",
              ].join(" ")}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); leerArchivo(e.dataTransfer.files[0]); }}
            >
              <div className={[
                "w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors duration-200",
                dragOver ? "bg-blue-100" : "bg-white border border-slate-200 shadow-sm",
              ].join(" ")}>
                <Upload size={24} className={dragOver ? "text-blue-600" : "text-slate-400"} />
              </div>
              <p className="font-semibold text-slate-700 m-0 mb-1 text-sm">
                {dragOver ? "Suelta el archivo aquí" : "Arrastra tu archivo aquí"}
              </p>
              <p className="text-xs text-slate-400 m-0 mb-5">
                Formatos soportados: .xlsx, .xls, .csv
              </p>
              <span className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2.5 text-xs font-semibold transition-colors shadow-sm">
                <Upload size={12} /> Seleccionar archivo
              </span>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={(e) => leerArchivo(e.target.files[0])} />
            </div>

            {/* Columnas esperadas */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-100">
                <AlertTriangle size={13} className="text-amber-600" />
                <span className="text-xs font-semibold text-amber-800">
                  Columnas esperadas en el archivo
                </span>
              </div>
              <div className="p-4 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
                {Object.entries(COLUMN_LABELS).map(([key, label]) => (
                  <div key={key} className={[
                    "flex items-center justify-between gap-2 rounded-lg px-3 py-2 border",
                    COLUMNAS_REQUERIDAS.includes(key)
                      ? "bg-white border-amber-300"
                      : "bg-white border-slate-200",
                  ].join(" ")}>
                    <span className="text-[11px] font-medium text-slate-700">{label}</span>
                    {COLUMNAS_REQUERIDAS.includes(key) && (
                      <span className="text-[9px] bg-amber-500 text-white rounded px-1.5 py-0.5 font-bold tracking-wide">
                        REQ
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="px-4 pb-3 text-[11px] text-amber-700">
                💡 Los nombres de columna son flexibles — si no se detectan automáticamente, podrás mapearlos.
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════
            PASO 2: Preview
        ══════════════════════════════ */}
        {step === "preview" && (
          <div className="flex-1 overflow-hidden flex flex-col">

            {/* Panel diagnóstico */}
            {(colsNoMapeadas.length > 0 || camposRequeridosSinMapear.length > 0) && (
              <div className="mx-5 mt-4 rounded-xl border border-orange-200 bg-orange-50/60 overflow-hidden shrink-0">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-orange-100 bg-orange-100/50">
                  <AlertCircle size={13} className="text-orange-600" />
                  <span className="text-xs font-semibold text-orange-800">
                    Columnas sin mapear automáticamente
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  {colsNoMapeadas.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-slate-600 mb-2">
                        No reconocidas en el Excel:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {colsNoMapeadas.map((c) => (
                          <span key={c} className="bg-white border border-orange-300 text-orange-700 rounded-md px-2 py-0.5 text-[11px] font-mono">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {camposRequeridosSinMapear.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-red-700 mb-2">
                        ⚠ Campos requeridos sin columna — asígnalos:
                      </p>
                      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                        {camposRequeridosSinMapear.map((campo) => (
                          <div key={campo} className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-slate-700 w-28 shrink-0">
                              {COLUMN_LABELS[campo]} *
                            </span>
                            <select
                              className="flex-1 text-[11px] border border-slate-300 rounded-lg px-2 py-1.5 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                              value={Object.keys(mapeoManual).find((k) => mapeoManual[k] === campo) || ""}
                              onChange={(e) => {
                                const colExcel = e.target.value;
                                setMapeoManual((prev) => {
                                  const next = { ...prev };
                                  Object.keys(next).forEach((k) => { if (next[k] === campo) delete next[k]; });
                                  if (colExcel) next[colExcel] = campo;
                                  return next;
                                });
                              }}
                            >
                              <option value="">— seleccionar columna —</option>
                              {colsNoMapeadas.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                      {Object.keys(mapeoManual).length > 0 && (
                        <button
                          onClick={aplicarMapeoManual}
                          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border-0"
                        >
                          <RefreshCw size={11} /> Aplicar y re-validar
                        </button>
                      )}
                    </div>
                  )}

                  {/* Columnas mapeadas */}
                  <div className="pt-2 border-t border-orange-200">
                    <p className="text-[10px] text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">
                      Reconocidas automáticamente
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {colsDetectadas.filter((c) => c.campo).map((c) => (
                        <span key={c.original} className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md px-2 py-0.5 text-[10px] font-mono">
                          {c.original} → {COLUMN_LABELS[c.campo] || c.campo}
                        </span>
                      ))}
                      {colsDetectadas.filter((c) => c.campo).length === 0 && (
                        <span className="text-[11px] text-slate-400 italic">Ninguna</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Barra resumen */}
            <div className="mx-5 mt-3 shrink-0">
              <div className="flex items-center gap-2.5 flex-wrap bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5">
                <span className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">{filas.length}</span> filas leídas
                </span>
                <div className="w-px h-4 bg-slate-200" />
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
                  <CheckCircle size={10} /> {validas} válidas
                </span>
                {invalidas > 0 && (
                  <span className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
                    <AlertCircle size={10} /> {invalidas} con errores
                  </span>
                )}
                {validandoFichas && (
                  <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
                    <RefreshCw size={10} className="animate-spin" /> Validando fichas…
                  </span>
                )}
                <button
                  onClick={() => validarFichas(filas)}
                  disabled={validandoFichas}
                  className="ml-auto text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-1 disabled:opacity-40 cursor-pointer bg-transparent border-0 font-medium"
                >
                  <RefreshCw size={10} className={validandoFichas ? "animate-spin" : ""} /> Re-validar
                </button>
              </div>
            </div>

            {/* Tabla */}
            <div className="flex-1 overflow-y-auto overflow-x-auto mx-5 mt-3 rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 sticky top-0 z-[2] border-b border-slate-200">
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-400 text-[10px] uppercase tracking-wider w-8">#</th>
                    {visibleCols.map((col) => (
                      <th key={col} className="px-3 py-2.5 text-left font-semibold text-slate-500 text-[10px] uppercase tracking-wider whitespace-nowrap">
                        {COLUMN_LABELS[col] || col}
                        {COLUMNAS_REQUERIDAS.includes(col) && <span className="text-red-400 ml-0.5">*</span>}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-500 text-[10px] uppercase tracking-wider">Estado</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-slate-500 text-[10px] uppercase tracking-wider w-20">Acc.</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((fila, idx) => {
                    const isEdit = editIdx === idx;
                    return (
                      <tr
                        key={fila._id}
                        className={[
                          "border-b border-slate-100 transition-colors",
                          isEdit
                            ? "bg-blue-50/60"
                            : fila._error
                              ? "bg-red-50/40 hover:bg-red-50/60"
                              : idx % 2 === 0 ? "bg-white hover:bg-slate-50/60" : "bg-slate-50/30 hover:bg-slate-50/60",
                        ].join(" ")}
                      >
                        <td className="px-3 py-2 text-slate-300 text-[10px] font-mono">{idx + 1}</td>

                        {isEdit ? (
                          <>
                            {visibleCols.map((col) => (
                              <td key={col} className="px-2 py-1.5">
                                <input
                                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                  value={editData[col] || ""}
                                  onChange={(e) => setEditData((p) => ({ ...p, [col]: e.target.value }))}
                                />
                              </td>
                            ))}
                            <td className="px-3 py-2 text-[10px] text-slate-400 italic">Editando…</td>
                            <td className="px-3 py-2">
                              <div className="flex justify-center gap-1">
                                <button onClick={guardarEdicion}
                                  className="w-7 h-7 bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center justify-center cursor-pointer border-0 transition-colors">
                                  <Save size={11} className="text-white" />
                                </button>
                                <button onClick={() => setEditIdx(null)}
                                  className="w-7 h-7 bg-slate-200 hover:bg-slate-300 rounded-lg flex items-center justify-center cursor-pointer border-0 transition-colors">
                                  <X size={11} className="text-slate-600" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            {visibleCols.map((col) => (
                              <td key={col} className="px-3 py-2 text-slate-700 whitespace-nowrap max-w-[130px] overflow-hidden text-ellipsis">
                                {col === "Id_Ficha" && fila.Id_Ficha ? (
                                  <span className="flex items-center gap-1.5">
                                    <span className="font-mono">{fila.Id_Ficha}</span>
                                    {fila._fichaValida === true  && <CheckCircle size={11} className="text-emerald-500 shrink-0" />}
                                    {fila._fichaValida === false && <AlertCircle  size={11} className="text-red-500 shrink-0" />}
                                  </span>
                                ) : fila[col] ? (
                                  <span>{fila[col]}</span>
                                ) : COLUMNAS_REQUERIDAS.includes(col) ? (
                                  <span className="text-red-400 text-[10px] font-semibold">⚠ Vacío</span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                            ))}
                            <td className="px-3 py-2">
                              {fila._error ? (
                                <span className="inline-flex items-center gap-1 bg-red-50 border border-red-200 text-red-600 rounded-md px-2 py-1 text-[10px] font-medium leading-tight max-w-[160px] truncate" title={fila._error}>
                                  <AlertCircle size={9} className="shrink-0" />
                                  <span className="truncate">{fila._error}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md px-2 py-1 text-[10px] font-semibold">
                                  <CheckCircle size={9} /> OK
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex justify-center gap-1">
                                <button onClick={() => iniciarEdicion(idx)}
                                  className="w-7 h-7 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center justify-center cursor-pointer transition-colors">
                                  <Edit2 size={11} className="text-blue-600" />
                                </button>
                                <button onClick={() => eliminarFila(idx)}
                                  className="w-7 h-7 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center justify-center cursor-pointer transition-colors">
                                  <Trash2 size={11} className="text-red-600" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer acciones */}
            <div className="px-5 py-4 border-t border-slate-100 flex gap-3 shrink-0 bg-white">
              <button
                onClick={() => { setStep("upload"); setFilas([]); setEditIdx(null); setColsDetectadas([]); setColsNoMapeadas([]); setMapeoManual({}); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-[13px] font-semibold text-slate-600 cursor-pointer transition-all"
              >
                <ArrowLeft size={13} /> Cambiar archivo
              </button>
              <button
                onClick={confirmarImportacion}
                disabled={guardando || validas === 0}
                className={[
                  "flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold transition-all border-0",
                  validas === 0
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : guardando
                      ? "bg-blue-400 text-white cursor-wait"
                      : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-sm",
                ].join(" ")}
              >
                {guardando && <RefreshCw size={13} className="animate-spin" />}
                {guardando ? "Importando…" : `Importar ${validas} registro${validas !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════
            PASO 3: Resultado
        ══════════════════════════════ */}
        {step === "result" && resultado && (
          <div className="p-8 flex flex-col gap-5 overflow-y-auto items-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle size={30} className="text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-800 m-0 mb-1 text-lg">Importación completada</h3>
              <p className="text-xs text-slate-400 m-0">El proceso finalizó correctamente</p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
                <p className="text-4xl font-bold text-emerald-700 m-0 tabular-nums">{resultado.creados}</p>
                <p className="text-xs text-emerald-600 m-0 mt-1 font-medium">Creados</p>
              </div>
              <div className={[
                "rounded-xl p-5 text-center border",
                resultado.omitidos > 0
                  ? "bg-red-50 border-red-200"
                  : "bg-slate-50 border-slate-200",
              ].join(" ")}>
                <p className={["text-4xl font-bold m-0 tabular-nums", resultado.omitidos > 0 ? "text-red-600" : "text-slate-300"].join(" ")}>
                  {resultado.omitidos}
                </p>
                <p className={["text-xs m-0 mt-1 font-medium", resultado.omitidos > 0 ? "text-red-500" : "text-slate-400"].join(" ")}>
                  Omitidos
                </p>
              </div>
            </div>

            {resultado.errores.length > 0 && (
              <div className="w-full max-w-xs rounded-xl border border-red-200 bg-red-50 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-red-100">
                  <AlertCircle size={12} className="text-red-500" />
                  <span className="text-xs font-semibold text-red-700">Detalle de errores</span>
                </div>
                <div className="p-3 max-h-28 overflow-y-auto space-y-1">
                  {resultado.errores.map((err, i) => (
                    <p key={i} className="text-[11px] text-red-600 m-0">• {err}</p>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-xl py-3 text-sm font-semibold cursor-pointer shadow-sm transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(32px) translateX(-50%); opacity: 0; }
          to   { transform: translateY(0)    translateX(-50%); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default ImportarExcel;