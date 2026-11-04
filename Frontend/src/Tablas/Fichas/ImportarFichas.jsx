// Frontend/src/Tablas/Fichas/ImportarFichas.jsx
// Modal de importacion masiva de fichas desde Excel con soporte para PE-04 y plantilla institucional.
// Incluye filtro automatico para Formacion Titulada (omitiendo Cursos Especiales y Eventos),
// resolucion en memoria de programas (Id_Programa <-> Nom_Programa) y calculo automatico de fechas de 6 meses.
// Codigo comentado didacticamente sin tildes ni emojis para aprendices de primer semestre.

import { useState, useRef } from "react";
import apiAxios from "../../api/axiosConfig";
import toast from "react-hot-toast";
import {
  X, Download, Upload, CheckCircle, AlertCircle,
  FileSpreadsheet, ChevronRight, ChevronLeft, Loader2, ToggleLeft, ToggleRight, Calendar,
  Filter, HelpCircle, Search
} from "lucide-react";

/* ── Paleta de colores para el modulo de Fichas (Azul Institucional) ── */
const CL = {
  header:   "bg-gradient-to-r from-blue-700 to-indigo-700",
  badge:    "bg-blue-100 text-blue-800",
  btn:      "bg-blue-600 hover:bg-blue-700 text-white",
  btnLight: "bg-blue-50 hover:bg-blue-100 text-blue-700",
  check:    "accent-blue-600",
  step:     "bg-blue-600 text-white",
  stepIdle: "bg-slate-200 text-slate-500",
};

