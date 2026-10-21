// Frontend/src/Tablas/Reservas/CrudReservas.jsx
// Modulo de gestion y auditoria de Reservas alimentarias en Foodsys.
// Incluye botones de exportacion universal a Excel y PDF con confirmacion inteligente,
// visor de codigo QR cifrado, guia interactiva y adaptabilidad movil/escritorio.
// Codigo comentado didacticamente sin tildes ni emojis para aprendices de primer semestre.

import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig.js";
import DataTable from "react-data-table-component";
import ReservasForm from "./ReservaForm.jsx";
import { QRCodeCanvas } from "qrcode.react";
import CryptoJS from "crypto-js";
import toast from "react-hot-toast";
import { exportarAExcel, exportarAPDF, confirmarExportacion } from "../../utils/exportUtils";
import GlobalLoader from "../../Components/GlobalLoader";
import {
  CalendarCheck, Eye, Pencil, Plus, Search, X, Clock,
  CheckCircle, XCircle, AlertCircle, Coffee, Sun, Moon,
  User, CreditCard, Sunrise, UtensilsCrossed, Upload, FileText,
  HelpCircle, ChevronDown, ChevronUp
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
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${cfg.cls}`}>
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
   Modal QR con Informacion Completa y Plato
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
    console.warn("No se pudo descifrar el codigo QR:", err);
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
    Almuerzo: "1:30 p.m.",
    Cena: "7:00 p.m."
  }[tipo] || "";

  const estado = reserva.Est_Reserva || reserva.Estado || "Generado";
  const platoImg = reserva.plato?.Img_Plato ? `${API_URL}/uploads/${reserva.plato.Img_Plato}` : null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CalendarCheck className="w-5 h-5 text-emerald-100" />
            <h3 className="font-bold text-base m-0">Ticket de Reserva #{reserva.Id_Reserva}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white border-0 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
            <QRCodeCanvas value={qrValue} size={180} level="H" />
          </div>

          <div className="w-full space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Aprendiz:</span>
              <span className="font-bold text-slate-800 text-right">{nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Documento:</span>
              <span className="font-mono text-slate-700">{documento}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Fecha:</span>
              <span className="font-bold text-slate-700">{fecha}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Servicio:</span>
              <span className="font-bold text-emerald-700">{tipo} (Cierre {vencimientoLabel})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-semibold">Estado:</span>
              <EstadoBadge estado={estado} />
            </div>
          </div>

          {reserva.plato?.Nom_Plato && (
            <div className="w-full flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
              {platoImg && (
                <img src={platoImg} alt={reserva.plato.Nom_Plato} className="w-10 h-10 rounded-lg object-cover" />
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-emerald-800 uppercase m-0 leading-tight">Plato Reservado</p>
                <p className="text-xs font-bold text-slate-800 truncate m-0">{reserva.plato.Nom_Plato}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   Componente Principal: CrudReservas
───────────────────────────────────────── */
const CrudReservas = () => {
  const [reservas, setReservas] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [cargando, setCargando] = useState(true);
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [Editar, setEditar] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrReserva, setQrReserva] = useState(null);
  const [exportando, setExportando] = useState(false);
  const [mostrarGuia, setMostrarGuia] = useState(false);

  const isMobile = useIsMobile();

  useEffect(() => {
    getAllReservas();
  }, []);

  const getAllReservas = async () => {
    setCargando(true);
    try {
      const res = await apiAxios.get("/api/Reservas/Todas");
      setReservas(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error al cargar reservas:", err);
      toast.error("Error al sincronizar reservas");
    } finally {
      setCargando(false);
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

  const tieneFiltrosActivos = Boolean(filterText);

  // ── Exportar a Excel con confirmacion inteligente ──
  const handleExportarExcel = async () => {
    if (reservas.length === 0) {
      toast.error("No hay reservas para exportar.");
      return;
    }

    const decision = await confirmarExportacion({
      totalOriginal: reservas.length,
      totalFiltrado: newList.length,
      tieneFiltrosActivos,
      formato: "Excel",
      nombreModulo: "reservas"
    });

    if (!decision) return;

    setExportando(true);
    try {
      const registros = decision === "filtrados" ? newList : reservas;

      const datosFormateados = registros.map((r) => ({
        "ID Reserva": r.Id_Reserva,
        "Fecha Reserva": r.Fec_Reserva || "",
        "Tipo Comida": r.Tip_Reserva || r.Tipo || "",
        "Documento": r.usuario?.NumDoc_Usuario || "",
        "Nombres": r.usuario?.Nom_Usuario || "",
        "Apellidos": r.usuario?.Ape_Usuario || "",
        "Ficha": r.usuario?.ficha?.Num_Ficha || "",
        "Plato": r.plato?.Nom_Plato || "Sin plato",
        "Estado": r.Est_Reserva || r.Estado || "Generado",
        "Novedad Excepcional": r.Exc_Reserva || "No",
        "Fecha Creacion": r.createdat ? new Date(r.createdat).toLocaleString("es-CO") : "",
        "Ultima Actualizacion": r.updatedat ? new Date(r.updatedat).toLocaleString("es-CO") : ""
      }));

      const fecha = new Date().toISOString().split("T")[0];
      exportarAExcel({
        datos: datosFormateados,
        nombreArchivo: `Foodsys_Reservas_${decision}_${fecha}.xlsx`,
        nombreHoja: "Reservas"
      });

      toast.success(`Archivo Excel exportado con ${registros.length} reservas.`);
    } catch (err) {
      console.error("Error al exportar Excel:", err);
      toast.error("Error al generar el archivo Excel.");
    } finally {
      setExportando(false);
    }
  };

  // ── Exportar a PDF con confirmacion inteligente ──
  const handleExportarPDF = async () => {
    if (reservas.length === 0) {
      toast.error("No hay reservas para exportar.");
      return;
    }

    const decision = await confirmarExportacion({
      totalOriginal: reservas.length,
      totalFiltrado: newList.length,
      tieneFiltrosActivos,
      formato: "PDF",
      nombreModulo: "reservas"
    });

    if (!decision) return;

    setExportando(true);
    try {
      const registros = decision === "filtrados" ? newList : reservas;

      const columnasPDF = [
        { header: "ID", dataKey: "id" },
        { header: "Fecha", dataKey: "fecha" },
        { header: "Tipo", dataKey: "tipo" },
        { header: "Aprendiz", dataKey: "aprendiz" },
        { header: "Plato", dataKey: "plato" },
        { header: "Estado", dataKey: "estado" }
      ];

      const filasPDF = registros.map((r) => ({
        id: r.Id_Reserva,
        fecha: r.Fec_Reserva || "—",
        tipo: r.Tip_Reserva || r.Tipo || "—",
        aprendiz: `${r.usuario?.Nom_Usuario || ""} ${r.usuario?.Ape_Usuario || ""}`.trim() || "—",
        plato: r.plato?.Nom_Plato || "Sin plato",
        estado: r.Est_Reserva || r.Estado || "Generado"
      }));

      const fecha = new Date().toISOString().split("T")[0];
      exportarAPDF({
        titulo: "Reporte Institucional de Reservas",
        subtitulo: `Centro Agropecuario "La Granja" - Registros: ${registros.length} (${decision})`,
        columnas: columnasPDF,
        datos: filasPDF,
        nombreArchivo: `Foodsys_Reservas_${decision}_${fecha}.pdf`,
        orientacion: "landscape"
      });

      toast.success(`Archivo PDF generado con ${registros.length} reservas.`);
    } catch (err) {
      console.error("Error al exportar PDF:", err);
      toast.error("Error al generar el documento PDF.");
    } finally {
      setExportando(false);
    }
  };

  const columnsTable = [
    { name: "ID", selector: (r) => r.Id_Reserva, sortable: true, width: "65px" },
    {
      name: "Fecha",
      selector: (r) => r.Fec_Reserva,
      sortable: true,
      minWidth: "110px",
      cell: (r) => <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{r.Fec_Reserva}</span>,
    },
    {
      name: "Tipo",
      selector: (r) => r.Tip_Reserva || r.Tipo,
      sortable: true,
      minWidth: "110px",
      cell: (r) => {
        const tipo = r.Tip_Reserva || r.Tipo || "—";
        return (
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${tipoBadge[tipo] || "bg-gray-100"}`}>
            {tipo}
          </span>
        );
      },
    },
    {
      name: "Aprendiz",
      selector: (r) => `${r.usuario?.Nom_Usuario} ${r.usuario?.Ape_Usuario}`,
      sortable: true,
      grow: 2,
      minWidth: "200px",
      cell: (r) => (
        <div className="py-1">
          <p className="font-semibold text-slate-800 text-xs sm:text-sm m-0">
            {r.usuario ? `${r.usuario.Nom_Usuario || ""} ${r.usuario.Ape_Usuario || ""}` : "Usuario no encontrado"}
          </p>
          <p className="text-[11px] text-slate-400 m-0">Doc: {r.usuario?.NumDoc_Usuario || "—"}</p>
        </div>
      ),
    },
    {
      name: "Plato Reservado",
      selector: (r) => r.plato?.Nom_Plato,
      sortable: true,
      minWidth: "160px",
      cell: (r) => (
        <span className="text-xs text-emerald-800 font-semibold truncate block max-w-xs" title={r.plato?.Nom_Plato}>
          {r.plato?.Nom_Plato || "Sin plato asignado"}
        </span>
      ),
    },
    {
      name: "Estado",
      selector: (r) => r.Est_Reserva || r.Estado,
      sortable: true,
      width: "125px",
      cell: (r) => <EstadoBadge estado={r.Est_Reserva || r.Estado} />,
    },
    {
      name: "Acciones",
      minWidth: "160px",
      cell: (row) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <button
            onClick={() => setQrReserva(row)}
            className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> Ver QR
          </button>
          <button
            onClick={() => editReserva(row)}
            className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Editar
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
        "&:hover": { background: "#f0fdf4" },
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
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-0 cursor-pointer text-left transition-colors hover:from-emerald-100 hover:to-teal-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <HelpCircle size={18} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm m-0">¿Como gestionar las Reservas? (Guia paso a paso)</p>
              <p className="text-xs text-slate-500 m-0">Audita estados de consumo, consulta tickets QR y exporta reportes</p>
            </div>
          </div>
          {mostrarGuia ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {mostrarGuia && (
          <div className="p-4 bg-white border-t border-slate-100 text-xs text-slate-600 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="font-bold text-emerald-700 uppercase tracking-wide">1. Estados del Alimento</p>
              <p>Generado (esperando turno), Verificado (paso por cocina si es externo), Consumido (entregado en comedor) y Vencido (inasistencia).</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-teal-700 uppercase tracking-wide">2. Lectura y Ticket QR</p>
              <p>Presiona <strong>Ver QR</strong> para abrir el ticket electronico cifrado del aprendiz con la informacion nutricional de su plato.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-blue-700 uppercase tracking-wide">3. Exportacion</p>
              <p>Descarga el historico filtrado en Excel o PDF para justificar el pago de raciones al operador del casino alimentario.</p>
            </div>
          </div>
        )}
      </div>

      {/* Panel Principal */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <CalendarCheck size={20} />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 text-base sm:text-lg m-0">Gestion de Reservas</h1>
                <p className="text-xs text-slate-500 m-0">{reservas.length} reservas registradas en el sistema</p>
              </div>
            </div>

            {/* Botones de Accion */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleExportarExcel}
                disabled={exportando || reservas.length === 0}
                className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer hover:bg-blue-100 transition-colors disabled:opacity-50"
                title="Exportar reservas a Excel"
              >
                <Upload size={14} /> {exportando ? "Exportando..." : "Exportar Excel"}
              </button>

              <button
                onClick={handleExportarPDF}
                disabled={exportando || reservas.length === 0}
                className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer hover:bg-rose-100 transition-colors disabled:opacity-50"
                title="Exportar reservas a PDF"
              >
                <FileText size={14} /> Exportar PDF
              </button>

              <button
                onClick={() => { setSelectedReserva(null); setEditar(false); setIsModalOpen(true); }}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer transition-colors shadow-sm"
              >
                <Plus size={14} /> Nueva Reserva
              </button>
            </div>
          </div>

          {/* Busqueda */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por fecha, aprendiz, documento, plato o estado..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-emerald-400 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Contenido (Cards en movil o DataTable en escritorio) */}
        <div className="overflow-x-auto">
          {cargando ? (
            <div className="p-12 flex justify-center">
              <GlobalLoader mensaje="Cargando historial de reservas..." />
            </div>
          ) : isMobile ? (
            <div className="p-3 space-y-2.5">
              {newList.map((r) => {
                const tipo = r.Tip_Reserva || r.Tipo || "—";
                const estado = r.Est_Reserva || r.Estado || "—";
                return (
                  <div key={r.Id_Reserva} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">Reserva #{r.Id_Reserva}</span>
                      <EstadoBadge estado={estado} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs m-0">
                        {r.usuario ? `${r.usuario.Nom_Usuario || ""} ${r.usuario.Ape_Usuario || ""}` : "Usuario no encontrado"}
                      </p>
                      <p className="text-[11px] text-slate-500 m-0">Doc: {r.usuario?.NumDoc_Usuario || "—"}</p>
                    </div>
                    {r.plato?.Nom_Plato && (
                      <p className="text-xs text-emerald-700 font-semibold m-0">{r.plato.Nom_Plato}</p>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                      <span>{r.Fec_Reserva} &middot; {tipo}</span>
                      <button onClick={() => setQrReserva(r)} className="text-emerald-600 font-bold border-0 bg-transparent cursor-pointer">
                        Ver QR
                      </button>
                    </div>
                  </div>
                );
              })}
              {newList.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">No se encontraron reservas.</div>
              )}
            </div>
          ) : (
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
                  <CalendarCheck size={32} className="opacity-20 mb-2" />
                  <p className="text-xs">No se encontraron reservas registradas.</p>
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* Modal QR */}
      {qrReserva && <QRModal reserva={qrReserva} onClose={() => setQrReserva(null)} />}

      {/* Modal formulario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={hideModal} />
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 max-h-[95vh] overflow-hidden flex flex-col animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 shrink-0">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2 m-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                  {Editar ? <Pencil className="w-3.5 h-3.5 text-emerald-600" /> : <Plus className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                {Editar ? "Editar Reserva" : "Registrar Nueva Reserva"}
              </h2>
              <button onClick={hideModal} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors border-0 cursor-pointer text-gray-500">
                <X className="w-4 h-4" />
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
    </div>
  );
};

export default CrudReservas;