// Frontend/src/Tablas/Usuarios/ModalImportarInstructores.jsx
// Modal especializado para importar masivamente instructores desde Excel
// Asigna automaticamente el rol 'Instructor' y el estado 'Instructor' a cada registro

import { useState } from "react";
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Award } from "lucide-react";
import apiAxios from "../../api/axiosConfig";
import FoodsysToast from "../../Components/UI/FoodsysToast";

export default function ModalImportarInstructores({ isOpen, onClose, onImportSuccess }) {
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleDescargarPlantilla = async () => {
    try {
      const response = await apiAxios.get("/api/Usuarios/plantilla-instructores", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Plantilla_Instructores_Foodsys.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      FoodsysToast.success("Plantilla descargada correctamente");
    } catch (err) {
      FoodsysToast.error("Error al descargar la plantilla de instructores");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
      setErrorMsg("");
      setResultado(null);
    }
  };

  const handleSubirArchivo = async (e) => {
    e.preventDefault();
    if (!archivo) {
      setErrorMsg("Por favor selecciona un archivo Excel (.xlsx)");
      return;
    }

    const formData = new FormData();
    formData.append("file", archivo);

    setCargando(true);
    setErrorMsg("");
    setResultado(null);

    try {
      const res = await apiAxios.post("/api/Usuarios/importar-instructores", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResultado(res.data);
      FoodsysToast.success(res.data.message || "Instructores importados con exito");
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Error al importar instructores";
      setErrorMsg(msg);
      FoodsysToast.error(msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Award size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Importar Instructores (Excel)</h2>
              <p className="text-xs text-slate-500">Asigna automaticamente el rol y estado de Instructor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Tarjeta de descarga de plantilla */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-blue-900 text-xs">Descargar formato oficial</p>
              <p className="text-xs text-blue-700 mt-0.5">
                Usa la plantilla con las columnas: TipDoc, NumDoc, Nombres, Apellidos, Correo, Telefono y Ficha.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDescargarPlantilla}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 py-2 text-xs font-semibold shrink-0 transition shadow-sm"
            >
              <Download size={14} /> Plantilla
            </button>
          </div>

          {/* Formulario de carga */}
          <form onSubmit={handleSubirArchivo} className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-blue-50/20 transition cursor-pointer relative">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FileSpreadsheet className="w-10 h-10 text-blue-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-800 text-sm">
                {archivo ? archivo.name : "Seleccionar o arrastrar archivo Excel (.xlsx)"}
              </p>
              <p className="text-xs text-slate-400 mt-1">Haz clic aqui para buscar en tu equipo</p>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-3 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {resultado && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 space-y-1 text-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <CheckCircle2 size={16} />
                  <span>{resultado.message}</span>
                </div>
                <div className="flex gap-4 pt-1 text-slate-600 font-medium">
                  <span>Creados: <strong>{resultado.creados}</strong></span>
                  <span>Actualizados: <strong>{resultado.actualizados}</strong></span>
                  <span>Omitidos: <strong>{resultado.omitidos}</strong></span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={cargando || !archivo}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition disabled:opacity-50 shadow-sm"
              >
                {cargando ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Procesando...
                  </>
                ) : (
                  <>
                    <Upload size={14} /> Subir e Importar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
