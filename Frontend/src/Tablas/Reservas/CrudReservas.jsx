import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig.js";
import DataTable from "react-data-table-component";
import ReservasForm from "./ReservaForm.jsx";
import { QRCodeCanvas } from "qrcode.react";
import { CalendarCheck, Eye, Pencil, Plus, Search, X, Clock, Tag, QrCode, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

const EstadoBadge = ({ estado }) => {
  const map = {
    Activo: { cls: "bg-emerald-100 text-emerald-700", Icon: CheckCircle },
    Inactivo: { cls: "bg-red-100 text-red-700", Icon: XCircle },
    Pendiente: { cls: "bg-amber-100 text-amber-700", Icon: AlertCircle },
  };
  const { cls, Icon } = map[estado] || { cls: "bg-gray-100 text-gray-600", Icon: AlertCircle };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      <Icon className="w-3 h-3" />
      {estado}
    </span>
  );
};

/* ── Modal Detalle ── */
const DetalleModal = ({ reserva, onClose, onEdit, onVerQr }) => {
  if (!reserva) return null;
  const rows = [
    { label: "ID", value: reserva.Id_Reserva },
    { label: "Fecha", value: reserva.Fec_Reserva },
    { label: "Vencimiento", value: new Date(reserva.Vencimiento).toLocaleString() },
    { label: "Estado", value: reserva.Est_Reserva },
    { label: "Tipo", value: reserva.Tipo },
    { label: "QR", value: reserva.Tex_Qr },
    { label: "ID Usuario", value: reserva.Id_Usuario },
  ];
  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-600 to-emerald-500">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-emerald-100 font-medium">Detalle</p>
              <p className="text-white font-bold text-sm">Reserva #{reserva.Id_Reserva}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex justify-between items-start gap-3 py-2 border-b border-gray-50 last:border-0">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide min-w-[100px]">{label}</span>
              {label === "Estado" ? (
                <EstadoBadge estado={value} />
              ) : (
                <span className="text-sm text-gray-800 font-medium text-right break-all">{value || "—"}</span>
              )}
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={() => { onVerQr(reserva); onClose(); }}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2.5 rounded-xl font-semibold text-sm transition-colors border border-emerald-200"
          >
            <QrCode className="w-4 h-4" /> Ver QR
          </button>
          <button
            onClick={() => { onEdit(reserva); onClose(); }}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            <Pencil className="w-4 h-4" /> Editar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Tarjeta Móvil ── */
const ReservaCard = ({ reserva, onEdit, onView, onVerQr }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 active:scale-[0.99] transition-transform">
    <div className="flex items-start gap-3">
      <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
        <CalendarCheck className="w-5 h-5 text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-bold text-gray-900 text-sm">Reserva #{reserva.Id_Reserva}</span>
          <EstadoBadge estado={reserva.Est_Reserva} />
        </div>
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Clock className="w-3 h-3 flex-shrink-0" /> {reserva.Fec_Reserva}
        </p>
        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
          <Tag className="w-3 h-3 flex-shrink-0" /> {reserva.Tipo || "Sin tipo"}
        </p>
      </div>
    </div>
    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
      <button
        onClick={() => onView(reserva)}
        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-semibold transition-colors"
      >
        <Eye className="w-3.5 h-3.5" /> Ver más
      </button>
      <button
        onClick={() => onVerQr(reserva)}
        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors"
      >
        <QrCode className="w-3.5 h-3.5" /> QR
      </button>
      <button
        onClick={() => onEdit(reserva)}
        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" /> Editar
      </button>
    </div>
  </div>
);

/* ─────────────── MAIN ─────────────── */
const CrudReservas = () => {
  const [reservas, setReservas] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [Editar, setEditar] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrTexto, setQrTexto] = useState("");
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [reservaDetalle, setReservaDetalle] = useState(null);
  const isMobile = useIsMobile();

  const verQr = (row) => { setQrTexto(row.Tex_Qr); setQrModalOpen(true); };
  const mostrarQR = (textoQR) => { setQrTexto(textoQR); setQrModalOpen(true); };

  const columnsTable = [
    { name: "ID", selector: (r) => r.Id_Reserva, sortable: true, width: "70px" },
    { name: "Fecha", selector: (r) => r.Fec_Reserva, sortable: true },
    { name: "Vencimiento", selector: (r) => new Date(r.Vencimiento).toLocaleString(), sortable: true },
    {
      name: "Estado",
      selector: (r) => r.Est_Reserva,
      sortable: true,
      cell: (r) => <EstadoBadge estado={r.Est_Reserva} />,
    },
    { name: "Tipo", selector: (r) => r.Tipo, sortable: true },
    { name: "ID Usuario", selector: (r) => r.Id_Usuario, sortable: true },
    {
      name: "Acciones",
      cell: (row) => (
        <div className="flex gap-1.5">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
            onClick={() => editReserva(row)}
          >
            <Pencil className="w-3 h-3" /> Editar
          </button>
          <button
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
            onClick={() => verQr(row)}
          >
            <QrCode className="w-3 h-3" /> QR
          </button>
        </div>
      ),
    },
  ];

  useEffect(() => { getAllReservas(); }, []);

  const getAllReservas = async () => {
    try {
      const response = await apiAxios.get("/api/Reservas");
      setReservas(response.data);
    } catch (error) {
      console.error("Error al cargar reservas:", error);
    }
  };

  const editReserva = (row) => { setSelectedReserva(row); setEditar(true); setIsModalOpen(true); };
  const hideModal = () => { setIsModalOpen(false); setSelectedReserva(null); };

  const newList = reservas.filter((r) => {
    const t = filterText.toLowerCase();
    return (
      r.Tipo?.toLowerCase().includes(t) ||
      r.Fec_Reserva?.toLowerCase().includes(t) ||
      r.Est_Reserva?.toLowerCase().includes(t)
    );
  });

  const customStyles = {
    headRow: { style: { backgroundColor: "#f8fafc", fontSize: "13px", fontWeight: "700", color: "#374151", borderBottom: "2px solid #e5e7eb" } },
    rows: { style: { fontSize: "13px", "&:hover": { backgroundColor: "#f0fdf4" }, borderBottom: "1px solid #f3f4f6" } },
    pagination: { style: { borderTop: "1px solid #e5e7eb", fontSize: "13px" } },
  };

  return (
    <>
      <div className="w-full h-full flex flex-col bg-gray-50 min-h-0">
        <div className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6 lg:py-4 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <CalendarCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-base lg:text-lg leading-tight">Reservas</h1>
                <p className="text-xs text-gray-400 hidden sm:block">{reservas.length} registros</p>
              </div>
            </div>
            <button
              onClick={() => { setSelectedReserva(null); setEditar(false); setIsModalOpen(true); }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 lg:px-5 lg:py-2.5 rounded-xl text-sm font-semibold transition-colors flex-shrink-0 shadow-sm shadow-emerald-200"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva Reserva</span>
            </button>
          </div>
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por tipo, fecha o estado..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isMobile ? (
            <div className="p-3 space-y-2">
              {newList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <CalendarCheck className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">No hay reservas para mostrar</p>
                </div>
              ) : (
                newList.map((r) => (
                  <ReservaCard
                    key={r.Id_Reserva}
                    reserva={r}
                    onEdit={editReserva}
                    onVerQr={verQr}
                    onView={(res) => { setReservaDetalle(res); setDetalleOpen(true); }}
                  />
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
                    <div className="flex flex-col items-center py-12 text-gray-400">
                      <CalendarCheck className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-sm">No hay reservas para mostrar</p>
                    </div>
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Detalle */}
      {detalleOpen && (
        <DetalleModal
          reserva={reservaDetalle}
          onClose={() => setDetalleOpen(false)}
          onEdit={editReserva}
          onVerQr={verQr}
        />
      )}

      {/* Modal Formulario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={hideModal} />
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 flex-shrink-0">
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
              <ReservasForm hideModal={hideModal} reserva={selectedReserva} Edit={Editar} reload={getAllReservas} mostrarQR={mostrarQR} />
            </div>
          </div>
        </div>
      )}

      {/* Modal QR */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setQrModalOpen(false)} />
          <div className="bg-white rounded-3xl shadow-2xl z-10 p-8 flex flex-col items-center gap-4 w-full max-w-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Código QR</h2>
            <div className="p-3 bg-white rounded-2xl border-2 border-gray-100 shadow-inner">
              {qrTexto ? (
                <QRCodeCanvas value={qrTexto} size={200} />
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center text-gray-400 text-sm">Sin código QR</div>
              )}
            </div>
            <button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
              onClick={() => setQrModalOpen(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CrudReservas;