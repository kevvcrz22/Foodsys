// Frontend/src/Tablas/Usuarios/CrudUsuarios.jsx
import apiAxios from "../../api/axiosConfig";
import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import toast from "react-hot-toast";
import UsuariosForm from "./UsuariosForm.jsx";
import ImportarExcel from "./ImportarExcel.jsx";
import { exportarUsuariosExcel } from "./ExportExcel.jsx";
import {
  Users, Pencil, Plus, Search, X, History,
  CheckCircle2, AlertCircle, Ban, ShieldCheck,
  Download, Upload,
} from "lucide-react";

const EstadoBadge = ({ estado }) => {
  const activo = estado === "Activo" || estado === "activo" || estado === "En Formacion";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: 20,
        background: activo ? "#ecfdf5" : "#fef2f2",
        color: activo ? "#059669" : "#dc2626",
        border: `1px solid ${activo ? "#d1fae5" : "#fee2e2"}`,
        whiteSpace: "nowrap",
      }}
    >
      {activo ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
      {estado || "—"}
    </span>
  );
};

const SancionBadge = ({ sancionado }) => {
  const esSan = sancionado === "Si" || sancionado === 1;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: 20,
        background: esSan ? "#fef2f2" : "#f0fdf4",
        color: esSan ? "#dc2626" : "#16a34a",
        border: `1px solid ${esSan ? "#fecaca" : "#bbf7d0"}`,
        whiteSpace: "nowrap",
      }}
    >
      {esSan ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
      {esSan ? "Sancionado" : "Sin sanción"}
    </span>
  );
};

const avatarColor = (str) => {
  const colors = ["#dbeafe", "#ede9fe", "#d1fae5", "#fef3c7", "#fee2e2", "#cffafe", "#e0e7ff"];
  const text   = ["#1d4ed8", "#6d28d9", "#065f46", "#92400e", "#991b1b", "#0e7490", "#3730a3"];
  let h = 0;
  for (let i = 0; i < (str || "").length; i++) h = str.charCodeAt(i) + h;
  const idx = h % colors.length;
  return { bg: colors[idx], color: text[idx] };
};

