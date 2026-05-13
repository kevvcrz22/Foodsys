// HistorialReservas.jsx

import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
    UtensilsCrossed, Clock, CheckCircle2, XCircle, ShieldCheck,
    CalendarDays, ChevronDown, Loader2, RefreshCw, Ban,
    AlertTriangle, Utensils, Star, QrCode, X, Download,
    Hash, Timer,
} from "lucide-react";
import { GenerarTicketQR } from "./GenerarTicketQR";
import apiAxios from "../../api/axiosConfig";

// ─── Configuracion visual por estado ─────────────────────────────────────────

const CONFIG_ESTADO = {
    Generado: {
        label: "Pendiente",
        icon: Clock,
        clases: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-400",
        borde: "border-l-amber-400",
        modalBanner: "from-amber-400 to-orange-400",
    },
    Verificado: {
        label: "Verificado",
        icon: ShieldCheck,
        clases: "bg-blue-50 text-blue-700 border-blue-200",
        dot: "bg-blue-400",
        borde: "border-l-blue-400",
        modalBanner: "from-blue-400 to-indigo-400",
    },
    Consumido: {
        label: "Consumido",
        icon: CheckCircle2,
        clases: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-400",
        borde: "border-l-emerald-400",
        modalBanner: "from-emerald-400 to-teal-400",
    },
    Cancelado: {
        label: "Cancelado",
        icon: XCircle,
        clases: "bg-slate-100 text-slate-500 border-slate-200",
        dot: "bg-slate-300",
        borde: "border-l-slate-300",
        modalBanner: "from-slate-300 to-slate-400",
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

const ConstruirQrUrl = (qrEncriptado) => {
    if (!qrEncriptado) return "";
    const base = window.location.origin;
    return `${base}/ReservaCreada-checkin?data=${encodeURIComponent(qrEncriptado)}`;
};

const UrlImagen = (nombreArchivo) => {
    if (!nombreArchivo) return null;
    const base = apiAxios.defaults.baseURL || "http://localhost:8000";
    return `${base}/uploads/${nombreArchivo}`;
};

// ─── Modal de detalle + QR ────────────────────────────────────────────────────

function ModalQR({ reserva, usuario, onCerrar }) {
    const estado = CONFIG_ESTADO[reserva.Est_Reserva] ?? CONFIG_ESTADO.Cancelado;
    const claseTipo = CONFIG_TIPO[reserva.Tip_Reserva] ?? "bg-slate-100 text-slate-600 border-slate-200";
    const qrUrl = ConstruirQrUrl(reserva.Qr_Reserva);
    const imgUrl = UrlImagen(reserva.plato?.Img_Plato);
    const esActiva = reserva.Est_Reserva === "Generado" || reserva.Est_Reserva === "Verificado";

    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onCerrar(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onCerrar]);

    // Descarga solo el QR como PNG
    const DescargarQR = () => {
        const svg = document.getElementById("qr-modal-svg");
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, 400, 400);
            ctx.drawImage(img, 0, 0, 400, 400);
            const link = document.createElement("a");
            link.download = `reserva-${reserva.Id_Reserva}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        };
        img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
    };

    // Descarga el ticket completo con imagen del plato, descripcion, datos del usuario y QR
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
                                Este QR ya no es valido. La reserva fue {reserva.Est_Reserva.toLowerCase()}.
                            </div>
                        )}

                        {qrUrl && (
                            <div className={`p-4 bg-white border-2 rounded-2xl shadow-sm
                              ${esActiva ? "border-indigo-100" : "border-slate-100 opacity-50"}`}>
                                <QRCodeSVG
                                    id="qr-modal-svg"
                                    value={qrUrl}
                                    size={220}
                                    marginSize={3}
                                    level="H"
                                />
                            </div>
                        )}

                        {esActiva && (
                            <p className="text-xs text-slate-400 text-center leading-relaxed px-4">
                                Presenta este codigo al supervisor para registrar tu consumo.
                            </p>
                        )}

                        {qrUrl && esActiva && (
                            <div className="flex flex-col items-center gap-2 w-full">

                                {/* Solo el QR */}
                                <button
                                    onClick={DescargarQR}
                                    className="flex items-center gap-2 text-xs font-semibold text-indigo-600
                             hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100
                             border border-indigo-200 px-4 py-2 rounded-xl transition-colors"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Descargar QR
                                </button>

                                {/* Ticket completo */}
                                <button
                                    onClick={DescargarTicketCompleto}
                                    className="flex items-center gap-2 text-xs font-semibold text-emerald-600
                             hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100
                             border border-emerald-200 px-4 py-2 rounded-xl transition-colors"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Descargar Ticket Completo
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

function TarjetaReserva({ reserva, onCancelar, cancelando, onVerQR }) {
    const [confirmar, setConfirmar] = useState(false);

    const estado = CONFIG_ESTADO[reserva.Est_Reserva] ?? CONFIG_ESTADO.Cancelado;
    const claseTipo = CONFIG_TIPO[reserva.Tip_Reserva] ?? "bg-slate-100 text-slate-600 border-slate-200";
    const esCancelable = reserva.Est_Reserva === "Generado";
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
                        <p className="text-sm font-semibold text-slate-800 leading-snug truncate">
                            {reserva.plato?.Nom_Plato ?? "Plato no disponible"}
                        </p>
                        <span className={`inline-flex items-center gap-1 shrink-0 text-[11px] font-semibold
                             px-2 py-0.5 rounded-full border ${estado.clases}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${estado.dot}`} />
                            {estado.label}
                        </span>
                    </div>

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
    const [Cargando, SetCargando] = useState(true);
    const [Error, SetError] = useState(null);
    const [Completo, SetCompleto] = useState(false);
    const [CargandoMas, SetCargandoMas] = useState(false);
    const [Cancelando, SetCancelando] = useState(null);
    const [MensajeOk, SetMensajeOk] = useState(null);
    const [MensajeErr, SetMensajeErr] = useState(null);
    const [ReservaQR, SetReservaQR] = useState(null);

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
            SetMensajeOk("Reserva cancelada correctamente.");
            setTimeout(() => SetMensajeOk(null), 4000);
        } catch (err) {
            SetMensajeErr(err?.response?.data?.message ?? "No se pudo cancelar la reserva");
            setTimeout(() => SetMensajeErr(null), 4000);
        } finally {
            SetCancelando(null);
        }
    };

    useEffect(() => { CargarHistorial(); }, [CargarHistorial]);

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