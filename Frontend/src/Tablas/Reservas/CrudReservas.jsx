import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig.js";
import DataTable from "react-data-table-component";
import ReservasForm from "./ReservaForm.jsx";
import { QRCodeCanvas } from "qrcode.react";
import CryptoJS from "crypto-js";
import {
  CalendarCheck, Eye, Pencil, Plus, Search, X, Clock,
  QrCode, CheckCircle, XCircle, AlertCircle, Coffee, Sun, Moon,
  User, CreditCard, Sunrise,
} from "lucide-react";

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || "clave_por_defecto_cambiar";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isMobile;
};

const estadoConfig = {
  Generada:  { cls: "bg-blue-100 text-blue-800 border-blue-300",   Icon: AlertCircle  },
  Usada:     { cls: "bg-green-100 text-green-800 border-green-300", Icon: CheckCircle  },
  Vencida:   { cls: "bg-red-100 text-red-800 border-red-300",      Icon: XCircle      },
  Cancelada: { cls: "bg-gray-100 text-gray-600 border-gray-300",   Icon: XCircle      },
};

const EstadoBadge = ({ estado }) => {
  const cfg = estadoConfig[estado] || { cls: "bg-gray-100 text-gray-600 border-gray-300", Icon: AlertCircle };
  const Icon = cfg.Icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <Icon className="w-3 h-3" />
      {estado}
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
   Modal QR Simplificado (estilo imagen 2)
───────────────────────────────────────── */
const QRModal = ({ reserva, onClose }) => {
  if (!reserva) return null;

  // Intentar descifrar para obtener datos extra
  let datosQR = {};
  try {
    if (reserva.Tex_Qr) {
      const bytes = CryptoJS.AES.decrypt(reserva.Tex_Qr, ENCRYPTION_KEY);
      const texto = bytes.toString(CryptoJS.enc.Utf8);
      if (texto) datosQR = JSON.parse(texto);
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
  const tipo = reserva.Tipo || datosQR.Tipo || "—";
  const fecha = reserva.Fec_Reserva || datosQR.Fec_Reserva || "—";

  const vencimientoLabel = {
    Desayuno: "7:00 a.m.",
    Almuerzo: "2:00 p.m.",
    Cena: "7:00 p.m."
  }[tipo] || "";

  const estado = reserva.Est_Reserva;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-xl font-bold text-gray-800">Código QR</h2>
          <p className="text-sm text-gray-400">Reserva #{reserva.Id_Reserva}</p>
        </div>

        <div className="px-6 py-2">
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-green-600" />
              <span className="text-base font-semibold text-gray-800">{nombre}</span>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">{documento}</span>
            </div>
            <div className="flex items-center gap-3">
              {tipo === "Desayuno" ? <Sunrise className="w-5 h-5 text-amber-600" /> :
               tipo === "Almuerzo" ? <Sun className="w-5 h-5 text-green-600" /> :
               <Moon className="w-5 h-5 text-indigo-600" />}
              <span className="text-sm font-medium text-gray-700">{tipo}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {fecha} · Vence {vencimientoLabel}
              </span>
            </div>
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                estado === "Generada" ? "bg-blue-100 text-blue-700" :
                estado === "Usada" ? "bg-green-100 text-green-700" :
                "bg-gray-100 text-gray-600"
              }`}>
                {estado}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-center p-6">
          <div className={`p-3 rounded-2xl border-2 ${
            estado === "Generada" ? "border-green-200 bg-white" : "border-gray-200 bg-gray-50 opacity-60"
          }`}>
            {reserva.Tex_Qr ? (
              <QRCodeCanvas
                value={reserva.Tex_Qr}
                size={200}
                level="H"
                fgColor={estado === "Generada" ? "#000000" : "#6b7280"}
              />
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center text-gray-400">
                Sin código QR
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition"
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
    { name: "ID",    selector: (r) => r.Id_Reserva, sortable: true, width: "70px" },
    { name: "Fecha", selector: (r) => r.Fec_Reserva, sortable: true, width: "110px" },
    {
      name: "Aprendiz",
      selector: (r) => r.usuario?.Nom_Usuario,
      sortable: true,
      cell: (r) => {
        const nombre = r.usuario ? `${r.usuario.Nom_Usuario || ""} ${r.usuario.Ape_Usuario || ""}`.trim() : "—";
        return (
          <div>
            <p className="text-sm font-medium text-gray-800">{nombre}</p>
            <p className="text-xs text-gray-400">{r.usuario?.NumDoc_Usuario || ""}</p>
          </div>
        );
      },
      grow: 2,
    },
    {
      name: "Tipo",
      selector: (r) => r.Tipo,
      sortable: true,
      cell: (r) => {
        const TIcon = tipoIcon[r.Tipo] || CalendarCheck;
        return (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full border flex items-center gap-1 ${tipoBadge[r.Tipo] || "bg-gray-100 text-gray-600"}`}>
            <TIcon className="w-3 h-3" />
            {r.Tipo}
          </span>
        );
      },
      width: "120px",
    },
    {
      name: "Estado",
      selector: (r) => r.Est_Reserva,
      sortable: true,
      cell: (r) => <EstadoBadge estado={r.Est_Reserva} />,
      width: "130px",
    },
    {
      name: "Vencimiento",
      selector: (r) => r.Vencimiento,
      sortable: true,
      cell: (r) => (
        <span className="text-xs text-gray-600">
          {new Date(r.Vencimiento).toLocaleString("es-CO", {
            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
          })}
        </span>
      ),
      width: "150px",
    },
    {
      name: "Acciones",
      cell: (row) => (
        <div className="flex gap-1.5">
          {row.Tex_Qr && (
            <button
              className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
              onClick={() => verQr(row)}
            >
              <QrCode className="w-3 h-3" /> QR
            </button>
          )}
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
            onClick={() => editReserva(row)}
          >
            <Pencil className="w-3 h-3" /> Editar
          </button>
        </div>
      ),
      width: "160px",
    },
  ];

  useEffect(() => { getAllReservas(); }, []);

  const getAllReservas = async () => {
    try {
      const response = await apiAxios.get("/api/Reservas");
      setReservas(response.data);
    } catch (err) {
      console.error("Error al cargar reservas:", err);
    }
  };

  const editReserva = (row) => { setSelectedReserva(row); setEditar(true); setIsModalOpen(true); };
  const hideModal   = () => { setIsModalOpen(false); setSelectedReserva(null); };

  const newList = reservas.filter((r) => {
    const t = filterText.toLowerCase();
    const nombre = r.usuario ? `${r.usuario.Nom_Usuario || ""} ${r.usuario.Ape_Usuario || ""}` : "";
    return (
      r.Tipo?.toLowerCase().includes(t) ||
      r.Fec_Reserva?.toLowerCase().includes(t) ||
      r.Est_Reserva?.toLowerCase().includes(t) ||
      nombre.toLowerCase().includes(t) ||
      r.usuario?.NumDoc_Usuario?.toString().includes(t)
    );
  });

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: "#f8fafc",
        fontSize: "13px",
        fontWeight: "700",
        color: "#374151",
        borderBottom: "2px solid #e5e7eb",
      },
    },
    rows: {
      style: {
        fontSize: "13px",
        "&:hover": { backgroundColor: "#f0fdf4" },
        borderBottom: "1px solid #f3f4f6",
      },
    },
    pagination: { style: { borderTop: "1px solid #e5e7eb", fontSize: "13px" } },
  };

  return (
    <>
      <div className="w-full h-full flex flex-col bg-gray-50 min-h-screen">
        <div className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-base sm:text-lg leading-tight">Reservas</h1>
                <p className="text-xs text-gray-400 hidden sm:block">{reservas.length} registros</p>
              </div>
            </div>
            <button
              onClick={() => { setSelectedReserva(null); setEditar(false); setIsModalOpen(true); }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 sm:px-5 rounded-xl text-sm font-semibold transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva Reserva</span>
            </button>
          </div>
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por tipo, fecha, aprendiz o estado..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-gray-50"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isMobile ? (
            <div className="p-3 space-y-2">
              {newList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                  <CalendarCheck className="w-10 h-10 mb-2" />
                  <p className="text-sm">No hay reservas</p>
                </div>
              ) : (
                newList.map((r) => (
                  <div key={r.Id_Reserva} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                        {tipoIcon[r.Tipo] && <Coffee className="w-5 h-5 text-emerald-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="font-bold text-gray-900 text-sm">Reserva #{r.Id_Reserva}</span>
                          <EstadoBadge estado={r.Est_Reserva} />
                        </div>
                        <p className="text-xs text-gray-700 font-medium">
                          {r.usuario?.Nom_Usuario} {r.usuario?.Ape_Usuario}
                        </p>
                        <p className="text-xs text-gray-400">{r.Fec_Reserva}</p>
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border mt-1 ${tipoBadge[r.Tipo]}`}>
                          {r.Tipo}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-gray-50">
                      <button onClick={() => verQr(r)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold">
                        <QrCode className="w-3.5 h-3.5" /> QR
                      </button>
                      <button onClick={() => editReserva(r)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold">
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="p-4 lg:p-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <DataTable
                  columns={columnsTable}
                  data={newList}
                  pagination
                  highlightOnHover
                  striped
                  customStyles={customStyles}
                  noDataComponent={
                    <div className="flex flex-col items-center py-12 text-gray-300">
                      <CalendarCheck className="w-8 h-8 mb-2" />
                      <p className="text-sm">No hay reservas</p>
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
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
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
                  const r = reservas.find((rv) => rv.Tex_Qr === txt);
                  if (r) setQrReserva(r);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal QR mejorado */}
      {qrReserva && <QRModal reserva={qrReserva} onClose={() => setQrReserva(null)} />}
    </>
  );
};

export default CrudReservas;