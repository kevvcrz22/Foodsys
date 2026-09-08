import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig.js";
import DataTable from "react-data-table-component";
import ReservasForm from "./ReservaForm.jsx";
import { QRCodeCanvas } from "qrcode.react";
import CryptoJS from "crypto-js";
import {
  CalendarCheck, Eye, Pencil, Plus, Search, X, Clock,
  CheckCircle, XCircle, AlertCircle, Coffee, Sun, Moon,
  User, CreditCard, Sunrise, UtensilsCrossed,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || "clave_por_defecto_cambiar";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

const estadoConfig = {
  Generado:   { cls: "bg-blue-100 text-blue-800 border-blue-300",   Icon: AlertCircle  },
  Generada:   { cls: "bg-blue-100 text-blue-800 border-blue-300",   Icon: AlertCircle  },
  Verificado: { cls: "bg-purple-100 text-purple-800 border-purple-300", Icon: CheckCircle },
  Verificada: { cls: "bg-purple-100 text-purple-800 border-purple-300", Icon: CheckCircle },
  Consumido:  { cls: "bg-green-100 text-green-800 border-green-300", Icon: CheckCircle  },
  Consumida:  { cls: "bg-green-100 text-green-800 border-green-300", Icon: CheckCircle  },
  Usada:      { cls: "bg-green-100 text-green-800 border-green-300", Icon: CheckCircle  },
  Vencido:    { cls: "bg-red-100 text-red-800 border-red-300",      Icon: XCircle      },
  Vencida:    { cls: "bg-red-100 text-red-800 border-red-300",      Icon: XCircle      },
  Cancelado:  { cls: "bg-gray-100 text-gray-600 border-gray-300",   Icon: XCircle      },
  Cancelada:  { cls: "bg-gray-100 text-gray-600 border-gray-300",   Icon: XCircle      },
};

const EstadoBadge = ({ estado }) => {
  const cfg = estadoConfig[estado] || { cls: "bg-gray-100 text-gray-600 border-gray-300", Icon: AlertCircle };
  const Icon = cfg.Icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <Icon className="w-3 h-3" />
      {estado || "—"}
    </span>
  );
};

const tipoIcon = { Desayuno: Coffee, Almuerzo: Sun, Cena: Moon };
const tipoBadge = {
  Desayuno: "bg-amber-100 text-amber-800 border-amber-200",
  Almuerzo: "bg-green-100 text-green-800 border-green-200",
  Cena:     "bg-indigo-100 text-indigo-800 border-indigo-200",
};

