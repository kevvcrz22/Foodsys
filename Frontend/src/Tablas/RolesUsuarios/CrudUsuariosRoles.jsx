// Frontend/src/Tablas/RolesUsuarios/CrudUsuariosRoles.jsx
// Modulo de gestion y asignacion de Roles a Usuarios en Foodsys.
// Incluye botones de exportacion a Excel y PDF con confirmacion inteligente,
// guia didactica para administradores y sincronizacion inmediata en tiempo real.
// Codigo comentado didacticamente sin tildes ni emojis para aprendices de primer semestre.

import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig.js";
import DataTable from "react-data-table-component";
import toast from "react-hot-toast";
import UsuariosRolesForm from "../RolesUsuarios/UsuariosRolesForm.jsx";
import { exportarAExcel, exportarAPDF, confirmarExportacion } from "../../utils/exportUtils";
import GlobalLoader from "../../Components/GlobalLoader";
import {
  Shield, Plus, Search, X, Pencil, Trash2, Users, Undo2,
  Upload, FileText, HelpCircle, ChevronDown, ChevronUp
} from "lucide-react";

const rolColors = {
  "Administrador":    { bg: "#fce7f3", color: "#9d174d" },
  "Coordinador":      { bg: "#ede9fe", color: "#6d28d9" },
  "Supervisor":       { bg: "#fef3c7", color: "#92400e" },
  "Aprendiz Interno": { bg: "#d1fae5", color: "#065f46" },
  "Aprendiz Externo": { bg: "#dbeafe", color: "#1e3a5f" },
  "Pasante Interno":  { bg: "#fef3c7", color: "#92400e" },
  "Pasante Externo":  { bg: "#e0f2fe", color: "#0369a1" },
  "Cocina":           { bg: "#f0fdfa", color: "#0d9488" },
  "Bienestar":        { bg: "#fce7f3", color: "#9d174d" },
  "Monitor":          { bg: "#fff7ed", color: "#9a3412" },
};

