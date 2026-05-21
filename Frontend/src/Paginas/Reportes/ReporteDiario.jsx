// Paginas/Reportes/ReporteDiario.jsx
//
// Tab de reporte diario dentro de la pagina de Reportes.
// Es el primer tab visible automaticamente al ingresar al modulo de reportes.
//
// Funcionalidades:
//   1. Selector de fecha nativo (input type="date") inicializado en la fecha actual.
//   2. Filtros de tipo de comida: Todos, Desayuno, Almuerzo, Cena.
//   3. Boton "Consultar" que dispara la peticion al backend con la fecha y el tipo.
//   4. Tarjetas de resumen: total del dia, por tipo de comida, por estado de reserva,
//      excepcionales y usuarios con estado Especial.
//   5. Tabla detallada con: nombre del aprendiz, documento, tipo, plato consumido,
//      estado de la reserva, telefono, correo y hora de creacion.
//   6. Tres graficas (Barras, Lineas, Pastel) que se renderizan con los datos del dia.
//   7. Botones de exportacion PDF y Excel que llaman al backend con los filtros activos.
//
// Toda la logica de base de datos vive en ReportesServices.js (backend Node).
// Este componente solo hace peticiones HTTP y renderiza la respuesta.
//
// Convencion de nombres:
//   - Constantes y estados en PascalCase con prefijo Set_ para setters (convencion del proyecto).
//   - Funciones auxiliares con mayuscula inicial.

import { useState } from "react";
import apiAxios from "../../api/axiosConfig";
import { Chart } from "react-google-charts";
import { FileText, FileSpreadsheet } from "lucide-react";

// ---------------------------------------------------------------------------
// UTILIDADES DE PRESENTACION
// ---------------------------------------------------------------------------

// Devuelve las clases Tailwind de color para el badge del estado de una reserva.
// Se centraliza aqui para no repetir la logica en cada fila de la tabla.
const Color_Estado = (Estado) => {
  if (Estado === "Consumido") return "bg-green-100 text-green-700";
  if (Estado === "Verificado") return "bg-blue-100 text-blue-700";
  if (Estado === "Cancelado" || Estado === "Vencido") return "bg-red-100 text-red-600";
  return "bg-orange-100 text-orange-600"; // Estado por defecto: Generado
};

// Convierte una fecha en formato YYYY-MM-DD al estilo local DD/MM/YYYY.
// Se usa en los titulos de las tarjetas de resumen y en el encabezado de la tabla.
const Formatear_Fecha = (Fecha_Str) => {
  if (!Fecha_Str) return "--";
  const [Anio, Mes, Dia] = Fecha_Str.split("-");
  return `${Dia}/${Mes}/${Anio}`;
};

// Spinner animado reutilizable para mostrar carga dentro de botones.
// Usa border parcial para simular una animacion de giro con CSS puro.
const Spinner = () => (
  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
);

// ---------------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------------

const ReporteDiario = () => {

  // Fecha seleccionada por el Coordinador.
  // Se inicializa con la fecha actual del sistema en formato YYYY-MM-DD.
  const [Fecha, Set_Fecha] = useState(new Date().toISOString().split("T")[0]);

  // Tipo de comida seleccionado para filtrar las reservas del dia.
  // "Todos" significa que no se aplica ningun filtro de tipo.
  const [Tipo, Set_Tipo] = useState("Todos");

  // Objeto de respuesta del backend.
  // Estructura esperada: { resumen: {...}, reservas: [...] }
  const [Datos, Set_Datos] = useState(null);

  // Controla el estado de carga mientras el backend responde.
  // Bloquea el boton Consultar para evitar peticiones duplicadas.
  const [Cargando, Set_Cargando] = useState(false);

  // Mensaje de error que se muestra en pantalla si la peticion falla.
  const [Error_Msg, Set_Error_Msg] = useState(null);

  // Estado de exportacion: "pdf" | "excel" | null.
  // Se usa para mostrar el spinner en el boton correspondiente.
  const [Exportando, Set_Exportando] = useState(null);

  // ---------------------------------------------------------------------------
  // FUNCION: Consultar
  // Construye la URL con los filtros activos y llama al backend.
  // El endpoint GET /api/Reportes/diario/:fecha acepta ?tipo=Almuerzo como query param.
  // ---------------------------------------------------------------------------
  const Consultar = async () => {
    // Validar que el Coordinador selecciono una fecha antes de consultar
    if (!Fecha) {
      Set_Error_Msg("Selecciona una fecha para consultar el reporte");
      return;
    }
    try {
      Set_Cargando(true);
      Set_Error_Msg(null);

      // Agregar el filtro de tipo solo si no es "Todos" para que el backend
      // no aplique un WHERE innecesario cuando se quieren ver todas las comidas
      const Url = `/api/Reportes/diario/${Fecha}${Tipo !== "Todos" ? `?tipo=${Tipo}` : ""}`;
      const Respuesta = await apiAxios.get(Url);
      Set_Datos(Respuesta.data);
    } catch (Error) {
      // Mostrar el mensaje de error del backend si existe, o uno generico
      Set_Error_Msg(Error.response?.data?.message || "Error al consultar el reporte diario");
      Set_Datos(null);
    } finally {
      // Siempre desbloquear el boton al finalizar, haya error o no
      Set_Cargando(false);
    }
  };

  // ---------------------------------------------------------------------------
  // FUNCION: Exportar
  // Solicita al backend un archivo PDF o Excel con los datos actuales.
  // El backend genera el archivo y lo envia como blob descargable.
  // ---------------------------------------------------------------------------
  const Exportar = async (Formato) => {
    // Marcar cual boton esta en proceso para mostrar el spinner correcto
    Set_Exportando(Formato);
    try {
      // Construir los parametros de la peticion con los filtros activos
      const Params = { periodo: "diario", fechaInicio: Fecha, fechaFin: Fecha };
      if (Tipo !== "Todos") Params.tipoAlimento = Tipo;

      // Pedir el archivo al backend indicando que la respuesta es un blob binario
      const Res = await apiAxios.get(`/api/Reportes/exportar/${Formato}`, {
        params: Params,
        responseType: "blob",
      });

      // Determinar extension y tipo MIME segun el formato solicitado
      const Ext = Formato === "pdf" ? "pdf" : "xlsx";
      const Mime = Formato === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      // Crear un objeto URL temporal para disparar la descarga en el navegador
      const Blob_Arch = new Blob([Res.data], { type: Mime });
      const Url_Temp = URL.createObjectURL(Blob_Arch);
      const Enlace = document.createElement("a");
      Enlace.href = Url_Temp;
      Enlace.download = `Reporte_Diario_${Fecha}.${Ext}`;
      Enlace.click();

      // Liberar la URL temporal de memoria del navegador
      URL.revokeObjectURL(Url_Temp);
    } catch (Err) {
      console.error("Error exportando reporte diario:", Err);
      alert("Error al exportar. Verifica la conexion con el servidor.");
    } finally {
      // Quitar el spinner del boton al finalizar
      Set_Exportando(null);
    }
  };

  // ---------------------------------------------------------------------------
  // PREPARACION DE DATOS PARA GRAFICAS
  // Se ejecuta cuando Datos existe. Si no hay datos, las graficas no se muestran.
  // Google Charts requiere que la primera fila sea el encabezado de columnas.
  // ---------------------------------------------------------------------------

  // Grafica de barras: reservas agrupadas por tipo de comida para el dia
  const Datos_Barras = Datos ? [
    ["Tipo", "Cantidad"],
    ...Object.entries(Datos.resumen?.porTipo || {}).map(([K, V]) => [K, Number(V)])
  ] : [];

  // Grafica de pastel: distribucion porcentual por tipo de comida
  const Datos_Pastel = Datos ? [
    ["Tipo", "Cantidad"],
    ...Object.entries(Datos.resumen?.porTipo || {}).map(([K, V]) => [K, Number(V)])
  ] : [];

  // Grafica de estados: cuantas reservas hay en cada estado (Consumido, Vencido, etc.)
  const Datos_Estados = Datos ? [
    ["Estado", "Cantidad"],
    ...Object.entries(Datos.resumen?.porEstado || {}).map(([K, V]) => [K, Number(V)])
  ] : [];

  // La grafica de barras necesita al menos una fila de datos (ademas del encabezado)
  const Hay_Datos_Graficas = Datos_Barras.length > 1;

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-5">

      {/* ===================================================================
          PANEL DE FILTROS
          Contiene: selector de fecha, botones de tipo de comida y boton Consultar.
          Se muestra siempre, incluso antes de realizar la primera consulta.
      ==================================================================== */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">

        {/* Titulo del panel con icono de calendario */}
        <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-[#1861c1]/10 rounded-lg flex items-center justify-center">
            <i className="fas fa-calendar-day text-[#1861c1] text-xs"></i>
          </span>
          Reporte Diario
        </h2>

        {/* Fila de controles: fecha + tipo + boton */}
        <div className="flex flex-col sm:flex-row gap-3 items-end">

          {/* Selector de fecha nativo con icono superpuesto */}
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Seleccionar fecha
            </label>
            <div className="relative">
              {/* Icono decorativo de calendario, no interactivo */}
              <i className="fas fa-calendar absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
              <input
                type="date"
                value={Fecha}
                onChange={(E) => Set_Fecha(E.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#1861c1]"
              />
            </div>
          </div>

          {/* Botones de seleccion de tipo de comida */}
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Tipo de comida
            </label>
            <div className="flex gap-1.5">
              {["Todos", "Desayuno", "Almuerzo", "Cena"].map((T) => (
                <button
                  key={T}
                  onClick={() => Set_Tipo(T)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition ${Tipo === T
                      ? "bg-[#1861c1] text-white shadow-sm"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                >
                  {T}
                </button>
              ))}
            </div>
          </div>

          {/* Boton principal de consulta */}
          <button
            onClick={Consultar}
            disabled={Cargando}
            className="px-6 py-2.5 rounded-xl bg-[#1861c1] text-white text-sm font-semibold hover:bg-[#1452a8] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60 whitespace-nowrap"
          >
            {Cargando ? (
              // Spinner mientras el backend responde
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <i className="fas fa-search text-xs"></i>
            )}
            Consultar
          </button>
        </div>
      </div>

      {/* ===================================================================
          MENSAJE DE ERROR
          Solo se muestra si la peticion al backend falla.
      ==================================================================== */}
      {Error_Msg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-600">{Error_Msg}</p>
        </div>
      )}

      {/* ===================================================================
          RESULTADOS DEL REPORTE
          Solo se muestra cuando Datos existe (despues de una consulta exitosa).
      ==================================================================== */}
      {Datos && (
        <div className="space-y-5">

          {/* ---------------------------------------------------------------
              FILA SUPERIOR: Tarjetas de resumen + Botones de exportacion
          --------------------------------------------------------------- */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

            {/* Tarjetas de resumen numericas del dia */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 flex-1">

              {/* Tarjeta: total de reservas del dia */}
              <div className="bg-[#1861c1]/5 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-[#1861c1]">{Datos.resumen.total}</p>
                <p className="text-xs text-gray-500 mt-1">Total reservas</p>
                <p className="text-xs text-gray-400 mt-0.5">{Formatear_Fecha(Datos.resumen.fecha)}</p>
              </div>

              {/* Tarjetas dinamicas: una por cada tipo de comida encontrado */}
              {Object.entries(Datos.resumen.porTipo || {}).map(([Tipo_Key, Conteo]) => (
                <div key={Tipo_Key} className="bg-orange-50 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-bold text-orange-500">{Conteo}</p>
                  <p className="text-xs text-gray-500 mt-1">{Tipo_Key}</p>
                </div>
              ))}

              {/* Tarjeta de excepcionales: solo aparece si hay al menos uno */}
              {Datos.resumen.totalExcepcionales > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-600">{Datos.resumen.totalExcepcionales}</p>
                  <p className="text-xs text-gray-500 mt-1">Excepcionales</p>
                </div>
              )}

              {/* Tarjeta de estado Especial: solo aparece si hay al menos uno */}
              {Datos.resumen.totalEspeciales > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-bold text-purple-600">{Datos.resumen.totalEspeciales}</p>
                  <p className="text-xs text-gray-500 mt-1">Estado Especial</p>
                </div>
              )}
            </div>

            {/* Botones de exportacion PDF y Excel */}
            <div className="flex gap-2 sm:flex-col sm:gap-2">
              <button
                onClick={() => Exportar("pdf")}
                disabled={Exportando === "pdf" || Datos.reservas.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                {Exportando === "pdf" ? <Spinner /> : <FileText className="w-4 h-4" />}
                <span>PDF</span>
              </button>
              <button
                onClick={() => Exportar("excel")}
                disabled={Exportando === "excel" || Datos.reservas.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                {Exportando === "excel" ? <Spinner /> : <FileSpreadsheet className="w-4 h-4" />}
                <span>Excel</span>
              </button>
            </div>
          </div>

          {/* ---------------------------------------------------------------
              TARJETAS DE ESTADO DE RESERVA
              Una tarjeta por cada estado encontrado (Consumido, Vencido, etc.)
          --------------------------------------------------------------- */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(Datos.resumen.porEstado || {}).map(([Estado_Key, Conteo]) => (
              <div
                key={Estado_Key}
                className={`rounded-xl p-3 text-center ${Color_Estado(Estado_Key)}`}
              >
                <p className="text-xl font-bold">{Conteo}</p>
                <p className="text-xs mt-0.5">{Estado_Key}</p>
              </div>
            ))}
          </div>

          {/* ---------------------------------------------------------------
              SECCION DE GRAFICAS
              Se muestran solo cuando hay datos numericos para renderizar.
              Tres graficas: barras por tipo, pastel por tipo, barras por estado.
          --------------------------------------------------------------- */}
          {Hay_Datos_Graficas && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Grafica de barras: cantidad de reservas por tipo de comida */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <h3 className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1.5">
                  <i className="fas fa-chart-bar text-indigo-500"></i>
                  Reservas por tipo
                </h3>
                <Chart
                  chartType="BarChart"
                  data={Datos_Barras}
                  options={{
                    chartArea: { width: "70%", height: "65%" },
                    colors: ["#1861c1"],
                    legend: { position: "none" },
                    hAxis: { minValue: 0, textStyle: { fontSize: 10 } },
                    vAxis: { textStyle: { fontSize: 10 } },
                  }}
                  width="100%"
                  height="220px"
                />
              </div>

              {/* Grafica de pastel: distribucion porcentual de tipos de comida */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <h3 className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1.5">
                  <i className="fas fa-chart-pie text-amber-500"></i>
                  Distribucion por tipo
                </h3>
                <Chart
                  chartType="PieChart"
                  data={Datos_Pastel}
                  options={{
                    colors: ["#6366f1", "#10b981", "#f59e0b"],
                    chartArea: { width: "85%", height: "80%" },
                    legend: { position: "right", textStyle: { fontSize: 10 } },
                    pieHole: 0.4,
                  }}
                  width="100%"
                  height="220px"
                />
              </div>

              {/* Grafica de barras: cantidad de reservas por estado */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <h3 className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1.5">
                  <i className="fas fa-chart-bar text-emerald-500"></i>
                  Reservas por estado
                </h3>
                <Chart
                  chartType="BarChart"
                  data={Datos_Estados}
                  options={{
                    chartArea: { width: "70%", height: "65%" },
                    colors: ["#10b981"],
                    legend: { position: "none" },
                    hAxis: { minValue: 0, textStyle: { fontSize: 10 } },
                    vAxis: { textStyle: { fontSize: 10 } },
                  }}
                  width="100%"
                  height="220px"
                />
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------
              TABLA DE DETALLE DE RESERVAS
              Muestra cada reserva del dia con: nombre, documento, tipo,
              plato, estado, telefono y correo del aprendiz.
          --------------------------------------------------------------- */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">

            {/* Encabezado de la tabla con contador de registros */}
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
              <span>Detalle de reservas — {Formatear_Fecha(Datos.resumen.fecha)}</span>
              <span className="text-xs font-normal text-gray-400">
                {Datos.reservas.length} registro{Datos.reservas.length !== 1 ? "s" : ""}
              </span>
            </h3>

            {/* Estado vacio: no hay reservas para los filtros seleccionados */}
            {Datos.reservas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-300">
                <i className="fas fa-inbox text-3xl mb-2"></i>
                <p className="text-sm">No hay reservas para los filtros seleccionados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">

                  {/* Cabecera de la tabla */}
                  <thead className="bg-gray-50 rounded-xl">
                    <tr>
                      <th className="text-left px-3 py-2.5 text-gray-500 font-semibold rounded-l-xl">Aprendiz</th>
                      <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Documento</th>
                      <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Tipo</th>
                      <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Plato</th>
                      <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Estado</th>
                      <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Hora</th>
                      <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Telefono</th>
                      <th className="text-left px-3 py-2.5 text-gray-500 font-semibold rounded-r-xl">Correo</th>
                    </tr>
                  </thead>

                  <tbody>
                    {Datos.reservas.map((R) => {
                      // Extraer los nombres de roles del aprendiz para saber si es externo
                      const Roles_Usuario = R.usuario?.rolesUsuario
                        ?.map((UR) => UR.rolUsuario?.Nom_Rol)
                        .filter(Boolean) || [];

                      // Determinar si el aprendiz tiene estado Especial activo
                      const Es_Especial = R.usuario?.Est_Usuario === "Especial";

                      // Determinar si el aprendiz tiene un rol de tipo externo
                      const Es_Externo = Roles_Usuario.some(
                        (Rol) => Rol === "Aprendiz Externo" || Rol === "Pasante Externo"
                      );

                      // Extraer la hora de creacion de la reserva del campo createdAt
                      // Se muestra en formato HH:MM para mayor legibilidad
                      const Hora_Reserva = R.createdAt
                        ? new Date(R.createdAt).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "--";

                      return (
                        <tr key={R.Id_Reserva} className="border-t border-gray-50 hover:bg-gray-50">

                          {/* Columna: nombre del aprendiz con badges de estado */}
                          <td className="px-3 py-2.5">
                            <div>
                              <p className="font-medium text-gray-700">
                                {R.usuario
                                  ? `${R.usuario.Nom_Usuario} ${R.usuario.Ape_Usuario}`
                                  : `Usuario #${R.Id_Usuario}`
                                }
                              </p>
                              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                {/* Badge de tipo externo */}
                                {Es_Externo && (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">
                                    Externo
                                  </span>
                                )}
                                {/* Badge de estado Especial */}
                                {Es_Especial && (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                                    Especial
                                  </span>
                                )}
                                {/* Badge de reserva excepcional (novedad) */}
                                {R.Exc_Reserva === "Si" && (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                                    Novedad
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Columna: tipo y numero de documento */}
                          <td className="px-3 py-2.5 text-gray-500">
                            {R.usuario?.TipDoc_Usuario} {R.usuario?.NumDoc_Usuario}
                          </td>

                          {/* Columna: tipo de comida de la reserva */}
                          <td className="px-3 py-2.5 text-gray-600">{R.Tip_Reserva}</td>

                          {/* Columna: nombre del plato elegido */}
                          <td className="px-3 py-2.5 text-gray-600">
                            {R.plato?.Nom_Plato || "--"}
                          </td>

                          {/* Columna: estado de la reserva con badge de color */}
                          <td className="px-3 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${Color_Estado(R.Est_Reserva)}`}>
                              {R.Est_Reserva}
                            </span>
                          </td>

                          {/* Columna: hora en que se registro la reserva */}
                          <td className="px-3 py-2.5 text-gray-500">{Hora_Reserva}</td>

                          {/* Columna: telefono de contacto del aprendiz */}
                          <td className="px-3 py-2.5 text-gray-500">
                            {R.usuario?.Tel_Usuario || "--"}
                          </td>

                          {/* Columna: correo electronico, truncado si es muy largo */}
                          <td className="px-3 py-2.5 text-gray-500 max-w-[160px] truncate">
                            {R.usuario?.Cor_Usuario || "--"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReporteDiario;