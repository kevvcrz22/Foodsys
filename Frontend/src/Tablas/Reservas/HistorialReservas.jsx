// HistorialReservas.jsx

import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import {
    UtensilsCrossed, Clock, CheckCircle2, XCircle, ShieldCheck,
    CalendarDays, ChevronDown, Loader2, RefreshCw, Ban,
    AlertTriangle, Utensils, Star, QrCode, X, Download,
    Hash, Timer, HeartHandshake, UserCheck, Coffee,
} from "lucide-react";
import { GenerarTicketQR } from "./GenerarTicketQR";
import apiAxios from "../../api/axiosConfig";
import ModalCederReserva from "../../Paginas/Reservas/ModalCederReserva.jsx";

// ─── Configuracion visual por estado ─────────────────────────────────────────

const CONFIG_ESTADO = {
    Generado: {
        label: "Generado",
        icon: CheckCircle2,
        clases: "bg-emerald-100 text-emerald-800 border-emerald-300",
        dot: "bg-emerald-500",
        borde: "border-l-emerald-500",
        modalBanner: "from-emerald-500 to-teal-600",
    },
    Generada: {
        label: "Generado",
        icon: CheckCircle2,
        clases: "bg-emerald-100 text-emerald-800 border-emerald-300",
        dot: "bg-emerald-500",
        borde: "border-l-emerald-500",
        modalBanner: "from-emerald-500 to-teal-600",
    },
    Pendiente: {
        label: "Pendiente",
        icon: Clock,
        clases: "bg-amber-100 text-amber-800 border-amber-300",
        dot: "bg-amber-500",
        borde: "border-l-amber-500",
        modalBanner: "from-amber-400 to-orange-500",
    },
    Verificado: {
        label: "Verificado",
        icon: ShieldCheck,
        clases: "bg-amber-100 text-amber-800 border-amber-300",
        dot: "bg-amber-500",
        borde: "border-l-amber-500",
        modalBanner: "from-amber-400 to-orange-500",
    },
    Verificada: {
        label: "Verificado",
        icon: ShieldCheck,
        clases: "bg-amber-100 text-amber-800 border-amber-300",
        dot: "bg-amber-500",
        borde: "border-l-amber-500",
        modalBanner: "from-amber-400 to-orange-500",
    },
    Pendiente_Cesion: {
        label: "Cesión Pendiente",
        icon: Clock,
        clases: "bg-amber-100 text-amber-800 border-amber-300",
        dot: "bg-amber-500",
        borde: "border-l-amber-500",
        modalBanner: "from-amber-400 to-orange-500",
    },
    Consumido: {
        label: "Consumido",
        icon: CheckCircle2,
        clases: "bg-slate-200 text-slate-700 border-slate-400",
        dot: "bg-slate-500",
        borde: "border-l-slate-400",
        modalBanner: "from-slate-500 to-slate-600",
    },
    Consumida: {
        label: "Consumido",
        icon: CheckCircle2,
        clases: "bg-slate-200 text-slate-700 border-slate-400",
        dot: "bg-slate-500",
        borde: "border-l-slate-400",
        modalBanner: "from-slate-500 to-slate-600",
    },
    Vencido: {
        label: "Vencido",
        icon: XCircle,
        clases: "bg-rose-100 text-rose-800 border-rose-300",
        dot: "bg-rose-500",
        borde: "border-l-rose-500",
        modalBanner: "from-rose-500 to-red-600",
    },
    Vencida: {
        label: "Vencido",
        icon: XCircle,
        clases: "bg-rose-100 text-rose-800 border-rose-300",
        dot: "bg-rose-500",
        borde: "border-l-rose-500",
        modalBanner: "from-rose-500 to-red-600",
    },
    Cancelado: {
        label: "Cancelado",
        icon: XCircle,
        clases: "bg-rose-100 text-rose-800 border-rose-300",
        dot: "bg-rose-500",
        borde: "border-l-rose-500",
        modalBanner: "from-rose-500 to-red-600",
    },
    Cancelada: {
        label: "Cancelado",
        icon: XCircle,
        clases: "bg-rose-100 text-rose-800 border-rose-300",
        dot: "bg-rose-500",
        borde: "border-l-rose-500",
        modalBanner: "from-rose-500 to-red-600",
    },
};

const CONFIG_TIPO = {
    Desayuno: "bg-orange-100 text-orange-700 border-orange-200",
    Almuerzo: "bg-indigo-100 text-indigo-700 border-indigo-200",
    Cena: "bg-violet-100 text-violet-700 border-violet-200",
};

// ─── Utilidades ───────────────────────────────────────────────────────────────

const FormatearFecha = (fechaStr) => {
    if (!fechaStr) return "—";
    return new Date(`${fechaStr}T12:00:00`).toLocaleDateString("es-CO", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
};

const FormatearHora = (isoStr) => {
    if (!isoStr) return "—";
    return new Date(isoStr).toLocaleTimeString("es-CO", {
        hour: "2-digit", minute: "2-digit",
    });
};

const ConstruirQrUrl = (qrEncriptado, idReserva) => {
    if (qrEncriptado) {
        const str = String(qrEncriptado).trim();
        if (str.includes("data=")) {
            try {
                return decodeURIComponent(str.split("data=")[1].split("&")[0]);
            } catch {
                return str;
            }
        }
        return str;
    }
    if (idReserva) {
        return JSON.stringify({ r: Number(idReserva) });
    }
    return "";
};

const UrlImagen = (nombreArchivo) => {
    if (!nombreArchivo) return null;
    const base = apiAxios.defaults.baseURL || "";
    return `${base}/uploads/${nombreArchivo}`;
};

// ─── Modal de detalle + QR ────────────────────────────────────────────────────

function ModalQR({ reserva, usuario, onCerrar }) {
    const estado = CONFIG_ESTADO[reserva.Est_Reserva] ?? CONFIG_ESTADO.Cancelado;
    const claseTipo = CONFIG_TIPO[reserva.Tip_Reserva] ?? "bg-slate-100 text-slate-600 border-slate-200";
    const qrUrl = ConstruirQrUrl(reserva.Qr_Reserva, reserva.Id_Reserva);
    const imgUrl = UrlImagen(reserva.plato?.Img_Plato);
    const esActiva = reserva.Est_Reserva === "Generado" || reserva.Est_Reserva === "Verificado";

    const tipoBebidaRaw = String(reserva.Tipo_Bebida || reserva.bebida?.Subtipo_Bebida || "FRIA").toUpperCase();
    const textoBebida = tipoBebidaRaw === "CALIENTE" ? "Bebida Caliente" : tipoBebidaRaw === "NINGUNA" ? "Sin bebida" : "Bebida Fría";
    const llevaSopa = reserva.Lleva_Sopa !== undefined ? Boolean(Number(reserva.Lleva_Sopa)) : true;
    const textoSopa = reserva.Tip_Reserva === "Desayuno"
        ? (llevaSopa ? "Sí, con caldo incluido" : "No, sin caldo")
        : (llevaSopa ? "Sí, con sopa incluida" : "No, sin sopa");

    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onCerrar(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onCerrar]);

    // Descarga el ticket compacto tipo factura con QR y datos completos
    const DescargarTicketCompleto = async () => {
        await GenerarTicketQR({
            reserva,
            usuario,
            qrUrl,
            urlImagen: UrlImagen,
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
        >
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md
                      max-h-[90vh] overflow-y-auto">

                <div className={`h-2 rounded-t-3xl bg-gradient-to-r ${estado.modalBanner}`} />

                <button
                    onClick={onCerrar}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100
                     hover:bg-slate-200 flex items-center justify-center transition-colors z-10"
                >
                    <X className="w-4 h-4 text-slate-500" />
                </button>

                <div className="p-6 flex flex-col gap-5">

                    {imgUrl ? (
                        <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-100">
                            <img
                                src={imgUrl}
                                alt={reserva.plato?.Nom_Plato}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.parentElement.style.display = "none"; }}
                            />
                        </div>
                    ) : (
                        <div className="w-full h-44 rounded-2xl bg-slate-100 border border-slate-200
                            flex items-center justify-center">
                            <Utensils className="w-10 h-10 text-slate-300" />
                        </div>
                    )}

                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-lg font-bold text-slate-800 leading-snug">
                                {reserva.plato?.Nom_Plato ?? "Plato no disponible"}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Reserva #{reserva.Id_Reserva}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${claseTipo}`}>
                                {reserva.Tip_Reserva}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold
                               px-2 py-0.5 rounded-full border ${estado.clases}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${estado.dot}`} />
                                {estado.label}
                            </span>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-3 border border-slate-100">

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200
                              flex items-center justify-center shrink-0">
                                <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                                    Fecha de reserva
                                </p>
                                <p className="text-sm font-semibold text-slate-700">
                                    {FormatearFecha(reserva.Fec_Reserva)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200
                              flex items-center justify-center shrink-0">
                                <Timer className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                                    Vence a las
                                </p>
                                <p className="text-sm font-semibold text-slate-700">
                                    {FormatearHora(reserva.Vec_Reserva)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200
                              flex items-center justify-center shrink-0">
                                <Hash className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                                    Tipo de reserva
                                </p>
                                <p className="text-sm font-semibold text-slate-700">
                                    {reserva.Exc_Reserva === "Si" ? "Novedad del dia" : "Reserva normal"}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/70">
                            <div className="bg-white rounded-xl p-2.5 border border-slate-200/80">
                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                                    Preferencia Bebida
                                </p>
                                <p className="text-xs font-bold text-slate-700 mt-0.5">
                                    {textoBebida}
                                </p>
                            </div>
                            <div className="bg-white rounded-xl p-2.5 border border-slate-200/80">
                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                                    Sopa / Caldo
                                </p>
                                <p className="text-xs font-bold text-emerald-700 mt-0.5">
                                    {textoSopa}
                                </p>
                            </div>
                        </div>

                        {reserva.Exc_Reserva === "Si" && reserva.Jus_Reserva && (
                            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                                <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wide mb-1">
                                    Justificacion
                                </p>
                                <p className="text-xs text-slate-600 italic leading-relaxed">
                                    "{reserva.Jus_Reserva}"
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center gap-3">

                        {!esActiva && (
                            <div className="w-full flex items-center gap-2 bg-slate-50 border border-slate-200
                              rounded-xl px-3 py-2.5 text-xs text-slate-500">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                Este QR ya no es valido. La reserva fue {(reserva.Est_Reserva || "cancelada").toLowerCase()}.
                            </div>
                        )}

                        {qrUrl && (
                            <div className={`p-4 bg-white border-2 rounded-2xl shadow-sm
                              ${esActiva ? "border-emerald-200" : "border-slate-100 opacity-50"}`}>
                                <QRCodeSVG
                                    id="qr-modal-svg"
                                    value={qrUrl}
                                    size={210}
                                    marginSize={2}
                                    level="M"
                                />
                            </div>
                        )}

                        {esActiva && (
                            <p className="text-xs text-slate-500 text-center leading-relaxed px-4">
                                Presenta este código QR de lectura rápida para registrar tu consumo.
                            </p>
                        )}

                        {qrUrl && esActiva && (
                            <div className="flex flex-col items-center gap-2 w-full">
                                <button
                                    onClick={DescargarTicketCompleto}
                                    className="w-full flex items-center justify-center gap-2 text-xs font-bold text-white
                             bg-emerald-600 hover:bg-emerald-700 shadow-sm
                             px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                                >
                                    <Download className="w-4 h-4" />
                                    Descargar Ticket
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

// ─── Tarjeta individual de reserva ───────────────────────────────────────────

function TarjetaReserva({ reserva, onCancelar, cancelando, onVerQR, onCeder }) {
    const [confirmar, setConfirmar] = useState(false);

    const estado = CONFIG_ESTADO[reserva.Est_Reserva] ?? CONFIG_ESTADO.Cancelado;
    const claseTipo = CONFIG_TIPO[reserva.Tip_Reserva] ?? "bg-slate-100 text-slate-600 border-slate-200";
    const esCancelable = reserva.Est_Reserva === "Generado";
    const esCedible = reserva.Est_Reserva === "Generado" && !reserva.Id_Usuario_Cedente;
    const fueCedida = !!reserva.Id_Usuario_Cedente;
    const esNovedad = reserva.Exc_Reserva === "Si";
    const tieneQR = !!reserva.Qr_Reserva;

    const handleCancelar = () => {
        if (!confirmar) { setConfirmar(true); return; }
        onCancelar(reserva.Id_Reserva);
        setConfirmar(false);
    };

    return (
        <div
            className={`
        relative bg-white rounded-2xl border border-slate-100 shadow-sm
        border-l-4 ${estado.borde}
        transition-all duration-200 hover:shadow-md hover:-translate-y-px
        ${reserva.Est_Reserva === "Cancelado" ? "opacity-60" : ""}
      `}
        >
            {esNovedad && (
                <div className="absolute -top-2 right-4">
                    <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-900
                           text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        <Star className="w-2.5 h-2.5" />
                        Novedad
                    </span>
                </div>
            )}

            <div className="p-4 flex gap-3">
                <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    {reserva.plato?.Img_Plato ? (
                        <img
                            src={UrlImagen(reserva.plato.Img_Plato)}
                            alt={reserva.plato.Nom_Plato}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = "none"; }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Utensils className="w-5 h-5 text-slate-300" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                            <p className="text-sm font-semibold text-slate-800 leading-snug truncate">
                                {reserva.plato?.Nom_Plato ?? "Plato no disponible"}
                            </p>
                            {reserva.bebida?.Nom_Plato && (
                                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                                    <Coffee className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>{reserva.bebida.Nom_Plato}</span>
                                    {reserva.bebida.Subtipo_Bebida && (
                                        <span className="text-[10px] text-slate-400">
                                            ({reserva.bebida.Subtipo_Bebida === 'FRIA' ? 'Fría' : reserva.bebida.Subtipo_Bebida === 'CALIENTE' ? 'Caliente' : ''})
                                        </span>
                                    )}
                                </p>
                            )}
                        </div>
                        <span className={`inline-flex items-center gap-1 shrink-0 text-[11px] font-semibold
                             px-2 py-0.5 rounded-full border ${estado.clases}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${estado.dot}`} />
                            {estado.label}
                        </span>
                    </div>

                    {reserva.Estado_Cesion === 'PENDIENTE_ACEPTACION' && (
                        <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Solicitud de cesión enviada (esperando que tu compañero acepte). Tu código QR sigue activo a tu nombre.</span>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${claseTipo}`}>
                            {reserva.Tip_Reserva}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <CalendarDays className="w-3 h-3" />
                            {FormatearFecha(reserva.Fec_Reserva)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {tieneQR && (
                            <button
                                onClick={() => onVerQR(reserva)}
                                className="inline-flex items-center gap-1.5 text-[11px] font-semibold
                           text-indigo-600 bg-indigo-50 hover:bg-indigo-100
                           border border-indigo-200 px-2.5 py-1.5 rounded-xl
                           transition-colors"
                            >
                                <QrCode className="w-3.5 h-3.5" />
                                Ver QR
                            </button>
                        )}

                        {esCedible && (
                            <button
                                onClick={() => onCeder(reserva)}
                                className="inline-flex items-center gap-1.5 text-[11px] font-semibold
                           text-emerald-700 bg-emerald-50 hover:bg-emerald-100
                           border border-emerald-200 px-2.5 py-1.5 rounded-xl
                           transition-colors shadow-2xs"
                                title="Ceder reserva a un companero o a la bolsa solidaria"
                            >
                                <HeartHandshake className="w-3.5 h-3.5" />
                                Ceder Reserva
                            </button>
                        )}

                        {fueCedida && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                                <UserCheck className="w-3 h-3" />
                                Cedida
                            </span>
                        )}

                        {esCancelable && (
                            confirmar ? (
                                <>
                                    <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        ¿Confirmar?
                                    </span>
                                    <button
                                        onClick={handleCancelar}
                                        disabled={cancelando === reserva.Id_Reserva}
                                        className="text-[11px] font-semibold text-white bg-red-500 hover:bg-red-600
                               px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50
                               flex items-center gap-1"
                                    >
                                        {cancelando === reserva.Id_Reserva
                                            ? <Loader2 className="w-3 h-3 animate-spin" />
                                            : <Ban className="w-3 h-3" />}
                                        Si
                                    </button>
                                    <button
                                        onClick={() => setConfirmar(false)}
                                        className="text-[11px] font-medium text-slate-500 hover:text-slate-700
                               px-2.5 py-1 rounded-lg border border-slate-200
                               hover:bg-slate-50 transition-colors"
                                    >
                                        No
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleCancelar}
                                    className="text-[11px] font-medium text-red-500 hover:text-red-700
                             flex items-center gap-1 px-2 py-1 rounded-lg
                             hover:bg-red-50 transition-colors border border-transparent
                             hover:border-red-100"
                                >
                                    <Ban className="w-3 h-3" />
                                    Cancelar
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Estado vacio ─────────────────────────────────────────────────────────────

function EstadoVacio() {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <UtensilsCrossed className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-slate-600 font-semibold mb-1">Sin reservas aun</p>
            <p className="text-slate-400 text-sm">
                Cuando generes tu primera reserva aparecera aqui.
            </p>
        </div>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function HistorialReservas() {

    // Lee el usuario que App.jsx guarda en localStorage al hacer login
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

    const [Reservas, SetReservas] = useState([]);
    const [solicitudesCesion, setSolicitudesCesion] = useState([]);
    const [procesandoCesion, setProcesandoCesion] = useState(null);
    const [Cargando, SetCargando] = useState(true);
    const [Error, SetError] = useState(null);
    const [Completo, SetCompleto] = useState(false);
    const [CargandoMas, SetCargandoMas] = useState(false);
    const [Cancelando, SetCancelando] = useState(null);
    const [MensajeOk, SetMensajeOk] = useState(null);
    const [MensajeErr, SetMensajeErr] = useState(null);
    const [ReservaQR, SetReservaQR] = useState(null);
    const [reservaParaCeder, SetReservaParaCeder] = useState(null);

    const CargarSolicitudesCesion = useCallback(async () => {
        try {
            const { data } = await apiAxios.get("/api/Reservas/ceder/pendientes");
            setSolicitudesCesion(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error al consultar cesiones pendientes:", err.message);
        }
    }, []);

    const ResponderSolicitudCesion = async (idReserva, accion) => {
        setProcesandoCesion(idReserva);
        try {
            const { data } = await apiAxios.post("/api/Reservas/ceder/responder", {
                Id_Reserva: idReserva,
                idReserva: idReserva,
                accion: accion
            });
            toast.success(data?.mensaje || (accion === "ACEPTAR" ? "¡Reserva aceptada exitosamente!" : "Solicitud de cesión rechazada."));
            await CargarHistorial();
            await CargarSolicitudesCesion();
            window.dispatchEvent(new Event("reservasActualizadas"));
        } catch (err) {
            toast.error(err?.response?.data?.mensaje || err?.response?.data?.message || "No se pudo procesar la solicitud de cesión");
        } finally {
            setProcesandoCesion(null);
        }
    };

    const CargarHistorial = useCallback(async () => {
        SetCargando(true);
        SetError(null);
        try {
            const { data } = await apiAxios.get("/api/Reservas/reservar/historial");
            SetReservas(data);
            SetCompleto(false);
        } catch (err) {
            SetError(err?.response?.data?.message ?? "No se pudo cargar el historial");
        } finally {
            SetCargando(false);
        }
    }, []);

    const CargarTodas = async () => {
        SetCargandoMas(true);
        SetError(null);
        try {
            const { data } = await apiAxios.get("/api/Reservas/reservar/historial/completo");
            SetReservas(data);
            SetCompleto(true);
        } catch (err) {
            SetError(err?.response?.data?.message ?? "No se pudo cargar el historial completo");
        } finally {
            SetCargandoMas(false);
        }
    };

    const CancelarReserva = async (Id_Reserva) => {
        SetCancelando(Id_Reserva);
        SetMensajeOk(null);
        SetMensajeErr(null);
        try {
            await apiAxios.patch(`/api/Reservas/reservar/${Id_Reserva}/cancelar`);
            SetReservas((prev) =>
                prev.map((r) =>
                    r.Id_Reserva === Id_Reserva ? { ...r, Est_Reserva: "Cancelado" } : r
                )
            );
            if (ReservaQR?.Id_Reserva === Id_Reserva) {
                SetReservaQR((prev) => ({ ...prev, Est_Reserva: "Cancelado" }));
            }
            // Disparar evento para que cualquier componente sincronice al instante
            window.dispatchEvent(new Event("reservasActualizadas"));
            toast.success("Reserva cancelada correctamente.");
        } catch (err) {
            toast.error(err?.response?.data?.message ?? "No se pudo cancelar la reserva");
        } finally {
            SetCancelando(null);
        }
    };

    useEffect(() => {
        CargarHistorial();
        CargarSolicitudesCesion();
        const alActualizarReservas = () => {
            CargarHistorial();
            CargarSolicitudesCesion();
        };
        window.addEventListener("reservasActualizadas", alActualizarReservas);
        return () => {
            window.removeEventListener("reservasActualizadas", alActualizarReservas);
        };
    }, [CargarHistorial, CargarSolicitudesCesion]);

    return (
        <>
            {ReservaQR && (
                <ModalQR
                    reserva={ReservaQR}
                    usuario={{
                        nombre: `${usuario?.Nom_Usuario ?? ""} ${usuario?.Ape_Usuario ?? ""}`.trim(),
                        documento: usuario?.NumDoc_Usuario ?? "—",
                    }}
                    onCerrar={() => SetReservaQR(null)}
                />
            )}

            {reservaParaCeder && (
                <ModalCederReserva
                    reserva={reservaParaCeder}
                    usuario={usuario}
                    onCerrar={() => SetReservaParaCeder(null)}
                    onExito={() => {
                        CargarHistorial();
                        window.dispatchEvent(new Event("reservasActualizadas"));
                    }}
                />
            )}

            <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                            <CalendarDays className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-800">
                                Historial de Reservas
                            </h2>
                            <p className="text-xs text-slate-400">
                                {Completo ? "Todas tus reservas" : "Ultimas 10 reservas"}
                                {Reservas.length > 0 && ` · ${Reservas.length} registros`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={CargarHistorial}
                        disabled={Cargando}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600
                       hover:bg-slate-100 transition-colors disabled:opacity-40"
                        title="Recargar"
                    >
                        <RefreshCw className={`w-4 h-4 ${Cargando ? "animate-spin" : ""}`} />
                    </button>
                </div>

                {MensajeOk && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200
                          text-emerald-700 text-sm font-medium px-4 py-3 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        {MensajeOk}
                    </div>
                )}
                {MensajeErr && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200
                          text-red-700 text-sm font-medium px-4 py-3 rounded-xl">
                        <XCircle className="w-4 h-4 shrink-0" />
                        {MensajeErr}
                    </div>
                )}

                {/* Tarjetas de ofertas de cesion recibidas (Pendientes de Aceptacion) */}
                {solicitudesCesion.length > 0 && (
                    <div className="space-y-3">
                        {solicitudesCesion.map((sol) => (
                            <div
                                key={sol.Id_Reserva}
                                className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border-2 border-emerald-500/40 rounded-2xl shadow-sm relative overflow-hidden"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                        <HeartHandshake className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                                                ¡Te ofrecen cederte una reserva!
                                            </span>
                                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                                {sol.Tip_Reserva}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800 mt-1">
                                            {sol.cedente ? `${sol.cedente.Nom_Usuario || ''} ${sol.cedente.Ape_Usuario || ''}`.trim() : "Un compañero"} te está cediendo su ración
                                        </p>
                                        <p className="text-xs text-slate-600 mt-0.5">
                                            Fecha: <span className="font-semibold text-slate-800">{FormatearFecha(sol.Fec_Reserva)}</span> · Plato: <span className="font-semibold text-slate-800">{sol.plato?.Nom_Plato || "Plato del día"}</span>
                                            {sol.bebida?.Nom_Plato && <span> · Bebida: <span className="font-semibold text-slate-800">{sol.bebida.Nom_Plato}</span></span>}
                                        </p>
                                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                                            <button
                                                onClick={() => ResponderSolicitudCesion(sol.Id_Reserva, "ACEPTAR")}
                                                disabled={procesandoCesion === sol.Id_Reserva}
                                                className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                                            >
                                                {procesandoCesion === sol.Id_Reserva ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                )}
                                                Aceptar Reserva
                                            </button>
                                            <button
                                                onClick={() => ResponderSolicitudCesion(sol.Id_Reserva, "RECHAZAR")}
                                                disabled={procesandoCesion === sol.Id_Reserva}
                                                className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
                                            >
                                                <XCircle className="w-3.5 h-3.5" />
                                                No aceptar / Rechazar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {Cargando && (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                    </div>
                )}

                {!Cargando && Error && (
                    <div className="flex flex-col items-center gap-3 py-12 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                        <p className="text-sm text-slate-600 font-medium">{Error}</p>
                        <button
                            onClick={CargarHistorial}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium
                         flex items-center gap-1 transition-colors"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Intentar de nuevo
                        </button>
                    </div>
                )}

                {!Cargando && !Error && Reservas.length === 0 && <EstadoVacio />}

                {!Cargando && !Error && Reservas.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {Reservas.map((reserva) => (
                            <TarjetaReserva
                                key={reserva.Id_Reserva}
                                reserva={reserva}
                                onCancelar={CancelarReserva}
                                cancelando={Cancelando}
                                onVerQR={SetReservaQR}
                                onCeder={SetReservaParaCeder}
                            />
                        ))}
                    </div>
                )}

                {!Cargando && !Error && Reservas.length > 0 && !Completo && (
                    <button
                        onClick={CargarTodas}
                        disabled={CargandoMas}
                        className="w-full py-3 rounded-xl border border-slate-200 bg-white
                       text-sm font-medium text-slate-600 hover:text-indigo-600
                       hover:border-indigo-200 hover:bg-indigo-50 transition-all
                       flex items-center justify-center gap-2 shadow-sm
                       disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {CargandoMas
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <ChevronDown className="w-4 h-4" />}
                        {CargandoMas ? "Cargando..." : "Ver historial completo"}
                    </button>
                )}

                {Completo && Reservas.length > 0 && (
                    <p className="text-center text-xs text-slate-400 py-2">
                        Mostrando todos los registros · {Reservas.length} reservas en total
                    </p>
                )}
            </div>
        </>
    );
}
