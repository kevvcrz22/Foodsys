// Paginas/Cocina/ValidarReservasCocina.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// MODULO EXCLUSIVO DEL ROL COCINA
// ─────────────────────────────────────────────────────────────────────────────
//
// PROPOSITO:
//   El personal de cocina usa este modulo para buscar la reserva de un
//   Aprendiz Externo o Pasante Externo y cambiar su estado de "Generado"
//   a "Verificado". Solo despues de esta verificacion el aprendiz podra
//   mostrar su QR al supervisor y consumir su comida.
//
// FLUJO (segun ReservasServices.js):
//   Generado -> [Cocina verifica presencialmente aqui] -> Verificado
//                -> [Supervisor escanea QR] -> Consumido
//
// NOTA IMPORTANTE:
//   Aprendices Internos y Pasantes Internos NO pasan por este modulo.
//   Su flujo va directo de Generado a Consumido con el supervisor.
//   Este modulo solo aplica para EXTERNOS sin estado "Especial".
//
// BUSQUEDA:
//   - Por NumDoc_Usuario: documento de cedula del aprendiz.
//   - Por Id_Reserva: numero exacto de la reserva en la BD.
//   Se consulta GET /api/Reservas/Todas y se filtra en el frontend
//   para no crear endpoints adicionales en el backend.
//
// VERIFICACION:
//   PATCH /api/Reservas/verificar/:id/cocina
//   Cambia Est_Reserva de Generado a Verificado.
//   Solo el rol Cocina tiene acceso (controlado por ReservarMiddleware).
//
// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  ZONA DE PRESENTACION - PUEDES MODIFICAR TEXTOS Y ESTILOS          ⚠️
//   Busca el comentario // 🎨 MODIFICABLE para saber que puedes cambiar
//   sin afectar la logica del sistema.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import {
    Search, CheckCircle, XCircle, Loader2, QrCode,
    Hash, FileText, AlertTriangle, User, Clock, Utensils,
} from "lucide-react";
import apiAxios from "../../api/axiosConfig";

