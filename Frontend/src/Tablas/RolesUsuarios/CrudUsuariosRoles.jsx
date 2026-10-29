// Frontend/src/Tablas/RolesUsuarios/CrudUsuariosRoles.jsx
// Modulo de gestion y asignacion intuitiva de Roles a Usuarios en Foodsys.
// Permite buscar por Nombre, Apellido, Cedula o Ficha y activar/quitar roles
// mediante chips e interruptores interactivos con confirmacion inmediata.
// Codigo comentado didacticamente sin tildes ni emojis para aprendices de ADSO.

import { useState, useEffect, useMemo, useCallback } from "react";
import apiAxios from "../../api/axiosConfig.js";
import { exportarAExcel, exportarAPDF, confirmarExportacion } from "../../utils/exportUtils";
import GlobalLoader from "../../Components/GlobalLoader";
import foodsysToast from "../../Components/UI/FoodsysToast";
import FoodsysConfirmModal from "../../Components/UI/FoodsysConfirmModal";
import {
  Shield, Search, X, Users, Upload, FileText,
  HelpCircle, ChevronDown, ChevronUp, Check, Plus,
  Sparkles, Filter, RefreshCw, AlertCircle
} from "lucide-react";

// Paleta institucional de colores por rol
const CONFIG_ROLES = {
  "Aprendiz Interno": {
    bgActivo: "bg-emerald-100 text-emerald-800 border-emerald-300",
    bgInactivo: "bg-slate-50 text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-700",
    colorHex: "#10b981"
  },
  "Aprendiz Externo": {
    bgActivo: "bg-blue-100 text-blue-800 border-blue-300",
    bgInactivo: "bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-700",
    colorHex: "#2563eb"
  },
  "Pasante Interno": {
    bgActivo: "bg-amber-100 text-amber-800 border-amber-300",
    bgInactivo: "bg-slate-50 text-slate-500 border-slate-200 hover:border-amber-300 hover:text-amber-700",
    colorHex: "#f59e0b"
  },
  "Pasante Externo": {
    bgActivo: "bg-sky-100 text-sky-800 border-sky-300",
    bgInactivo: "bg-slate-50 text-slate-500 border-slate-200 hover:border-sky-300 hover:text-sky-700",
    colorHex: "#0284c7"
  },
  "Supervisor": {
    bgActivo: "bg-orange-100 text-orange-800 border-orange-300",
    bgInactivo: "bg-slate-50 text-slate-500 border-slate-200 hover:border-orange-300 hover:text-orange-700",
    colorHex: "#ea580c"
  },
  "Cocina": {
    bgActivo: "bg-teal-100 text-teal-800 border-teal-300",
    bgInactivo: "bg-slate-50 text-slate-500 border-slate-200 hover:border-teal-300 hover:text-teal-700",
    colorHex: "#0d9488"
  },
  "Bienestar": {
    bgActivo: "bg-rose-100 text-rose-800 border-rose-300",
    bgInactivo: "bg-slate-50 text-slate-500 border-slate-200 hover:border-rose-300 hover:text-rose-700",
    colorHex: "#e11d48"
  },
  "Administrador": {
    bgActivo: "bg-purple-100 text-purple-800 border-purple-300",
    bgInactivo: "bg-slate-50 text-slate-500 border-slate-200 hover:border-purple-300 hover:text-purple-700",
    colorHex: "#7c3aed"
  },
  "Coordinador": {
    bgActivo: "bg-indigo-100 text-indigo-800 border-indigo-300",
    bgInactivo: "bg-slate-50 text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-700",
    colorHex: "#4f46e5"
  },
  "Monitor": {
    bgActivo: "bg-orange-100 text-orange-800 border-orange-300",
    bgInactivo: "bg-slate-50 text-slate-500 border-slate-200 hover:border-orange-300 hover:text-orange-700",
    colorHex: "#ea580c"
  },
  "Supervisor de Contrato": {
    bgActivo: "bg-violet-100 text-violet-800 border-violet-300",
    bgInactivo: "bg-slate-50 text-slate-500 border-slate-200 hover:border-violet-300 hover:text-violet-700",
    colorHex: "#6d28d9"
  },
  "Instructor": {
    bgActivo: "bg-cyan-100 text-cyan-800 border-cyan-300",
    bgInactivo: "bg-slate-50 text-slate-500 border-slate-200 hover:border-cyan-300 hover:text-cyan-700",
    colorHex: "#0891b2"
  },
  "Vocero": {
    bgActivo: "bg-lime-100 text-lime-800 border-lime-300",
    bgInactivo: "bg-slate-50 text-slate-500 border-slate-200 hover:border-lime-300 hover:text-lime-700",
    colorHex: "#65a30d"
  },
  "SENA Empresa": {
    bgActivo: "bg-emerald-100 text-emerald-900 border-emerald-400",
    bgInactivo: "bg-slate-50 text-slate-500 border-slate-200 hover:border-emerald-400 hover:text-emerald-800",
    colorHex: "#047857"
  },
  "Visitante": {
    bgActivo: "bg-slate-200 text-slate-800 border-slate-300",
    bgInactivo: "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700",
    colorHex: "#475569"
  }
};