/* ─────────────────────────────────────────
   Modal QR con Información Completa y Plato
───────────────────────────────────────── */
const QRModal = ({ reserva, onClose }) => {
  if (!reserva) return null;

  const qrValue = reserva.Qr_Reserva || reserva.Tex_Qr || (reserva.Id_Reserva ? String(reserva.Id_Reserva) : "");

  let datosQR = {};
  try {
    if (qrValue) {
      const bytes = CryptoJS.AES.decrypt(qrValue, ENCRYPTION_KEY);
      const texto = bytes.toString(CryptoJS.enc.Utf8);
      if (texto) {
        try {
          datosQR = JSON.parse(texto);
        } catch {
          datosQR = { raw: texto };
        }
      }
    }
  } catch (err) {
    console.warn("No se pudo descifrar el código QR:", err);
  }

  const nombre = reserva.usuario
    ? `${reserva.usuario.Nom_Usuario || ""} ${reserva.usuario.Ape_Usuario || ""}`.trim()
    : datosQR.Nom_Usuario
      ? `${datosQR.Nom_Usuario} ${datosQR.Ape_Usuario || ""}`
      : "—";
  const documento = reserva.usuario?.NumDoc_Usuario || datosQR.NumDoc || "—";
  const tipo = reserva.Tip_Reserva || reserva.Tipo || datosQR.Tipo || "—";
  const fecha = reserva.Fec_Reserva || datosQR.Fec_Reserva || "—";

  const vencimientoLabel = {
    Desayuno: "7:00 a.m.",
    Almuerzo: "2:00 p.m.",
    Cena: "7:00 p.m."
  }[tipo] || "";

  const estado = reserva.Est_Reserva || reserva.Estado || "Generado";
  const platoImg = reserva.plato?.Img_Plato ? `${API_URL}/uploads/${reserva.plato.Img_Plato}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 pt-5 pb-2 flex items-center justify-between border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Código QR de Reserva</h2>
            <p className="text-xs text-gray-400">Reserva #{reserva.Id_Reserva}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-3 overflow-y-auto space-y-3">
          {/* Card Aprendiz y Turno */}
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-3.5 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-sm font-semibold text-gray-800 truncate">{nombre}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-600">{documento}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
              <div className="flex items-center gap-2">
                {tipo === "Desayuno" ? <Sunrise className="w-4 h-4 text-amber-600" /> :
                 tipo === "Almuerzo" ? <Sun className="w-4 h-4 text-emerald-600" /> :
                 <Moon className="w-4 h-4 text-indigo-600" />}
                <span className="text-xs font-semibold text-gray-700">{tipo}</span>
              </div>
              <EstadoBadge estado={estado} />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>{fecha} {vencimientoLabel && `· Vence ${vencimientoLabel}`}</span>
            </div>
          </div>

          {/* Card Plato */}
          {reserva.plato && (
            <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-3 flex items-center gap-3">
              {platoImg ? (
                <img
                  src={platoImg}
                  alt={reserva.plato.Nom_Plato || "Plato"}
                  className="w-14 h-14 rounded-xl object-cover border border-emerald-200 shrink-0 shadow-sm"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-emerald-100/70 flex items-center justify-center text-emerald-600 shrink-0">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Menú asignado</span>
                <p className="font-bold text-gray-800 text-xs truncate m-0">{reserva.plato.Nom_Plato}</p>
                {reserva.plato.Des_Plato ? (
                  <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 m-0">{reserva.plato.Des_Plato}</p>
                ) : (
                  <p className="text-[11px] text-gray-400 mt-0.5 m-0 italic">Sin descripción</p>
                )}
              </div>
            </div>
          )}

          {/* Canvas QR */}
          <div className="flex justify-center py-2">
            <div className={`p-3.5 rounded-2xl border-2 bg-white shadow-sm ${
              estado === "Generado" || estado === "Generada" || estado === "Verificado" || estado === "Verificada"
                ? "border-emerald-300"
                : "border-gray-200 opacity-60"
            }`}>
              {qrValue ? (
                <QRCodeCanvas
                  value={qrValue}
                  size={190}
                  level="H"
                  fgColor={estado === "Cancelado" || estado === "Cancelada" || estado === "Vencido" || estado === "Vencida" ? "#6b7280" : "#000000"}
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-gray-400 text-xs">
                  Sin código QR disponible
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition cursor-pointer shadow-sm text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   Componente principal CrudReservas
───────────────────────────────────────── */
const CrudReservas = () => {
  const [reservas,       setReservas]       = useState([]);
  const [filterText,     setFilterText]     = useState("");
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [Editar,         setEditar]         = useState(false);
  const [isModalOpen,    setIsModalOpen]    = useState(false);
  const [qrReserva,      setQrReserva]      = useState(null);
  const isMobile = useIsMobile();

  const verQr = (row) => setQrReserva(row);

  const columnsTable = [
    { name: "ID", selector: (r) => r.Id_Reserva, sortable: true, width: "65px" },
    {
      name: "Fecha",
      selector: (r) => r.Fec_Reserva,
      sortable: true,
      minWidth: "110px",
      cell: (r) => <span className="text-[13px] text-slate-700 font-medium whitespace-nowrap">{r.Fec_Reserva || "—"}</span>
    },
    {
      name: "Aprendiz",
      selector: (r) => r.usuario?.Nom_Usuario,
      sortable: true,
      minWidth: "180px",
      grow: 2,
      cell: (r) => {
        const nombre = r.usuario ? `${r.usuario.Nom_Usuario || ""} ${r.usuario.Ape_Usuario || ""}`.trim() : "—";
        return (
          <div className="py-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-800 m-0 truncate">{nombre}</p>
            <p className="text-[11px] text-slate-400 m-0 truncate">{r.usuario?.NumDoc_Usuario || ""}</p>
          </div>
        );
      },
    },
    {
      name: "Plato / Menú",
      selector: (r) => r.plato?.Nom_Plato,
      sortable: true,
      minWidth: "200px",
      grow: 2,
      cell: (r) => {
        const platoImg = r.plato?.Img_Plato ? `${API_URL}/uploads/${r.plato.Img_Plato}` : null;
        return (
          <div className="flex items-center gap-2.5 py-1.5 min-w-0">
            {platoImg ? (
              <img
                src={platoImg}
                alt={r.plato.Nom_Plato}
                className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 shadow-xs"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 text-[13px] m-0 truncate">
                {r.plato?.Nom_Plato || "Sin plato asignado"}
              </p>
              {r.plato?.Des_Plato ? (
                <p className="text-[11px] text-slate-400 m-0 truncate max-w-[220px]" title={r.plato.Des_Plato}>
                  {r.plato.Des_Plato}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 m-0 italic">Sin descripción</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      name: "Tipo",
      selector: (r) => r.Tip_Reserva || r.Tipo,
      sortable: true,
      minWidth: "120px",
      cell: (r) => {
        const tipo = r.Tip_Reserva || r.Tipo || "—";
        const TIcon = tipoIcon[tipo] || CalendarCheck;
        return (
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 whitespace-nowrap ${tipoBadge[tipo] || "bg-gray-100 text-gray-600"}`}>
            <TIcon className="w-3.5 h-3.5" />
            {tipo}
          </span>
        );
      },
    },
    {
      name: "Estado",
      selector: (r) => r.Est_Reserva || r.Estado,
      sortable: true,
      minWidth: "120px",
      cell: (r) => <EstadoBadge estado={r.Est_Reserva || r.Estado} />,
    },
    {
      name: "Vencimiento",
      selector: (r) => r.Vec_Reserva || r.Vencimiento,
      sortable: true,
      minWidth: "130px",
      cell: (r) => {
        const vec = r.Vec_Reserva || r.Vencimiento;
        return (
          <span className="text-xs text-slate-600 whitespace-nowrap">
            {vec
              ? new Date(vec).toLocaleString("es-CO", {
                  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                })
              : "—"}
          </span>
        );
      },
    },
    {
      name: "Acciones",
      minWidth: "160px",
      cell: (row) => (
        <div className="flex gap-1.5 whitespace-nowrap">
          <button
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            onClick={() => verQr(row)}
            title="Ver código QR y plato"
          >
            <Eye size={12} /> QR
          </button>
          <button
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            onClick={() => editReserva(row)}
            title="Editar reserva"
          >
            <Pencil size={12} /> Editar
          </button>
        </div>
      ),
    },
  ];

  useEffect(() => { getAllReservas(); }, []);

  const getAllReservas = async () => {
    try {
      const response = await apiAxios.get("/api/Reservas/Todas");
      setReservas(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error al cargar reservas:", err);
    }
  };

  const editReserva = (row) => { setSelectedReserva(row); setEditar(true); setIsModalOpen(true); };
  const hideModal   = () => { setIsModalOpen(false); setSelectedReserva(null); };

  const newList = reservas.filter((r) => {
    const t = filterText.toLowerCase();
    const nombre = r.usuario ? `${r.usuario.Nom_Usuario || ""} ${r.usuario.Ape_Usuario || ""}` : "";
    const tipo = r.Tip_Reserva || r.Tipo || "";
    const estado = r.Est_Reserva || r.Estado || "";
    const plato = r.plato?.Nom_Plato || "";
    const desc = r.plato?.Des_Plato || "";
    return (
      tipo.toLowerCase().includes(t) ||
      (r.Fec_Reserva && r.Fec_Reserva.toLowerCase().includes(t)) ||
      estado.toLowerCase().includes(t) ||
      nombre.toLowerCase().includes(t) ||
      plato.toLowerCase().includes(t) ||
      desc.toLowerCase().includes(t) ||
      (r.usuario?.NumDoc_Usuario && r.usuario.NumDoc_Usuario.toString().includes(t))
    );
  });

  const customStyles = {
    table:      { style: { minWidth: "900px" } },
    headRow:    { style: { background: "#f8fafc", fontSize: 12, fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" } },
    headCells:  { style: { whiteSpace: "nowrap" } },
    cells:      { style: { whiteSpace: "nowrap" } },
    rows:       { style: { fontSize: 13, borderBottom: "1px solid #f3f4f6", "&:hover": { background: "#f0fdf4" } } },
    pagination: { style: { borderTop: "1px solid #e5e7eb", fontSize: 13 } },
  };

  return (
    <>
      <div className="w-full h-full flex flex-col bg-slate-50 min-h-0">
        <div className="bg-white border-b border-slate-100 px-5 py-4 shrink-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                <CalendarCheck size={18} className="text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-slate-800 text-base m-0">Reservas</h1>
                <p className="text-xs text-slate-400 m-0">{reservas.length} registros</p>
              </div>
            </div>
            <button
              onClick={() => { setSelectedReserva(null); setEditar(false); setIsModalOpen(true); }}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0 rounded-xl px-4 py-2 text-[13px] font-semibold cursor-pointer transition-colors shadow-sm"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Nueva Reserva</span>
            </button>
          </div>
          <div className="mt-3 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por tipo, fecha, aprendiz, plato o estado..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-[13px] bg-slate-50 text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10 transition-all"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isMobile ? (
            <div className="p-3 space-y-2.5">
              {newList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <CalendarCheck size={40} className="mb-2 opacity-30" />
                  <p className="text-sm">No hay reservas registradas</p>
                </div>
              ) : (
                newList.map((r) => {
                  const tipo = r.Tip_Reserva || r.Tipo || "—";
                  const estado = r.Est_Reserva || r.Estado || "—";
                  const platoImg = r.plato?.Img_Plato ? `${API_URL}/uploads/${r.plato.Img_Plato}` : null;
                  return (
                    <div key={r.Id_Reserva} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                      <div className="flex items-start gap-3 mb-3">
                        {platoImg ? (
                          <img
                            src={platoImg}
                            alt={r.plato?.Nom_Plato}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                            {tipoIcon[tipo] ? <Coffee className="w-5 h-5 text-emerald-600" /> : <UtensilsCrossed className="w-5 h-5 text-emerald-600" />}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="font-bold text-slate-800 text-sm">Reserva #{r.Id_Reserva}</span>
                            <EstadoBadge estado={estado} />
                          </div>
                          <p className="text-xs text-slate-700 font-semibold truncate m-0">
                            {r.usuario?.Nom_Usuario} {r.usuario?.Ape_Usuario}
                          </p>
                          <p className="text-[11px] text-emerald-700 font-medium truncate m-0">
                            {r.plato?.Nom_Plato || "Sin plato"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${tipoBadge[tipo] || "bg-gray-100"}`}>
                              {tipo}
                            </span>
                            <span className="text-[11px] text-slate-400">{r.Fec_Reserva}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-slate-50">
                        <button onClick={() => verQr(r)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold cursor-pointer transition-colors">
                          <Eye className="w-3.5 h-3.5" /> Ver QR y Plato
                        </button>
                        <button onClick={() => editReserva(r)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold cursor-pointer transition-colors">
                          <Pencil className="w-3.5 h-3.5" /> Editar
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="p-4 sm:p-5">
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <DataTable
                  columns={columnsTable}
                  data={newList}
                  keyField="Id_Reserva"
                  pagination
                  highlightOnHover
                  responsive
                  customStyles={customStyles}
                  noDataComponent={
                    <div className="flex flex-col items-center py-12 text-slate-400">
                      <CalendarCheck size={32} className="mb-2 opacity-30" />
                      <p className="text-[13px]">No hay reservas</p>
                    </div>
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal formulario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-9999 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={hideModal} />
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 shrink-0">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                  {Editar ? <Pencil className="w-3.5 h-3.5 text-emerald-600" /> : <Plus className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                {Editar ? "Editar Reserva" : "Nueva Reserva"}
              </h2>
              <button onClick={hideModal} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto flex-1">
              <ReservasForm
                hideModal={hideModal}
                reserva={selectedReserva}
                Edit={Editar}
                reload={getAllReservas}
                mostrarQR={(txt) => {
                  const r = reservas.find((rv) => (rv.Qr_Reserva === txt || rv.Tex_Qr === txt));
                  if (r) setQrReserva(r);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal QR */}
      {qrReserva && <QRModal reserva={qrReserva} onClose={() => setQrReserva(null)} />}
    </>
  );
};

export default CrudReservas;