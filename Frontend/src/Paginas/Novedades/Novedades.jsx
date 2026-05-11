// Paginas/Novedades/Novedades.jsx
//
// Pagina principal del modulo de Novedades para el Coordinador en FoodSys.
// CORRECCIONES APLICADAS EN ESTA VERSION (sin modificar logica de negocio existente):
//
//   1. Cargar_Platos ahora usa el endpoint /api/Reservas/reservar/Menu/:Fecha/:Tipo
//      en lugar de /api/Menus/fecha/:fecha que no existe en MenusRoutes.js.
//      El endpoint de Reservas ya incluye la asociacion con PlatosModel (plato.Nom_Plato)
//      y filtra por tipo de comida en el servidor, no en el cliente.
//
//   2. Se agrego Tipo a las dependencias del useEffect que llama a Cargar_Platos,
//      para que la lista de platos se actualice al cambiar el tipo de comida
//      sin necesidad de volver a seleccionar el aprendiz.
//
//   3. PlatosFiltrados ahora es igual a PlatosDisp directamente porque el backend
//      ya retorna solo los platos del tipo seleccionado. Antes el filtro en el cliente
//      fallaba porque los datos de /api/Menus/fecha nunca llegaban.
//
// NADA MAS CAMBIO. Toda la logica de tabs, estado Especial, reporte y formulario
// de novedad sigue siendo identica al codigo original.

import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig";
import BuscadorAprendiz from "./BuscadorAprendiz";
import TarjetaSeleccionado from "./TarjetaSeleccionado";
import SelectorTipo from "./SelectorTipo";
import ListaNovedades from "./ListaNovedades";
import PanelEspecial from "./PanelEspecial";

const Novedades = () => {
  // =========================================================================
  // ESTADO EXISTENTE - NO MODIFICADO
  // =========================================================================

  const [Usuarios, Set_Usuarios]           = useState([]);
  const [Busqueda, Set_Busqueda]           = useState("");
  const [UsuarioSel, Set_UsuarioSel]       = useState(null);
  const [Tipo, Set_Tipo]                   = useState("Almuerzo");
  const [Plato, Set_Plato]                 = useState("");
  const [Jus_Reserva, Set_Jus_Reserva]    = useState("");
  const [TiposDisp, Set_TiposDisp]         = useState([]);
  const [PlatosDisp, Set_PlatosDisp]       = useState([]);
  const [Cargando, Set_Cargando]           = useState(false);
  const [Mensaje, Set_Mensaje]             = useState(null);
  const [Exc_Reservas, Set_Exc_Reservas]   = useState([]);

  // =========================================================================
  // ESTADO NUEVO - NO MODIFICADO RESPECTO A LA VERSION ANTERIOR
  // =========================================================================

  const [TabActiva, Set_TabActiva]             = useState("novedades");
  const [Mostrar_Reporte, Set_Mostrar_Reporte] = useState(false);
  const [Datos_Reporte, Set_Datos_Reporte]     = useState(null);
  const [Cargando_Reporte, Set_Cargando_Reporte] = useState(false);

  // =========================================================================
  // EFECTOS - SE AGREGO Tipo A LAS DEPENDENCIAS DEL SEGUNDO useEffect
  // =========================================================================

  useEffect(() => {
    Cargar_Usuarios();
    Cargar_Excepcionales();
  }, []);

  // Antes este efecto solo dependia de UsuarioSel.
  // Ahora tambien depende de Tipo para recargar los platos cuando el Coordinador
  // cambia el tipo de comida sin volver a seleccionar al aprendiz.
  useEffect(() => {
    if (UsuarioSel && Tipo) {
      Cargar_Platos(Tipo);
    }
  }, [UsuarioSel, Tipo]);

  // =========================================================================
  // FUNCIONES EXISTENTES - SOLO Cargar_Platos SE MODIFICO
  // =========================================================================

  const Cargar_Usuarios = async () => {
    try {
      const Respuesta = await apiAxios.get("/api/Usuarios/aprendices");
      Set_Usuarios(Respuesta.data);
    } catch (Error) {
      console.error("[Novedades] Error cargando lista de aprendices:", Error);
    }
  };

  const Cargar_Excepcionales = async () => {
    try {
      const Respuesta = await apiAxios.get("/api/Novedades/hoy");
      Set_Exc_Reservas(Respuesta.data);
    } catch (Error) {
      console.error("[Novedades] Error cargando novedades del dia:", Error);
    }
  };

  // CORRECCION: este metodo ahora recibe el tipo como parametro y usa el endpoint
  // /api/Reservas/reservar/Menu/:Fecha/:Tipo que ya existe en ReservasRoute.js y
  // que incluye correctamente la asociacion con PlatosModel (plato.Nom_Plato).
  // El endpoint anterior /api/Menus/fecha/:fecha no existia en MenusRoutes.js.
  const Cargar_Platos = async (TipoComida) => {
    const FechaHoy = new Date().toISOString().split("T")[0];
    try {
      const Respuesta = await apiAxios.get(
        `/api/Reservas/reservar/Menu/${FechaHoy}/${TipoComida}`
      );
      Set_PlatosDisp(Respuesta.data || []);
      Set_Plato("");
    } catch (Error) {
      console.error("[Novedades] Error cargando menu del dia:", Error);
      Set_PlatosDisp([]);
    }
  };

  const Cargar_Tipos_Permitidos = async (RolesAprendiz) => {
    try {
      const Respuesta = await apiAxios.post("/api/Novedades/tipos-comida", {
        roles: RolesAprendiz,
      });
      const TiposRecibidos = Respuesta.data.tipos || [];
      Set_TiposDisp(TiposRecibidos);
      Set_Tipo(TiposRecibidos[0] || "");
    } catch (Error) {
      console.error("[Novedades] Error cargando tipos de comida:", Error);
      Set_TiposDisp([]);
    }
  };

  const Manejar_Seleccionar = (UsuarioElegido) => {
    Set_UsuarioSel(UsuarioElegido);
    Set_Busqueda(`${UsuarioElegido.Nom_Usuario} ${UsuarioElegido.Ape_Usuario}`);
    Set_Plato("");
    Set_Jus_Reserva("");
    // Cargar_Tipos_Permitidos actualiza Tipo, lo que dispara el useEffect
    // que llama a Cargar_Platos con el nuevo tipo. No hay que llamar Cargar_Platos aqui.
    Cargar_Tipos_Permitidos(UsuarioElegido.roles || []);
  };

  const Limpiar_Seleccion = () => {
    Set_UsuarioSel(null);
    Set_Busqueda("");
    Set_Tipo("Almuerzo");
    Set_Plato("");
    Set_Jus_Reserva("");
    Set_TiposDisp([]);
    Set_PlatosDisp([]);
  };

  const Manejar_Registrar = async () => {
    if (!UsuarioSel) {
      Set_Mensaje({ tipo: "error", texto: "Selecciona un aprendiz primero" });
      return;
    }
    if (!Tipo) {
      Set_Mensaje({ tipo: "error", texto: "El tipo de comida no esta disponible para este aprendiz" });
      return;
    }
    if (!Plato) {
      Set_Mensaje({ tipo: "error", texto: "Debes seleccionar un plato del menu del dia" });
      return;
    }
    if (!Jus_Reserva.trim()) {
      Set_Mensaje({ tipo: "error", texto: "Debes escribir una justificacion para la novedad" });
      return;
    }

    try {
      Set_Cargando(true);
      await apiAxios.post("/api/Novedades/crear", {
        Id_UsuarioAprendiz: UsuarioSel.Id_Usuario,
        Tip_Reserva: Tipo,
        platoElegido: parseInt(Plato),
        Jus_Reserva: Jus_Reserva.trim(),
      });

      Set_Mensaje({
        tipo: "exito",
        texto: `Novedad registrada correctamente para ${UsuarioSel.Nom_Usuario} ${UsuarioSel.Ape_Usuario}`,
      });

      Limpiar_Seleccion();
      Cargar_Excepcionales();
    } catch (Error) {
      Set_Mensaje({
        tipo: "error",
        texto: Error.response?.data?.message || "Error al registrar la novedad",
      });
    } finally {
      Set_Cargando(false);
      setTimeout(() => Set_Mensaje(null), 4000);
    }
  };

  // CORRECCION: PlatosFiltrados ahora es igual a PlatosDisp porque el endpoint
  // /api/Reservas/reservar/Menu/:Fecha/:Tipo ya filtra por tipo en el servidor.
  // El filtro anterior en el cliente nunca funcionaba porque los datos no llegaban.
  const PlatosFiltrados = PlatosDisp;

  const UsuariosFiltrados = Usuarios.filter(
    (U) =>
      `${U.Nom_Usuario} ${U.Ape_Usuario}`
        .toLowerCase()
        .includes(Busqueda.toLowerCase()) ||
      String(U.NumDoc_Usuario).includes(Busqueda)
  );

  // =========================================================================
  // FUNCIONES NUEVAS - REPORTE (no modificadas respecto a la version anterior)
  // =========================================================================

  const Cargar_Reporte = async () => {
    try {
      Set_Cargando_Reporte(true);
      const Respuesta = await apiAxios.get("/api/Novedades/reporte/hoy");
      Set_Datos_Reporte(Respuesta.data);
      Set_Mostrar_Reporte(true);
    } catch (Error) {
      console.error("[Novedades] Error cargando reporte del dia:", Error);
    } finally {
      Set_Cargando_Reporte(false);
    }
  };

  const Cerrar_Reporte = () => {
    Set_Mostrar_Reporte(false);
    Set_Datos_Reporte(null);
  };

  const Formatear_Hora = (Iso_String) => {
    if (!Iso_String) return "--";
    const Fecha = new Date(Iso_String);
    return Fecha.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  };

  // =========================================================================
  // RENDER - NO MODIFICADO
  // =========================================================================

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">

      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1861c1]">
          Modulo de Novedades
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Gestiona reservas excepcionales y el estado Especial de los aprendices externos
        </p>
      </div>

      {Mensaje && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
            Mensaje.tipo === "exito"
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-red-100 text-red-700 border border-red-200"
          }`}
        >
          {Mensaje.texto}
        </div>
      )}

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => Set_TabActiva("novedades")}
          className={`pb-3 px-4 text-sm font-medium transition border-b-2 -mb-px ${
            TabActiva === "novedades"
              ? "border-[#1861c1] text-[#1861c1]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Registrar Novedad
        </button>

        <button
          onClick={() => Set_TabActiva("especial")}
          className={`pb-3 px-4 text-sm font-medium transition border-b-2 -mb-px flex items-center gap-2 ${
            TabActiva === "especial"
              ? "border-purple-500 text-purple-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Estado Especial
          {Usuarios.filter((U) => U.Est_Usuario === "Especial").length > 0 && (
            <span className="bg-purple-100 text-purple-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {Usuarios.filter((U) => U.Est_Usuario === "Especial").length}
            </span>
          )}
        </button>
      </div>

      {TabActiva === "novedades" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2 border-b pb-3">
              <span className="w-8 h-8 bg-[#1861c1]/10 rounded-lg flex items-center justify-center text-[#1861c1]">
                <i className="fas fa-plus text-sm"></i>
              </span>
              Registrar Reserva Excepcional
            </h2>

            <BuscadorAprendiz
              Busqueda={Busqueda}
              Set_Busqueda={Set_Busqueda}
              Usuarios_Filtrados={UsuariosFiltrados}
              Set_UsuarioSel={Set_UsuarioSel}
              Set_Tipo={Set_Tipo}
              Usuario_Seleccionado={UsuarioSel}
              Manejar_Seleccionar={Manejar_Seleccionar}
            />

            <TarjetaSeleccionado
              Usuario={UsuarioSel}
              Limpiar_Seleccion={Limpiar_Seleccion}
            />

            {UsuarioSel && (
              <div className="space-y-4">
                {TiposDisp.length === 0 ? (
                  <div className="text-sm text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                    Este aprendiz no tiene un rol valido para recibir novedades.
                  </div>
                ) : (
                  <>
                    <SelectorTipo
                      Tipos_Disponibles={TiposDisp}
                      Tipo={Tipo}
                      Set_Tipo={(NuevoTipo) => {
                        Set_Tipo(NuevoTipo);
                        Set_Plato("");
                        // El cambio de Tipo dispara el useEffect que recarga los platos.
                        // No hace falta llamar a Cargar_Platos aqui manualmente.
                      }}
                    />

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">
                        Plato (Menu del dia)
                      </label>
                      {PlatosFiltrados.length > 0 ? (
                        <select
                          value={Plato}
                          onChange={(E) => Set_Plato(E.target.value)}
                          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">-- Seleccione un plato --</option>
                          {PlatosFiltrados.map((M) => (
                            <option key={M.Id_Menu} value={M.plato?.Id_Plato}>
                              {M.plato?.Nom_Plato}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded-xl border text-center">
                          No hay menu programado para {Tipo} hoy
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">
                        Justificacion
                      </label>
                      <textarea
                        value={Jus_Reserva}
                        onChange={(E) => Set_Jus_Reserva(E.target.value)}
                        placeholder="Explique el motivo de esta novedad (minimo 5 caracteres)..."
                        rows="2"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      />
                    </div>

                    <button
                      onClick={Manejar_Registrar}
                      disabled={Cargando || !Plato || !Jus_Reserva.trim()}
                      className="w-full py-3 rounded-xl font-semibold bg-[#42b72a] text-white hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {Cargando ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        "Registrar Novedad"
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <ListaNovedades
            Reservas={Exc_Reservas}
            Manejar_Reporte={Cargar_Reporte}
            Cargando_Reporte={Cargando_Reporte}
          />
        </div>
      )}

      {TabActiva === "especial" && (
        <PanelEspecial Usuarios={Usuarios} />
      )}

      {Mostrar_Reporte && Datos_Reporte && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(E) => { if (E.target === E.currentTarget) Cerrar_Reporte(); }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
            onClick={(E) => E.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-800">
                  Reporte de Novedades del Dia
                </h3>
                <p className="text-xs text-gray-400">
                  Fecha: {Datos_Reporte.fecha} &mdash; Generado:{" "}
                  {new Date(Datos_Reporte.generadoEn).toLocaleTimeString("es-CO", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="text-xs bg-[#1861c1] text-white px-3 py-1.5 rounded-lg font-medium hover:bg-[#1452a8] transition flex items-center gap-1.5"
                >
                  <i className="fas fa-print text-xs"></i>
                  Imprimir
                </button>
                <button
                  onClick={Cerrar_Reporte}
                  className="text-gray-400 hover:text-gray-600 transition w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100"
                >
                  <i className="fas fa-times text-sm"></i>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-[#1861c1]/5 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-[#1861c1]">{Datos_Reporte.total}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Total novedades</p>
                </div>
                {Object.entries(Datos_Reporte.porTipo).map(([Tipo_Comida, Conteo]) => (
                  <div key={Tipo_Comida} className="bg-orange-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-orange-500">{Conteo}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{Tipo_Comida}</p>
                  </div>
                ))}
                {Object.entries(Datos_Reporte.porEstado).map(([Estado, Conteo]) => (
                  <div key={Estado} className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{Conteo}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{Estado}</p>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Detalle de Novedades</h4>
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">#</th>
                        <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Aprendiz</th>
                        <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Documento</th>
                        <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Tipo</th>
                        <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Plato</th>
                        <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Estado</th>
                        <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Datos_Reporte.detalle.map((Fila, Idx) => (
                        <tr key={Fila.Id_Reserva} className="border-t border-gray-50 hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-400">{Idx + 1}</td>
                          <td className="px-3 py-2 text-gray-700 font-medium">{Fila.Aprendiz}</td>
                          <td className="px-3 py-2 text-gray-500">{Fila.Documento}</td>
                          <td className="px-3 py-2 text-gray-600">{Fila.Tipo}</td>
                          <td className="px-3 py-2 text-gray-600">{Fila.Plato}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full font-semibold ${
                              Fila.Estado === "Consumido"
                                ? "bg-green-100 text-green-600"
                                : Fila.Estado === "Cancelado" || Fila.Estado === "Vencido"
                                ? "bg-red-100 text-red-500"
                                : Fila.Estado === "Verificado"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-orange-100 text-orange-600"
                            }`}>
                              {Fila.Estado}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-400">{Formatear_Hora(Fila.HoraCreacion)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {Datos_Reporte.detalle.length === 0 && (
                    <p className="text-center text-gray-400 text-xs py-6">
                      No hay novedades registradas para generar el reporte
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Novedades;