// Paginas/Novedades/PanelEstadoEspecial.jsx
//
// Panel de gestion del estado Especial para aprendices y pasantes externos.
// Solo el Coordinador accede a esta vista.
//
// Que hace este componente:
//   1. Muestra la lista de aprendices externos con su estado actual (Est_Usuario).
//   2. Permite seleccionar uno o varios para asignarles el estado Especial.
//   3. Permite quitar/revocar el estado Especial individualmente o de forma grupal.
//   4. Permite importar un archivo Excel con IDs o documentos para asignacion masiva.

import { useState, useRef } from "react";
import apiAxios from "../../api/axiosConfig";
import toast from "react-hot-toast";
import { Star, X, FileSpreadsheet, Upload, Users, Sparkles, AlertCircle } from "lucide-react";

// Roles que califican para recibir el estado Especial.
const ROLES_EXTERNOS = ["Aprendiz Externo", "Pasante Externo"];

const PanelEstadoEspecial = ({ Usuarios = [], onRecargar }) => {
  // Array de IDs de los aprendices seleccionados mediante checkbox
  const [Seleccionados, Set_Seleccionados] = useState([]);

  // Archivo Excel seleccionado para la importacion masiva
  const [Archivo, Set_Archivo] = useState(null);

  // Estado de carga de acciones
  const [Cargando_Asignar, Set_Cargando_Asignar] = useState(false);
  const [Cargando_Revocar, Set_Cargando_Revocar] = useState(false);
  const [Cargando_Excel, Set_Cargando_Excel] = useState(false);

  // Filtro interno para ver "Todos", "Especiales" o "Elegibles"
  const [FiltroTab, Set_FiltroTab] = useState("todos");

  // Resultado devuelto por el backend tras asignar o importar
  const [Resultado, Set_Resultado] = useState(null);

  // Mensaje de error general si la peticion falla completamente
  const [Error_Msg, Set_Error_Msg] = useState(null);

  const Ref_Archivo = useRef(null);

  // Filtra la lista de usuarios para mostrar solo los externos
  const Aprendices_Externos = Usuarios.filter((U) =>
    U.roles?.some((R) => ROLES_EXTERNOS.includes(R))
  );

  const Aprendices_Filtrados = Aprendices_Externos.filter((U) => {
    if (FiltroTab === "especiales") return U.Est_Usuario === "Especial";
    if (FiltroTab === "elegibles") return U.Est_Usuario !== "Especial";
    return true;
  });

  const Cant_Especiales = Aprendices_Externos.filter((U) => U.Est_Usuario === "Especial").length;
  const Cant_Elegibles = Aprendices_Externos.filter((U) => U.Est_Usuario !== "Especial").length;

  const Manejar_Seleccion = (Id_Usuario) => {
    Set_Seleccionados((Prev) =>
      Prev.includes(Id_Usuario)
        ? Prev.filter((Id) => Id !== Id_Usuario)
        : [...Prev, Id_Usuario]
    );
  };

  const Seleccionar_Todos_Elegibles = () => {
    const Ids_Elegibles = Aprendices_Externos
      .filter((U) => U.Est_Usuario !== "Especial")
      .map((U) => U.Id_Usuario);
    Set_Seleccionados(Ids_Elegibles);
  };

  const Limpiar_Seleccion = () => {
    Set_Seleccionados([]);
    Set_Resultado(null);
    Set_Error_Msg(null);
  };

  // Asignar estado especial a los seleccionados
  const Asignar_Especial = async () => {
    if (Seleccionados.length === 0) {
      Set_Error_Msg("Selecciona al menos un aprendiz antes de asignar el estado Especial.");
      return;
    }

    try {
      Set_Cargando_Asignar(true);
      Set_Error_Msg(null);
      Set_Resultado(null);

      const Respuesta = await apiAxios.patch("/api/Novedades/especial/asignar", {
        idsUsuarios: Seleccionados,
      });

      Set_Resultado(Respuesta.data.resultado);
      Set_Seleccionados([]);
      toast.success("Estado especial asignado correctamente");
      if (onRecargar) onRecargar();
    } catch (Error) {
      const msg = Error.response?.data?.message || "Error al asignar el estado Especial. Intenta de nuevo.";
      Set_Error_Msg(msg);
      toast.error(msg);
    } finally {
      Set_Cargando_Asignar(false);
    }
  };

  // Revocar estado especial (uno o varios usuarios)
  const Revocar_Especial = async (ids) => {
    if (!ids || ids.length === 0) return;

    try {
      Set_Cargando_Revocar(true);
      Set_Error_Msg(null);
      Set_Resultado(null);

      const Respuesta = await apiAxios.patch("/api/Novedades/especial/revocar", {
        idsUsuarios: ids,
      });

      const cant = Respuesta.data.resultado?.revocados?.length || ids.length;
      toast.success(`Se quitó el estado Especial a ${cant} aprendiz${cant !== 1 ? "es" : ""}`);
      if (onRecargar) onRecargar();
    } catch (Error) {
      const msg = Error.response?.data?.message || "Error al quitar el estado Especial. Intenta de nuevo.";
      Set_Error_Msg(msg);
      toast.error(msg);
    } finally {
      Set_Cargando_Revocar(false);
    }
  };

  const Manejar_Archivo = (E) => {
    const ArchivoSeleccionado = E.target.files[0];
    if (ArchivoSeleccionado) {
      Set_Archivo(ArchivoSeleccionado);
      Set_Resultado(null);
      Set_Error_Msg(null);
    }
  };

  const Importar_Excel = async () => {
    if (!Archivo) {
      Set_Error_Msg("Selecciona un archivo Excel antes de importar.");
      return;
    }

    try {
      Set_Cargando_Excel(true);
      Set_Error_Msg(null);
      Set_Resultado(null);

      const Form_Data = new FormData();
      Form_Data.append("archivo", Archivo);

      const Respuesta = await apiAxios.post(
        "/api/Novedades/especial/importar-excel",
        Form_Data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      Set_Resultado(Respuesta.data.resultado);
      Set_Archivo(null);
      if (Ref_Archivo.current) Ref_Archivo.current.value = "";
      toast.success("Importación completada");
      if (onRecargar) onRecargar();
    } catch (Error) {
      const msg = Error.response?.data?.message || "Error al procesar el archivo Excel. Verifica el formato.";
      Set_Error_Msg(msg);
      toast.error(msg);
    } finally {
      Set_Cargando_Excel(false);
    }
  };

  const Color_Estado = (Estado) => {
    if (Estado === "Especial") return "bg-blue-100 text-blue-700 border border-blue-200";
    if (Estado === "En Formacion") return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    if (Estado === "Aplazado" || Estado === "Cancelado") return "bg-red-100 text-red-600 border border-red-200";
    if (Estado === "Etapa Productiva") return "bg-blue-100 text-blue-600 border border-blue-200";
    return "bg-gray-100 text-gray-500 border border-gray-200";
  };

  return (
    <div className="space-y-6">

      {/* Cabecera del panel */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-[#1861c1] flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              Gestión de Estado Especial (30 Días)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              Los aprendices externos con <strong>Estado Especial</strong> pueden usar su código QR directamente con el Supervisor sin validación en cocina. Puedes <strong>asignar o quitar el estado especial</strong> en cualquier momento con un solo clic.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Panel izquierdo: lista de aprendices */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="text-[#1861c1]" size={16} />
              </span>
              <div>
                <h2 className="text-sm font-bold text-gray-800 m-0">
                  Aprendices Externos ({Aprendices_Externos.length})
                </h2>
                <p className="text-[11px] text-gray-400 m-0">
                  {Cant_Especiales} con estado Especial activo
                </p>
              </div>
            </div>

            {/* Filtro de pestañas */}
            <div className="flex items-center bg-gray-100/80 p-1 rounded-xl gap-1 text-xs">
              <button
                type="button"
                onClick={() => Set_FiltroTab("todos")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  FiltroTab === "todos" ? "bg-white text-[#1861c1] shadow-xs" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Todos ({Aprendices_Externos.length})
              </button>
              <button
                type="button"
                onClick={() => Set_FiltroTab("especiales")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  FiltroTab === "especiales" ? "bg-[#1861c1] text-white shadow-xs" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Especiales ({Cant_Especiales})
              </button>
              <button
                type="button"
                onClick={() => Set_FiltroTab("elegibles")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  FiltroTab === "elegibles" ? "bg-white text-emerald-700 shadow-xs" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Elegibles ({Cant_Elegibles})
              </button>
            </div>
          </div>

          {/* Acciones de selección rápida */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 text-xs">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={Seleccionar_Todos_Elegibles}
                className="text-[#1861c1] font-semibold hover:underline cursor-pointer"
              >
                Seleccionar todos los elegibles ({Cant_Elegibles})
              </button>
              {Seleccionados.length > 0 && (
                <button
                  type="button"
                  onClick={Limpiar_Seleccion}
                  className="text-gray-400 font-medium hover:underline cursor-pointer"
                >
                  Limpiar selección ({Seleccionados.length})
                </button>
              )}
            </div>
          </div>

          {/* Lista de aprendices */}
          {Aprendices_Filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Users size={36} className="opacity-20 mb-2" />
              <p className="text-xs font-medium">No se encontraron aprendices en esta categoría</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1 mt-3 flex-1">
              {Aprendices_Filtrados.map((U) => {
                const Esta_Seleccionado = Seleccionados.includes(U.Id_Usuario);
                const Ya_Es_Especial = U.Est_Usuario === "Especial";

                return (
                  <div
                    key={U.Id_Usuario}
                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition border ${
                      Esta_Seleccionado
                        ? "bg-blue-50/80 border-blue-300"
                        : Ya_Es_Especial
                        ? "bg-blue-50/30 border-blue-150"
                        : "bg-gray-50/70 border-transparent hover:bg-gray-100/70"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Checkbox solo para los no-especiales que se van a asignar */}
                      {!Ya_Es_Especial ? (
                        <input
                          type="checkbox"
                          checked={Esta_Seleccionado}
                          onChange={() => Manejar_Seleccion(U.Id_Usuario)}
                          className="w-4 h-4 accent-[#1861c1] rounded cursor-pointer"
                        />
                      ) : (
                        <div className="w-4 h-4 flex items-center justify-center text-[#1861c1]">
                          <Star size={14} className="fill-[#1861c1]" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-800 truncate m-0">
                          {U.Nom_Usuario} {U.Ape_Usuario}
                        </p>
                        <p className="text-[11px] text-gray-500 m-0">
                          {U.TipDoc_Usuario} {U.NumDoc_Usuario} &bull;{" "}
                          <span className="text-gray-400">{U.roles?.join(", ")}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${Color_Estado(U.Est_Usuario)}`}>
                        {U.Est_Usuario || "Sin estado"}
                      </span>

                      {/* Botón para quitar el estado especial de forma individual e inmediata */}
                      {Ya_Es_Especial && (
                        <button
                          type="button"
                          onClick={() => Revocar_Especial([U.Id_Usuario])}
                          disabled={Cargando_Revocar}
                          title="Quitar estado especial y regresar a En Formación"
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <X size={12} />
                          Quitar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Botón de asignación en lote */}
          {Seleccionados.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={Asignar_Especial}
                disabled={Cargando_Asignar}
                className="w-full py-3 rounded-xl font-bold text-sm bg-[#1861c1] text-white hover:bg-blue-700 shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {Cargando_Asignar ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Star size={15} />
                    Asignar Estado Especial a {Seleccionados.length} aprendiz{Seleccionados.length !== 1 ? "es" : ""}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Panel derecho: importación masiva y resultados */}
        <div className="space-y-4">

          {/* Importación Excel */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700">
                <FileSpreadsheet size={15} />
              </span>
              Importar desde Excel
            </h3>

            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              Sube un archivo Excel con columna <strong>Id_Usuario</strong> o <strong>NumDoc_Usuario</strong> para asignarles estado especial de forma masiva.
            </p>

            <input
              ref={Ref_Archivo}
              type="file"
              accept=".xlsx,.xls"
              onChange={Manejar_Archivo}
              className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 file:text-xs file:font-semibold hover:file:bg-gray-200 cursor-pointer"
            />

            {Archivo && (
              <p className="text-xs text-[#1861c1] font-medium mt-1 truncate">
                Archivo: {Archivo.name}
              </p>
            )}

            <button
              type="button"
              onClick={Importar_Excel}
              disabled={!Archivo || Cargando_Excel}
              className="mt-3 w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {Cargando_Excel ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Upload size={13} />
                  Procesar Archivo
                </>
              )}
            </button>
          </div>

          {/* Mensaje de error general */}
          {Error_Msg && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
              <span>{Error_Msg}</span>
            </div>
          )}

          {/* Panel de resultado */}
          {Resultado && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Resultado de la Operación
              </h4>

              {Resultado.actualizados?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-emerald-700 mb-1">
                    Actualizados ({Resultado.actualizados.length})
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {Resultado.actualizados.map((A, Idx) => (
                      <div key={Idx} className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 rounded-lg px-3 py-1.5 font-medium">
                        <span className="truncate">{A.nombre}</span>
                        <span className="text-[10px] text-emerald-600 whitespace-nowrap ml-2">Vence: {A.venceEn}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Resultado.revocados?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-rose-700 mb-1">
                    Revocados ({Resultado.revocados.length})
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {Resultado.revocados.map((R, Idx) => (
                      <div key={Idx} className="flex items-center justify-between text-xs bg-rose-50 text-rose-800 rounded-lg px-3 py-1.5 font-medium">
                        <span className="truncate">{R.nombre}</span>
                        <span className="text-[10px] text-rose-600 whitespace-nowrap ml-2">En Formación</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Resultado.rechazados?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-amber-700 mb-1">
                    Rechazados ({Resultado.rechazados.length})
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {Resultado.rechazados.map((R, Idx) => (
                      <div key={Idx} className="text-xs bg-amber-50 rounded-lg px-3 py-1.5 text-amber-900">
                        <span className="font-semibold">{R.nombre || `ID ${R.Id_Usuario}`}: </span>
                        <span className="text-amber-700">{R.motivo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PanelEstadoEspecial;