const RolBadge = ({ nombre }) => {
  const c = rolColors[nombre] || { bg: "#f3f4f6", color: "#374151" };
  return (
    <span style={{ background: c.bg, color: c.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
      <Shield size={10} />{nombre}
    </span>
  );
};

const CrudUsuariosRoles = () => {
  const [usuariosRol, setUsuariosRol] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [editar, setEditar] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [mostrarGuia, setMostrarGuia] = useState(false);

  useEffect(() => {
    getAllUsuariosRol();
    return () => toast.dismiss();
  }, []);

  const getAllUsuariosRol = async () => {
    setCargando(true);
    try {
      const response = await apiAxios.get("/api/UsuariosRoles");
      const data = Array.isArray(response.data) ? response.data.map((item) => ({
        ...item,
        rol: item.rol || item.rolUsuario || null,
      })) : [];
      setUsuariosRol(data);
    } catch (error) {
      console.error("Error al cargar UsuariosRol:", error);
      toast.error("Error al cargar asignaciones de roles");
    } finally {
      setCargando(false);
    }
  };

  const eliminarItem = (row) => {
    const nombre = `${row.usuario?.Nom_Usuario || ""} ${row.usuario?.Ape_Usuario || ""}`.trim();
    const rolNombre = row.rol?.Nom_Rol || "este rol";

    toast.custom((t) => (
      <div className="max-w-md w-full bg-white shadow-2xl rounded-2xl p-4 border border-slate-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0 text-rose-600">
            <Trash2 size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-800 m-0">¿Quitar rol asignado?</h4>
            <p className="text-xs text-slate-500 mt-1 mb-0 leading-relaxed">
              ¿Estas seguro de quitar el rol <span className="font-semibold text-slate-700">"{rolNombre}"</span> a <span className="font-semibold text-slate-700">{nombre}</span>?
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              toast("Accion cancelada", { icon: <Undo2 size={16} className="text-slate-500" />, duration: 1500 });
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer border-0"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              procederEliminarItem(row);
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm cursor-pointer border-0"
          >
            Si, quitar rol
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const procederEliminarItem = async (row) => {
    try {
      await apiAxios.delete(`/api/UsuariosRoles/${row.Id_UsuariosRol}`);
      toast.success("Rol quitado correctamente");

      // Sincronizacion si es el usuario autenticado
      try {
        const usuarioActualRaw = localStorage.getItem("usuario");
        if (usuarioActualRaw) {
          const usuarioActual = JSON.parse(usuarioActualRaw);
          if (Number(usuarioActual.Id_Usuario) === Number(row.Id_Usuario)) {
            const resUsuario = await apiAxios.get(`/api/Usuarios/${row.Id_Usuario}`);
            if (resUsuario.data && Array.isArray(resUsuario.data.roles)) {
              localStorage.setItem("roles", JSON.stringify(resUsuario.data.roles));
              const rolActivo = localStorage.getItem("rolActivo");
              if (!resUsuario.data.roles.includes(rolActivo) && resUsuario.data.roles.length > 0) {
                localStorage.setItem("rolActivo", resUsuario.data.roles[0]);
              }
              window.dispatchEvent(new Event("rolesActualizados"));
            }
          }
        }
      } catch (errSync) {
        console.warn("Error al sincronizar roles en vivo:", errSync);
      }

      getAllUsuariosRol();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al eliminar asignacion de rol");
    }
  };

  const editItem = (row) => { setSelectedItem(row); setEditar(true); setIsModalOpen(true); };
  const hideModal = () => { setIsModalOpen(false); setSelectedItem(null); setEditar(false); };

  const newList = usuariosRol.filter((item) => {
    const text = filterText.toLowerCase();
    return (
      String(item.usuario?.NumDoc_Usuario || "").includes(text) ||
      String(item.usuario?.Nom_Usuario || "").toLowerCase().includes(text) ||
      String(item.usuario?.Ape_Usuario || "").toLowerCase().includes(text) ||
      String(item.rol?.Nom_Rol || "").toLowerCase().includes(text)
    );
  });

  const tieneFiltrosActivos = Boolean(filterText);

  // ── Exportar a Excel con confirmacion inteligente ──
  const handleExportarExcel = async () => {
    if (usuariosRol.length === 0) {
      toast.error("No hay asignaciones para exportar.");
      return;
    }

    const decision = await confirmarExportacion({
      totalOriginal: usuariosRol.length,
      totalFiltrado: newList.length,
      tieneFiltrosActivos,
      formato: "Excel",
      nombreModulo: "asignaciones de roles"
    });

    if (!decision) return;

    setExportando(true);
    try {
      const registros = decision === "filtrados" ? newList : usuariosRol;

      const datosFormateados = registros.map((ur) => ({
        "ID Asignacion": ur.Id_UsuariosRol,
        "ID Usuario": ur.Id_Usuario || "",
        "Documento": ur.usuario?.NumDoc_Usuario || "",
        "Nombres": ur.usuario?.Nom_Usuario || "",
        "Apellidos": ur.usuario?.Ape_Usuario || "",
        "Correo": ur.usuario?.Cor_Usuario || "",
        "ID Rol": ur.Id_Rol || "",
        "Nombre Rol": ur.rol?.Nom_Rol || "Sin rol",
        "Fecha Creacion": ur.createdat ? new Date(ur.createdat).toLocaleString("es-CO") : "",
        "Ultima Actualizacion": ur.updatedat ? new Date(ur.updatedat).toLocaleString("es-CO") : ""
      }));

      const fecha = new Date().toISOString().split("T")[0];
      exportarAExcel({
        datos: datosFormateados,
        nombreArchivo: `Foodsys_Usuarios_Roles_${decision}_${fecha}.xlsx`,
        nombreHoja: "UsuariosRoles"
      });

      toast.success(`Archivo Excel exportado con ${registros.length} asignaciones.`);
    } catch (err) {
      console.error("Error al exportar Excel:", err);
      toast.error("Error al generar el archivo Excel.");
    } finally {
      setExportando(false);
    }
  };

  // ── Exportar a PDF con confirmacion inteligente ──
  const handleExportarPDF = async () => {
    if (usuariosRol.length === 0) {
      toast.error("No hay asignaciones para exportar.");
      return;
    }

    const decision = await confirmarExportacion({
      totalOriginal: usuariosRol.length,
      totalFiltrado: newList.length,
      tieneFiltrosActivos,
      formato: "PDF",
      nombreModulo: "asignaciones de roles"
    });

    if (!decision) return;

    setExportando(true);
    try {
      const registros = decision === "filtrados" ? newList : usuariosRol;

      const columnasPDF = [
        { header: "ID", dataKey: "id" },
        { header: "Documento", dataKey: "doc" },
        { header: "Usuario", dataKey: "usuario" },
        { header: "Rol Asignado", dataKey: "rol" }
      ];

      const filasPDF = registros.map((ur) => ({
        id: ur.Id_UsuariosRol,
        doc: ur.usuario?.NumDoc_Usuario || "—",
        usuario: `${ur.usuario?.Nom_Usuario || ""} ${ur.usuario?.Ape_Usuario || ""}`.trim() || "—",
        rol: ur.rol?.Nom_Rol || "Sin rol"
      }));

      const fecha = new Date().toISOString().split("T")[0];
      exportarAPDF({
        titulo: "Matriz Institucional de Asignacion de Roles",
        subtitulo: `Centro Agropecuario "La Granja" - Registros: ${registros.length} (${decision})`,
        columnas: columnasPDF,
        datos: filasPDF,
        nombreArchivo: `Foodsys_Usuarios_Roles_${decision}_${fecha}.pdf`,
        orientacion: "portrait"
      });

      toast.success(`Archivo PDF generado con ${registros.length} asignaciones.`);
    } catch (err) {
      console.error("Error al exportar PDF:", err);
      toast.error("Error al generar el documento PDF.");
    } finally {
      setExportando(false);
    }
  };

  const columnsTable = [
    { name: "ID", selector: (row) => row.Id_UsuariosRol, sortable: true, width: "65px" },
    {
      name: "Usuario",
      selector: (row) => `${row.usuario?.Nom_Usuario || ""} ${row.usuario?.Ape_Usuario || ""}`,
      sortable: true,
      grow: 2,
      minWidth: "220px",
      cell: (row) => {
        const nombre = `${row.usuario?.Nom_Usuario || ""} ${row.usuario?.Ape_Usuario || ""}`.trim();
        const initials = nombre.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
        return (
          <div className="flex items-center gap-2.5 py-1.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
              <span className="text-violet-700 font-semibold text-[11px]">{initials || "?"}</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 text-[13px] m-0 truncate">{nombre || "—"}</p>
              <p className="text-[11px] text-slate-400 m-0 truncate">{row.usuario?.NumDoc_Usuario || "—"}</p>
            </div>
          </div>
        );
      },
    },
    {
      name: "Rol",
      selector: (row) => row.rol?.Nom_Rol,
      sortable: true,
      minWidth: "150px",
      cell: (row) => row.rol?.Nom_Rol ? <RolBadge nombre={row.rol.Nom_Rol} /> : <span className="text-slate-400 text-xs whitespace-nowrap">Sin rol</span>,
    },
    {
      name: "Acciones",
      minWidth: "160px",
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            className="bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors whitespace-nowrap"
            onClick={() => editItem(row)}
          >
            <Pencil size={12} /> Editar
          </button>
          <button
            className="bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors whitespace-nowrap"
            onClick={() => eliminarItem(row)}
          >
            <Trash2 size={12} /> Quitar
          </button>
        </div>
      ),
    },
  ];

  const customStyles = {
    headRow: {
      style: {
        background: "#f8fafc",
        fontSize: 11,
        fontWeight: 700,
        color: "#6b7280",
        borderBottom: "1px solid #e5e7eb",
        textTransform: "uppercase",
      },
    },
    rows: {
      style: {
        fontSize: 13,
        borderBottom: "1px solid #f3f4f6",
        "&:hover": { background: "#f5f3ff" },
      },
    },
    pagination: { style: { borderTop: "1px solid #e5e7eb", fontSize: 13 } },
  };

  return (
    <div className="w-full flex flex-col gap-4 p-3 sm:p-5 bg-slate-50 min-h-screen">
      {/* Guia Didactica */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <button
          onClick={() => setMostrarGuia(!mostrarGuia)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-indigo-50 border-0 cursor-pointer text-left transition-colors hover:from-violet-100 hover:to-indigo-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center">
              <HelpCircle size={18} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm m-0">¿Como asignar roles a usuarios? (Guia paso a paso)</p>
              <p className="text-xs text-slate-500 m-0">Vincula multiples perfiles a un usuario y exporta la matriz de permisos</p>
            </div>
          </div>
          {mostrarGuia ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {mostrarGuia && (
          <div className="p-4 bg-white border-t border-slate-100 text-xs text-slate-600 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="font-bold text-violet-700 uppercase tracking-wide">1. Multiples Roles</p>
              <p>Un usuario puede tener 2 o mas roles (ej: Administrador y Supervisor). El sistema le permitira cambiar de rol activo sin cerrar sesion.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-indigo-700 uppercase tracking-wide">2. Asignacion Automatica</p>
              <p>Al importar usuarios en Excel, el sistema asigna automaticamente Aprendiz Interno o Externo segun el Centro de Convivencia.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-emerald-700 uppercase tracking-wide">3. Exportacion</p>
              <p>Descarga la matriz de asignacion en Excel o PDF para soporte de auditorias del sistema de informacion.</p>
            </div>
          </div>
        )}
      </div>

      {/* Panel Principal */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <Shield size={18} />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 text-base sm:text-lg m-0">Asignacion de Roles a Usuarios</h1>
                <p className="text-xs text-slate-500 m-0">{usuariosRol.length} roles asignados</p>
              </div>
            </div>

            {/* Botones de Accion */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleExportarExcel}
                disabled={exportando || usuariosRol.length === 0}
                className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer hover:bg-blue-100 transition-colors disabled:opacity-50"
                title="Exportar asignaciones a Excel"
              >
                <Upload size={14} /> {exportando ? "Exportando..." : "Exportar Excel"}
              </button>

              <button
                onClick={handleExportarPDF}
                disabled={exportando || usuariosRol.length === 0}
                className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer hover:bg-rose-100 transition-colors disabled:opacity-50"
                title="Exportar asignaciones a PDF"
              >
                <FileText size={14} /> Exportar PDF
              </button>

              <button
                onClick={() => { setSelectedItem(null); setEditar(false); setIsModalOpen(true); }}
                className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white border-0 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer transition-colors shadow-sm"
              >
                <Plus size={14} /> Asignar Rol
              </button>
            </div>
          </div>

          {/* Busqueda */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por usuario, documento o rol..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-violet-400 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          {cargando ? (
            <div className="p-12 flex justify-center">
              <GlobalLoader mensaje="Cargando asignaciones de roles..." />
            </div>
          ) : (
            <DataTable
              columns={columnsTable}
              data={newList}
              keyField="Id_UsuariosRol"
              pagination
              highlightOnHover
              responsive
              customStyles={customStyles}
              noDataComponent={
                <div className="flex flex-col items-center py-12 text-slate-400">
                  <Users size={32} className="opacity-20 mb-2" />
                  <p className="text-xs">No hay asignaciones para mostrar.</p>
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* Modal Formulario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={hideModal} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden z-10 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0">
              <h2 className="font-bold text-slate-800 text-sm sm:text-base m-0 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                  {editar ? <Pencil size={13} className="text-violet-700" /> : <Plus size={13} className="text-violet-700" />}
                </div>
                {editar ? "Editar Asignacion" : "Asignar Rol a Usuario"}
              </h2>
              <button onClick={hideModal} className="text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto flex-1">
              <UsuariosRolesForm hideModal={hideModal} data={selectedItem} Edit={editar} reload={getAllUsuariosRol} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrudUsuariosRoles;