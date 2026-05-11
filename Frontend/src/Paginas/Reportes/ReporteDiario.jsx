// Paginas/Reportes/ReporteDiario.jsx
//
// Tab de reporte diario dentro de la pagina de Reportes.
// Permite al Coordinador seleccionar una fecha con un input de tipo date
// y ver el detalle completo de todas las reservas de ese dia.
//
// Funcionalidades:
//   - Selector de fecha con icono de calendario (nativo HTML, funciona en todos los navegadores)
//   - Filtro por tipo de comida: Todos, Desayuno, Almuerzo, Cena
//   - Tarjetas de resumen: total, por tipo, por estado, excepcionales, con estado Especial
//   - Tabla con datos del aprendiz: nombre, documento, plato, estado, contacto
//   - Badges visuales para reservas excepcionales y usuarios con estado Especial
//
// Este componente solo hace peticiones al backend y muestra resultados.
// Toda la logica de consulta y agrupamiento vive en ReportesService.getDiarioPorFecha.

import { useState } from "react";
import apiAxios from "../../api/axiosConfig";

// Colores del badge de estado de reserva.
// Centralizados aqui para no repetirlos en cada fila de la tabla.
const Color_Estado_Reserva = (Estado) => {
  if (Estado === "Consumido")  return "bg-green-100 text-green-700";
  if (Estado === "Verificado") return "bg-blue-100 text-blue-700";
  if (Estado === "Cancelado" || Estado === "Vencido") return "bg-red-100 text-red-600";
  return "bg-orange-100 text-orange-600"; // Generado
};