const ROLES_PERMITIDOS_COORDINADOR = [
  "Cocina",
  "Monitor",
  "Supervisor",
  "Bienestar",
  "Aprendiz Interno",
  "Aprendiz Externo",
  "Pasante Interno",
  "Pasante Externo"
];

const CrudUsuariosRoles = () => {
  const rolActivo = localStorage.getItem("rolActivo") || "";
  const usuarioLogeado = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("usuario") || "null");
    } catch {
      return null;
    }
  }, []);
  const [usuarios, setUsuarios] = useState([]);
  const [rolesDisponibles, setRolesDisponibles] = useState([]);
  const [usuariosRol, setUsuariosRol] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);

  // Filtros y busqueda
  const [filterText, setFilterText] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todos");
  const [mostrarGuia, setMostrarGuia] = useState(false);

  // Paginacion
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 12;

  // Modal de confirmacion
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "Confirmar",
    variant: "danger",
    action: null
  });

  // ── Cargar Usuarios, Roles y Asignaciones ────────────────────────────────
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [resUsuarios, resRoles, resUsuariosRol] = await Promise.all([
        apiAxios.get("/api/Usuarios"),
        apiAxios.get("/api/Roles"),
        apiAxios.get("/api/UsuariosRoles")
      ]);

      const listaUsuarios = Array.isArray(resUsuarios.data) ? resUsuarios.data : [];
      const listaRolesRaw = Array.isArray(resRoles.data) ? resRoles.data : [];
      const listaUR = Array.isArray(resUsuariosRol.data) ? resUsuariosRol.data : [];

      // Deduplicar roles por Nom_Rol para evitar chips triplicados en interfaz
      const vistos = new Set();
      const listaRolesUnicos = [];
      for (const r of listaRolesRaw) {
        const nombreLimpio = String(r.Nom_Rol || "").trim();
        if (!nombreLimpio || vistos.has(nombreLimpio.toLowerCase())) continue;
        vistos.add(nombreLimpio.toLowerCase());
        listaRolesUnicos.push({ ...r, Nom_Rol: nombreLimpio });
      }

      const rolesFiltradosPorJerarquia =
        rolActivo === "Coordinador"
          ? listaRolesUnicos.filter((r) => ROLES_PERMITIDOS_COORDINADOR.includes(r.Nom_Rol))
          : listaRolesUnicos;

      setUsuarios(listaUsuarios);
      setRolesDisponibles(rolesFiltradosPorJerarquia);
      setUsuariosRol(listaUR);
    } catch (error) {
      console.error("Error al cargar datos de roles y usuarios:", error);
      foodsysToast.error("Error al cargar usuarios y roles del sistema");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ── Mapa de Roles Asignados por Usuario ──────────────────────────────────
  const mapaAsignacionesPorUsuario = useMemo(() => {
    const mapa = new Map();
    usuariosRol.forEach((ur) => {
      const idU = Number(ur.Id_Usuario);
      if (!mapa.has(idU)) mapa.set(idU, []);
      mapa.get(idU).push({
        Id_UsuariosRol: ur.Id_UsuariosRol,
        Id_Rol: ur.Id_Rol,
        Nom_Rol: ur.rol?.Nom_Rol || ur.rolUsuario?.Nom_Rol || ""
      });
    });
    return mapa;
  }, [usuariosRol]);

  // ── Lista Consolidada de Usuarios con sus Roles ───────────────────────────
  const usuariosConsolidados = useMemo(() => {
    return usuarios.map((u) => {
      const asignados = mapaAsignacionesPorUsuario.get(Number(u.Id_Usuario)) || [];
      const nombresRoles = asignados.map((a) => a.Nom_Rol).filter(Boolean);

      // Si no vienen en usuariosRol pero si en usuario.roles
      const rolesFinales = Array.from(
        new Set(nombresRoles.length > 0 ? nombresRoles : (u.roles || []))
      );

      return {
        ...u,
        nombreCompleto: `${u.Nom_Usuario || ""} ${u.Ape_Usuario || ""}`.trim(),
        numeroFicha: u.ficha?.Num_Ficha || u.Num_Ficha || "Sin Ficha",
        programaFormacion: u.ficha?.programa?.Nom_Programa || "Sin Programa",
        rolesAsignadosObj: asignados,
        rolesNombres: rolesFinales
      };
    });
  }, [usuarios, mapaAsignacionesPorUsuario]);

  // ── Filtrado en Vivo por Busqueda y Categoria ────────────────────────────
  const usuariosFiltrados = useMemo(() => {
    const txt = filterText.toLowerCase().trim();

    return usuariosConsolidados.filter((u) => {
      // Coincidencia de texto (Nombre, Documento, Ficha, Programa o Rol)
      const coincideTexto =
        !txt ||
        u.nombreCompleto.toLowerCase().includes(txt) ||
        String(u.NumDoc_Usuario || "").includes(txt) ||
        String(u.numeroFicha).includes(txt) ||
        u.programaFormacion.toLowerCase().includes(txt) ||
        u.rolesNombres.some((r) => r.toLowerCase().includes(txt));

      if (!coincideTexto) return false;

      // Filtro por Categoria de Rol
      if (filtroCategoria === "Todos") return true;
      if (filtroCategoria === "Internos") {
        return u.rolesNombres.some((r) => r.includes("Interno"));
      }
      if (filtroCategoria === "Externos") {
        return u.rolesNombres.some((r) => r.includes("Externo") || r === "Visitante");
      }
      if (filtroCategoria === "Administrativos") {
        return u.rolesNombres.some((r) =>
          ["Supervisor", "Monitor", "Supervisor de Contrato", "Cocina", "Bienestar", "Administrador", "Coordinador", "Instructor", "SENA Empresa"].includes(r)
        );
      }
      if (filtroCategoria === "SinRol") {
        return u.rolesNombres.length === 0;
      }
      return u.rolesNombres.includes(filtroCategoria);
    });
  }, [usuariosConsolidados, filterText, filtroCategoria]);

  // Paginacion calculada
  const totalPaginas = Math.ceil(usuariosFiltrados.length / elementosPorPagina) || 1;
  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * elementosPorPagina;
    return usuariosFiltrados.slice(inicio, inicio + elementosPorPagina);
  }, [usuariosFiltrados, paginaActual]);

  // ── Logica para Activar o Desactivar Rol ──────────────────────────────────
  const solicitarAlternarRol = (usuario, rolObj) => {
    const nombreRol = rolObj.Nom_Rol;

    if (rolActivo === "Coordinador" && !ROLES_PERMITIDOS_COORDINADOR.includes(nombreRol)) {
      foodsysToast.warning(
        "Restricción de Jerarquía",
        "El rol Coordinador solo puede gestionar roles de Casino/Cocina, Monitores, Bienestar y Aprendices/Pasantes."
      );
      return;
    }

    const idLogeado = Number(usuarioLogeado?.Id_Usuario || usuarioLogeado?.id || 0);
    if (
      idLogeado === Number(usuario.Id_Usuario) &&
      ["Administrador", "Coordinador", "Supervisor de Contrato"].includes(nombreRol) &&
      rolActivo !== "Administrador"
    ) {
      foodsysToast.warning(
        "Acción No Permitida",
        `No puedes autoasignarte o modificar tu propio rol superior (${nombreRol}).`
      );
      return;
    }

    const asignacionActual = usuario.rolesAsignadosObj.find(
      (a) => Number(a.Id_Rol) === Number(rolObj.Id_Rol) || a.Nom_Rol === rolObj.Nom_Rol
    );

    if (asignacionActual) {
      // Solicitar confirmacion para quitar rol
      setModalConfig({
        isOpen: true,
        title: "¿Quitar rol asignado?",
        description: `¿Seguro que deseas retirar el rol "${rolObj.Nom_Rol}" a ${usuario.nombreCompleto} (${usuario.NumDoc_Usuario})?`,
        confirmText: "Si, quitar rol",
        variant: "danger",
        action: () => ejecutarEliminarRol(asignacionActual.Id_UsuariosRol, usuario, rolObj.Nom_Rol)
      });
    } else {
      // 1. Validar incompatibilidad (Interno vs Externo)
      const ROLES_INTERNOS = ["Aprendiz Interno", "Pasante Interno"];
      const ROLES_EXTERNOS = ["Aprendiz Externo", "Pasante Externo", "Visitante"];

      if (ROLES_INTERNOS.includes(nombreRol) && usuario.rolesNombres.some((r) => ROLES_EXTERNOS.includes(r))) {
        foodsysToast.warning(
          "Incompatibilidad de Rol",
          "El usuario ya tiene un perfil Externo asignado. No puede ser Interno y Externo simultáneamente."
        );
        return;
      }
      if (ROLES_EXTERNOS.includes(nombreRol) && usuario.rolesNombres.some((r) => ROLES_INTERNOS.includes(r))) {
        foodsysToast.warning(
          "Incompatibilidad de Rol",
          "El usuario ya tiene un perfil Interno asignado. No puede ser Interno y Externo simultáneamente."
        );
        return;
      }

      // 2. Validar exclusión Pasante vs Aprendiz
      const ROLES_PASANTE = ["Pasante Interno", "Pasante Externo"];
      const ROLES_APRENDIZ = ["Aprendiz Interno", "Aprendiz Externo"];

      if (ROLES_PASANTE.includes(nombreRol) && usuario.rolesNombres.some((r) => ROLES_APRENDIZ.includes(r))) {
        foodsysToast.warning(
          "Incompatibilidad de Rol",
          "Un Pasante no es Aprendiz. Retira primero el rol de Aprendiz antes de asignarle perfil de Pasante."
        );
        return;
      }
      if (ROLES_APRENDIZ.includes(nombreRol) && usuario.rolesNombres.some((r) => ROLES_PASANTE.includes(r))) {
        foodsysToast.warning(
          "Incompatibilidad de Rol",
          "El usuario ya tiene perfil de Pasante (Pasante no es Aprendiz). Retira primero el rol de Pasante."
        );
        return;
      }

      // Solicitar confirmacion para asignar rol
      setModalConfig({
        isOpen: true,
        title: "¿Asignar nuevo rol?",
        description: `¿Deseas asignar el rol "${rolObj.Nom_Rol}" a ${usuario.nombreCompleto}?`,
        confirmText: "Si, asignar rol",
        variant: "success",
        action: () => ejecutarAsignarRol(usuario.Id_Usuario, rolObj.Id_Rol, usuario, rolObj.Nom_Rol)
      });
    }
  };

  const ejecutarAsignarRol = async (Id_Usuario, Id_Rol, usuario, nombreRol) => {
    try {
      await apiAxios.post("/api/UsuariosRoles", { Id_Usuario, Id_Rol });
      foodsysToast.success(
        `Rol asignado correctamente`,
        `Se agrego el perfil "${nombreRol}" a ${usuario.nombreCompleto}`
      );
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
      cargarDatos();
    } catch (error) {
      const msg = error.response?.data?.message || "No se pudo asignar el rol";
      foodsysToast.error("Error al asignar rol", msg);
    }
  };

  const ejecutarEliminarRol = async (Id_UsuariosRol, usuario, nombreRol) => {
    try {
      await apiAxios.delete(`/api/UsuariosRoles/${Id_UsuariosRol}`);
      foodsysToast.success(
        `Rol retirado`,
        `Se quito el perfil "${nombreRol}" a ${usuario.nombreCompleto}`
      );
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
      cargarDatos();
    } catch (error) {
      const msg = error.response?.data?.message || "No se pudo quitar el rol";
      foodsysToast.error("Error al quitar rol", msg);
    }
  };

  // ── Exportacion a Excel y PDF ─────────────────────────────────────────────
  const handleExportarExcel = async () => {
    if (usuariosConsolidados.length === 0) {
      foodsysToast.warning("No hay registros para exportar");
      return;
    }

    const decision = await confirmarExportacion({
      totalOriginal: usuariosConsolidados.length,
      totalFiltrado: usuariosFiltrados.length,
      tieneFiltrosActivos: Boolean(filterText || filtroCategoria !== "Todos"),
      formato: "Excel",
      nombreModulo: "asignacion de roles"
    });

    if (!decision) return;

    setExportando(true);
    try {
      const registros = decision === "filtrados" ? usuariosFiltrados : usuariosConsolidados;

      const datosFormateados = registros.map((u) => ({
        "Tipo Documento": u.TipDoc_Usuario || "CC",
        "Numero Documento": u.NumDoc_Usuario || "",
        "Nombres": u.Nom_Usuario || "",
        "Apellidos": u.Ape_Usuario || "",
        "Correo": u.Cor_Usuario || "",
        "Telefono": u.Tel_Usuario || "",
        "Centro Convivencia": u.CenCon_Usuario || "No",
        "Numero Ficha": u.numeroFicha,
        "Programa de Formacion": u.programaFormacion,
        "Roles Asignados": u.rolesNombres.join(", ") || "Sin roles asignados",
        "Estado": u.Est_Usuario || "Activo"
      }));

      const fecha = new Date().toISOString().split("T")[0];
      exportarAExcel({
        datos: datosFormateados,
        nombreArchivo: `Foodsys_Matriz_Roles_${decision}_${fecha}.xlsx`,
        nombreHoja: "Roles Usuarios"
      });

      foodsysToast.success(`Excel exportado con ${registros.length} usuarios.`);
    } catch (err) {
      console.error("Error al exportar Excel:", err);
      foodsysToast.error("Error al generar el archivo Excel");
    } finally {
      setExportando(false);
    }
  };

  const handleExportarPDF = async () => {
    if (usuariosConsolidados.length === 0) {
      foodsysToast.warning("No hay registros para exportar");
      return;
    }

    const decision = await confirmarExportacion({
      totalOriginal: usuariosConsolidados.length,
      totalFiltrado: usuariosFiltrados.length,
      tieneFiltrosActivos: Boolean(filterText || filtroCategoria !== "Todos"),
      formato: "PDF",
      nombreModulo: "asignacion de roles"
    });

    if (!decision) return;

    setExportando(true);
    try {
      const registros = decision === "filtrados" ? usuariosFiltrados : usuariosConsolidados;

      const columnasPDF = [
        { header: "Documento", dataKey: "doc" },
        { header: "Aprendiz / Usuario", dataKey: "usuario" },
        { header: "Ficha / Programa", dataKey: "ficha" },
        { header: "Roles Asignados", dataKey: "roles" }
      ];

      const filasPDF = registros.map((u) => ({
        doc: `${u.TipDoc_Usuario || "CC"} ${u.NumDoc_Usuario}`,
        usuario: u.nombreCompleto,
        ficha: `${u.numeroFicha} — ${u.programaFormacion}`.slice(0, 35),
        roles: u.rolesNombres.join(" | ") || "Sin rol"
      }));

      const fecha = new Date().toISOString().split("T")[0];
      exportarAPDF({
        titulo: "Matriz Institucional de Asignacion de Roles",
        subtitulo: `Centro Agropecuario "La Granja" - Registros: ${registros.length} (${decision})`,
        columnas: columnasPDF,
        datos: filasPDF,
        nombreArchivo: `Foodsys_Matriz_Roles_${decision}_${fecha}.pdf`,
        orientacion: "portrait"
      });

      foodsysToast.success(`PDF generado con ${registros.length} usuarios.`);
    } catch (err) {
      console.error("Error al exportar PDF:", err);
      foodsysToast.error("Error al generar el archivo PDF");
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-5 p-3 sm:p-6 bg-slate-50 min-h-screen">
      {/* Guia Didactica Plegable */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <button
          onClick={() => setMostrarGuia(!mostrarGuia)}
          className="w-full flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-0 cursor-pointer text-left transition-colors hover:from-emerald-100 hover:to-teal-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                Asignación Intuitiva de Roles y Permisos (Guía Rápida)
              </p>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Busca al aprendiz o funcionario y haz un clic sobre cualquier chip de rol para activarlo o quitarlo.
              </p>
            </div>
          </div>
          {mostrarGuia ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
        </button>

        {mostrarGuia && (
          <div className="p-5 bg-white border-t border-slate-100 text-xs text-slate-600 grid grid-cols-1 md:grid-cols-3 gap-4 leading-relaxed">
            <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-1">
              <p className="font-bold text-emerald-800 uppercase tracking-wide">1. Búsqueda Directa</p>
              <p>Escribe el nombre, apellido, número de cédula o número de ficha. Ya no necesitas memorizar ningún ID numérico.</p>
            </div>
            <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-1">
              <p className="font-bold text-blue-800 uppercase tracking-wide">2. Chips Interactivos</p>
              <p>Los chips iluminados con check representan roles activos. Haz clic sobre uno inactivo (+) para asignarlo o sobre uno activo (x) para removerlo.</p>
            </div>
            <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1">
              <p className="font-bold text-purple-800 uppercase tracking-wide">3. Roles Múltiples</p>
              <p>Un usuario puede combinar perfiles administrativos (ej: Supervisor + Bienestar), pero el sistema bloquea perfiles incompatibles (Interno con Externo).</p>
            </div>
          </div>
        )}
      </div>

      {/* Panel Principal */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        {/* Cabecera y Herramientas */}
        <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Matriz de Usuarios y Roles
                </h1>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Total de usuarios en base de datos: <span className="text-emerald-700 font-bold">{usuarios.length}</span>
                </p>
              </div>
            </div>

            {/* Botones de Exportacion y Actualizar */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={cargarDatos}
                disabled={cargando}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-2.5 rounded-2xl text-xs transition-colors cursor-pointer"
                title="Actualizar listado"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${cargando ? "animate-spin" : ""}`} />
                <span>Actualizar</span>
              </button>

              <button
                onClick={handleExportarExcel}
                disabled={exportando || usuarios.length === 0}
                className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3.5 py-2.5 rounded-2xl text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Exportar Excel</span>
              </button>

              <button
                onClick={handleExportarPDF}
                disabled={exportando || usuarios.length === 0}
                className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold px-3.5 py-2.5 rounded-2xl text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Exportar PDF</span>
              </button>
            </div>
          </div>

          {/* Buscador en Vivo y Filtro Rapido */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
            <div className="md:col-span-8 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por Nombre, Apellido, Cédula o Ficha..."
                value={filterText}
                onChange={(e) => {
                  setFilterText(e.target.value);
                  setPaginaActual(1);
                }}
                className="w-full pl-11 pr-10 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
              {filterText && (
                <button
                  onClick={() => setFilterText("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Categorias de Filtro */}
            <div className="md:col-span-4 flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: "Todos", label: "Todos" },
                { id: "Internos", label: "Internos" },
                { id: "Externos", label: "Externos" },
                { id: "Administrativos", label: "Admin/Func" },
                { id: "SinRol", label: "Sin Rol" }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setFiltroCategoria(cat.id);
                    setPaginaActual(1);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    filtroCategoria === cat.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Listado de Usuarios con Chips Interactivos */}
        <div className="p-5 sm:p-6">
          {cargando ? (
            <div className="py-20 flex justify-center">
              <GlobalLoader mensaje="Cargando usuarios y matriz de roles..." />
            </div>
          ) : usuariosPaginados.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Users className="w-8 h-8" />
              </div>
              <p className="text-slate-700 font-bold text-sm">
                No se encontraron usuarios con ese criterio de búsqueda
              </p>
              <p className="text-slate-400 text-xs">
                Intenta buscar por otro nombre, cédula o limpia los filtros
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {usuariosPaginados.map((u) => {
                const initials = u.nombreCompleto
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() || "U";

                return (
                  <div
                    key={u.Id_Usuario}
                    className="p-4 sm:p-5 rounded-3xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm transition-all flex flex-col justify-between gap-4"
                  >
                    {/* Fila 1: Datos Personales */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight truncate">
                            {u.nombreCompleto || "Sin Nombre Registrado"}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mt-0.5 flex-wrap">
                            <span>{u.TipDoc_Usuario || "CC"}: {u.NumDoc_Usuario || "--"}</span>
                            <span>&middot;</span>
                            <span className="text-slate-600 font-bold">Ficha: {u.numeroFicha}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5" title={u.programaFormacion}>
                            {u.programaFormacion}
                          </p>
                        </div>
                      </div>

                      {/* Badge Centro de Convivencia */}
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${
                          u.CenCon_Usuario === "Si"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {u.CenCon_Usuario === "Si" ? "Interno CenCon" : "Externo"}
                      </span>
                    </div>

                    {/* Fila 2: Chips Interactivos de Roles */}
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                        Roles del Sistema (Clic para activar / quitar):
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {rolesDisponibles.map((rol) => {
                          const estaAsignado = u.rolesNombres.includes(rol.Nom_Rol);
                          const cfg = CONFIG_ROLES[rol.Nom_Rol] || {
                            bgActivo: "bg-emerald-100 text-emerald-800 border-emerald-300",
                            bgInactivo: "bg-slate-50 text-slate-500 border-slate-200",
                            colorHex: "#10b981"
                          };

                          return (
                            <button
                              key={rol.Id_Rol}
                              onClick={() => solicitarAlternarRol(u, rol)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                estaAsignado
                                  ? `${cfg.bgActivo} shadow-2xs scale-100`
                                  : `${cfg.bgInactivo} opacity-80 hover:opacity-100`
                              }`}
                              title={
                                estaAsignado
                                  ? `Haz clic para quitar el rol "${rol.Nom_Rol}"`
                                  : `Haz clic para asignar el rol "${rol.Nom_Rol}"`
                              }
                            >
                              {estaAsignado ? (
                                <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />
                              ) : (
                                <Plus className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                              )}
                              <span>{rol.Nom_Rol}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginacion Limpia */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-5">
              <p className="text-xs font-bold text-slate-500">
                Mostrando {usuariosPaginados.length} de {usuariosFiltrados.length} usuarios
              </p>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                  disabled={paginaActual === 1}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Anterior
                </button>
                <span className="px-3 py-1.5 text-xs font-bold text-slate-700">
                  {paginaActual} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                  disabled={paginaActual === totalPaginas}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmacion Unificado */}
      <FoodsysConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.action}
        title={modalConfig.title}
        description={modalConfig.description}
        confirmText={modalConfig.confirmText}
        variant={modalConfig.variant}
      />
    </div>
  );
};

export default CrudUsuariosRoles;