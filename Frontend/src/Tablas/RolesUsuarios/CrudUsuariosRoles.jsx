// Frontend/src/Tablas/RolesUsuarios/CrudUsuariosRoles.jsx
import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig.js";
import DataTable from "react-data-table-component";
import UsuariosRolesForm from "../RolesUsuarios/UsuariosRolesForm.jsx";
import { Shield, Plus, Search, X, Pencil, Users } from "lucide-react";

const rolColors = {
  "Administrador":    { bg: "#fce7f3", color: "#9d174d" },
  "Coordinador":      { bg: "#ede9fe", color: "#6d28d9" },
  "Supervisor":       { bg: "#fef3c7", color: "#92400e" },
  "Aprendiz Interno": { bg: "#d1fae5", color: "#065f46" },
  "Aprendiz Externo": { bg: "#dbeafe", color: "#1e3a5f" },
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

  const columnsTable = [
    { name: "ID", selector: (row) => row.Id_UsuariosRol, sortable: true, width: "70px" },
    {
      name: "Usuario",
      selector: (row) => `${row.usuario?.Nom_Usuario || ""} ${row.usuario?.Ape_Usuario || ""}`,
      sortable: true,
      grow: 2,
      cell: (row) => {
        const nombre = `${row.usuario?.Nom_Usuario || ""} ${row.usuario?.Ape_Usuario || ""}`.trim();
        const initials = nombre.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#1d4ed8", fontWeight: 600, fontSize: 11 }}>{initials || "?"}</span>
            </div>
            <div>
              <p style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: 13, margin: 0 }}>{nombre || "—"}</p>
              <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: 0 }}>{row.usuario?.NumDoc_Usuario || "—"}</p>
            </div>
          </div>
        );
      },
    },
    {
      name: "Rol",
      selector: (row) => row.rol?.Nom_Rol,
      sortable: true,
      cell: (row) => row.rol?.Nom_Rol ? <RolBadge nombre={row.rol.Nom_Rol} /> : <span style={{ color: "#9ca3af", fontSize: 12 }}>Sin rol</span>,
    },
    {
      name: "Acciones",
      cell: (row) => (
        <button style={{ background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
          onClick={() => editItem(row)}>
          <Pencil size={12} /> Editar
        </button>
      ),
    },
  ];

  useEffect(() => { getAllUsuariosRol(); }, []);

  const getAllUsuariosRol = async () => {
    setCargando(true);
    try {
      const response = await apiAxios.get("/api/UsuariosRoles");
      // Fix alias: el backend usa as: "rolUsuario" pero el frontend espera "rol"
      const data = Array.isArray(response.data) ? response.data.map((item) => ({
        ...item,
        rol: item.rol || item.rolUsuario || null,
      })) : [];
      setUsuariosRol(data);
    } catch (error) {
      console.error("Error al cargar UsuariosRol:", error);
    } finally {
      setCargando(false);
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

  const customStyles = {
    headRow: { style: { background: "#f8fafc", fontSize: 11, fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb", textTransform: "uppercase", letterSpacing: "0.04em" } },
    rows: { style: { fontSize: 13, borderBottom: "1px solid #f3f4f6", "&:hover": { background: "#f5f3ff" } } },
    pagination: { style: { borderTop: "1px solid #e5e7eb", fontSize: 13 } },
  };

  return (
    <>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", background: "var(--color-background-tertiary)" }}>
        <div style={{ background: "var(--color-background-primary)", borderBottom: "1px solid var(--color-border-tertiary)", padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={18} style={{ color: "#fff" }} />
              </div>
              <div>
                <h1 style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: 16, margin: 0 }}>Usuarios - Roles</h1>
                <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>{usuariosRol.length} asignaciones</p>
              </div>
            </div>
            <button onClick={() => { setSelectedItem(null); setEditar(false); setIsModalOpen(true); }}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> Asignar Rol
            </button>
          </div>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-secondary)" }} />
            <input type="text" placeholder="Buscar por usuario, documento o rol..."
              style={{ width: "100%", paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: "1px solid var(--color-border-tertiary)", borderRadius: 8, fontSize: 13, background: "var(--color-background-secondary)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }}
              value={filterText} onChange={(e) => setFilterText(e.target.value)} />
          </div>
        </div>

        <div style={{ padding: "16px 20px" }}>
          {cargando ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0", color: "var(--color-text-secondary)" }}>
              <div style={{ width: 28, height: 28, border: "3px solid #ddd6fe", borderTop: "3px solid #7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: 10 }} />
              <p style={{ fontSize: 13 }}>Cargando asignaciones...</p>
            </div>
          ) : (
            <div style={{ background: "var(--color-background-primary)", borderRadius: 16, border: "1px solid var(--color-border-tertiary)", overflow: "hidden" }}>
              <DataTable
                columns={columnsTable}
                data={newList}
                keyField="Id_UsuariosRol"
                pagination
                highlightOnHover
                striped
                customStyles={customStyles}
                noDataComponent={
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0", color: "var(--color-text-secondary)" }}>
                    <Users size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <p style={{ fontSize: 13 }}>No hay asignaciones para mostrar</p>
                  </div>
                }
              />
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)" }} onClick={hideModal} />
          <div style={{
            background: "var(--color-background-primary)", width: "100%", maxWidth: 480,
            borderRadius: "20px 20px 0 0", zIndex: 10, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
            boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
          }} className="sm:rounded-2xl">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--color-border-tertiary)" }}>
              <h2 style={{ fontWeight: 600, fontSize: 15, color: "var(--color-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {editar ? <Pencil size={13} style={{ color: "#7c3aed" }} /> : <Plus size={13} style={{ color: "#7c3aed" }} />}
                </div>
                {editar ? "Editar Asignación" : "Asignar Rol a Usuario"}
              </h2>
              <button onClick={hideModal} style={{ background: "var(--color-background-secondary)", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex" }}>
                <X size={15} style={{ color: "var(--color-text-secondary)" }} />
              </button>
            </div>
            <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
              <UsuariosRolesForm hideModal={hideModal} data={selectedItem} Edit={editar} reload={getAllUsuariosRol} />
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

export default CrudUsuariosRoles;