const ReporteDiario = () => {
  // Fecha seleccionada por el Coordinador. Por defecto muestra el dia de hoy.
  const [Fecha, Set_Fecha] = useState(new Date().toISOString().split("T")[0]);

  // Filtro de tipo de comida. "Todos" indica que no se aplica filtro.
  const [Tipo, Set_Tipo] = useState("Todos");

  // Datos retornados por el backend: { resumen, reservas }
  const [Datos, Set_Datos] = useState(null);

  // Estado de carga para bloquear el boton mientras el backend responde
  const [Cargando, Set_Cargando] = useState(false);

  // Mensaje de error visible si la peticion falla
  const [Error_Msg, Set_Error_Msg] = useState(null);

  // Llama al endpoint GET /api/Reportes/diario/:fecha con el tipo como query string
  const Consultar = async () => {
    if (!Fecha) {
      Set_Error_Msg("Selecciona una fecha para consultar el reporte");
      return;
    }
    try {
      Set_Cargando(true);
      Set_Error_Msg(null);
      const Url = `/api/Reportes/diario/${Fecha}${Tipo !== "Todos" ? `?tipo=${Tipo}` : ""}`;
      const Respuesta = await apiAxios.get(Url);
      Set_Datos(Respuesta.data);
    } catch (Error) {
      Set_Error_Msg(Error.response?.data?.message || "Error al consultar el reporte diario");
      Set_Datos(null);
    } finally {
      Set_Cargando(false);
    }
  };

  // Formatea una fecha YYYY-MM-DD al estilo colombiano DD/MM/YYYY para mostrarsela al usuario
  const Formatear_Fecha = (Fecha_Str) => {
    if (!Fecha_Str) return "--";
    const [Anio, Mes, Dia] = Fecha_Str.split("-");
    return `${Dia}/${Mes}/${Anio}`;
  };

  return (
    <div className="space-y-5">

      {/* Panel de filtros: fecha + tipo + boton de consulta */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-[#1861c1]/10 rounded-lg flex items-center justify-center">
            <i className="fas fa-calendar-day text-[#1861c1] text-xs"></i>
          </span>
          Reporte Diario
        </h2>

        <div className="flex flex-col sm:flex-row gap-3 items-end">
          {/* Selector de fecha con icono de calendario visible */}
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Fecha del reporte
            </label>
            <div className="relative">
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

          {/* Filtro por tipo de comida */}
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Tipo de comida
            </label>
            <div className="flex gap-1.5">
              {["Todos", "Desayuno", "Almuerzo", "Cena"].map((T) => (
                <button
                  key={T}
                  onClick={() => Set_Tipo(T)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition ${
                    Tipo === T
                      ? "bg-[#1861c1] text-white shadow-sm"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {T}
                </button>
              ))}
            </div>
          </div>

          {/* Boton de consulta */}
          <button
            onClick={Consultar}
            disabled={Cargando}
            className="px-6 py-2.5 rounded-xl bg-[#1861c1] text-white text-sm font-semibold hover:bg-[#1452a8] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60 whitespace-nowrap"
          >
            {Cargando ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <i className="fas fa-search text-xs"></i>
            )}
            Consultar
          </button>
        </div>
      </div>

      {/* Mensaje de error si la peticion falla */}
      {Error_Msg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-600">{Error_Msg}</p>
        </div>
      )}

      {/* Resultados del reporte */}
      {Datos && (
        <div className="space-y-5">

          {/* Tarjetas de resumen del dia */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Total de reservas del dia */}
            <div className="bg-[#1861c1]/5 rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-[#1861c1]">{Datos.resumen.total}</p>
              <p className="text-xs text-gray-500 mt-1">Total reservas</p>
              <p className="text-xs text-gray-400 mt-0.5">{Formatear_Fecha(Datos.resumen.fecha)}</p>
            </div>

            {/* Reservas por tipo de comida */}
            {Object.entries(Datos.resumen.porTipo).map(([Tipo_Key, Conteo]) => (
              <div key={Tipo_Key} className="bg-orange-50 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-orange-500">{Conteo}</p>
                <p className="text-xs text-gray-500 mt-1">{Tipo_Key}</p>
              </div>
            ))}

            {/* Reservas excepcionales del dia */}
            {Datos.resumen.totalExcepcionales > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-yellow-600">{Datos.resumen.totalExcepcionales}</p>
                <p className="text-xs text-gray-500 mt-1">Excepcionales</p>
              </div>
            )}

            {/* Aprendices con estado Especial que reservaron ese dia */}
            {Datos.resumen.totalEspeciales > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-purple-600">{Datos.resumen.totalEspeciales}</p>
                <p className="text-xs text-gray-500 mt-1">Estado Especial</p>
              </div>
            )}
          </div>

          {/* Tarjetas de resumen por estado de reserva */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(Datos.resumen.porEstado).map(([Estado_Key, Conteo]) => (
              <div key={Estado_Key} className={`rounded-xl p-3 text-center ${Color_Estado_Reserva(Estado_Key)}`}>
                <p className="text-xl font-bold">{Conteo}</p>
                <p className="text-xs mt-0.5">{Estado_Key}</p>
              </div>
            ))}
          </div>

          {/* Tabla de detalle de reservas del dia */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
              <span>Detalle de reservas del {Formatear_Fecha(Datos.resumen.fecha)}</span>
              <span className="text-xs font-normal text-gray-400">
                {Datos.reservas.length} registro{Datos.reservas.length !== 1 ? "s" : ""}
              </span>
            </h3>

            {Datos.reservas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-300">
                <i className="fas fa-inbox text-3xl mb-2"></i>
                <p className="text-sm">No hay reservas para los filtros seleccionados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 rounded-xl">
                    <tr>
                      <th className="text-left px-3 py-2.5 text-gray-500 font-semibold rounded-l-xl">Aprendiz</th>
                      <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Documento</th>
                      <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Tipo</th>
                      <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Plato</th>
                      <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Estado</th>
                      <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Telefono</th>
                      <th className="text-left px-3 py-2.5 text-gray-500 font-semibold rounded-r-xl">Correo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Datos.reservas.map((R) => {
                      // Extraer nombres de roles para identificar si es externo con estado Especial
                      const Roles_Usuario = R.usuario?.rolesUsuario
                        ?.map((UR) => UR.rolUsuario?.Nom_Rol)
                        .filter(Boolean) || [];
                      const Es_Especial = R.usuario?.Est_Usuario === "Especial";
                      const Es_Externo  = Roles_Usuario.some((Rol) =>
                        Rol === "Aprendiz Externo" || Rol === "Pasante Externo"
                      );

                      return (
                        <tr key={R.Id_Reserva} className="border-t border-gray-50 hover:bg-gray-50">
                          <td className="px-3 py-2.5">
                            <div>
                              <p className="font-medium text-gray-700">
                                {R.usuario
                                  ? `${R.usuario.Nom_Usuario} ${R.usuario.Ape_Usuario}`
                                  : `Usuario #${R.Id_Usuario}`
                                }
                              </p>
                              <div className="flex items-center gap-1 mt-0.5">
                                {/* Badge de tipo de usuario */}
                                {Es_Externo && (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">
                                    Externo
                                  </span>
                                )}
                                {/* Badge de estado Especial activo */}
                                {Es_Especial && (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                                    Especial
                                  </span>
                                )}
                                {/* Badge de reserva excepcional */}
                                {R.Exc_Reserva === "Si" && (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                                    Novedad
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-gray-500">
                            {R.usuario?.TipDoc_Usuario} {R.usuario?.NumDoc_Usuario}
                          </td>
                          <td className="px-3 py-2.5 text-gray-600">{R.Tip_Reserva}</td>
                          <td className="px-3 py-2.5 text-gray-600">
                            {R.plato?.Nom_Plato || "--"}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${Color_Estado_Reserva(R.Est_Reserva)}`}>
                              {R.Est_Reserva}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-gray-500">
                            {R.usuario?.Tel_Usuario || "--"}
                          </td>
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