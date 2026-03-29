// Frontend/src/Components/CargaCSV.jsx
import { useState, useRef } from "react";
import apiAxios from "../api/axiosConfig";
import {
  Upload, FileText, CheckCircle, XCircle,
  AlertCircle, Download,
} from "lucide-react";

/**
 * Botón + modal para cargar un CSV de aprendices.
 * Llama a POST /api/Usuarios/importar-csv
 *
 * Props:
 *  - onImportado(): callback opcional cuando se importa con éxito
 */
const CargaCSV = ({ onImportado }) => {
  const [open,       setOpen]       = useState(false);
  const [archivo,    setArchivo]    = useState(null);
  const [cargando,   setCargando]   = useState(false);
  const [resultado,  setResultado]  = useState(null);
  const inputRef = useRef(null);

  const handleArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Solo se permiten archivos .csv");
      return;
    }
    setArchivo(file);
    setResultado(null);
  };

  const handleImportar = async () => {
    if (!archivo) return alert("Selecciona un archivo CSV primero.");
    setCargando(true);
    setResultado(null);
    try {
      const formData = new FormData();
      formData.append("archivo", archivo);

      const res = await apiAxios.post("/api/Usuarios/importar-csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResultado({ exito: true, ...res.data });
      setArchivo(null);
      if (inputRef.current) inputRef.current.value = "";
      onImportado?.();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Error al importar";
      setResultado({ exito: false, message: msg, creados: 0, omitidos: 0, errores: [] });
    } finally {
      setCargando(false);
    }
  };

  /* Descargar plantilla CSV de ejemplo */
  const descargarPlantilla = () => {
    const headers = [
      "TipDoc_Usuario", "NumDoc_Usuario", "Nom_Usuario", "Ape_Usuario",
      "Gen_Usuario", "Cor_Usuario", "Tel_Usuario", "CenCon_Usuario",
      "Est_Usuario", "San_Usuario", "Id_Ficha",
    ].join(",");
    const ejemplo = [
      "CC,1234567890,Juan,Pérez,M,juan@sena.edu.co,3001234567,No,En Formacion,No,1",
      "CC,9876543210,María,García,F,maria@sena.edu.co,3109876543,Sí,En Formacion,No,2",
    ].join("\n");

    const blob = new Blob([`${headers}\n${ejemplo}`], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "Plantilla_Aprendices.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* ── Botón de apertura ── */}
      <button
        onClick={() => { setOpen(true); setResultado(null); }}
        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-violet-200"
      >
        <Upload className="w-4 h-4" />
        <span>Cargar CSV</span>
      </button>

      {/* ── Modal ── */}
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="bg-white rounded-3xl shadow-2xl z-10 w-full max-w-md p-6 space-y-5">

            {/* Cabecera */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-violet-600" />
                Importar Aprendices CSV
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              >✕</button>
            </div>

            {/* Zona de carga */}
            <div
              className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleArchivo}
              />
              {archivo ? (
                <div className="flex items-center justify-center gap-2 text-violet-700">
                  <FileText className="w-6 h-6" />
                  <span className="font-medium text-sm">{archivo.name}</span>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Haz clic para seleccionar el archivo <strong>.csv</strong></p>
                  <p className="text-xs text-gray-400 mt-1">Solo archivos CSV con los campos requeridos</p>
                </>
              )}
            </div>

            {/* Resultado */}
            {resultado && (
              <div className={`rounded-2xl p-4 border ${
                resultado.exito
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-red-50 border-red-200"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {resultado.exito
                    ? <CheckCircle className="w-5 h-5 text-emerald-600" />
                    : <XCircle    className="w-5 h-5 text-red-600" />
                  }
                  <p className={`font-semibold text-sm ${resultado.exito ? "text-emerald-800" : "text-red-800"}`}>
                    {resultado.exito ? "Importación completada" : "Error en la importación"}
                  </p>
                </div>
                <p className="text-sm text-gray-700">{resultado.message}</p>
                {resultado.exito && (
                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="text-emerald-700 font-medium">✓ Creados: {resultado.creados}</span>
                    <span className="text-amber-700 font-medium">↩ Omitidos: {resultado.omitidos}</span>
                  </div>
                )}
                {resultado.errores?.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                      Ver {resultado.errores.length} advertencia(s)
                    </summary>
                    <ul className="mt-1 space-y-1 max-h-28 overflow-y-auto">
                      {resultado.errores.map((e, i) => (
                        <li key={i} className="flex items-start gap-1 text-xs text-amber-700">
                          <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}

            {/* Botones */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleImportar}
                disabled={!archivo || cargando}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                {cargando
                  ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Importando...</>
                  : <><Upload className="w-4 h-4" /> Importar aprendices</>
                }
              </button>

              <button
                onClick={descargarPlantilla}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar plantilla CSV de ejemplo
              </button>
            </div>

            {/* Info de columnas */}
            <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1">
              <p className="font-semibold text-gray-600 mb-1">Columnas requeridas en el CSV:</p>
              <p className="font-mono bg-white rounded p-2 text-[11px] leading-relaxed border border-gray-100">
                TipDoc_Usuario, NumDoc_Usuario, Nom_Usuario, Ape_Usuario,<br />
                Gen_Usuario, Cor_Usuario, Tel_Usuario, CenCon_Usuario,<br />
                Est_Usuario, San_Usuario, Id_Ficha
              </p>
              <p className="text-gray-400 mt-1">
                La contraseña inicial será el número de documento del aprendiz.
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default CargaCSV;