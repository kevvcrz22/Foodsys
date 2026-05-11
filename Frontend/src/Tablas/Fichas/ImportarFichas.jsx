// Frontend/src/Tablas/Fichas/ImportarFichas.jsx
// Modal de importacion masiva de fichas desde Excel.
// Flujo de tres pasos identico al de ImportarProgramas pero
// adaptado al modelo FichasModel con sus seis campos.
//   Paso 1 — Descargar la plantilla .xlsx vacia.
//   Paso 2 — Subir el archivo y obtener preview.
//   Paso 3 — Confirmar las filas seleccionadas.
// Toda la validacion (campos, FK de programa, duplicados) ocurre en Node.

import { useState, useRef } from "react";
import apiAxios from "../../api/axiosConfig";
import {
  X, Download, Upload, CheckCircle, AlertCircle,
  FileSpreadsheet, ChevronRight, Loader2, ToggleLeft, ToggleRight, Calendar,
} from "lucide-react";

/* ── Paleta del modulo de Fichas (azul slate) ── */
const CL = {
  header:   "bg-gradient-to-r from-blue-600 to-blue-500",
  badge:    "bg-blue-100 text-blue-700",
  btn:      "bg-blue-600 hover:bg-blue-700 text-white",
  btnLight: "bg-blue-50 hover:bg-blue-100 text-blue-700",
  check:    "accent-blue-600",
  step:     "bg-blue-600 text-white",
  stepIdle: "bg-slate-200 text-slate-500",
};

