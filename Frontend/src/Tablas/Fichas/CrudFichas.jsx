// Frontend/src/Tablas/Fichas/CrudFichas.jsx
import apiAxios from "../../api/axiosConfig";
import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import FichasForm from "./FichasForm";
import { FileText, Calendar, BookOpen, Eye, Pencil, Plus, Search, X, Users } from "lucide-react";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isMobile;
};

// Modal de aprendices por ficha
const AprendicesModal = ({ ficha, aprendices, loading, onClose }) => {
  if (!ficha) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div style={{
        background: "var(--color-background-primary)", width: "100%", maxWidth: 440,
        borderRadius: "20px 20px 0 0", boxShadow: "0 -4px 32px rgba(0,0,0,0.14)",
        zIndex: 10, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh",
      }} className="sm:rounded-2xl">
        <div style={{ background: "#2563eb", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={18} style={{ color: "#fff" }} />
            </div>
            <div>
              <p style={{ color: "#bfdbfe", fontSize: 11, margin: 0 }}>Aprendices en ficha</p>
              <p style={{ color: "#fff", fontWeight: 600, fontSize: 14, margin: 0 }}>#{ficha.Num_Ficha}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", color: "#fff", display: "flex" }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: "10px 16px 8px", background: "#eff6ff", borderBottom: "1px solid #bfdbfe" }}>
          <span style={{ fontSize: 13, color: "#1d4ed8", fontWeight: 600 }}>
            {loading ? "Cargando..." : `${aprendices.length} aprendice${aprendices.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "12px 16px" }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0" }}>
              <div style={{ width: 28, height: 28, border: "3px solid #bfdbfe", borderTop: "3px solid #2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : aprendices.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0", color: "var(--color-text-secondary)" }}>
              <Users size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p style={{ fontSize: 13 }}>No hay aprendices en esta ficha</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {aprendices.map((ap, idx) => {
                const nombre = `${ap.Nom_Usuario || ap.Nom_Aprendiz || ""} ${ap.Ape_Usuario || ap.Ape_Aprendiz || ""}`.trim();
                const documento = ap.NumDoc_Usuario || ap.Doc_Aprendiz || "—";
                const initials = nombre.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
                return (
                  <div key={ap.Id_Usuario || idx} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: "var(--color-background-secondary)", borderRadius: 10, padding: "10px 12px",
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ color: "#1d4ed8", fontSize: 12, fontWeight: 600 }}>{initials || "?"}</span>
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: 13, margin: 0 }}>{nombre || "Sin nombre"}</p>
                      <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: 0 }}>Doc: {documento}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const DetalleModal = ({ ficha, onClose, onEdit, onVerAprendices }) => {
  if (!ficha) return null;
  const rows = [
    { label: "ID", value: ficha.Id_Ficha },
    { label: "N° Ficha", value: ficha.Num_Ficha },
    { label: "Programa", value: ficha.programas?.Nom_Programa || "—" },
    { label: "Inicio Lectiva", value: ficha.FecIniLec_Ficha?.slice?.(0, 10) || "—" },
    { label: "Fin Lectiva", value: ficha.FecFinLec_Ficha?.slice?.(0, 10) || "—" },
    { label: "Inicio Práctica", value: ficha.FecIniPra_Ficha?.slice?.(0, 10) || "—" },
    { label: "Fin Práctica", value: ficha.FecFinPra_Ficha?.slice?.(0, 10) || "—" },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div style={{
        background: "var(--color-background-primary)", width: "100%", maxWidth: 420,
        borderRadius: "20px 20px 0 0", boxShadow: "0 -4px 32px rgba(0,0,0,0.14)",
        zIndex: 10, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "88vh",
      }} className="sm:rounded-2xl">
        <div style={{ background: "#2563eb", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FileText size={18} style={{ color: "#fff" }} />
            <p style={{ color: "#fff", fontWeight: 600, fontSize: 14, margin: 0 }}>Ficha #{ficha.Num_Ficha}</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", color: "#fff", display: "flex" }}>
            <X size={15} />
          </button>
        </div>
        <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
          {rows.map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--color-border-tertiary)" }}>
              <span style={{ fontSize: 11, color: "var(--color-text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>{label}</span>
              <span style={{ fontSize: 13, color: "var(--color-text-primary)", fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--color-border-tertiary)", display: "flex", gap: 8 }}>
          <button onClick={() => { onVerAprendices(ficha); onClose(); }}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#eff6ff", color: "#1d4ed8", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Users size={14} /> Aprendices
          </button>
          <button onClick={() => { onEdit(ficha); onClose(); }}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Pencil size={14} /> Editar
          </button>
        </div>
      </div>
    </div>
  );
};

const FichaCard = ({ ficha, onEdit, onView, onVerAprendices, aprendicesCount }) => (
  <div style={{
    background: "var(--color-background-primary)", borderRadius: 16,
    border: "1px solid var(--color-border-tertiary)", padding: "14px 16px",
    display: "flex", alignItems: "center", gap: 12,
  }}>
    <div style={{ width: 44, height: 44, borderRadius: 14, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <FileText size={20} style={{ color: "#2563eb" }} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: 14 }}>#{ficha.Num_Ficha}</span>
        <button onClick={() => onVerAprendices(ficha)}
          style={{ display: "flex", alignItems: "center", gap: 4, background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: 8, padding: "2px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
          <Users size={11} />{aprendicesCount}
        </button>
      </div>
      <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
        <BookOpen size={11} />{ficha.programas?.Nom_Programa || "Sin programa"}
      </p>
      <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
        <Calendar size={11} />{ficha.FecIniLec_Ficha?.slice?.(0, 10)} → {ficha.FecFinLec_Ficha?.slice?.(0, 10)}
      </p>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <button onClick={() => onView(ficha)} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Eye size={13} style={{ color: "var(--color-text-secondary)" }} />
      </button>
      <button onClick={() => onEdit(ficha)} style={{ width: 34, height: 34, borderRadius: 8, border: "none", background: "#dbeafe", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Pencil size={13} style={{ color: "#1d4ed8" }} />
      </button>
    </div>
  </div>
);

const CrudFichas = () => {
  const [Fichas, setFichas] = useState([]);
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [selectedFicha, setSelectedFicha] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [fichaDetalle, setFichaDetalle] = useState(null);
  const [aprendicesModal, setAprendicesModal] = useState({ open: false, ficha: null });
  const [aprendicesList, setAprendicesList] = useState([]);
  const [aprendicesLoading, setAprendicesLoading] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    getAllFichas();
    getAllUsuarios();
  }, []);

  const getAllFichas = async () => {
    try {
      const res = await apiAxios.get("/api/Fichas/");
      setFichas(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  const getAllUsuarios = async () => {
    try {
      const res = await apiAxios.get("/api/Usuarios/");
      setTodosUsuarios(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  // Contar aprendices por ficha desde los usuarios cargados
  const contarAprendices = (fichaId) =>
    todosUsuarios.filter((u) => u.Id_Ficha === fichaId || u.ficha?.Id_Ficha === fichaId).length;

  const verAprendices = (ficha) => {
    setAprendicesModal({ open: true, ficha });
    setAprendicesLoading(true);
    const lista = todosUsuarios.filter((u) => u.Id_Ficha === ficha.Id_Ficha || u.ficha?.Id_Ficha === ficha.Id_Ficha);
    setAprendicesList(lista);
    setAprendicesLoading(false);
  };

  const columnsTable = [
    { name: "ID", selector: (r) => r.Id_Ficha, sortable: true, width: "65px" },
    { name: "N° Ficha", selector: (r) => r.Num_Ficha, sortable: true,
      cell: (r) => <span style={{ fontWeight: 600, color: "#2563eb", fontSize: 13 }}>{r.Num_Ficha}</span> },
    { name: "Inicio Lectiva", selector: (r) => r.FecIniLec_Ficha, cell: (r) => <span style={{ fontSize: 12 }}>{r.FecIniLec_Ficha?.slice?.(0, 10) || "—"}</span> },
    { name: "Fin Lectiva", selector: (r) => r.FecFinLec_Ficha, cell: (r) => <span style={{ fontSize: 12 }}>{r.FecFinLec_Ficha?.slice?.(0, 10) || "—"}</span> },
    { name: "Programa", selector: (r) => r.programas?.Nom_Programa,
      cell: (r) => <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{r.programas?.Nom_Programa || "Sin programa"}</span> },
    {
      name: "Aprendices",
      center: true,
      cell: (row) => {
        const count = contarAprendices(row.Id_Ficha);
        return (
          <button onClick={() => verAprendices(row)} title="Ver aprendices de esta ficha"
            style={{ display: "flex", alignItems: "center", gap: 5, background: count > 0 ? "#dbeafe" : "#f3f4f6", color: count > 0 ? "#1d4ed8" : "#9ca3af", border: "none", borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "background 0.15s" }}>
            <Users size={12} />{count}
          </button>
        );
      },
    },
    { name: "Creado", selector: (r) => r.createdAt, cell: (r) => <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("es-CO") : "—"}</span> },
    {
      name: "Acciones",
      cell: (row) => (
        <button style={{ background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
          onClick={() => editFicha(row)}>
          <Pencil size={12} /> Editar
        </button>
      ),
    },
  ];

  const editFicha = (row) => { setSelectedFicha(row); setIsEdit(true); setIsModalOpen(true); };
  const hideModal = () => { setIsModalOpen(false); setSelectedFicha(null); setIsEdit(false); };

  const newList = Fichas.filter((f) => {
    const t = filterText.toLowerCase();
    return String(f.Num_Ficha || "").toLowerCase().includes(t) || String(f.programas?.Nom_Programa || "").toLowerCase().includes(t);
  });

  const customStyles = {
    headRow: { style: { background: "#f8fafc", fontSize: 11, fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb", textTransform: "uppercase", letterSpacing: "0.04em" } },
    rows: { style: { fontSize: 13, borderBottom: "1px solid #f3f4f6", "&:hover": { background: "#f0f9ff" } } },
    pagination: { style: { borderTop: "1px solid #e5e7eb", fontSize: 13 } },
  };

  return (
    <>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", background: "var(--color-background-tertiary)" }}>
        <div style={{ background: "var(--color-background-primary)", borderBottom: "1px solid var(--color-border-tertiary)", padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText size={18} style={{ color: "#fff" }} />
              </div>
              <div>
                <h1 style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: 16, margin: 0 }}>Fichas</h1>
                <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>{Fichas.length} registros</p>
              </div>
            </div>
            <button onClick={() => { setSelectedFicha(null); setIsEdit(false); setIsModalOpen(true); }}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /><span>Nueva Ficha</span>
            </button>
          </div>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-secondary)" }} />
            <input type="text" placeholder="Buscar por número o programa..."
              style={{ width: "100%", paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: "1px solid var(--color-border-tertiary)", borderRadius: 8, fontSize: 13, background: "var(--color-background-secondary)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }}
              value={filterText} onChange={(e) => setFilterText(e.target.value)} />
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {isMobile ? (
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {newList.map((f) => (
                <FichaCard key={f.Id_Ficha} ficha={f}
                  aprendicesCount={contarAprendices(f.Id_Ficha)}
                  onEdit={editFicha}
                  onView={(ficha) => { setFichaDetalle(ficha); setDetalleOpen(true); }}
                  onVerAprendices={verAprendices}
                />
              ))}
            </div>
          ) : (
            <div style={{ padding: "16px 20px" }}>
              <div style={{ background: "var(--color-background-primary)", borderRadius: 16, border: "1px solid var(--color-border-tertiary)", overflow: "hidden" }}>
                <DataTable columns={columnsTable} data={newList} keyField="Id_Ficha"
                  pagination highlightOnHover striped customStyles={customStyles}
                  noDataComponent={
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0", color: "var(--color-text-secondary)" }}>
                      <FileText size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                      <p style={{ fontSize: 13 }}>No hay fichas para mostrar</p>
                    </div>
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {detalleOpen && <DetalleModal ficha={fichaDetalle} onClose={() => setDetalleOpen(false)} onEdit={editFicha} onVerAprendices={verAprendices} />}
      {aprendicesModal.open && <AprendicesModal ficha={aprendicesModal.ficha} aprendices={aprendicesList} loading={aprendicesLoading} onClose={() => setAprendicesModal({ open: false, ficha: null })} />}

      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)" }} onClick={hideModal} />
          <div style={{
            background: "var(--color-background-primary)", width: "100%", maxWidth: 520,
            borderRadius: "20px 20px 0 0", zIndex: 10, maxHeight: "95vh", overflow: "hidden", display: "flex", flexDirection: "column",
            boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
          }} className="sm:rounded-2xl">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--color-border-tertiary)", padding: "16px 20px" }}>
              <h2 style={{ fontWeight: 600, fontSize: 15, color: "var(--color-text-primary)", margin: 0 }}>
                {isEdit ? "Editar Ficha" : "Nueva Ficha"}
              </h2>
              <button onClick={hideModal} style={{ background: "var(--color-background-secondary)", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex" }}>
                <X size={15} style={{ color: "var(--color-text-secondary)" }} />
              </button>
            </div>
            <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
              <FichasForm hideModal={hideModal} selectedFicha={selectedFicha} isEdit={isEdit} reload={getAllFichas} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CrudFichas;