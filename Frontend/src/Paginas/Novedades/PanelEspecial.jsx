// Paginas/Novedades/PanelEstadoEspecial.jsx
//
// Panel de gestion del estado Especial para aprendices y pasantes externos.
// Solo el Coordinador accede a esta vista.
//
// Que hace este componente:
//   1. Muestra la lista de aprendices externos con su estado actual (Est_Usuario).
//   2. Permite seleccionar uno o varios para asignarles el estado Especial.
//   3. Permite importar un archivo Excel con IDs o documentos para asignacion masiva.
//
// Que NO hace este componente:
//   No valida si el usuario es elegible para el estado Especial.
//   No calcula cuando vence el estado. Toda esa logica vive en NovedadesService.js.
//   Solo captura datos, llama al backend y muestra el resultado.
//
// FLUJO DE ESTADO ESPECIAL:
//   Coordinador selecciona aprendices externos -> Clic "Asignar Especial"
//   -> PATCH /api/Novedades/especial/asignar -> Backend valida roles y actualiza.
//   El estado dura 30 dias desde la asignacion, calculados en el backend.
//
// FLUJO DE IMPORTACION EXCEL:
//   Coordinador sube archivo Excel con columna Id_Usuario o NumDoc_Usuario.
//   -> POST /api/Novedades/especial/importar-excel (multipart/form-data, campo "archivo")
//   -> Backend lee el archivo, resuelve IDs y asigna el estado.
//
// NOTA IMPORTANTE SOBRE EL ENDPOINT DE APRENDICES:
//   El endpoint /api/Usuarios/aprendices filtra por 'Aprendiz Interno' y 'Aprendiz Externo'.
//   Los usuarios con rol 'Pasante Externo' podrian no aparecer en esta lista si el
//   endpoint no los incluye. Si ocurre eso, modificar getAprendices en UsuariosService.js
//   para incluir tambien los roles de Pasante.
//
// Props:
//   Usuarios - Array de aprendices ya cargado en el padre (Novedades.jsx).
//              Se recibe desde el padre para evitar llamar al backend dos veces.

import { useState, useRef } from "react";
import apiAxios from "../../api/axiosConfig";

// Roles que califican para recibir el estado Especial.
// Deben coincidir con ROLES_ELEGIBLES_ESPECIAL definido en NovedadesService.js.
const ROLES_EXTERNOS = ["Aprendiz Externo", "Pasante Externo"];

const PanelEstadoEspecial = ({ Usuarios }) => {

  // Array de IDs de los aprendices seleccionados mediante checkbox.
  // Se envian directamente al backend en la peticion de asignacion.
  const [Seleccionados, Set_Seleccionados] = useState([]);

  // Archivo Excel seleccionado para la importacion masiva.
  // Se almacena el objeto File del input para pasarlo a FormData al enviar.
  const [Archivo, Set_Archivo] = useState(null);

  // Estado de carga del boton de asignacion individual por checkbox.
  const [Cargando_Asignar, Set_Cargando_Asignar] = useState(false);

  // Estado de carga del boton de importacion Excel.
  const [Cargando_Excel, Set_Cargando_Excel] = useState(false);

  // Resultado devuelto por el backend tras asignar o importar.
  // Estructura: { actualizados: [...], rechazados: [...] }
  // Se muestra en un panel de retroalimentacion bajo el boton de accion.
  const [Resultado, Set_Resultado] = useState(null);

  // Mensaje de error general si la peticion falla completamente.
  const [Error_Msg, Set_Error_Msg] = useState(null);

  // Referencia al input de archivo para poder limpiarlo programaticamente
  // despues de una importacion exitosa (input[type=file] no se puede limpiar con state).
  const Ref_Archivo = useRef(null);

  // Filtra la lista de usuarios para mostrar solo los externos.
  // Los internos no son elegibles para el estado Especial porque su flujo ya omite cocina.
  const Aprendices_Externos = Usuarios.filter((U) =>
    U.roles?.some((R) => ROLES_EXTERNOS.includes(R))
  );

  // Agrega o quita un ID del array de seleccionados al hacer clic en un checkbox.
  // Si ya estaba seleccionado lo quita; si no estaba lo agrega.
  const Manejar_Seleccion = (Id_Usuario) => {
    Set_Seleccionados((Prev) =>
      Prev.includes(Id_Usuario)
        ? Prev.filter((Id) => Id !== Id_Usuario)
        : [...Prev, Id_Usuario]
    );
  };

  // Selecciona todos los aprendices externos que esten en estado "En Formacion".
  // No tiene sentido seleccionar los que ya tienen estado Especial activo,
  // el backend los rechazaria de todas formas con el motivo correspondiente.
  const Seleccionar_Todos = () => {
    const Ids_Elegibles = Aprendices_Externos
      .filter((U) => U.Est_Usuario !== "Especial")
      .map((U) => U.Id_Usuario);
    Set_Seleccionados(Ids_Elegibles);
  };

  // Limpia toda la seleccion y el resultado previo para empezar de nuevo.
  const Limpiar_Seleccion = () => {
    Set_Seleccionados([]);
    Set_Resultado(null);
    Set_Error_Msg(null);
  };

  // Envia la lista de IDs seleccionados al backend para asignar el estado Especial.
  // El backend valida que cada ID corresponda a un Aprendiz/Pasante Externo
  // y retorna un resumen con los actualizados y los rechazados con su motivo.
  const Asignar_Especial = async () => {
    if (Seleccionados.length === 0) {
      Set_Error_Msg("Selecciona al menos un aprendiz antes de asignar el estado Especial.");
      return;
    }

    try {
      Set_Cargando_Asignar(true);
      Set_Error_Msg(null);
      Set_Resultado(null);

      // El campo del body debe ser exactamente "idsUsuarios" segun NovedadesController.js.
      const Respuesta = await apiAxios.patch("/api/Novedades/especial/asignar", {
        idsUsuarios: Seleccionados,
      });

      // Guardar el resultado para mostrarlo al Coordinador y limpiar la seleccion.
      Set_Resultado(Respuesta.data.resultado);
      Set_Seleccionados([]);
    } catch (Error) {
      Set_Error_Msg(
        Error.response?.data?.message || "Error al asignar el estado Especial. Intenta de nuevo."
      );
    } finally {
      Set_Cargando_Asignar(false);
    }
  };

  // Maneja el cambio del input de archivo y guarda el File en el estado.
  // Solo acepta .xlsx y .xls segun la configuracion de multer en el backend.
  const Manejar_Archivo = (E) => {
    const ArchivoSeleccionado = E.target.files[0];
    if (ArchivoSeleccionado) {
      Set_Archivo(ArchivoSeleccionado);
      Set_Resultado(null);
      Set_Error_Msg(null);
    }
  };

  // Envia el archivo Excel al backend para procesar la asignacion masiva.
  // Se usa FormData porque el backend espera multipart/form-data con el campo "archivo".
  // El header Content-Type debe ser multipart/form-data para que axios lo maneje correctamente.
  const Importar_Excel = async () => {
    if (!Archivo) {
      Set_Error_Msg("Selecciona un archivo Excel antes de importar.");
      return;
    }

    try {
      Set_Cargando_Excel(true);
      Set_Error_Msg(null);
      Set_Resultado(null);

      // FormData es necesario para enviar archivos binarios via HTTP.
      // El campo "archivo" debe coincidir con uploadExcel.single('archivo') en NovedadesRoute.js.
      const Form_Data = new FormData();
      Form_Data.append("archivo", Archivo);

      const Respuesta = await apiAxios.post(
        "/api/Novedades/especial/importar-excel",
        Form_Data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      Set_Resultado(Respuesta.data.resultado);

      // Limpiar el input de archivo despues de una importacion exitosa.
      // No se puede hacer con state porque los inputs de tipo file son no controlados.
      Set_Archivo(null);
      if (Ref_Archivo.current) Ref_Archivo.current.value = "";
    } catch (Error) {
      Set_Error_Msg(
        Error.response?.data?.message || "Error al procesar el archivo Excel. Verifica el formato."
      );
    } finally {
      Set_Cargando_Excel(false);
    }
  };

  // Retorna el color de fondo y texto del badge segun el valor de Est_Usuario.
  // Los valores posibles en la base de datos son los definidos en el enum de la tabla usuarios.
  const Color_Estado = (Estado) => {
    if (Estado === "Especial") return "bg-purple-100 text-purple-700 border border-purple-200";
    if (Estado === "En Formacion") return "bg-green-100 text-green-700";
    if (Estado === "Aplazado" || Estado === "Cancelado") return "bg-red-100 text-red-600";
    if (Estado === "Etapa Productiva") return "bg-blue-100 text-blue-600";
    return "bg-gray-100 text-gray-500";
  };

  return (
    <div className="space-y-6">

      {/* Cabecera del panel con descripcion del flujo */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-purple-700 mb-1">
          Estado Especial: duracion de 30 dias
        </h3>
        <p className="text-xs text-purple-600">
          Los aprendices con estado Especial pueden usar su QR directamente con el Supervisor
          sin pasar por el personal de Cocina. Aplica unicamente para Aprendiz Externo y Pasante Externo.
          El estado se revierte automaticamente a "En Formacion" al cumplirse los 30 dias.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Panel izquierdo: lista de aprendices con checkboxes.
            Ocupa 2 columnas en pantallas grandes para dar mas espacio a la lista. */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-base font-semibold text-gray-700 flex items-center gap-2">
              <span className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-users text-purple-500 text-xs"></i>
              </span>
              Aprendices Externos ({Aprendices_Externos.length})
            </h2>

            {/* Botones de seleccion masiva */}
            <div className="flex gap-2">
              <button
                onClick={Seleccionar_Todos}
                className="text-xs text-[#1861c1] font-medium hover:underline"
              >
                Seleccionar elegibles
              </button>
              {Seleccionados.length > 0 && (
                <button
                  onClick={Limpiar_Seleccion}
                  className="text-xs text-gray-400 font-medium hover:underline"
                >
                  Limpiar ({Seleccionados.length})
                </button>
              )}
            </div>
          </div>

          {/* Lista de aprendices externos con scroll para listas largas.
              Cada fila muestra nombre, documento, roles y estado actual con checkbox. */}
          {Aprendices_Externos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-300">
              <i className="fas fa-user-slash text-3xl mb-2"></i>
              <p className="text-sm">No hay aprendices externos registrados</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {Aprendices_Externos.map((U) => {
                const Esta_Seleccionado = Seleccionados.includes(U.Id_Usuario);
                const Ya_Es_Especial = U.Est_Usuario === "Especial";

                return (
                  <label
                    key={U.Id_Usuario}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition border ${
                      Esta_Seleccionado
                        ? "bg-[#f0f4ff] border-[#1861c1]/30"
                        : "bg-gray-50 border-transparent hover:bg-gray-100"
                    } ${Ya_Es_Especial ? "opacity-60" : ""}`}
                  >
                    {/* Checkbox vinculado al estado de seleccion del aprendiz.
                        Se deshabilita si ya tiene estado Especial activo para
                        evitar envios innecesarios que el backend rechazaria. */}
                    <input
                      type="checkbox"
                      checked={Esta_Seleccionado}
                      onChange={() => !Ya_Es_Especial && Manejar_Seleccion(U.Id_Usuario)}
                      disabled={Ya_Es_Especial}
                      className="w-4 h-4 accent-[#1861c1]"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {U.Nom_Usuario} {U.Ape_Usuario}
                      </p>
                      <p className="text-xs text-gray-400">
                        {U.TipDoc_Usuario} {U.NumDoc_Usuario} &mdash;{" "}
                        {U.roles?.join(", ")}
                      </p>
                    </div>

                    {/* Badge del estado actual del usuario.
                        Est_Usuario es el campo de la tabla usuarios con los estados del enum. */}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${Color_Estado(U.Est_Usuario)}`}>
                      {U.Est_Usuario || "Sin estado"}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {/* Boton de asignacion.
              Muestra cuantos aprendices estan seleccionados para que el Coordinador
              confirme antes de hacer el cambio. Se bloquea durante la peticion. */}
          {Seleccionados.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={Asignar_Especial}
                disabled={Cargando_Asignar}
                className="w-full py-3 rounded-xl font-semibold bg-purple-600 text-white hover:bg-purple-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {Cargando_Asignar ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <i className="fas fa-star text-xs"></i>
                    Asignar Estado Especial a {Seleccionados.length} aprendiz{Seleccionados.length !== 1 ? "es" : ""}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Panel derecho: importacion masiva por Excel y resultado de la ultima operacion */}
        <div className="space-y-4">

          {/* Seccion de importacion Excel.
              El archivo debe tener una columna "Id_Usuario" o "NumDoc_Usuario" en la hoja 1.
              El backend (NovedadesService.ImportarEspecialesDesdeExcel) detecta automaticamente
              cual de las dos columnas usar. */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
                <i className="fas fa-file-excel text-green-600 text-xs"></i>
              </span>
              Importar desde Excel
            </h3>

            <p className="text-xs text-gray-400 mb-3">
              El archivo debe tener una hoja con columna <strong>Id_Usuario</strong> o{" "}
              <strong>NumDoc_Usuario</strong>. Solo los aprendices externos seran actualizados.
            </p>

            {/* Input de archivo.
                La referencia Ref_Archivo permite limpiar el campo despues de importar
                ya que los inputs de tipo file no son controlados por React state. */}
            <input
              ref={Ref_Archivo}
              type="file"
              accept=".xlsx,.xls"
              onChange={Manejar_Archivo}
              className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-600 file:text-xs file:font-medium hover:file:bg-gray-200 cursor-pointer"
            />

            {/* Nombre del archivo seleccionado para confirmacion visual antes de importar */}
            {Archivo && (
              <p className="text-xs text-gray-400 mt-1 truncate">
                Seleccionado: {Archivo.name}
              </p>
            )}

            <button
              onClick={Importar_Excel}
              disabled={!Archivo || Cargando_Excel}
              className="mt-3 w-full py-2 rounded-xl text-sm font-semibold bg-[#42b72a] text-white hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {Cargando_Excel ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <i className="fas fa-upload text-xs"></i>
                  Importar
                </>
              )}
            </button>
          </div>

          {/* Mensaje de error general si la peticion falla completamente */}
          {Error_Msg && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs text-red-600">{Error_Msg}</p>
            </div>
          )}

          {/* Panel de resultado de la ultima operacion (asignacion o importacion).
              Muestra dos listas: actualizados (verde) y rechazados con su motivo (rojo).
              El backend siempre retorna este formato en ambos endpoints. */}
          {Resultado && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Resultado de la operacion</h4>

              {/* Lista de aprendices actualizados exitosamente */}
              {Resultado.actualizados?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-600 mb-1">
                    Actualizados ({Resultado.actualizados.length})
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {Resultado.actualizados.map((A, Idx) => (
                      <div key={Idx} className="flex items-center justify-between text-xs bg-green-50 rounded-lg px-3 py-1.5">
                        <span className="text-green-700 font-medium truncate">{A.nombre}</span>
                        {/* venceEn viene del backend calculado como hoy + 30 dias */}
                        <span className="text-green-500 whitespace-nowrap ml-2">Vence: {A.venceEn}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista de aprendices rechazados con el motivo de cada rechazo */}
              {Resultado.rechazados?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-500 mb-1">
                    Rechazados ({Resultado.rechazados.length})
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {Resultado.rechazados.map((R, Idx) => (
                      <div key={Idx} className="text-xs bg-red-50 rounded-lg px-3 py-1.5">
                        <span className="text-red-600 font-medium">{R.nombre || `ID ${R.Id_Usuario}`}: </span>
                        <span className="text-red-400">{R.motivo}</span>
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