/* ─────────────────────────────────────────────
   Indicador visual de pasos en la cabecera
───────────────────────────────────────────── */
const PasoIndicador = ({ PasoActual }) => {
  const Pasos = ["Plantilla", "Vista previa", "Confirmar"];
  return (
    <div className="flex items-center justify-center gap-2 py-3 px-5 border-b border-slate-100 bg-slate-50">
      {Pasos.map((Nombre, Idx) => {
        const Num    = Idx + 1;
        const Activo = PasoActual === Num;
        const Hecho  = PasoActual  >  Num;
        return (
          <div key={Nombre} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${Activo ? CL.step : Hecho ? "bg-emerald-100 text-emerald-700" : CL.stepIdle}`}>
              {Hecho ? <CheckCircle size={11} /> : <span>{Num}</span>}
              <span className="hidden sm:inline">{Nombre}</span>
            </div>
            {Idx < 2 && <ChevronRight size={12} className="text-slate-300 shrink-0" />}
          </div>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────
   ImportarFichas — componente principal
   Props:
     onClose : cierra el modal desde el padre
     reload  : refresca la tabla de fichas
───────────────────────────────────────────── */
const ImportarFichas = ({ onClose, reload }) => {
  const [Paso,      setPaso]      = useState(1);
  const [Archivo,   setArchivo]   = useState(null);
  const [Preview,   setPreview]   = useState([]);
  const [Seleccion, setSeleccion] = useState([]);
  const [Cargando,  setCargando]  = useState(false);
  const [Resultado, setResultado] = useState(null);
  const [Error,     setError]     = useState("");
  const InputRef = useRef(null);

  // ── Descarga la plantilla de fichas desde el backend ──
  /*
    La plantilla contiene los seis encabezados del modelo:
    Num_Ficha, FecIniLec_Ficha, FecFinLec_Ficha,
    FecIniPra_Ficha, FecFinPra_Ficha, Id_Programa.
    Las fechas deben ingresarse en formato YYYY-MM-DD.
  */
  const DescargarPlantilla = async () => {
    try {
      setCargando(true);
      const Resp = await apiAxios.get("/api/fichas/plantilla-excel", { responseType: "blob" });
      const Url  = URL.createObjectURL(new Blob([Resp.data]));
      const Link = document.createElement("a");
      Link.href     = Url;
      Link.download = "plantilla_fichas.xlsx";
      Link.click();
      URL.revokeObjectURL(Url);
    } catch {
      setError("No se pudo descargar la plantilla. Verifica la conexion con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  // ── Captura el archivo seleccionado por el usuario ──
  const AlSeleccionarArchivo = (Ev) => {
    const File = Ev.target.files?.[0];
    if (!File) return;
    setArchivo(File);
    setError("");
  };

  // ── Envia el archivo al backend y recibe el preview ──
  /*
    El backend lee el buffer en RAM, parsea el Excel,
    limpia los encabezados y devuelve el array de objetos.
    Los campos coinciden exactamente con las columnas de la plantilla.
    Nada se escribe en la BD en este paso.
  */
  const ObtenerPreview = async () => {
    if (!Archivo) { setError("Selecciona un archivo primero."); return; }
    try {
      setCargando(true);
      setError("");
      const Form = new FormData();
      Form.append("file", Archivo);
      const Resp = await apiAxios.post("/api/fichas/preview-import", Form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const Datos = Resp.data.data || [];
      setPreview(Datos);
      setSeleccion(Datos.map((_, Idx) => Idx));
      setPaso(2);
    } catch (Err) {
      setError(Err.response?.data?.message || "Error al leer el archivo. Usa la plantilla oficial.");
    } finally {
      setCargando(false);
    }
  };

  // ── Alterna seleccion de una fila ──
  const ToggleFila = (Idx) =>
    setSeleccion((Prev) =>
      Prev.includes(Idx) ? Prev.filter((I) => I !== Idx) : [...Prev, Idx]
    );

  // ── Selecciona o deselecciona todas ──
  const ToggleTodos = () =>
    setSeleccion(Seleccion.length === Preview.length ? [] : Preview.map((_, I) => I));

  // ── Envia las filas aprobadas al backend para persistirlas ──
  /*
    El backend por cada fila:
      1. Valida Num_Ficha e Id_Programa obligatorios.
      2. Verifica que el Id_Programa exista en la tabla programas.
      3. Verifica que Num_Ficha no este duplicada.
      4. Crea el registro si pasa todas las validaciones.
    Responde { creados, omitidos, errores }.
  */
  const ConfirmarImportacion = async () => {
    if (!Seleccion.length) { setError("Selecciona al menos una ficha."); return; }
    try {
      setCargando(true);
      setError("");
      const FichasSeleccionadas = Seleccion.map((Idx) => Preview[Idx]);
      const Resp = await apiAxios.post("/api/fichas/importar-seleccionadas", {
        fichas: FichasSeleccionadas,
      });
      setResultado(Resp.data);
      setPaso(3);
      reload?.();
    } catch (Err) {
      setError(Err.response?.data?.message || "Error al importar. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  // ── Reinicia el flujo sin cerrar el modal ──
  const Reiniciar = () => {
    setPaso(1); setArchivo(null); setPreview([]);
    setSeleccion([]); setResultado(null); setError("");
    if (InputRef.current) InputRef.current.value = "";
  };

  // Formatea fechas ISO a formato legible es-CO para la tabla de preview
  const FormatearFecha = (Valor) => {
    if (!Valor) return "—";
    const D = new Date(Valor);
    return isNaN(D) ? String(Valor) : D.toLocaleDateString("es-CO");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden z-10">

        {/* ── Cabecera ── */}
        <div className={`${CL.header} px-5 py-4 flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <FileSpreadsheet size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-blue-100 font-semibold m-0 uppercase tracking-wide">Importacion masiva</p>
              <p className="text-white font-bold text-sm m-0">Fichas desde Excel</p>
            </div>
          </div>
          <button onClick={onClose}
            className="bg-white/20 border-0 rounded-xl p-2 cursor-pointer text-white flex items-center hover:bg-white/30 transition-colors">
            <X size={16} />
          </button>
        </div>

        <PasoIndicador PasoActual={Paso} />

        <div className="flex-1 overflow-y-auto px-5 py-5">

          {/* ══ PASO 1 ══ */}
          {Paso === 1 && (
            <div className="flex flex-col gap-5">

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="font-semibold text-slate-800 text-sm mb-1">
                  Paso 1 — Descarga la plantilla oficial
                </p>
                <p className="text-[12px] text-slate-500 mb-3 leading-relaxed">
                  La plantilla incluye los campos:
                  <strong> Num_Ficha</strong>, fechas de fases lectiva y practica, y
                  <strong> Id_Programa</strong> (debe existir en el sistema).
                  Las fechas van en formato <strong>YYYY-MM-DD</strong>.
                </p>
                <button onClick={DescargarPlantilla} disabled={Cargando}
                  className={`flex items-center gap-2 ${CL.btnLight} border-0 rounded-xl px-4 py-2.5 text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50`}>
                  {Cargando ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                  Descargar plantilla .xlsx
                </button>
              </div>

              <div>
                <p className="font-semibold text-slate-800 text-sm mb-2">
                  Paso 2 — Sube el archivo completado
                </p>
                <label htmlFor="InputFicha"
                  className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-blue-200 rounded-2xl py-8 px-4 cursor-pointer bg-blue-50/50 hover:bg-blue-50 transition-colors">
                  <Upload size={28} className="text-blue-300" />
                  <p className="text-sm font-semibold text-slate-600">
                    {Archivo ? Archivo.name : "Haz clic o arrastra el archivo aqui"}
                  </p>
                  <p className="text-[11px] text-slate-400">Solo archivos .xlsx</p>
                  <input id="InputFicha" ref={InputRef} type="file" accept=".xlsx"
                    className="hidden" onChange={AlSeleccionarArchivo} />
                </label>
              </div>

              {Error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-red-700 m-0">{Error}</p>
                </div>
              )}

              <button onClick={ObtenerPreview} disabled={!Archivo || Cargando}
                className={`flex items-center justify-center gap-2 ${CL.btn} border-0 rounded-xl py-3 text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}>
                {Cargando ? <Loader2 size={15} className="animate-spin" /> : <ChevronRight size={15} />}
                Vista previa de datos
              </button>
            </div>
          )}

          {/* ══ PASO 2: Preview con checkboxes ══ */}
          {Paso === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-semibold text-slate-800 text-sm m-0">Revisa y selecciona las fichas</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {Seleccion.length} de {Preview.length} seleccionadas
                  </p>
                </div>
                <button onClick={ToggleTodos}
                  className={`flex items-center gap-1.5 ${CL.btnLight} border-0 rounded-xl px-3 py-2 text-[12px] font-semibold cursor-pointer transition-colors`}>
                  {Seleccion.length === Preview.length ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  {Seleccion.length === Preview.length ? "Deseleccionar todo" : "Seleccionar todo"}
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                {Preview.map((Fila, Idx) => {
                  const Marcado = Seleccion.includes(Idx);
                  return (
                    <label key={Idx}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${Marcado ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-100 opacity-60"}`}>
                      <input type="checkbox" className={`mt-0.5 w-4 h-4 ${CL.check} shrink-0`}
                        checked={Marcado} onChange={() => ToggleFila(Idx)} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-blue-700 text-sm m-0">
                          Ficha #{Fila.Num_Ficha || <span className="text-red-400 italic">Sin numero</span>}
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar size={10} /> Lect: {FormatearFecha(Fila.FecIniLec_Ficha)} – {FormatearFecha(Fila.FecFinLec_Ficha)}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar size={10} /> Prac: {FormatearFecha(Fila.FecIniPra_Ficha)} – {FormatearFecha(Fila.FecFinPra_Ficha)}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            Programa ID: {Fila.Id_Programa || "—"}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {Error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-red-700 m-0">{Error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={Reiniciar}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border-0 rounded-xl py-3 text-sm font-semibold cursor-pointer transition-colors">
                  Volver
                </button>
                <button onClick={ConfirmarImportacion} disabled={!Seleccion.length || Cargando}
                  className={`flex-1 flex items-center justify-center gap-2 ${CL.btn} border-0 rounded-xl py-3 text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}>
                  {Cargando ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                  Importar {Seleccion.length} ficha{Seleccion.length !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
          )}

          {/* ══ PASO 3: Resultado ══ */}
          {Paso === 3 && Resultado && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center py-4 gap-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle size={28} className="text-emerald-600" />
                </div>
                <p className="font-bold text-slate-800 text-base m-0">Importacion completada</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-extrabold text-emerald-700 m-0">{Resultado.creados}</p>
                  <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide mt-1 m-0">Creadas</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-extrabold text-amber-700 m-0">{Resultado.omitidos}</p>
                  <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide mt-1 m-0">Omitidas</p>
                </div>
              </div>

              {Resultado.errores?.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                  <p className="font-semibold text-red-700 text-[12px] uppercase mb-2">Detalle de omisiones</p>
                  <ul className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                    {Resultado.errores.map((Err, Idx) => (
                      <li key={Idx} className="text-[11px] text-red-600 flex items-start gap-1.5">
                        <AlertCircle size={11} className="shrink-0 mt-0.5" /> {Err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={Reiniciar}
                  className={`flex-1 ${CL.btnLight} border-0 rounded-xl py-3 text-sm font-semibold cursor-pointer transition-colors`}>
                  Importar mas
                </button>
                <button onClick={onClose}
                  className={`flex-1 ${CL.btn} border-0 rounded-xl py-3 text-sm font-semibold cursor-pointer transition-colors`}>
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportarFichas;