// Frontend/src/Tablas/Usuarios/Aprendices.jsx
import apiAxios from "../../api/axiosConfig";
import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import UsuariosForm from "./UsuariosForm.jsx";
import { Users, Search, CheckCircle, XCircle, Filter } from "lucide-react";

const EstadoBadge = ({ estado }) => {
  const activo = estado === "Activo" || estado === "activo" || estado === "En Formacion";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
      background: activo ? "#d1fae5" : "#fee2e2",
      color: activo ? "#065f46" : "#991b1b",
    }}>
      {activo ? <CheckCircle size={11} /> : <XCircle size={11} />}
      {estado || "—"}
    </span>
  );
};

const Aprendices = () => {
  const [Usuarios, setUsuarios] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [filtroReserva, setFiltroReserva] = useState("todos");
  const [selectedUsuario, setselectedUsuario] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cargando, setCargando] = useState(true);

  const columnsTable = [
    { name: "ID", selector: (r) => r.Id_Usuario, width: "65px", sortable: true },
    {
      name: "Nombre",
      selector: (r) => `${r.Nom_Usuario} ${r.Ape_Usuario}`,
      sortable: true,
      grow: 2,
      cell: (r) => {
        const nombre = `${r.Nom_Usuario || ""} ${r.Ape_Usuario || ""}`.trim();
        const initials = nombre.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#1d4ed8", fontWeight: 600, fontSize: 11 }}>{initials}</span>
            </div>
            <div>
              <p style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: 13, margin: 0 }}>{nombre}</p>
              <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: 0 }}>
                {r.roles?.join(" · ") || "Sin rol"}
              </p>
            </div>
          </div>
        );
      },
    },
    { name: "Documento", selector: (r) => r.NumDoc_Usuario, cell: (r) => <span style={{ fontSize: 13 }}>{r.NumDoc_Usuario}</span> },
    { name: "Teléfono", selector: (r) => r.Tel_Usuario, cell: (r) => <span style={{ fontSize: 13 }}>{r.Tel_Usuario || "—"}</span> },
    {
      name: "Ficha",
      selector: (r) => r.ficha?.Num_Ficha,
      cell: (r) => r.ficha?.Num_Ficha
        ? <span style={{ background: "#ede9fe", color: "#6d28d9", borderRadius: 8, padding: "3px 8px", fontSize: 12, fontWeight: 600 }}>{r.ficha.Num_Ficha}</span>
        : <span style={{ color: "#9ca3af", fontSize: 12 }}>Sin ficha</span>,
    },
    {
      name: "Programa",
      selector: (r) => r.ficha?.Programa?.Nom_Programa || r.ficha?.programas?.Nom_Programa,
      sortable: true,
      cell: (r) => {
        const prog = r.ficha?.Programa?.Nom_Programa || r.ficha?.programas?.Nom_Programa;
        return <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{prog || "Sin programa"}</span>;
      },
    },
    {
      name: "Reserva",
      cell: (r) => (
        <span style={{
          background: r.tieneReserva ? "#d1fae5" : "#fee2e2",
          color: r.tieneReserva ? "#065f46" : "#991b1b",
          borderRadius: 8, padding: "3px 8px", fontSize: 11, fontWeight: 600,
        }}>
          {r.estadoReserva}
        </span>
      ),
    },
    {
      name: "Tipo Comida",
      selector: (r) => r.tipoComida,
      cell: (r) => <span style={{ fontSize: 12 }}>{r.tipoComida || "—"}</span>,
    },
    {
      name: "Estado",
      cell: (r) => <EstadoBadge estado={r.Est_Usuario} />,
    },
    {
      name: "Acciones",
      cell: (row) => (
        <button style={{ background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          onClick={() => editUsuario(row)}>
          Editar
        </button>
      ),
    },
    {
  name: "Detalle",
  cell: (row) => (
    <button
      className="bg-purple-500 text-white px-2 py-1 rounded"
      onClick={() => verDetalle(row)}
    >
      Ver
    </button>
  ),
}
  ];

  useEffect(() => { getAllUsuarios(); }, []);

  const getAllUsuarios = async () => {
    setCargando(true);
    try {
      // Usar el endpoint /aprendices que ya filtra por rol en el backend
      const usuariosRes = await apiAxios.get("/api/Usuarios/aprendices");
      let aprendices = Array.isArray(usuariosRes.data) ? usuariosRes.data : [];

      // Si el backend no filtra correctamente, filtrar en frontend también
      aprendices = aprendices.filter((u) => {
        const roles = u.roles || u.rolesUsuario?.map(r => r.rol?.Nom_Rol) || [];
        return roles.some(r => ["Aprendiz Interno", "Aprendiz Externo"].includes(r));
      });

      // Intentar obtener reservas (opcional, no bloquea si falla)
      let reservas = [];
      try {
        const reservasRes = await apiAxios.get("/api/Reservas/");
        reservas = Array.isArray(reservasRes.data) ? reservasRes.data : [];
      } catch { /* ignorar */ }

      const aprendicesFull = aprendices.map((user) => {
        const reserva = reservas.find(
          (r) => r.Id_Usuario === user.Id_Usuario && r.Estado === "Generada"
        );
        return {
          ...user,
          tieneReserva: !!reserva,
          estadoReserva: reserva?.Estado || "Sin reserva",
          tipoComida: reserva?.Tipo || "—",
        };
      });

      setUsuarios(aprendicesFull);
    } catch (error) {
      console.error("Error cargando aprendices:", error);
    } finally {
      setCargando(false);
    }
  };

  const editUsuario = (row) => { setselectedUsuario(row); setIsEdit(true); setIsModalOpen(true); };
  const hideModal = () => { setIsModalOpen(false); setselectedUsuario(null); setIsEdit(false); };

  let listaFiltrada = Usuarios;
  if (filtroReserva === "con") listaFiltrada = listaFiltrada.filter((u) => u.tieneReserva);
  else if (filtroReserva === "sin") listaFiltrada = listaFiltrada.filter((u) => !u.tieneReserva);

  const newList = listaFiltrada.filter((a) => {
    const t = filterText.toLowerCase();
    return (
      String(a.NumDoc_Usuario || "").toLowerCase().includes(t) ||
      String(a.Nom_Usuario || "").toLowerCase().includes(t) ||
      String(a.Ape_Usuario || "").toLowerCase().includes(t)
    );
  });

  const customStyles = {
    headRow: { style: { background: "#f8fafc", fontSize: 11, fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb", textTransform: "uppercase", letterSpacing: "0.04em" } },
    rows: { style: { fontSize: 13, borderBottom: "1px solid #f3f4f6", "&:hover": { background: "#f0f9ff" } } },
    pagination: { style: { borderTop: "1px solid #e5e7eb", fontSize: 13 } },
  };

  const btnFiltro = (valor, label, bg, color) => (
    <button onClick={() => setFiltroReserva(valor)} style={{
      background: filtroReserva === valor ? bg : "var(--color-background-secondary)",
      color: filtroReserva === valor ? color : "var(--color-text-secondary)",
      border: `1px solid ${filtroReserva === valor ? "transparent" : "var(--color-border-tertiary)"}`,
      borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
      transition: "all 0.15s",
    }}>
      {label}
    </button>
  );

  return (
    <>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", background: "var(--color-background-tertiary)", minHeight: 0 }}>
        <div style={{ background: "var(--color-background-primary)", borderBottom: "1px solid var(--color-border-tertiary)", padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={18} style={{ color: "#fff" }} />
            </div>
            <div>
              <h1 style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: 16, margin: 0 }}>Aprendices</h1>
              <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>
                {cargando ? "Cargando..." : `${Usuarios.length} aprendices`}
              </p>
            </div>
          </div>

          <div style={{ position: "relative", marginBottom: 12 }}>
            <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-secondary)" }} />
            <input type="text" placeholder="Buscar por nombre o documento..."
              style={{ width: "100%", paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: "1px solid var(--color-border-tertiary)", borderRadius: 8, fontSize: 13, background: "var(--color-background-secondary)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }}
              value={filterText} onChange={(e) => setFilterText(e.target.value)} />
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginRight: 4 }}>
              <Filter size={13} style={{ color: "var(--color-text-secondary)" }} />
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Reserva:</span>
            </div>
            {btnFiltro("todos", "Todos", "#e0e7ff", "#3730a3")}
            {btnFiltro("con", "Con reserva", "#d1fae5", "#065f46")}
            {btnFiltro("sin", "Sin reserva", "#fee2e2", "#991b1b")}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {cargando ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 0", color: "var(--color-text-secondary)" }}>
              <div style={{ width: 36, height: 36, border: "3px solid #bfdbfe", borderTop: "3px solid #2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: 12 }} />
              <p style={{ fontSize: 14 }}>Cargando aprendices...</p>
            </div>
          ) : (
            <div style={{ padding: "16px 20px" }}>
              <div style={{ background: "var(--color-background-primary)", borderRadius: 16, border: "1px solid var(--color-border-tertiary)", overflow: "hidden" }}>
                <DataTable
                  columns={columnsTable}
                  data={newList}
                  keyField="Id_Usuario"
                  pagination
                  highlightOnHover
                  striped
                  customStyles={customStyles}
                  noDataComponent={
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0", color: "var(--color-text-secondary)" }}>
                      <Users size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                      <p style={{ fontSize: 13 }}>No hay aprendices para mostrar</p>
                    </div>
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      

      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)" }} onClick={hideModal} />
          <div style={{
            background: "var(--color-background-primary)", width: "100%", maxWidth: 600,
            borderRadius: "20px 20px 0 0", boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
            zIndex: 10, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
          }} className="sm:rounded-2xl">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--color-border-tertiary)" }}>
              <h2 style={{ fontWeight: 600, fontSize: 15, color: "var(--color-text-primary)", margin: 0 }}>Editar Aprendiz</h2>
              <button onClick={hideModal} style={{ background: "var(--color-background-secondary)", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex" }}>
                <span style={{ color: "var(--color-text-secondary)", fontSize: 18, lineHeight: 1 }}>×</span>
              </button>
            </div>
            <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
              <UsuariosForm hideModal={hideModal} UsuarioSeleccionado={selectedUsuario} Editar={isEdit} reload={getAllUsuarios} />
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

export default Aprendices;