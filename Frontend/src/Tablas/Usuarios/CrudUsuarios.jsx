// Frontend/src/Tablas/Usuarios/CrudUsuarios.jsx
// Modulo de administracion completa de usuarios en Foodsys
// Incluye semaforo semanal de inasistencias (0/3, 1/3, 2/3, 3/3), exportacion universal a Excel y PDF con confirmacion inteligente,
// historial real de reservas con conexion directa al backend, guia paso a paso y diseno 100% responsivo para moviles y escritorio.
// Codigo comentado didacticamente sin tildes ni emojis para aprendices de primer semestre.

import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import toast from "react-hot-toast";
import apiAxios from "../../api/axiosConfig";
import UsuariosForm from "./UsuariosForm.jsx";
import ImportarExcel from "./ImportarExcel.jsx";
import { exportarAExcel, exportarAPDF, confirmarExportacion } from "../../utils/exportUtils";
import GlobalLoader from "../../Components/GlobalLoader";
import {
  Users, Pencil, Plus, Search, X, History,
  CheckCircle2, AlertCircle, Ban, ShieldCheck,
  Download, Upload, Undo2, HelpCircle, ChevronDown, ChevronUp,
  FileText, Phone, Mail, Calendar
} from "lucide-react";

/* ============================================================
   BADGE DE ESTADO FORMATIVO O DE CUENTA
============================================================ */
const EstadoBadge = ({ estado }) => {
  const activo = estado === "Activo" || estado === "activo" || estado === "En Formacion";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
        activo
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-red-50 text-red-700 border-red-200"
      }`}
    >
      {activo ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
      {estado || "—"}
    </span>
  );
};

/* ============================================================
   BADGE DE SANCION DISCIPLINARIA
============================================================ */
const SancionBadge = ({ sancionado }) => {
  const esSan = sancionado === "Si" || sancionado === 1;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
        esSan
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-green-50 text-green-700 border-green-200"
      }`}
    >
      {esSan ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
      {esSan ? "Sancionado" : "Sin sancion"}
    </span>
  );
};

/* ============================================================
   SEMAFORO DE INASISTENCIAS SEMANALES (0/3, 1/3, 2/3, 3/3)
============================================================ */
const SemaforoInasistencias = ({ inasistencias = 0, sancionado = false }) => {
  let badgeColor = "bg-green-50 text-green-700 border-green-200";
  let label = `${inasistencias}/3`;

  if (sancionado || inasistencias >= 3) {
    badgeColor = "bg-red-100 text-red-800 border-red-300 font-bold";
    label = `${inasistencias}/3 Sancionado`;
  } else if (inasistencias === 2) {
    badgeColor = "bg-amber-100 text-amber-800 border-amber-300 font-bold animate-pulse";
    label = "2/3 En Riesgo";
  } else if (inasistencias === 1) {
    badgeColor = "bg-yellow-50 text-yellow-800 border-yellow-200";
    label = "1/3";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border whitespace-nowrap ${badgeColor}`}
      title={`Inasistencias acumuladas en la semana actual (Lunes a Domingo): ${inasistencias}`}
    >
      {label}
    </span>
  );
};

/* ============================================================
   GENERADOR DE COLORES PARA EL AVATAR DEL USUARIO
============================================================ */
const avatarColor = (str) => {
  const colors = ["#dbeafe", "#ede9fe", "#d1fae5", "#fef3c7", "#fee2e2", "#cffafe", "#e0e7ff"];
  const text   = ["#1d4ed8", "#6d28d9", "#065f46", "#92400e", "#991b1b", "#0e7490", "#3730a3"];
  let h = 0;
  for (let i = 0; i < (str || "").length; i++) h = str.charCodeAt(i) + h;
  const idx = Math.abs(h) % colors.length;
  return { bg: colors[idx], color: text[idx] };
};

/* ============================================================
   COMPONENTE PRINCIPAL: CRUD USUARIOS
============================================================ */
const CrudUsuarios = () => {
  // Lista de usuarios y control de carga
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizandoSan, setActualizandoSan] = useState(null);

  // Filtros de busqueda y chips
  const [filterText, setFilterText] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos"); // 'todos', 'activos', 'inactivos'
  const [filtroSancion, setFiltroSancion] = useState("todos"); // 'todos', 'sancionados', 'sin_sancion'
  const [filtroRol, setFiltroRol] = useState("todos"); // 'todos', 'aprendiz', 'pasante', etc.

  // Modales
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importModal, setImportModal] = useState(false);

  // Panel lateral o modal de detalle con historial real
  const [usuarioDetalle, setUsuarioDetalle] = useState(null);
  const [historialReservas, setHistorialReservas] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [filtroHistorialTipo, setFiltroHistorialTipo] = useState("todos");

  // Estado del proceso de exportacion
  const [exportando, setExportando] = useState(false);

  // Acordeon didactico con instrucciones paso a paso
  const [mostrarGuia, setMostrarGuia] = useState(false);

  // Rol activo del usuario logueado en la sesion
  const rolActivo = localStorage.getItem("rolActivo") || "";
  const canToggleSan = rolActivo === "Administrador" || rolActivo === "Coordinador";

  // Carga inicial de usuarios al montar el componente
  useEffect(() => {
    getAllUsuarios();
    return () => toast.dismiss();
  }, []);

  // Peticion HTTP al backend para obtener todos los usuarios con sus roles y fichas
  const getAllUsuarios = async () => {
    setCargando(true);
    try {
      const res = await apiAxios.get("/api/Usuarios/");
      setUsuarios(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      toast.error("Error al cargar la lista de usuarios");
    } finally {
      setCargando(false);
    }
  };

  // Carga el historial real de reservas de un usuario mediante el endpoint oficial de reportes
  const verDetalleUsuario = async (usuario) => {
    setUsuarioDetalle(usuario);
    setCargandoHistorial(true);
    setFiltroHistorialTipo("todos");
    try {
      const res = await apiAxios.get(`/api/Reportes/aprendiz?documento=${usuario.NumDoc_Usuario}`);
      setHistorialReservas(res.data?.historial || []);
    } catch (err) {
      console.warn("Nota sobre historial individual:", err.message);
      setHistorialReservas([]);
    } finally {
      setCargandoHistorial(false);
    }
  };

  // Confirmacion interactiva antes de sancionar o retirar sancion
  const toggleSancion = (usuario) => {
    const nuevo = (usuario.San_Usuario === "Si" || usuario.San_Usuario === 1) ? "No" : "Si";
    const esSancionar = nuevo === "Si";
    const nombre = `${usuario.Nom_Usuario || ""} ${usuario.Ape_Usuario || ""}`.trim();

    toast(
      (t) => (
        <div className="flex flex-col gap-3 min-w-[320px] p-1">
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                esSancionar ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
              }`}
            >
              {esSancionar ? <Ban size={18} /> : <ShieldCheck size={18} />}
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-800 text-sm m-0">
                {esSancionar ? "¿Sancionar usuario?" : "¿Quitar sancion?"}
              </p>
              <p className="text-xs text-slate-500 mt-1 m-0">
                {nombre} {usuario.NumDoc_Usuario ? `(${usuario.NumDoc_Usuario})` : ""}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                toast("Accion cancelada", { icon: <Undo2 size={16} className="text-slate-500" />, duration: 1500 });
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                await ejecutarToggleSancion(usuario, nuevo);
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm transition-colors ${
                esSancionar ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              Confirmar
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  // Envia la actualizacion de sancion al backend
  const ejecutarToggleSancion = async (usuario, nuevo) => {
    setActualizandoSan(usuario.Id_Usuario);
    const toastId = toast.loading("Actualizando sancion...");
    try {
      await apiAxios.patch(`/api/Usuarios/${usuario.Id_Usuario}/sancion`, { San_Usuario: nuevo });
      setUsuarios((prev) =>
        prev.map((u) => (u.Id_Usuario === usuario.Id_Usuario ? { ...u, San_Usuario: nuevo } : u))
      );
      if (usuarioDetalle?.Id_Usuario === usuario.Id_Usuario) {
        setUsuarioDetalle((prev) => ({ ...prev, San_Usuario: nuevo }));
      }
      toast.success(
        nuevo === "Si" ? "Usuario sancionado correctamente" : "Sancion retirada correctamente",
        { id: toastId }
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error al actualizar la sancion", { id: toastId });
    } finally {
      setActualizandoSan(null);
    }
  };

  // Prepara y abre el modal de edicion
  const editUsuario = (row) => {
    setSelectedUsuario(row);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  // Cierra el modal de formulario
  const hideModal = () => {
    setIsModalOpen(false);
    setSelectedUsuario(null);
    setIsEdit(false);
  };

  // -------------------------------------------------------------
  // LOGICA DE FILTRADO EN MEMORIA
  // -------------------------------------------------------------
  let listaFiltrada = usuarios;

  if (filtroEstado === "activos") {
    listaFiltrada = listaFiltrada.filter(
      (u) => u.Est_Usuario === "Activo" || u.Est_Usuario === "activo" || u.Est_Usuario === "En Formacion"
    );
  } else if (filtroEstado === "inactivos") {
    listaFiltrada = listaFiltrada.filter(
      (u) => u.Est_Usuario !== "Activo" && u.Est_Usuario !== "activo" && u.Est_Usuario !== "En Formacion"
    );
  }

  if (filtroSancion === "sancionados") {
    listaFiltrada = listaFiltrada.filter((u) => u.San_Usuario === "Si" || u.San_Usuario === 1);
  } else if (filtroSancion === "sin_sancion") {
    listaFiltrada = listaFiltrada.filter((u) => u.San_Usuario !== "Si" && u.San_Usuario !== 1);
  }

  if (filtroRol !== "todos") {
    listaFiltrada = listaFiltrada.filter((u) => {
      const roles = u.roles || u.rolesUsuario?.map((ru) => ru.rolUsuario?.Nom_Rol || ru.rol?.Nom_Rol) || [];
      return roles.some((r) => r && r.toLowerCase().includes(filtroRol.toLowerCase()));
    });
  }

  const newList = listaFiltrada.filter((a) => {
    const t = filterText.toLowerCase();
    return (
      String(a.NumDoc_Usuario || "").toLowerCase().includes(t) ||
      String(a.Nom_Usuario || "").toLowerCase().includes(t) ||
      String(a.Ape_Usuario || "").toLowerCase().includes(t) ||
      String(a.Cor_Usuario || "").toLowerCase().includes(t) ||
      String(a.ficha?.Num_Ficha || "").toLowerCase().includes(t) ||
      String(a.ficha?.programas?.Nom_Programa || "").toLowerCase().includes(t)
    );
  });

  const cantSancionados = usuarios.filter((u) => u.San_Usuario === "Si" || u.San_Usuario === 1).length;
  const tieneFiltrosActivos = Boolean(filterText || filtroEstado !== "todos" || filtroSancion !== "todos" || filtroRol !== "todos");

  // -------------------------------------------------------------
  // EXPORTACION UNIVERSAL A EXCEL CON CONFIRMACION INTELIGENTE
  // -------------------------------------------------------------
  const handleExportarExcel = async () => {
    if (usuarios.length === 0) {
      toast.error("No hay datos de usuarios para exportar.");
      return;
    }

    const decision = await confirmarExportacion({
      totalOriginal: usuarios.length,
      totalFiltrado: newList.length,
      tieneFiltrosActivos,
      formato: "Excel",
      nombreModulo: "usuarios"
    });

    if (!decision) return;

    setExportando(true);
    try {
      const registrosAExportar = decision === "filtrados" ? newList : usuarios;

      const datosFormateados = registrosAExportar.map((u) => {
        const roles = u.roles || u.rolesUsuario?.map((ru) => ru.rolUsuario?.Nom_Rol || ru.rol?.Nom_Rol) || [];
        return {
          "Tipo Documento": u.TipDoc_Usuario || "",
          "N° Documento": u.NumDoc_Usuario || "",
          "Nombres": u.Nom_Usuario || "",
          "Apellidos": u.Ape_Usuario || "",
          "Genero": u.Gen_Usuario || "",
          "Correo": u.Cor_Usuario || "",
          "Telefono": u.Tel_Usuario || "",
          "Centro de Convivencia": u.CenCon_Usuario || "No",
          "Rol": roles.join(" · ") || "Sin rol",
          "N° Ficha": u.ficha?.Num_Ficha || "Sin ficha",
          "Programa": u.ficha?.programas?.Nom_Programa || "Sin programa",
          "Estado": u.Est_Usuario || "",
          "Sancion": u.San_Usuario || "No",
          "Inasistencias Semana": u.inasistenciasSemana ?? 0,
          "Fecha Desancion": u.Fec_Desancion ? new Date(u.Fec_Desancion).toLocaleDateString("es-CO") : "",
          "Fecha Creacion": u.createdat ? new Date(u.createdat).toLocaleString("es-CO") : "",
          "Ultima Actualizacion": u.updatedat ? new Date(u.updatedat).toLocaleString("es-CO") : ""
        };
      });

      const fecha = new Date().toISOString().split("T")[0];
      exportarAExcel({
        datos: datosFormateados,
        nombreArchivo: `Foodsys_Usuarios_${decision}_${fecha}.xlsx`,
        nombreHoja: "Usuarios"
      });

      toast.success(`Archivo Excel exportado con ${registrosAExportar.length} registros.`);
    } catch (err) {
      console.error("Error al exportar Excel:", err);
      toast.error("Error al generar el archivo Excel.");
    } finally {
      setExportando(false);
    }
  };

  // -------------------------------------------------------------
  // EXPORTACION UNIVERSAL A PDF CON CONFIRMACION INTELIGENTE
  // -------------------------------------------------------------
  const handleExportarPDF = async () => {
    if (usuarios.length === 0) {
      toast.error("No hay datos de usuarios para exportar.");
      return;
    }

    const decision = await confirmarExportacion({
      totalOriginal: usuarios.length,
      totalFiltrado: newList.length,
      tieneFiltrosActivos,
      formato: "PDF",
      nombreModulo: "usuarios"
    });

    if (!decision) return;

    setExportando(true);
    try {
      const registrosAExportar = decision === "filtrados" ? newList : usuarios;

      const columnasPDF = [
        { header: "Documento", dataKey: "doc" },
        { header: "Usuario", dataKey: "nombre" },
        { header: "Rol", dataKey: "rol" },
        { header: "Ficha", dataKey: "ficha" },
        { header: "Estado", dataKey: "estado" },
        { header: "Sancion", dataKey: "sancion" },
        { header: "Fallas Sem", dataKey: "inasistencias" }
      ];

      const filasPDF = registrosAExportar.map((u) => {
        const roles = u.roles || u.rolesUsuario?.map((ru) => ru.rolUsuario?.Nom_Rol || ru.rol?.Nom_Rol) || [];
        return {
          doc: `${u.TipDoc_Usuario || ""} ${u.NumDoc_Usuario || ""}`.trim(),
          nombre: `${u.Nom_Usuario || ""} ${u.Ape_Usuario || ""}`.trim(),
          rol: roles.join(", ") || "Sin rol",
          ficha: u.ficha?.Num_Ficha || "Sin ficha",
          estado: u.Est_Usuario || "—",
          sancion: (u.San_Usuario === "Si" || u.San_Usuario === 1) ? "Sancionado" : "No",
          inasistencias: `${u.inasistenciasSemana ?? 0}/3`
        };
      });

      const fecha = new Date().toISOString().split("T")[0];
      exportarAPDF({
        titulo: "Reporte Institucional de Usuarios",
        subtitulo: `Centro Agropecuario "La Granja" - Registros: ${registrosAExportar.length} (${decision})`,
        columnas: columnasPDF,
        datos: filasPDF,
        nombreArchivo: `Foodsys_Usuarios_${decision}_${fecha}.pdf`,
        orientacion: "landscape"
      });

      toast.success(`Archivo PDF generado con ${registrosAExportar.length} registros.`);
    } catch (err) {
      console.error("Error al exportar PDF:", err);
      toast.error("Error al generar el documento PDF.");
    } finally {
      setExportando(false);
    }
  };

  // Columnas para la tabla principal
  const columnsTable = [
    {
      name: "Documento",
      selector: (r) => r.NumDoc_Usuario,
      width: "125px",
      cell: (r) => (
        <span className="text-[12px] font-semibold text-slate-700 whitespace-nowrap">
          {r.NumDoc_Usuario || "—"}
        </span>
      ),
    },
    {
      name: "Usuario",
      selector: (r) => `${r.Nom_Usuario} ${r.Ape_Usuario}`,
      sortable: true,
      grow: 2,
      minWidth: "220px",
      cell: (r) => {
        const nombre = `${r.Nom_Usuario || ""} ${r.Ape_Usuario || ""}`.trim();
        const { bg, color } = avatarColor(nombre);
        const roles = r.roles || r.rolesUsuario?.map((ru) => ru.rolUsuario?.Nom_Rol || ru.rol?.Nom_Rol) || [];
        const sancionado = r.San_Usuario === "Si" || r.San_Usuario === 1;

        return (
          <div className="flex items-center gap-2.5 py-1.5 min-w-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs"
              style={{ background: bg, color: color }}
            >
              {`${r.Nom_Usuario?.[0] || ""}${r.Ape_Usuario?.[0] || ""}`.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p
                className={`text-[13px] font-semibold truncate m-0 ${
                  sancionado ? "text-red-600" : "text-slate-900"
                }`}
              >
                {nombre}
              </p>
              <p className="text-[11px] text-slate-500 truncate m-0">
                {roles.length > 0 ? roles.join(" · ") : (r.Cor_Usuario || "Sin rol")}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      name: "Ficha / Programa",
      selector: (r) => r.ficha?.Num_Ficha,
      sortable: true,
      minWidth: "160px",
      cell: (r) => (
        <div className="flex flex-col gap-0.5">
          {r.ficha?.Num_Ficha ? (
            <span className="bg-purple-50 text-purple-700 border border-purple-200 rounded px-1.5 py-0.5 text-[11px] font-bold w-fit">
              Ficha {r.ficha.Num_Ficha}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">Sin ficha</span>
          )}
          {r.ficha?.programas?.Nom_Programa && (
            <span
              className="text-[11px] text-slate-600 max-w-[150px] truncate"
              title={r.ficha.programas.Nom_Programa}
            >
              {r.ficha.programas.Nom_Programa}
            </span>
          )}
        </div>
      ),
    },
    {
      name: "Estado",
      selector: (r) => r.Est_Usuario,
      sortable: true,
      width: "120px",
      cell: (r) => <EstadoBadge estado={r.Est_Usuario} />,
    },
    {
      name: "Sancion",
      selector: (r) => r.San_Usuario,
      sortable: true,
      width: "125px",
      cell: (r) => <SancionBadge sancionado={r.San_Usuario} />,
    },
    {
      name: "Fallas Sem",
      selector: (r) => r.inasistenciasSemana ?? 0,
      sortable: true,
      width: "120px",
      cell: (r) => (
        <SemaforoInasistencias
          inasistencias={r.inasistenciasSemana ?? 0}
          sancionado={r.San_Usuario === "Si" || r.San_Usuario === 1}
        />
      ),
    },
    {
      name: "Acciones",
      minWidth: "240px",
      cell: (row) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <button
            onClick={() => verDetalleUsuario(row)}
            className="bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer inline-flex items-center gap-1 transition-colors"
            title="Ver detalle e historial de reservas"
          >
            <History size={12} className="text-slate-500" /> Detalle
          </button>

          <button
            onClick={() => editUsuario(row)}
            className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer inline-flex items-center gap-1 transition-colors"
            title="Editar usuario"
          >
            <Pencil size={12} className="text-blue-600" /> Editar
          </button>

          {canToggleSan && (
            <button
              disabled={actualizandoSan === row.Id_Usuario}
              onClick={() => toggleSancion(row)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer inline-flex items-center gap-1 transition-colors ${
                (row.San_Usuario === "Si" || row.San_Usuario === 1)
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                  : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
              }`}
              title={(row.San_Usuario === "Si" || row.San_Usuario === 1) ? "Quitar sancion" : "Sancionar usuario"}
            >
              {(row.San_Usuario === "Si" || row.San_Usuario === 1) ? (
                <>
                  <ShieldCheck size={12} className="text-emerald-600" /> Quitar
                </>
              ) : (
                <>
                  <Ban size={12} className="text-red-600" /> Sancionar
                </>
              )}
            </button>
          )}
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
        "&:hover": { background: "#f0f9ff" },
      },
    },
    pagination: { style: { borderTop: "1px solid #e5e7eb", fontSize: 13 } },
  };

  // Boton auxiliar de chip para filtros
  const btnFiltro = (valor, label, bg, color, group = "estado") => {
    let activo = false;
    if (group === "estado") activo = filtroEstado === valor;
    if (group === "sancion") activo = filtroSancion === valor;
    if (group === "rol") activo = filtroRol === valor;

    return (
      <button
        onClick={() => {
          if (group === "estado") setFiltroEstado(valor);
          if (group === "sancion") setFiltroSancion(valor);
          if (group === "rol") setFiltroRol(valor);
        }}
        style={{
          background: activo ? bg : "#fff",
          color: activo ? color : "#6b7280",
          border: `1px solid ${activo ? "transparent" : "#e5e7eb"}`,
          borderRadius: 8,
          padding: "4px 12px",
          fontSize: 11,
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.15s",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="w-full flex flex-col gap-4 p-3 sm:p-5 bg-slate-50 min-h-screen">
      {/* ============================================================
          BANNER DE INSTRUCCIONES DIDACTICAS
      ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <button
          onClick={() => setMostrarGuia(!mostrarGuia)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-0 cursor-pointer text-left transition-colors hover:from-blue-100 hover:to-indigo-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <HelpCircle size={18} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm m-0">¿Como usar este modulo? (Guia paso a paso)</p>
              <p className="text-xs text-slate-500 m-0">Aprende a filtrar, exportar a Excel/PDF y gestionar usuarios</p>
            </div>
          </div>
          {mostrarGuia ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {mostrarGuia && (
          <div className="p-4 bg-white border-t border-slate-100 text-xs text-slate-600 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="font-bold text-blue-700 uppercase tracking-wide">1. Busqueda y Filtros</p>
              <p>Usa la barra superior para buscar por cedula, nombre o ficha. Usa los botones de chip para ver solo aprendices, pasantes, sancionados o inactivos.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-indigo-700 uppercase tracking-wide">2. Exportacion Inteligente</p>
              <p>Presiona <strong>Exportar Excel</strong> o <strong>Exportar PDF</strong>. Si no tienes filtros, el sistema te preguntara si deseas descargar todos los registros o solo los seleccionados.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-emerald-700 uppercase tracking-wide">3. Historial y Sanciones</p>
              <p>Haz clic en el boton <strong>Detalle</strong> de cualquier fila para inspeccionar las reservas reales de ese usuario y ver su semaforo semanal de inasistencias (0 a 3 fallas).</p>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================
          PANEL PRINCIPAL: TABLA DE USUARIOS
      ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <Users size={20} />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 text-base sm:text-lg m-0">Gestion de Usuarios</h1>
                <p className="text-xs text-slate-500 m-0">
                  {usuarios.length} usuarios registrados{" "}
                  {cantSancionados > 0 && (
                    <span className="text-red-600 font-bold">({cantSancionados} con sancion activa)</span>
                  )}
                </p>
              </div>
            </div>

            {/* Botones de Accion */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setImportModal(true)}
                className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer hover:bg-emerald-100 transition-colors"
                title="Importar usuarios desde archivo Excel"
              >
                <Download size={14} /> Importar Excel
              </button>

              <button
                onClick={handleExportarExcel}
                disabled={exportando || usuarios.length === 0}
                className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer hover:bg-blue-100 transition-colors disabled:opacity-50"
                title="Exportar listado a Excel"
              >
                <Upload size={14} /> {exportando ? "Exportando..." : "Exportar Excel"}
              </button>

              <button
                onClick={handleExportarPDF}
                disabled={exportando || usuarios.length === 0}
                className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer hover:bg-rose-100 transition-colors disabled:opacity-50"
                title="Exportar listado a PDF institucional"
              >
                <FileText size={14} /> Exportar PDF
              </button>

              <button
                onClick={() => {
                  setSelectedUsuario(null);
                  setIsEdit(false);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 bg-blue-600 text-white rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus size={14} /> Nuevo Usuario
              </button>
            </div>
          </div>

          {/* Busqueda */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por documento, nombre, correo o ficha..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-blue-400 focus:outline-none transition-all"
            />
          </div>

          {/* Filtros Chips */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Estado:</span>
              {btnFiltro("todos", "Todos", "#e0e7ff", "#3730a3", "estado")}
              {btnFiltro("activos", "Activos", "#f0fdf4", "#16a34a", "estado")}
              {btnFiltro("inactivos", "Inactivos", "#fef2f2", "#dc2626", "estado")}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Sancion:</span>
              {btnFiltro("todos", "Todos", "#e0e7ff", "#3730a3", "sancion")}
              {btnFiltro("sancionados", "Sancionados", "#fef2f2", "#dc2626", "sancion")}
              {btnFiltro("sin_sancion", "Sin Sancion", "#f0fdf4", "#16a34a", "sancion")}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Rol:</span>
              {btnFiltro("todos", "Todos", "#e0e7ff", "#3730a3", "rol")}
              {btnFiltro("aprendiz", "Aprendices", "#dbeafe", "#1e40af", "rol")}
              {btnFiltro("pasante", "Pasantes", "#fef3c7", "#92400e", "rol")}
              {btnFiltro("coordinador", "Coordinador", "#fce7f3", "#9d174d", "rol")}
              {btnFiltro("administrador", "Administrador", "#ede9fe", "#6d28d9", "rol")}
              {btnFiltro("supervisor", "Supervisor", "#e0f2fe", "#0369a1", "rol")}
            </div>
          </div>
        </div>

        {/* Tabla DataTable */}
        <div className="overflow-x-auto">
          {cargando ? (
            <div className="p-12 flex justify-center">
              <GlobalLoader mensaje="Cargando listado completo de usuarios..." />
            </div>
          ) : (
            <DataTable
              columns={columnsTable}
              data={newList}
              keyField="Id_Usuario"
              pagination
              highlightOnHover
              responsive
              customStyles={customStyles}
              conditionalRowStyles={[
                {
                  when: (row) => row.San_Usuario === "Si" || row.San_Usuario === 1,
                  style: { backgroundColor: "#fff5f5" },
                },
              ]}
              noDataComponent={
                <div className="flex flex-col items-center py-12 text-slate-400">
                  <Users size={32} className="opacity-20 mb-2" />
                  <p className="text-xs">No se encontraron usuarios con los criterios indicados.</p>
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* ============================================================
          MODAL DETALLE E HISTORIAL DEL USUARIO
      ============================================================ */}
      {usuarioDetalle && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setUsuarioDetalle(null)} />
          <div className="relative bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden z-10 animate-in fade-in">
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-5 text-white flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-lg">
                  {`${usuarioDetalle.Nom_Usuario?.[0] || ""}${usuarioDetalle.Ape_Usuario?.[0] || ""}`.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-bold m-0">{usuarioDetalle.Nom_Usuario} {usuarioDetalle.Ape_Usuario}</h2>
                  <p className="text-xs text-blue-100 m-0">Doc: {usuarioDetalle.TipDoc_Usuario} {usuarioDetalle.NumDoc_Usuario}</p>
                </div>
              </div>
              <button
                onClick={() => setUsuarioDetalle(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border-0 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Informacion General */}
            <div className="p-5 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50">
              <div className="flex items-center gap-2 text-slate-700">
                <Mail size={14} className="text-slate-400" />
                <span><strong>Correo:</strong> {usuarioDetalle.Cor_Usuario || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone size={14} className="text-slate-400" />
                <span><strong>Telefono:</strong> {usuarioDetalle.Tel_Usuario || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <FileText size={14} className="text-slate-400" />
                <span><strong>Ficha:</strong> {usuarioDetalle.ficha?.Num_Ficha || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Users size={14} className="text-slate-400" />
                <span><strong>Programa:</strong> {usuarioDetalle.ficha?.programas?.Nom_Programa || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 size={14} className="text-slate-400" />
                <span><strong>Estado:</strong> <EstadoBadge estado={usuarioDetalle.Est_Usuario} /></span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <AlertCircle size={14} className="text-slate-400" />
                <span><strong>Sancion:</strong> <SancionBadge sancionado={usuarioDetalle.San_Usuario} /></span>
              </div>
            </div>

            {/* Listado de Historial Real */}
            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 m-0">
                  <History size={16} className="text-blue-600" /> Historial de Reservas
                </h3>
                <div className="flex gap-1">
                  {["todos", "Consumido", "Vencido"].map((filtro) => (
                    <button
                      key={filtro}
                      onClick={() => setFiltroHistorialTipo(filtro)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border-0 cursor-pointer ${
                        filtroHistorialTipo === filtro
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {filtro}
                    </button>
                  ))}
                </div>
              </div>

              {cargandoHistorial ? (
                <div className="py-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {historialReservas
                    .filter((r) => filtroHistorialTipo === "todos" || r.Est_Reserva === filtroHistorialTipo)
                    .map((res) => {
                      const est = res.Est_Reserva || "Generado";
                      let colorEst = "bg-blue-50 text-blue-700 border-blue-200";
                      if (est === "Consumido") colorEst = "bg-emerald-50 text-emerald-700 border-emerald-200";
                      if (est === "Vencido" || est === "Cancelado") colorEst = "bg-rose-50 text-rose-700 border-rose-200";

                      return (
                        <div key={res.Id_Reserva} className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs">{res.Tip_Reserva}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorEst}`}>
                              {est}
                            </span>
                          </div>
                          {res.plato?.Nom_Plato && (
                            <p className="text-xs text-emerald-700 font-semibold m-0">
                              {res.plato.Nom_Plato}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} /> {res.Fec_Reserva}
                            </span>
                            <span className="font-mono">#{String(res.Id_Reserva).padStart(4, "0")}</span>
                          </div>
                        </div>
                      );
                    })}

                  {historialReservas.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      Este usuario no registra reservas en el sistema.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => {
                  const target = usuarioDetalle;
                  setUsuarioDetalle(null);
                  editUsuario(target);
                }}
                className="inline-flex items-center gap-1.5 bg-blue-600 text-white rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Pencil size={14} /> Editar Informacion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL FORMULARIO DE USUARIO (CREAR / EDITAR)
      ============================================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={hideModal} />
          <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden z-10">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-base m-0">
                {isEdit ? "Editar Usuario" : "Registrar Nuevo Usuario"}
              </h2>
              <button onClick={hideModal} className="text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <UsuariosForm
                hideModal={hideModal}
                UsuarioSeleccionado={selectedUsuario}
                Editar={isEdit}
                reload={getAllUsuarios}
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL IMPORTAR EXCEL
      ============================================================ */}
      {importModal && (
        <ImportarExcel
          onClose={() => setImportModal(false)}
          reload={getAllUsuarios}
        />
      )}
    </div>
  );
};

export default CrudUsuarios;