/* ── Indicador visual de progreso en tres pasos ── */
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
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                Activo ? CL.step : Hecho ? "bg-emerald-100 text-emerald-700" : CL.stepIdle
              }`}
            >
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

/* ── Componente Principal: Importar Fichas ── */
const ImportarFichas = ({ onClose, reload }) => {
  const [Paso, setPaso] = useState(1);
  const [Archivo, setArchivo] = useState(null);
  const [Preview, setPreview] = useState([]);
  const [Seleccion, setSeleccion] = useState([]);
  const [Cargando, setCargando] = useState(false);
  const [Resultado, setResultado] = useState(null);
  const [Error, setError] = useState("");
  
  // Filtro inteligente para omitir Cursos Especiales y Eventos (activo por defecto segun directiva)
  const [soloTitulada, setSoloTitulada] = useState(true);

  // Paginación y búsqueda rápida en cliente
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const filasPorPagina = 50;

  const InputRef = useRef(null);

  // Descarga la plantilla oficial en formato .xlsx
  const DescargarPlantilla = async () => {
    try {
      setCargando(true);
      const Resp = await apiAxios.get("/api/fichas/plantilla-excel", { responseType: "blob" });
      const Url  = URL.createObjectURL(new Blob([Resp.data]));
      const Link = document.createElement("a");
      Link.href     = Url;
      Link.download = "Plantilla_Fichas_Foodsys.xlsx";
      document.body.appendChild(Link);
      Link.click();
      setTimeout(() => {
        document.body.removeChild(Link);
        URL.revokeObjectURL(Url);
      }, 1500);
      toast.success("Plantilla de fichas descargada correctamente");
    } catch {
      setError("No se pudo descargar la plantilla. Verifica la conexion con el servidor.");
      toast.error("No se pudo descargar la plantilla");
    } finally {
      setCargando(false);
    }
  };

  // Captura el archivo seleccionado por el usuario
  const AlSeleccionarArchivo = (Ev) => {
    const File = Ev.target.files?.[0];
    if (!File) return;
    setArchivo(File);
    setError("");
  };

  // Envia el archivo Excel al backend para procesar en memoria RAM y recibir vista previa
  const ObtenerPreview = async () => {
    if (!Archivo) {
      setError("Selecciona un archivo Excel primero.");
      return;
    }
    try {
      setCargando(true);
      setError("");
      const Form = new FormData();
      Form.append("file", Archivo);
      Form.append("soloTitulada", soloTitulada);

      const Resp = await apiAxios.post("/api/fichas/preview-import", Form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const Datos = Resp.data.data || [];
      if (Datos.length === 0) {
        setError("No se encontraron fichas validas en el archivo seleccionado.");
        return;
      }
      setPreview(Datos);
      // Solo preseleccionar las fichas cuyo programa SI existe en el sistema
      const validos = Datos.map((d, Idx) => d.programaValido !== false ? Idx : null).filter(x => x !== null);
      setSeleccion(validos);
      setPagina(1);
      setBusqueda("");
      setPaso(2);
      if (Resp.data.invalidasSinPrograma > 0) {
        toast.error(`${Resp.data.invalidasSinPrograma} fichas tienen programas no registrados y no se podrán subir.`, { duration: 5000 });
      } else {
        toast.success(`Se detectaron ${Datos.length} fichas listas para importar.`);
      }
    } catch (Err) {
      setError(Err.response?.data?.message || "Error al leer el archivo. Asegurate de que tenga formato .xlsx o .xlsm valido.");
    } finally {
      setCargando(false);
    }
  };

  // Alterna seleccion de una fila especifica
  const ToggleFila = (Idx) =>
    setSeleccion((Prev) =>
      Prev.includes(Idx) ? Prev.filter((I) => I !== Idx) : [...Prev, Idx]
    );

  // Selecciona o deselecciona todas las filas validas
  const ToggleTodos = () => {
    const indicesValidos = Preview.map((d, i) => d.programaValido !== false ? i : null).filter(x => x !== null);
    setSeleccion((Prev) => (Prev.length === indicesValidos.length ? [] : indicesValidos));
  };

  // Confirma e inserta las filas seleccionadas en la base de datos MySQL
  const ConfirmarImportacion = async () => {
    if (!Seleccion.length) {
      setError("Selecciona al menos una ficha para importar.");
      toast.error("Selecciona al menos una ficha.");
      return;
    }
    try {
      setCargando(true);
      setError("");
      const FichasSeleccionadas = Seleccion.map((Idx) => Preview[Idx]);
      const Resp = await apiAxios.post("/api/fichas/importar-seleccionadas", {
        fichas: FichasSeleccionadas,
      });
      setResultado(Resp.data);
      setPaso(3);
      toast.success("Importacion de fichas completada con exito");
      reload?.();
    } catch (Err) {
      const msg = Err.response?.data?.message || "Error al importar fichas. Intenta de nuevo.";
      setError(msg);
      toast.error(msg);
    } finally {
      setCargando(false);
    }
  };

  // Reinicia el flujo de importacion
  const Reiniciar = () => {
    setPaso(1);
    setArchivo(null);
    setPreview([]);
    setSeleccion([]);
    setResultado(null);
    setError("");
    if (InputRef.current) InputRef.current.value = "";
  };

  // Formato de fechas
  const FormatearFecha = (Valor) => {
    if (!Valor) return "—";
    const D = new Date(Valor);
    return isNaN(D) ? String(Valor) : D.toLocaleDateString("es-CO");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden z-10 animate-in fade-in">
        {/* Cabecera */}
        <div className={`${CL.header} px-6 py-4 flex items-center justify-between shrink-0 text-white`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <FileSpreadsheet size={20} className="text-white" />
            </div>
            <div>
              <p className="text-[11px] text-blue-100 font-bold m-0 uppercase tracking-wide">Importacion Masiva</p>
              <h2 className="text-white font-bold text-sm sm:text-base m-0">Fichas desde Excel / PE-04</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 border-0 cursor-pointer text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Indicador de pasos */}
        <PasoIndicador PasoActual={Paso} />

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* PASO 1: DESCARGA Y SUBIDA */}
          {Paso === 1 && (
            <div className="flex flex-col gap-5">
              {/* Plantilla Oficial */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="font-bold text-slate-800 text-sm mb-1">
                  Paso 1 — Descarga la plantilla oficial o usa el reporte PE-04
                </p>
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  El sistema detecta automaticamente si subes la plantilla de Foodsys o el archivo institucional <strong>PE-04_1.xlsx</strong>.
                  Si no especificas el ID del programa, el sistema busca el nombre y lo vincula o lo crea automaticamente.
                </p>
                <button
                  onClick={DescargarPlantilla}
                  disabled={Cargando}
                  className={`flex items-center gap-2 ${CL.btnLight} border border-blue-200 rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer transition-colors disabled:opacity-50`}
                >
                  {Cargando ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                  Descargar Plantilla Oficial .xlsx
                </button>
              </div>

              {/* Checkbox inteligente para Titulada */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="chkSoloTitulada"
                  checked={soloTitulada}
                  onChange={(e) => setSoloTitulada(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-blue-600 cursor-pointer shrink-0"
                />
                <label htmlFor="chkSoloTitulada" className="text-xs text-slate-700 cursor-pointer">
                  <strong>Importar solo Formacion Titulada (Tecnologo, Tecnico, Operario, Auxiliar)</strong>
                  <p className="text-[11px] text-slate-500 m-0 mt-0.5">
                    Omitira automaticamente los miles de registros correspondientes a Cursos Especiales y Eventos del PE-04.
                  </p>
                </label>
              </div>

              {/* Zona de Arrastre de Archivo */}
              <div>
                <p className="font-bold text-slate-800 text-sm mb-2">
                  Paso 2 — Sube tu archivo Excel (.xlsx o .xlsm)
                </p>
                <label
                  htmlFor="InputFicha"
                  className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-blue-300 rounded-2xl py-8 px-4 cursor-pointer bg-blue-50/40 hover:bg-blue-50 transition-colors"
                >
                  <Upload size={32} className="text-blue-500" />
                  <p className="text-sm font-bold text-slate-700 m-0 text-center">
                    {Archivo ? Archivo.name : "Haz clic aquí o arrastra tu archivo Excel"}
                  </p>
                  <p className="text-xs text-slate-400 m-0">Formatos soportados: .xlsx, .xlsm, .xls</p>
                  <input
                    id="InputFicha"
                    ref={InputRef}
                    type="file"
                    accept=".xlsx, .xlsm, .xls"
                    className="hidden"
                    onChange={AlSeleccionarArchivo}
                  />
                </label>
              </div>

              {Error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 m-0">{Error}</p>
                </div>
              )}

              <button
                onClick={ObtenerPreview}
                disabled={!Archivo || Cargando}
                className={`flex items-center justify-center gap-2 ${CL.btn} rounded-xl py-3 text-xs sm:text-sm font-bold cursor-pointer transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {Cargando ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                Ver Vista Previa y Validar Datos
              </button>
            </div>
          )}

          {/* PASO 2: VISTA PREVIA Y SELECCION */}
          {Paso === 2 && (() => {
            const previewFiltrado = Preview.map((item, originalIdx) => ({ item, originalIdx })).filter(({ item }) => {
              if (!busqueda) return true;
              const q = busqueda.toLowerCase().trim();
              return (
                String(item.Num_Ficha || "").includes(q) ||
                String(item.Nom_Programa || "").toLowerCase().includes(q) ||
                String(item.Estado_Curso || "").toLowerCase().includes(q) ||
                String(item.Nivel_Formacion || "").toLowerCase().includes(q)
              );
            });

            const totalPaginas = Math.ceil(previewFiltrado.length / filasPorPagina) || 1;
            const paginaSegura = Math.min(pagina, totalPaginas);
            const itemsPaginados = previewFiltrado.slice(
              (paginaSegura - 1) * filasPorPagina,
              paginaSegura * filasPorPagina
            );

            return (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-bold text-slate-800 text-sm m-0">Revisa las fichas procesadas</p>
                    <p className="text-xs text-slate-500 m-0">
                      {Seleccion.length} de {Preview.length} seleccionadas para guardar
                    </p>
                  </div>
                  <button
                    onClick={ToggleTodos}
                    className={`flex items-center gap-1.5 ${CL.btnLight} rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer transition-colors`}
                  >
                    {Seleccion.length === Preview.length ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    {Seleccion.length === Preview.length ? "Deseleccionar todo" : "Seleccionar todo"}
                  </button>
                </div>

                {/* Busqueda rapida */}
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por ficha, programa o estado..."
                    value={busqueda}
                    onChange={(e) => {
                      setBusqueda(e.target.value);
                      setPagina(1);
                    }}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Lista paginada */}
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                  {itemsPaginados.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-6">No se encontraron fichas coincidentes con "{busqueda}".</p>
                  ) : (
                    itemsPaginados.map(({ item: Fila, originalIdx }) => {
                      const esValido = Fila.programaValido !== false;
                      const Marcado = Seleccion.includes(originalIdx);
                      return (
                        <label
                          key={originalIdx}
                          className={`flex items-start gap-3 p-2.5 rounded-xl border transition-colors ${
                            !esValido
                              ? "bg-red-50/70 border-red-200 cursor-not-allowed opacity-90"
                              : Marcado
                                ? "bg-blue-50/70 border-blue-200 cursor-pointer"
                                : "bg-slate-50 border-slate-200 opacity-60 cursor-pointer"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className={`mt-1 w-4 h-4 ${CL.check} shrink-0`}
                            checked={Marcado}
                            disabled={!esValido}
                            onChange={() => esValido && ToggleFila(originalIdx)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-blue-800 text-xs sm:text-sm">
                                Ficha #{Fila.Num_Ficha || <span className="text-red-500 italic">Sin numero</span>}
                              </span>
                              {Fila.Nom_Programa && (
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded truncate max-w-[240px] border ${
                                  esValido
                                    ? "bg-white text-slate-700 border-slate-200"
                                    : "bg-red-100 text-red-800 border-red-300"
                                }`} title={Fila.Nom_Programa}>
                                  {Fila.Nom_Programa}
                                </span>
                              )}
                              {esValido ? (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                  Programa registrado
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                                  Programa no existe
                                </span>
                              )}
                              {Fila.Nivel_Formacion && (
                                <span className="text-[10px] font-medium text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                                  {Fila.Nivel_Formacion}
                                </span>
                              )}
                            </div>

                            {!esValido && Fila.errorPrograma && (
                              <p className="text-[11px] text-red-600 font-semibold m-0 mt-1">
                                {Fila.errorPrograma}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar size={11} className="text-slate-400" /> Lectiva: {FormatearFecha(Fila.FecIniLec_Ficha)} – {FormatearFecha(Fila.FecFinLec_Ficha)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={11} className="text-slate-400" /> Practica: {FormatearFecha(Fila.FecIniPra_Ficha)} – {FormatearFecha(Fila.FecFinPra_Ficha)}
                              </span>
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>

                {/* Paginador */}
                {totalPaginas > 1 && (
                  <div className="flex items-center justify-between px-1 py-1 text-xs text-slate-500 border-t border-slate-100">
                    <span>
                      Pág. {paginaSegura} de {totalPaginas} ({previewFiltrado.length} fichas)
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={paginaSegura <= 1}
                        onClick={() => setPagina((p) => Math.max(1, p - 1))}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium text-[11px]"
                      >
                        <ChevronLeft size={12} /> Anterior
                      </button>
                      <button
                        type="button"
                        disabled={paginaSegura >= totalPaginas}
                        onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium text-[11px]"
                      >
                        Siguiente <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                )}

                {Error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 m-0">{Error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={Reiniciar}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-2.5 text-xs font-bold cursor-pointer transition-colors border-0"
                  >
                    Volver a cargar
                  </button>
                  <button
                    onClick={ConfirmarImportacion}
                    disabled={!Seleccion.length || Cargando}
                    className={`flex-1 flex items-center justify-center gap-2 ${CL.btn} rounded-xl py-2.5 text-xs font-bold cursor-pointer transition-colors border-0 disabled:opacity-50`}
                  >
                    {Cargando ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    Importar {Seleccion.length} Ficha{Seleccion.length !== 1 ? "s" : ""}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* PASO 3: RESULTADO FINAL */}
          {Paso === 3 && Resultado && (
            <div className="flex flex-col gap-4 text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle size={30} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base m-0">¡Importacion Finalizada!</h3>
                <p className="text-xs text-slate-500 m-0 mt-1">Los datos han sido sincronizados con la base de datos MySQL.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 my-2">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <p className="text-3xl font-black text-emerald-700 m-0">{Resultado.creados ?? 0}</p>
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide m-0 mt-1">Fichas Procesadas</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <p className="text-3xl font-black text-amber-700 m-0">{Resultado.omitidos ?? 0}</p>
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-wide m-0 mt-1">Omitidas</p>
                </div>
              </div>

              {Resultado.errores?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-left">
                  <p className="font-bold text-red-800 text-xs uppercase mb-2">Detalles:</p>
                  <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto m-0 pl-4 list-disc">
                    {Resultado.errores.map((Err, Idx) => (
                      <li key={Idx}>{Err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 mt-3">
                <button
                  onClick={Reiniciar}
                  className={`flex-1 ${CL.btnLight} border border-blue-200 rounded-xl py-2.5 text-xs font-bold cursor-pointer transition-colors`}
                >
                  Importar mas fichas
                </button>
                <button
                  onClick={onClose}
                  className={`flex-1 ${CL.btn} rounded-xl py-2.5 text-xs font-bold cursor-pointer transition-colors border-0`}
                >
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