const CrudUsuarios = () => {
  const [Usuarios,         setUsuarios]         = useState([]);
  const [TodasReservas,    setTodasReservas]    = useState([]);
  const [filterText,       setFilterText]       = useState("");
  const [filtroEstado,     setFiltroEstado]     = useState("todos");
  const [filtroSancion,    setFiltroSancion]    = useState("todos");
  const [filtroRol,        setFiltroRol]        = useState("todos");

  const [selectedUsuario,  setSelectedUsuario]  = useState(null);
  const [usuarioDetalle,   setUsuarioDetalle]   = useState(null);
  const [isEdit,           setIsEdit]           = useState(false);
  const [isModalOpen,      setIsModalOpen]      = useState(false);
  const [importModal,      setImportModal]      = useState(false);
  const [exportando,       setExportando]       = useState(false);
  const [cargando,         setCargando]         = useState(true);
  const [actualizandoSan,  setActualizandoSan]  = useState(null);

  const rolActivo = localStorage.getItem("rolActivo") || "";
  const canToggleSan = rolActivo === "Administrador" || rolActivo === "Coordinador";

  const toggleSancion = (usuario) => {
    const nuevo = (usuario.San_Usuario === "Si" || usuario.San_Usuario === 1) ? "No" : "Si";
    const esSancionar = nuevo === "Si";
    const nombre = `${usuario.Nom_Usuario || ""} ${usuario.Ape_Usuario || ""}`.trim();

    toast(
      (t) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 320, padding: "4px 2px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: esSancionar ? "#fee2e2" : "#dcfce7",
                color: esSancionar ? "#dc2626" : "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {esSancionar ? <Ban size={18} /> : <ShieldCheck size={18} />}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, color: "#1e293b", fontSize: 14, margin: 0 }}>
                {esSancionar ? "¿Sancionar usuario?" : "¿Quitar sanción?"}
              </p>
              <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0 0", lineHeight: 1.3 }}>
                {nombre} {usuario.NumDoc_Usuario ? `(${usuario.NumDoc_Usuario})` : ""}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                toast("Acción cancelada", { icon: "ℹ️", duration: 1000 });
              }}
              style={{
                background: "#f1f5f9",
                color: "#475569",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.15s",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                await ejecutarToggleSancion(usuario, nuevo);
              }}
              style={{
                background: esSancionar ? "#dc2626" : "#16a34a",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "6px 16px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                transition: "background 0.15s",
              }}
            >
              Confirmar
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  const ejecutarToggleSancion = async (usuario, nuevo) => {
    setActualizandoSan(usuario.Id_Usuario);
    const toastId = toast.loading("Actualizando sanción...");
    try {
      await apiAxios.patch(`/api/Usuarios/${usuario.Id_Usuario}/sancion`, { San_Usuario: nuevo });
      setUsuarios((prev) =>
        prev.map((u) => (u.Id_Usuario === usuario.Id_Usuario ? { ...u, San_Usuario: nuevo } : u))
      );
      if (usuarioDetalle?.Id_Usuario === usuario.Id_Usuario) {
        setUsuarioDetalle((prev) => ({ ...prev, San_Usuario: nuevo }));
      }
      toast.success(
        nuevo === "Si" ? "Usuario sancionado correctamente" : "Sanción retirada correctamente",
        { id: toastId }
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error al actualizar la sanción", { id: toastId });
    } finally {
      setActualizandoSan(null);
    }
  };

  const columnsTable = [
    {
      name: "Documento",
      selector: (r) => r.NumDoc_Usuario,
      width: "125px",
      cell: (r) => <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{r.NumDoc_Usuario || "—"}</span>,
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", minWidth: 0 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontWeight: 700,
                fontSize: 12,
                color: color,
              }}
            >
              {`${r.Nom_Usuario?.[0] || ""}${r.Ape_Usuario?.[0] || ""}`.toUpperCase() || "?"}
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontWeight: 600,
                  color: sancionado ? "#dc2626" : "#0f172a",
                  fontSize: 13,
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {nombre}
              </p>
              <p style={{ fontSize: 11, color: "#64748b", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {r.ficha?.Num_Ficha ? (
            <span
              style={{
                background: "#f5f3ff",
                color: "#6d28d9",
                border: "1px solid #ddd6fe",
                borderRadius: 6,
                padding: "2px 6px",
                fontSize: 11,
                fontWeight: 700,
                display: "inline-block",
                width: "fit-content",
              }}
            >
              Ficha {r.ficha.Num_Ficha}
            </span>
          ) : (
            <span style={{ fontSize: 11, color: "#94a3b8" }}>Sin ficha</span>
          )}
          {r.ficha?.programas?.Nom_Programa && (
            <span style={{ fontSize: 11, color: "#64748b", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.ficha.programas.Nom_Programa}>
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
      name: "Sanción",
      selector: (r) => r.San_Usuario,
      sortable: true,
      width: "125px",
      cell: (r) => <SancionBadge sancionado={r.San_Usuario} />,
    },
    {
      name: "Acciones",
      width: "280px",
      cell: (row) => (
        <div style={{ display: "flex", gap: 6, alignItems: "center", whiteSpace: "nowrap" }}>
          <button
            onClick={() => setUsuarioDetalle(row)}
            style={{
              background: "#f8fafc",
              color: "#334155",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "5px 9px",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
            }}
            title="Ver detalle e historial"
          >
            <History size={12} style={{ color: "#64748b" }} />
            Detalle
          </button>

          <button
            onClick={() => editUsuario(row)}
            style={{
              background: "#eff6ff",
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",
              borderRadius: 8,
              padding: "5px 9px",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
            }}
            title="Editar usuario"
          >
            <Pencil size={12} style={{ color: "#2563eb" }} />
            Editar
          </button>

          {canToggleSan && (
            <button
              disabled={actualizandoSan === row.Id_Usuario}
              onClick={() => toggleSancion(row)}
              style={{
                background: (row.San_Usuario === "Si" || row.San_Usuario === 1) ? "#ecfdf5" : "#fef2f2",
                color: (row.San_Usuario === "Si" || row.San_Usuario === 1) ? "#047857" : "#b91c1c",
                border: `1px solid ${(row.San_Usuario === "Si" || row.San_Usuario === 1) ? "#a7f3d0" : "#fecaca"}`,
                borderRadius: 8,
                padding: "5px 9px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
                opacity: actualizandoSan === row.Id_Usuario ? 0.5 : 1,
              }}
              title={(row.San_Usuario === "Si" || row.San_Usuario === 1) ? "Quitar sanción al usuario" : "Sancionar usuario"}
            >
              {(row.San_Usuario === "Si" || row.San_Usuario === 1) ? (
                <>
                  <ShieldCheck size={12} style={{ color: "#059669" }} />
                  Quitar
                </>
              ) : (
                <>
                  <Ban size={12} style={{ color: "#dc2626" }} />
                  Sancionar
                </>
              )}
            </button>
          )}
        </div>
      ),
    },
  ];

  useEffect(() => {
    getAllUsuarios();
  }, []);

  const getAllUsuarios = async () => {
    setCargando(true);
    try {
      const [usuariosRes, reservasRes] = await Promise.allSettled([
        apiAxios.get("/api/Usuarios/"),
        apiAxios.get("/api/Reservas/Todas"),
      ]);

      if (usuariosRes.status === "fulfilled") {
        setUsuarios(Array.isArray(usuariosRes.value.data) ? usuariosRes.value.data : []);
      }
      if (reservasRes.status === "fulfilled") {
        setTodasReservas(Array.isArray(reservasRes.value.data) ? reservasRes.value.data : []);
      }
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      toast.error("Error al cargar la lista de usuarios");
    } finally {
      setCargando(false);
    }
  };

  const editUsuario = (row) => {
    setSelectedUsuario(row);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const hideModal = () => {
    setIsModalOpen(false);
    setSelectedUsuario(null);
    setIsEdit(false);
  };

  const handleExportar = async () => {
    setExportando(true);
    try {
      exportarUsuariosExcel(filterText ? newList : Usuarios);
    } catch (err) {
      console.error(err);
      toast.error("Error al exportar usuarios a Excel");
    } finally {
      setExportando(false);
    }
  };

  // Filtrado
  let listaFiltrada = Usuarios;

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

  const cantSancionados = Usuarios.filter((u) => u.San_Usuario === "Si" || u.San_Usuario === 1).length;

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
    <>
      <div style={{ display: "flex", height: "calc(100vh - 100px)", gap: 16, overflow: "hidden" }}>
        {/* PANEL IZQUIERDO: Tabla y Filtros */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          {/* Cabecera */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Users size={20} style={{ color: "#fff" }} />
                </div>
                <div>
                  <h1 style={{ fontWeight: 700, color: "#111827", fontSize: 18, margin: 0 }}>Gestión de Usuarios</h1>
                  <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                    {Usuarios.length} totales{" "}
                    {cantSancionados > 0 && (
                      <span style={{ color: "#dc2626", fontWeight: 600 }}>({cantSancionados} sancionados)</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Botones de acción: Importar (flecha abajo), Exportar (flecha arriba), Nuevo */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => setImportModal(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#ecfdf5",
                    color: "#065f46",
                    border: "1px solid #a7f3d0",
                    borderRadius: 10,
                    padding: "7px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  title="Importar usuarios desde Excel"
                >
                  <Download size={14} /> Importar Excel
                </button>

                <button
                  onClick={handleExportar}
                  disabled={exportando || Usuarios.length === 0}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                    borderRadius: 10,
                    padding: "7px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background 0.15s",
                    opacity: exportando || Usuarios.length === 0 ? 0.6 : 1,
                  }}
                  title="Exportar usuarios a Excel"
                >
                  <Upload size={14} /> {exportando ? "Exportando..." : "Exportar Excel"}
                </button>

                <button
                  onClick={() => {
                    setSelectedUsuario(null);
                    setIsEdit(false);
                    setIsModalOpen(true);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "7px 16px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(37,99,235,0.3)",
                    transition: "background 0.15s",
                  }}
                >
                  <Plus size={14} /> Nuevo Usuario
                </button>
              </div>
            </div>

            {/* Búsqueda y Filtros de Chips */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ position: "relative" }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                  }}
                />
                <input
                  type="text"
                  placeholder="Buscar por documento, nombre, correo o ficha..."
                  style={{
                    width: "100%",
                    paddingLeft: 38,
                    paddingRight: 12,
                    paddingTop: 10,
                    paddingBottom: 10,
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    fontSize: 13,
                    outline: "none",
                    background: "#f8fafc",
                  }}
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>
                    Estado:
                  </span>
                  {btnFiltro("todos", "Todos", "#e0e7ff", "#3730a3", "estado")}
                  {btnFiltro("activos", "Activos", "#f0fdf4", "#16a34a", "estado")}
                  {btnFiltro("inactivos", "Inactivos", "#fef2f2", "#dc2626", "estado")}
                </div>

                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>
                    Sanción:
                  </span>
                  {btnFiltro("todos", "Todos", "#e0e7ff", "#3730a3", "sancion")}
                  {btnFiltro("sancionados", "Sancionados", "#fef2f2", "#dc2626", "sancion")}
                  {btnFiltro("sin_sancion", "Sin Sanción", "#f0fdf4", "#16a34a", "sancion")}
                </div>

                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>
                    Rol:
                  </span>
                  {btnFiltro("todos", "Todos", "#e0e7ff", "#3730a3", "rol")}
                  {btnFiltro("aprendiz", "Aprendices", "#dbeafe", "#1e40af", "rol")}
                  {btnFiltro("instructor", "Instructores", "#fef3c7", "#92400e", "rol")}
                  {btnFiltro("administrador", "Admin / Coord", "#ede9fe", "#6d28d9", "rol")}
                </div>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div style={{ flex: 1, overflow: "auto" }}>
            {cargando ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  color: "#6b7280",
                }}
              >
                Cargando usuarios...
              </div>
            ) : (
              <DataTable
                columns={columnsTable}
                data={newList}
                keyField="Id_Usuario"
                pagination
                highlightOnHover
                customStyles={customStyles}
                conditionalRowStyles={[
                  {
                    when: (row) => row.San_Usuario === "Si" || row.San_Usuario === 1,
                    style: { backgroundColor: "#fff5f5" },
                  },
                ]}
                noDataComponent={
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0", color: "#9ca3af" }}>
                    <Users size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                    <p style={{ fontSize: 13, margin: 0 }}>No se encontraron usuarios</p>
                  </div>
                }
              />
            )}
          </div>
        </div>

        {/* PANEL DERECHO: Perfil e Historial del Usuario */}
        {usuarioDetalle && (
          <div
            style={{
              width: "380px",
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              animation: "slideIn 0.3s ease-out",
            }}
          >
            {/* Header lateral */}
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid #e5e7eb",
                background: "#f8fafc",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      background:
                        usuarioDetalle.San_Usuario === "Si" || usuarioDetalle.San_Usuario === 1
                          ? "#fee2e2"
                          : "#dbeafe",
                      border: `2px solid ${
                        usuarioDetalle.San_Usuario === "Si" || usuarioDetalle.San_Usuario === 1
                          ? "#fca5a5"
                          : "#93c5fd"
                      }`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        color:
                          usuarioDetalle.San_Usuario === "Si" || usuarioDetalle.San_Usuario === 1
                            ? "#dc2626"
                            : "#1d4ed8",
                        fontWeight: 700,
                        fontSize: 16,
                      }}
                    >
                      {`${usuarioDetalle.Nom_Usuario?.[0] || ""}${usuarioDetalle.Ape_Usuario?.[0] || ""}`.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#111827" }}>
                      {usuarioDetalle.Nom_Usuario} {usuarioDetalle.Ape_Usuario}
                    </h2>
                    <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0 0" }}>
                      {usuarioDetalle.NumDoc_Usuario}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <p style={{ fontSize: 12, margin: 0 }}>
                    <strong style={{ color: "#4b5563" }}>Correo:</strong> {usuarioDetalle.Cor_Usuario || "—"}
                  </p>
                  <p style={{ fontSize: 12, margin: 0 }}>
                    <strong style={{ color: "#4b5563" }}>Teléfono:</strong> {usuarioDetalle.Tel_Usuario || "—"}
                  </p>
                  <p style={{ fontSize: 12, margin: 0 }}>
                    <strong style={{ color: "#4b5563" }}>Ficha:</strong> {usuarioDetalle.ficha?.Num_Ficha || "N/A"}
                  </p>
                  <p style={{ fontSize: 12, margin: 0 }}>
                    <strong style={{ color: "#4b5563" }}>Programa:</strong>{" "}
                    {usuarioDetalle.ficha?.programas?.Nom_Programa || "N/A"}
                  </p>
                  <p style={{ fontSize: 12, margin: 0 }}>
                    <strong style={{ color: "#4b5563" }}>Estado:</strong>{" "}
                    <EstadoBadge estado={usuarioDetalle.Est_Usuario} />
                  </p>
                  <p style={{ fontSize: 12, margin: 0 }}>
                    <strong style={{ color: "#4b5563" }}>Sanción:</strong>{" "}
                    <SancionBadge sancionado={usuarioDetalle.San_Usuario} />
                  </p>
                </div>
              </div>

              <button
                onClick={() => setUsuarioDetalle(null)}
                style={{
                  background: "#e5e7eb",
                  border: "none",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#4b5563",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Historial de reservas */}
            <div style={{ padding: "20px", flex: 1, overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#111827",
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <History size={16} style={{ color: "#6366f1" }} />
                  Historial de Reservas
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {TodasReservas.filter((r) => r.Id_Usuario === usuarioDetalle.Id_Usuario)
                  .sort((a, b) => new Date(b.Fec_Reserva || b.createdAt) - new Date(a.Fec_Reserva || a.createdAt))
                  .map((res) => {
                    const est = res.Est_Reserva || res.Estado || "—";
                    const tipo = res.Tip_Reserva || res.Tipo || "—";
                    let colorEstado = "#f3f4f6";
                    let textEstado = "#374151";
                    if (est === "Generado" || est === "Generada" || est === "Verificado" || est === "Verificada") {
                      colorEstado = "#dbeafe";
                      textEstado = "#1d4ed8";
                    } else if (est === "Consumido" || est === "Consumida" || est === "Usada") {
                      colorEstado = "#d1fae5";
                      textEstado = "#065f46";
                    } else if (est === "Vencido" || est === "Vencida" || est === "Cancelado" || est === "Cancelada") {
                      colorEstado = "#fee2e2";
                      textEstado = "#991b1b";
                    }

                    return (
                      <div
                        key={res.Id_Reserva}
                        style={{
                          background: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: 10,
                          padding: "12px",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 6,
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{tipo}</span>
                          <span
                            style={{
                              fontSize: 11,
                              background: colorEstado,
                              color: textEstado,
                              padding: "2px 8px",
                              borderRadius: 12,
                              fontWeight: 600,
                            }}
                          >
                            {est}
                          </span>
                        </div>
                        {res.plato?.Nom_Plato && (
                          <p style={{ fontSize: 11, color: "#059669", fontWeight: 600, margin: "0 0 4px 0" }}>
                            🍽️ {res.plato.Nom_Plato}
                          </p>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: "#6b7280" }}>
                            {res.Fec_Reserva
                              ? new Date(res.Fec_Reserva).toLocaleDateString("es-CO", {
                                  weekday: "short",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "—"}
                          </span>
                          <span style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace" }}>
                            #{res.Id_Reserva.toString().padStart(4, "0")}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                {TodasReservas.filter((r) => r.Id_Usuario === usuarioDetalle.Id_Usuario).length === 0 && (
                  <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af" }}>
                    <p style={{ fontSize: 13 }}>Este usuario no registra reservas.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer con botón editar */}
            <div style={{ padding: "16px 20px", borderTop: "1px solid #e5e7eb", background: "#f8fafc" }}>
              <button
                onClick={() => {
                  editUsuario(usuarioDetalle);
                }}
                style={{
                  width: "100%",
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Pencil size={14} /> Editar Información
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal formulario de Usuario */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(2px)",
            }}
            onClick={hideModal}
          />
          <div
            style={{
              background: "#fff",
              width: "100%",
              maxWidth: 640,
              borderRadius: 20,
              zIndex: 10,
              maxHeight: "92vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#111827" }}>
                {isEdit ? "Editar Usuario" : "Nuevo Usuario"}
              </h2>
              <button
                onClick={hideModal}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#6b7280" }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: "20px", overflowY: "auto" }}>
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

      {/* Modal Importar Excel */}
      {importModal && (
        <ImportarExcel
          onClose={() => setImportModal(false)}
          reload={getAllUsuarios}
        />
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
};

export default CrudUsuarios;