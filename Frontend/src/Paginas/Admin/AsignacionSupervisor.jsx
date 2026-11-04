// Frontend/src/Paginas/Admin/AsignacionSupervisor.jsx
// Módulo de Asignación Temporal de Supervisor (Bienestar y Coordinación)
// Permite asignar el rol de Supervisor a un usuario por un periodo determinado.
// Al cumplirse la fecha fin, el sistema lo destituye automáticamente.

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ShieldCheck, Calendar, Clock, Search, Plus, Trash2, RefreshCw,
  UserCheck, AlertTriangle, CheckCircle2, FileSpreadsheet, Eye,
  ArrowRight, Sparkles, UserX, Info
} from "lucide-react";
import apiAxios from "../../api/axiosConfig";
import FoodsysToast from "../../Components/UI/FoodsysToast";
import FoodsysConfirmModal from "../../Components/UI/FoodsysConfirmModal";
import GlobalLoader from "../../Components/GlobalLoader";
import * as XLSX from "xlsx";

export default function AsignacionSupervisor() {
  const hoyBogotaStr = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

  // Estado general
  const [asignaciones, setAsignaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS"); // 'TODOS' | 'ACTIVO' | 'PROGRAMADO' | 'VENCIDO' | 'REVOCADO'

  // Formulario de asignación
  const [numDoc, setNumDoc] = useState("");
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);
  const [buscandoUsuario, setBuscandoUsuario] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState("");
  const [fechaInicio, setFechaInicio] = useState(hoyBogotaStr);
  const [fechaFin, setFechaFin] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(d);
  });
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [revisandoVencidos, setRevisandoVencidos] = useState(false);

  // Modal para revocar
  const [asignacionARevocar, setAsignacionARevocar] = useState(null);
  const [revocando, setRevocando] = useState(false);

  // Búsqueda en tiempo real por documento del usuario
  useEffect(() => {
    const docLimpio = numDoc.trim().replace(/\D/g, "");
    if (docLimpio.length < 5) {
      setUsuarioEncontrado(null);
      setErrorBusqueda("");
      return;
    }

    const timer = setTimeout(async () => {
      setBuscandoUsuario(true);
      setErrorBusqueda("");
      try {
        const res = await apiAxios.get(`/api/Usuarios/buscar-documento/${docLimpio}`);
        const u = res.data?.usuario || (res.data?.Id_Usuario ? res.data : null);
        if (u && (u.Nom_Usuario || u.Id_Usuario)) {
          setUsuarioEncontrado(u);
          setErrorBusqueda("");
        } else {
          setUsuarioEncontrado(null);
          setErrorBusqueda("No se encontró ningún usuario con este número de documento.");
        }
      } catch (err) {
        setUsuarioEncontrado(null);
        setErrorBusqueda(err.response?.data?.message || "No se encontró ningún usuario con ese documento.");
      } finally {
        setBuscandoUsuario(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [numDoc]);

  // Cargar asignaciones desde el backend
  const cargarAsignaciones = useCallback(async () => {
    setCargando(true);
    try {
      const res = await apiAxios.get("/api/asignacion-supervisor/listar");
      const lista = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.asignaciones) ? res.data.asignaciones : [];
      setAsignaciones(lista);
    } catch (err) {
      console.error("Error al cargar asignaciones de supervisor:", err);
      FoodsysToast.error("Error al cargar asignaciones de supervisor.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarAsignaciones();
  }, [cargarAsignaciones]);

  // Guardar nueva asignación
  const handleGuardarAsignacion = async (e) => {
    e.preventDefault();
    const docLimpio = numDoc.trim().replace(/\D/g, "");

    if (!docLimpio) {
      FoodsysToast.warning("Ingresa un número de documento válido.");
      return;
    }

    if (!usuarioEncontrado) {
      FoodsysToast.warning("Espera a que el sistema encuentre el usuario antes de asignar.");
      return;
    }

    if (fechaInicio > fechaFin) {
      FoodsysToast.warning("La fecha de inicio no puede ser posterior a la fecha de fin.");
      return;
    }

    setGuardando(true);
    try {
      const res = await apiAxios.post("/api/asignacion-supervisor/crear", {
        Id_Usuario: usuarioEncontrado.Id_Usuario,
        NumDoc_Usuario: docLimpio,
        Fecha_Inicio: fechaInicio,
        Fecha_Fin: fechaFin,
        Observaciones: observaciones
      });

      FoodsysToast.success(res.data?.mensaje || "Rol de Supervisor asignado exitosamente.");
      setNumDoc("");
      setUsuarioEncontrado(null);
      setObservaciones("");
      cargarAsignaciones();
    } catch (err) {
      console.error("Error al asignar supervisor:", err);
      const msg = err.response?.data?.mensaje || err.message || "Error al asignar rol de supervisor.";
      FoodsysToast.error(msg);
    } finally {
      setGuardando(false);
    }
  };

  // Revocar asignación
  const confirmarRevocar = async () => {
    if (!asignacionARevocar) return;
    setRevocando(true);
    try {
      const id = asignacionARevocar.Id_Asignacion_Supervisor;
      const res = await apiAxios.delete(`/api/asignacion-supervisor/${id}/revocar`);
      FoodsysToast.success(res.data?.mensaje || "Rol de Supervisor revocado y destituido exitosamente.");
      setAsignacionARevocar(null);
      cargarAsignaciones();
    } catch (err) {
      console.error("Error al revocar supervisor:", err);
      const msg = err.response?.data?.mensaje || err.message || "Error al revocar asignación.";
      FoodsysToast.error(msg);
    } finally {
      setRevocando(false);
    }
  };

  // Revisar vencidos manualmente
  const handleRevisarVencidos = async () => {
    setRevisandoVencidos(true);
    try {
      const res = await apiAxios.post("/api/asignacion-supervisor/revisar-vencidos");
      FoodsysToast.success(res.data?.mensaje || "Revisión completada. Se revirtieron los vencidos.");
      cargarAsignaciones();
    } catch (err) {
      FoodsysToast.error("Error al revisar vencidos.");
    } finally {
      setRevisandoVencidos(false);
    }
  };

  // Exportar a Excel
  const handleExportarExcel = () => {
    if (asignaciones.length === 0) {
      FoodsysToast.info("No hay datos para exportar.");
      return;
    }
    const data = asignaciones.map((a, i) => ({
      "#": i + 1,
      "Documento": a.NumDoc_Usuario || a.usuario?.NumDoc_Usuario || "",
      "Nombre Completo": `${a.usuario?.Nom_Usuario || ""} ${a.usuario?.Ape_Usuario || ""}`.trim() || a.Nom_Usuario || "",
      "Fecha Inicio": a.Fecha_Inicio,
      "Fecha Fin": a.Fecha_Fin,
      "Estado": a.Estado,
      "Observaciones": a.Observaciones || "",
      "Asignado Por": a.asignador?.Nom_Usuario ? `${a.asignador.Nom_Usuario} ${a.asignador.Ape_Usuario || ""}` : "Administración"
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Supervisores");
    XLSX.writeFile(wb, `Asignaciones_Supervisores_${hoyBogotaStr}.xlsx`);
    FoodsysToast.success("Archivo Excel generado con éxito.");
  };

  // Filtrado de lista
  const asignacionesFiltradas = useMemo(() => {
    return asignaciones.filter((a) => {
      const cumpleFiltro = filtroEstado === "TODOS" || a.Estado === filtroEstado;
      if (!cumpleFiltro) return false;

      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase().trim();
      const doc = String(a.NumDoc_Usuario || a.usuario?.NumDoc_Usuario || "").toLowerCase();
      const nom = `${a.usuario?.Nom_Usuario || ""} ${a.usuario?.Ape_Usuario || ""}`.toLowerCase();
      const obs = (a.Observaciones || "").toLowerCase();
      return doc.includes(q) || nom.includes(q) || obs.includes(q);
    });
  }, [asignaciones, filtroEstado, busqueda]);

  const pillEstado = (est) => {
    switch (est) {
      case "ACTIVO":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Activo</span>;
      case "PROGRAMADO":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">Programado</span>;
      case "VENCIDO":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">Destituido (Vencido)</span>;
      case "REVOCADO":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">Revocado</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{est}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Cabecera */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <ShieldCheck size={26} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Asignación de Supervisor
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Gestión de Supervisores asignados por tiempo determinado con destitución automática
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRevisarVencidos}
              disabled={revisandoVencidos}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Comprobar asignaciones cuya fecha fin ya caducó y destituir el rol automáticamente"
            >
              <RefreshCw size={14} className={revisandoVencidos ? "animate-spin" : ""} />
              <span>Verificar Vencidos</span>
            </button>
            <button
              onClick={handleExportarExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm cursor-pointer"
            >
              <FileSpreadsheet size={14} />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>

        {/* Banner informativo */}
        <div className="mt-4 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-900">
          <Info size={16} className="text-emerald-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Regla Operativa Oficial:</strong> Bienestar al Aprendiz y Coordinación pueden asignar a un usuario (aprendiz, pasante o funcionario) el rol de <strong>Supervisor</strong> para un rango de fechas específico. Durante la vigencia, el usuario tiene acceso a las funciones de supervisión en comedor. Al llegar la medianoche de la <strong>Fecha de Fin</strong>, el sistema <strong>destituye automáticamente</strong> el rol de Supervisor sin necesidad de intervención manual.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Formulario de Asignación */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Plus size={18} className="text-emerald-600" />
            <h2 className="text-base font-bold text-slate-800">Nueva Asignación</h2>
          </div>

          <form onSubmit={handleGuardarAsignacion} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Documento de Identidad del Usuario *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={numDoc}
                  onChange={(e) => setNumDoc(e.target.value)}
                  placeholder="Ej: 1109381233 (búsqueda en tiempo real)"
                  required
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
                {buscandoUsuario && (
                  <span className="absolute right-3 top-2.5 text-[11px] text-emerald-600 font-bold animate-pulse">
                    Buscando...
                  </span>
                )}
              </div>

              {/* Información del usuario encontrado */}
              {usuarioEncontrado && (
                <div className="mt-2.5 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs space-y-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-emerald-950 text-sm">
                      {usuarioEncontrado.Nom_Usuario} {usuarioEncontrado.Ape_Usuario}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/80 text-emerald-900 border border-emerald-300">
                      {(usuarioEncontrado.roles || []).join(", ") || "Usuario"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <p className="m-0"><strong>Documento:</strong> {usuarioEncontrado.NumDoc_Usuario}</p>
                    <p className="m-0"><strong>Correo:</strong> {usuarioEncontrado.Cor_Usuario || "No registrado"}</p>
                    {usuarioEncontrado.Num_Ficha && (
                      <p className="m-0"><strong>Ficha:</strong> {usuarioEncontrado.Num_Ficha} · {usuarioEncontrado.Nom_Programa || ""}</p>
                    )}
                  </div>
                </div>
              )}

              {errorBusqueda && !usuarioEncontrado && (
                <p className="mt-1.5 text-[11px] font-semibold text-rose-600 m-0">
                  {errorBusqueda}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fecha de Fin (Destitución) *
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  min={fechaInicio}
                  onChange={(e) => setFechaFin(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Observaciones o Justificación (Opcional)
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                placeholder="Ej: Asignado para apoyo de supervisión en comedor durante el mes de formación..."
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={guardando || !usuarioEncontrado}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <ShieldCheck size={16} />
              <span>{guardando ? "Asignando..." : "Asignar Rol de Supervisor"}</span>
            </button>
          </form>
        </div>

        {/* Tabla de Asignaciones */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Historial de Asignaciones ({asignacionesFiltradas.length})
              </h2>
              <p className="text-xs text-slate-400">
                Supervisores temporales asignados por Bienestar y Coordinación
              </p>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar documento o nombre..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="ACTIVO">Activos</option>
                <option value="PROGRAMADO">Programados</option>
                <option value="VENCIDO">Destituidos (Vencidos)</option>
                <option value="REVOCADO">Revocados</option>
              </select>
            </div>
          </div>

          {cargando ? (
            <div className="py-12 flex justify-center">
              <GlobalLoader />
            </div>
          ) : asignacionesFiltradas.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No se encontraron asignaciones de supervisor registradas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-100 text-[10px]">
                  <tr>
                    <th className="p-3">Usuario</th>
                    <th className="p-3">Documento</th>
                    <th className="p-3">Vigencia Asignada</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Asignado Por</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {asignacionesFiltradas.map((a) => (
                    <tr key={a.Id_Asignacion_Supervisor} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 font-semibold text-slate-900">
                        {a.usuario ? `${a.usuario.Nom_Usuario} ${a.usuario.Ape_Usuario || ""}` : a.Nom_Usuario || "Usuario"}
                      </td>
                      <td className="p-3 text-slate-600 font-mono">
                        {a.NumDoc_Usuario || a.usuario?.NumDoc_Usuario || "--"}
                      </td>
                      <td className="p-3 text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          <span>{a.Fecha_Inicio} al {a.Fecha_Fin}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {pillEstado(a.Estado)}
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">
                        {a.asignador?.Nom_Usuario ? `${a.asignador.Nom_Usuario} ${a.asignador.Ape_Usuario || ""}` : "Administración"}
                      </td>
                      <td className="p-3 text-right">
                        {(a.Estado === "ACTIVO" || a.Estado === "PROGRAMADO") && (
                          <button
                            onClick={() => setAsignacionARevocar(a)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                            title="Destituir y revocar el rol de Supervisor antes de tiempo"
                          >
                            <UserX size={12} />
                            <span>Revocar</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmación de Revocación */}
      {asignacionARevocar && (
        <FoodsysConfirmModal
          abierto={Boolean(asignacionARevocar)}
          titulo="¿Destituir rol de Supervisor?"
          mensaje={`¿Estás seguro de revocar anticipadamente el rol de Supervisor a ${asignacionARevocar.usuario?.Nom_Usuario || asignacionARevocar.Nom_Usuario || "este usuario"}? Su permiso quedará inactivo de inmediato.`}
          textoConfirmar={revocando ? "Revocando..." : "Sí, Destituir Rol"}
          textoCancelar="Cancelar"
          variante="danger"
          enConfirmar={confirmarRevocar}
          enCancelar={() => setAsignacionARevocar(null)}
        />
      )}
    </div>
  );
}