// ─────────────────────────────────────────────────────────────────────────────
// Tarjeta que muestra los datos de la reserva encontrada
// y el boton para verificar la presencia del aprendiz.
// ─────────────────────────────────────────────────────────────────────────────
const TarjetaReserva = ({ reserva, onVerificar, verificando }) => {

    // Colores del badge segun el estado actual de la reserva
    // 🎨 MODIFICABLE - cambia los colores de cada estado
    const colorEstado = {
        Generado: "bg-yellow-100 text-yellow-800 border-yellow-300",
        Verificado: "bg-green-100 text-green-800 border-green-300",
        Consumido: "bg-blue-100 text-blue-800 border-blue-300",
        Cancelado: "bg-red-100 text-red-800 border-red-300",
    };

    // Nombre completo del aprendiz sacado de la estructura de la reserva
    const nombreAprendiz = reserva.usuario
        ? `${reserva.usuario.Nom_Usuario ?? ""} ${reserva.usuario.Ape_Usuario ?? ""}`.trim()
        : "Sin nombre";

    const numDoc = reserva.usuario?.NumDoc_Usuario ?? "Sin documento";

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

            {/* ── Encabezado con nombre y estado ── */}
            <div className="bg-orange-50 border-b border-orange-200 px-5 py-4">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-base truncate">{nombreAprendiz}</p>
                        <p className="text-sm text-gray-500">Doc: {numDoc}</p>
                    </div>
                    {/* Badge del estado actual */}
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border shrink-0 ${colorEstado[reserva.Est_Reserva] || "bg-gray-100 text-gray-600 border-gray-300"}`}>
                        {reserva.Est_Reserva}
                    </span>
                </div>
            </div>

            {/* ── Detalles de la reserva ── */}
            <div className="px-5 py-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                    <Hash className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-gray-500">ID Reserva:</span>
                    <span className="font-semibold text-gray-800">#{reserva.Id_Reserva}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <Utensils className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-gray-500">Tipo:</span>
                    <span className="font-semibold text-gray-800">{reserva.Tip_Reserva}</span>
                </div>
                {reserva.plato?.Nom_Plato && (
                    <div className="flex items-center gap-3 text-sm">
                        <QrCode className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-gray-500">Plato:</span>
                        <span className="font-semibold text-gray-800">{reserva.plato.Nom_Plato}</span>
                    </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-gray-500">Fecha:</span>
                    <span className="font-semibold text-gray-800">{reserva.Fec_Reserva}</span>
                </div>
            </div>

            {/* ── Accion: verificar, ya verificada o sin accion posible ── */}
            <div className="px-5 py-4 border-t border-gray-100">
                {reserva.Est_Reserva === "Generado" ? (
                    // Solo se puede verificar si esta en estado Generado
                    <button
                        onClick={() => onVerificar(reserva.Id_Reserva)}
                        disabled={verificando}
                        id={`btn-verificar-${reserva.Id_Reserva}`}
                        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 text-sm"
                    >
                        {verificando
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <CheckCircle className="w-4 h-4" />}
                        {/* 🎨 MODIFICABLE - Texto del boton de verificar */}
                        {verificando ? "Verificando..." : "Verificar Presencia"}
                    </button>
                ) : reserva.Est_Reserva === "Verificado" ? (
                    // Si ya fue verificada mostramos confirmacion
                    <div className="flex items-center justify-center gap-2 text-green-600 font-semibold text-sm py-2">
                        <CheckCircle className="w-4 h-4" />
                        {/* 🎨 MODIFICABLE */}
                        Ya verificada — el aprendiz puede usar su QR con el supervisor
                    </div>
                ) : (
                    // Consumida, Cancelada u otro estado: no se puede verificar
                    <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-2">
                        <XCircle className="w-4 h-4" />
                        {/* 🎨 MODIFICABLE */}
                        No se puede verificar — estado actual: {reserva.Est_Reserva}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal del modulo de verificacion
// ─────────────────────────────────────────────────────────────────────────────
const ValidarReservasCocina = () => {

    // "documento" busca por numero de cedula | "id" busca por Id_Reserva
    const [tipoBusqueda, setTipoBusqueda] = useState("documento");
    const [valorBusqueda, setValorBusqueda] = useState("");
    const [reservaEncontrada, setReservaEncontrada] = useState(null);
    const [buscando, setBuscando] = useState(false);
    const [verificando, setVerificando] = useState(false);
    const [error, setError] = useState("");
    const [mensajeExito, setMensajeExito] = useState("");

    // Fecha de hoy en formato YYYY-MM-DD para filtrar solo reservas del dia
    const hoy = new Date().toISOString().split("T")[0];

    // ── Busqueda de reserva ──────────────────────────────────────────────────
    // Consulta GET /api/Reservas/Todas y filtra por documento o Id_Reserva.
    // Se filtra tambien por la fecha de hoy para mostrar solo la reserva activa.
    // NOTA: no se llama a los endpoints de consumir para no alterar el estado.
    const buscarReserva = async () => {
        setError("");
        setMensajeExito("");
        setReservaEncontrada(null);

        if (!valorBusqueda.trim()) {
            setError("Por favor ingresa un valor para buscar.");  // 🎨 MODIFICABLE
            return;
        }

        setBuscando(true);
        try {
            // Obtenemos todas las reservas del sistema (acceso permitido para Cocina via authMiddleware)
            const respuesta = await apiAxios.get("/api/Reservas/Todas");
            const todasLasReservas = respuesta.data;

            // Filtramos en el frontend segun el tipo de busqueda y la fecha de hoy
            let encontrada = null;

            if (tipoBusqueda === "documento") {
                // Busca por numero de documento del aprendiz, solo reservas de hoy
                encontrada = todasLasReservas.find(
                    (r) =>
                        String(r.usuario?.NumDoc_Usuario) === valorBusqueda.trim() &&
                        r.Fec_Reserva === hoy
                );
            } else {
                // Busca por ID exacto de la reserva (sin filtro de fecha para mayor flexibilidad)
                encontrada = todasLasReservas.find(
                    (r) => String(r.Id_Reserva) === valorBusqueda.trim()
                );
            }

            if (!encontrada) {
                setError(
                    tipoBusqueda === "documento"
                        // 🎨 MODIFICABLE - Mensaje cuando no se encuentra por documento
                        ? "No se encontro reserva para hoy con ese numero de documento."
                        // 🎨 MODIFICABLE - Mensaje cuando no se encuentra por ID
                        : "No se encontro ninguna reserva con ese ID."
                );
                return;
            }

            setReservaEncontrada(encontrada);
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                "Error al buscar la reserva. Verifica tu conexion."  // 🎨 MODIFICABLE
            );
        } finally {
            setBuscando(false);
        }
    };

    // ── Verificacion de presencia ────────────────────────────────────────────
    // Llama a PATCH /api/Reservas/verificar/:id/cocina
    // Cambia Est_Reserva de "Generado" a "Verificado".
    // Solo el rol Cocina tiene acceso (controlado por ReservarMiddleware en el backend).
    const verificarReserva = async (idReserva) => {
        setError("");
        setMensajeExito("");
        setVerificando(true);

        try {
            await apiAxios.patch(`/api/Reservas/verificar/${idReserva}/cocina`);

            // 🎨 MODIFICABLE - Mensaje de exito
            setMensajeExito("✅ Reserva verificada correctamente. El aprendiz ya puede usar su QR con el supervisor.");

            // Actualizamos el estado local para que la UI refleje el cambio sin recargar
            setReservaEncontrada((prev) =>
                prev ? { ...prev, Est_Reserva: "Verificado" } : prev
            );
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                "No se pudo verificar la reserva."  // 🎨 MODIFICABLE
            );
        } finally {
            setVerificando(false);
        }
    };

    // Permite buscar presionando la tecla Enter en el campo de texto
    const manejarTecla = (e) => {
        if (e.key === "Enter") buscarReserva();
    };

    // Limpia todos los estados al cambiar el tipo de busqueda
    const cambiarTipo = (nuevoTipo) => {
        setTipoBusqueda(nuevoTipo);
        setValorBusqueda("");
        setReservaEncontrada(null);
        setError("");
        setMensajeExito("");
    };

    return (
        // Contenedor completamente responsive: funciona en movil, tablet, PC y TV
        <div className="w-full min-h-screen bg-gray-50 px-4 py-6 md:px-8">

            {/* ── Encabezado del modulo ── */}
            <div className="max-w-2xl mx-auto mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shrink-0 shadow-sm">
                        <QrCode className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        {/* 🎨 MODIFICABLE - Titulo y subtitulo */}
                        <h1 className="text-xl font-bold text-gray-900">Verificacion de Reservas</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Busca al aprendiz y confirma su presencia para habilitar el QR
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto space-y-5">

                {/* ── Panel de busqueda ── */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">

                    {/* Selector de tipo de busqueda */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Buscar por {/* 🎨 MODIFICABLE */}
                        </p>
                        <div className="flex gap-2">

                            {/* Boton: buscar por numero de documento */}
                            <button
                                onClick={() => cambiarTipo("documento")}
                                id="btn-buscar-documento"
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${tipoBusqueda === "documento"
                                        ? "bg-orange-500 text-white border-transparent shadow-sm"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                                    }`}
                            >
                                <FileText className="w-4 h-4" />
                                Numero de Documento {/* 🎨 MODIFICABLE */}
                            </button>

                            {/* Boton: buscar por ID de reserva */}
                            <button
                                onClick={() => cambiarTipo("id")}
                                id="btn-buscar-id"
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${tipoBusqueda === "id"
                                        ? "bg-orange-500 text-white border-transparent shadow-sm"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                                    }`}
                            >
                                <Hash className="w-4 h-4" />
                                ID de Reserva {/* 🎨 MODIFICABLE */}
                            </button>

                        </div>
                    </div>

                    {/* Campo de texto + boton buscar */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                id="input-busqueda-cocina"
                                type={tipoBusqueda === "id" ? "number" : "text"}
                                // 🎨 MODIFICABLE - Placeholders del campo de busqueda
                                placeholder={
                                    tipoBusqueda === "documento"
                                        ? "Ej: 1001234567 (cedula del aprendiz)"
                                        : "Ej: 42 (ID de la reserva)"
                                }
                                value={valorBusqueda}
                                onChange={(e) => setValorBusqueda(e.target.value)}
                                onKeyDown={manejarTecla}
                                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-gray-50"
                            />
                        </div>
                        <button
                            onClick={buscarReserva}
                            disabled={buscando}
                            id="btn-buscar-reserva"
                            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold px-5 py-3 rounded-xl transition-all duration-200 text-sm shrink-0"
                        >
                            {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            {/* 🎨 MODIFICABLE */}
                            {buscando ? "Buscando..." : "Buscar"}
                        </button>
                    </div>

                    {/* Texto de ayuda contextual */}
                    <p className="text-xs text-gray-400 text-center">
                        {/* 🎨 MODIFICABLE - Texto de ayuda */}
                        {tipoBusqueda === "documento"
                            ? "La busqueda filtra las reservas activas del dia de hoy por cedula."
                            : "Ingresa el numero exacto del ID de reserva del aprendiz."}
                    </p>
                </div>

                {/* ── Mensaje de error ── */}
                {error && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-700">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                {/* ── Mensaje de exito tras verificar ── */}
                {mensajeExito && (
                    <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4 text-green-700">
                        <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium">{mensajeExito}</p>
                    </div>
                )}

                {/* ── Tarjeta de resultado ── */}
                {reservaEncontrada && (
                    <TarjetaReserva
                        reserva={reservaEncontrada}
                        onVerificar={verificarReserva}
                        verificando={verificando}
                    />
                )}

                {/* ── Nota informativa del flujo ── */}
                {/* 🎨 MODIFICABLE - Pasos explicados al personal de cocina */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
                        Como funciona este modulo
                    </p>
                    <ul className="text-xs text-amber-700 space-y-1.5 list-disc list-inside">
                        <li>El aprendiz externo se presenta en taquilla con su documento.</li>
                        <li>Buscas la reserva por cedula o por ID de reserva.</li>
                        <li>Si aparece en estado <strong>Generado</strong>, presiona <strong>Verificar Presencia</strong>.</li>
                        <li>El estado cambia a <strong>Verificado</strong> y el aprendiz puede usar su QR con el supervisor.</li>
                        <li>Los aprendices <strong>internos</strong> no pasan por este paso — van directo con el supervisor.</li>
                    </ul>
                </div>

            </div>
        </div>
    );
};

export default ValidarReservasCocina;