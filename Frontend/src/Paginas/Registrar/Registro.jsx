// =============================================================================
// Foodsys - Módulo de Registro de Consumo para Supervisor
// Estilo Verde Normal SENA, Escaneo QR en Cámara, Búsqueda Manual
// Inteligente y Reportes en PDF con Gráficos.
// =============================================================================

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Chart } from "react-google-charts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  QrCode, Search, Play, Square, ClipboardList,
  CheckCircle2, XCircle, Clock,
  User, Utensils, Camera, Hash, FileText,
  Download, X, RefreshCw, TrendingUp, BarChart3,
  PieChart, Shield, Loader2,
  ScanLine, CalendarX, Ban, AlertTriangle,
  Sparkles, Check, Coffee, SunMedium,
  Moon, CheckCheck, ArrowRight
} from "lucide-react";

// URL base de la API
const API_URL = import.meta.env.VITE_API_URL || "";

// Configuración de escaneo a pantalla completa (sin recuadro nativo duplicado)
const CONFIG_QR = {
  fps: 30,
  aspectRatio: 1.0,
  disableFlip: false,
  experimentalFeatures: { useBarCodeDetectorIfSupported: true },
};

// Paleta de estilos por tipo de comida
const ESTILOS_TIPO = {
  Desayuno: {
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    icon: Coffee,
    color: "#f59e0b",
  },
  Almuerzo: {
    badge: "bg-green-50 text-green-800 border-green-200",
    icon: SunMedium,
    color: "#16a34a",
  },
  Cena: {
    badge: "bg-blue-50 text-blue-800 border-blue-200",
    icon: Moon,
    color: "#2563eb",
  },
};

// Horarios de turnos del comedor
const HORARIOS_SERVICIO = [
  { tipo: "Desayuno", horario: "06:00 – 07:00", inicioMin: 6 * 60, finMin: 7 * 60, icon: Coffee, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { tipo: "Almuerzo", horario: "11:30 – 13:30", inicioMin: 11 * 60 + 30, finMin: 13 * 60 + 30, icon: SunMedium, color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
  { tipo: "Cena",     horario: "18:00 – 19:00", inicioMin: 18 * 60, finMin: 19 * 60, icon: Moon, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
];

// Clasificador inteligente de respuestas de error del backend
const ClasificarError = (mensaje) => {
  if (!mensaje || typeof mensaje !== "string") return { tipo: "generico" };
  const m = mensaje.toLowerCase();
  if (m.includes("código qr es para el") || m.includes("codigo qr es para el") || m.includes("fecha")) {
    return { tipo: "fecha_invalida" };
  }
  if (m.includes("vencido") || m.includes("vencida")) {
    return { tipo: "qr_vencido" };
  }
  if (m.includes("consumido") || m.includes("ya fue consumida") || m.includes("ya fue")) {
    return { tipo: "ya_consumido" };
  }
  if (m.includes("cancelado") || m.includes("cancelada")) {
    return { tipo: "cancelado" };
  }
  if (m.includes("cocina") || m.includes("verificada") || m.includes("verificar")) {
    return { tipo: "falta_cocina" };
  }
  if (m.includes("horario") || m.includes("habilitado")) {
    return { tipo: "fuera_horario" };
  }
  if (m.includes("sancionado") || m.includes("sanción")) {
    return { tipo: "sancionado" };
  }
  return { tipo: "generico" };
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: Tarjeta de Métrica Estadística Compacta y Proporcional
// ─────────────────────────────────────────────────────────────────────────────
const TarjetaMetrica = ({ label, valor, icon: IconComponent, colorTheme, onRefresh, loading }) => {
  const themes = {
    green: {
      bg: "bg-green-50/60 border-green-200/80 hover:border-green-300",
      textVal: "text-green-900",
      textLbl: "text-green-700",
      iconBg: "bg-green-600 text-white shadow-xs shadow-green-600/20",
    },
    purple: {
      bg: "bg-purple-50/60 border-purple-200/80 hover:border-purple-300",
      textVal: "text-purple-900",
      textLbl: "text-purple-700",
      iconBg: "bg-purple-600 text-white shadow-xs shadow-purple-600/20",
    },
    rose: {
      bg: "bg-red-50/60 border-red-200/80 hover:border-red-300",
      textVal: "text-red-900",
      textLbl: "text-red-700",
      iconBg: "bg-red-600 text-white shadow-xs shadow-red-600/20",
    },
    slate: {
      bg: "bg-gray-50 border-gray-200/80 hover:border-gray-300",
      textVal: "text-gray-900",
      textLbl: "text-gray-600",
      iconBg: "bg-gray-600 text-white shadow-xs shadow-gray-600/20",
    },
  };

  const currentTheme = themes[colorTheme] || themes.green;

  return (
    <div className={`relative flex items-center justify-between gap-3 rounded-2xl border p-3 sm:px-3.5 shadow-2xs transition-all duration-200 hover:shadow-xs ${currentTheme.bg}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${currentTheme.iconBg}`}>
          <IconComponent className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0">
          <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate leading-tight ${currentTheme.textLbl}`}>
            {label}
          </p>
          <span className={`text-lg sm:text-xl font-black tracking-tight leading-none block mt-0.5 ${currentTheme.textVal}`}>
            {valor}
          </span>
        </div>
      </div>
      {onRefresh && (
        <button
          onClick={onRefresh}
          title="Actualizar datos"
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white/80 transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-green-600" : ""}`} />
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: Tarjeta de Resultado del Escaneo / Búsqueda
// ─────────────────────────────────────────────────────────────────────────────
const TarjetaResultado = ({ resultado }) => {
  if (!resultado) return null;

  // CASO DE ERROR CLASIFICADO
  if (resultado.Error) {
    const { tipo } = ClasificarError(resultado.Error);

    const configuraciones = {
      fecha_invalida: {
        icono: CalendarX,
        titulo: "Reserva de otra fecha",
        cardBg: "bg-amber-50 border-amber-200",
        iconBox: "bg-amber-500 text-white shadow-sm",
        titleColor: "text-amber-900",
        msgColor: "text-amber-800",
        pill: "Fecha incorrecta",
      },
      qr_vencido: {
        icono: Clock,
        titulo: "Código QR / Reserva vencida",
        cardBg: "bg-gray-100 border-gray-300",
        iconBox: "bg-gray-600 text-white shadow-sm",
        titleColor: "text-gray-900",
        msgColor: "text-gray-700",
        pill: "Turno expirado",
      },
      ya_consumido: {
        icono: CheckCircle2,
        titulo: "Reserva ya consumida",
        cardBg: "bg-blue-50 border-blue-200",
        iconBox: "bg-blue-600 text-white shadow-sm",
        titleColor: "text-blue-900",
        msgColor: "text-blue-800",
        pill: "Ya registrada hoy",
      },
      cancelado: {
        icono: Ban,
        titulo: "Reserva cancelada",
        cardBg: "bg-orange-50 border-orange-200",
        iconBox: "bg-orange-500 text-white shadow-sm",
        titleColor: "text-orange-900",
        msgColor: "text-orange-800",
        pill: "Cancelada por aprendiz",
      },
      falta_cocina: {
        icono: AlertTriangle,
        titulo: "Verificación de Cocina pendiente",
        cardBg: "bg-amber-50 border-amber-300",
        iconBox: "bg-amber-500 text-white shadow-sm",
        titleColor: "text-amber-950",
        msgColor: "text-amber-800",
        pill: "Requiere paso por cocina",
      },
      fuera_horario: {
        icono: Clock,
        titulo: "Fuera de la franja horaria",
        cardBg: "bg-amber-50 border-amber-200",
        iconBox: "bg-amber-500 text-white shadow-sm",
        titleColor: "text-amber-900",
        msgColor: "text-amber-800",
        pill: "Comedor fuera de servicio",
      },
      sancionado: {
        icono: Shield,
        titulo: "Aprendiz con sanción activa",
        cardBg: "bg-red-50 border-red-300",
        iconBox: "bg-red-600 text-white shadow-sm",
        titleColor: "text-red-950",
        msgColor: "text-red-800",
        pill: "Acceso bloqueado",
      },
      generico: {
        icono: XCircle,
        titulo: "No se pudo registrar el consumo",
        cardBg: "bg-red-50 border-red-200",
        iconBox: "bg-red-600 text-white shadow-sm",
        titleColor: "text-red-950",
        msgColor: "text-red-800",
        pill: "Rechazado",
      },
    };

    const cfg = configuraciones[tipo] || configuraciones.generico;
    const ErrorIcon = cfg.icono;

    return (
      <div className={`rounded-2xl border-2 p-5 shadow-xs transition-all ${cfg.cardBg}`}>
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBox}`}>
            <ErrorIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`text-base font-bold ${cfg.titleColor}`}>
                {cfg.titulo}
              </h4>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white border border-current/20">
                {cfg.pill}
              </span>
            </div>
            <p className={`mt-1.5 text-sm leading-relaxed ${cfg.msgColor}`}>
              {resultado.Error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // CASO DE ÉXITO: Consumo registrado
  const baseServidor = API_URL.replace(/\/api$/, "");
  const urlImagen = resultado.ImgPlato ? `${baseServidor}/uploads/${resultado.ImgPlato}` : null;
  const configTipo = ESTILOS_TIPO[resultado.Tipo] || ESTILOS_TIPO.Almuerzo;
  const TipoIcon = configTipo.icon;

  return (
    <div className="rounded-2xl border-2 border-green-300 bg-green-50/80 p-5 sm:p-6 shadow-xs transition-all">
      {/* Cabecera del resultado */}
      <div className="flex items-center justify-between gap-3 border-b border-green-200 pb-3.5 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-green-600 text-white flex items-center justify-center shadow-xs">
            <CheckCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-green-950 text-base sm:text-lg leading-tight">
              ¡Consumo Autorizado!
            </h4>
            <p className="text-xs font-semibold text-green-700">
              Registrado exitosamente en el sistema
            </p>
          </div>
        </div>

        {/* Badge de perfil de flujo */}
        <div>
          {resultado.flujoEspecial && (
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 px-3 py-1 rounded-full">
              <Shield className="w-3 h-3" /> Especial
            </span>
          )}
          {resultado.flujoInterno && !resultado.flujoEspecial && (
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-green-100 text-green-800 border border-green-300 px-3 py-1 rounded-full">
              <User className="w-3 h-3" /> Interno
            </span>
          )}
          {!resultado.flujoEspecial && !resultado.flujoInterno && (
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1 rounded-full">
              <User className="w-3 h-3" /> Externo
            </span>
          )}
        </div>
      </div>

      {/* Cuerpo principal del plato y usuario */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Foto del plato si existe */}
        {urlImagen && (
          <div className="md:col-span-4 flex justify-center">
            <div className="relative group overflow-hidden rounded-2xl border border-green-200 w-full max-w-[180px] h-36 bg-green-100/50">
              <img
                src={urlImagen}
                alt={resultado.Plato || "Plato servido"}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>
          </div>
        )}

        {/* Datos del aprendiz y plato */}
        <div className={urlImagen ? "md:col-span-8 space-y-3" : "md:col-span-12 space-y-3"}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex items-center gap-2.5 bg-white border border-green-100 p-2.5 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-400 uppercase leading-none">Aprendiz</p>
                <p className="text-sm font-bold text-gray-900 truncate mt-0.5">{resultado.Aprendiz || "Sin nombre"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-white border border-green-100 p-2.5 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                <Hash className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-400 uppercase leading-none">Documento</p>
                <p className="text-sm font-bold text-gray-900 truncate mt-0.5">{resultado.NumDoc || "--"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-white border border-green-100 p-2.5 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                <Utensils className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-400 uppercase leading-none">Plato Asignado</p>
                <p className="text-sm font-bold text-green-950 truncate mt-0.5">{resultado.Plato || "Menú del día"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-white border border-green-100 p-2.5 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                <TipoIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-400 uppercase leading-none">Tipo de Comida</p>
                <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md border mt-0.5 ${configTipo.badge}`}>
                  {resultado.Tipo || "Almuerzo"}
                </span>
              </div>
            </div>
          </div>

          {resultado.DescPlato && (
            <div className="bg-white/80 rounded-xl p-2.5 text-xs text-green-900 border border-green-200 leading-relaxed">
              <span className="font-bold">Detalle del menú: </span> {resultado.DescPlato}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: Modal de Cierre de Turno y Reporte Ejecutivo
// ─────────────────────────────────────────────────────────────────────────────
const ModalCierreTurno = ({ datos, onCerrar, onExportarPDF, refReporte, exportandoPDF }) => {
  const { horaInicio, horaFin, historial, metricas } = datos;

  const formatearHora = (iso) =>
    new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const formatearFecha = (iso) =>
    new Date(iso).toLocaleDateString("es-CO", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

  // Datos para gráficos de Google Charts
  const datosColumnas = [
    ["Categoría", "Cantidad", { role: "style" }, { role: "annotation" }],
    ["Consumidas", metricas.total, "color: #16a34a", String(metricas.total)],
    ["Especiales", metricas.especiales, "color: #7c3aed", String(metricas.especiales)],
    ["Canceladas", metricas.canceladas, "color: #dc2626", String(metricas.canceladas)],
    ["Vencidas", metricas.vencidas, "color: #4b5563", String(metricas.vencidas)],
  ];

  const contarTipo = (tipo) => historial.filter((r) => r.Tipo === tipo).length;

  const datosPastel = [
    ["Tipo de Servicio", "Cantidad"],
    ["Desayuno", contarTipo("Desayuno")],
    ["Almuerzo", contarTipo("Almuerzo")],
    ["Cena", contarTipo("Cena")],
  ].filter((f, i) => i === 0 || f[1] > 0);

  if (datosPastel.length === 1) datosPastel.push(["Sin consumos", 1]);

  // Evolución por franjas horarias
  const agrupadoHora = historial.reduce((acc, item) => {
    const hora = new Date(item.Timestamp).getHours();
    const key = `${hora.toString().padStart(2, "0")}:00`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const datosLinea = [
    ["Hora", "Consumos"],
    ...Object.entries(agrupadoHora)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([h, c]) => [h, c]),
  ];

  if (datosLinea.length < 3) {
    datosLinea.push(["00:00", 0]);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-5xl max-h-[96vh] overflow-y-auto shadow-2xl border border-gray-200 flex flex-col">
        {/* Barra superior del modal */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                Reporte de Cierre de Turno
              </h2>
              <p className="text-xs text-gray-500">
                {formatearFecha(horaInicio)} &middot; {formatearHora(horaInicio)} a {formatearHora(horaFin)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportarPDF}
              disabled={exportandoPDF}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 disabled:bg-green-400 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
            >
              {exportandoPDF ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Exportando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Exportar Reporte PDF</span>
                </>
              )}
            </button>
            <button
              onClick={onCerrar}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenedor exportable */}
        <div ref={refReporte} className="p-6 sm:p-8 space-y-6 sm:space-y-8 bg-white flex-1">
          {/* Membrete del reporte */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-green-800 bg-green-100 px-2.5 py-0.5 rounded-full">
                  FOODSYS &middot; SENA
                </span>
                <span className="text-xs text-gray-500 font-medium">Regional Tolima</span>
              </div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight mt-1">
                Control y Auditoría de Comedor
              </h1>
              <p className="text-xs text-gray-500">
                Generado por Supervisor &middot; Fecha: {formatearFecha(horaInicio)}
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 text-right text-xs text-gray-600">
              <p><strong className="text-gray-800">Apertura:</strong> {formatearHora(horaInicio)}</p>
              <p><strong className="text-gray-800">Cierre:</strong> {formatearHora(horaFin)}</p>
            </div>
          </div>

          {/* Tarjetas de resumen métrico */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-green-50 border border-green-200">
              <p className="text-xs font-bold text-green-800 uppercase">Consumidas</p>
              <p className="text-3xl font-black text-green-950 mt-1">{metricas.total}</p>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
              <p className="text-xs font-bold text-purple-800 uppercase">Especiales</p>
              <p className="text-3xl font-black text-purple-950 mt-1">{metricas.especiales}</p>
            </div>
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
              <p className="text-xs font-bold text-red-800 uppercase">Canceladas (Día)</p>
              <p className="text-3xl font-black text-red-950 mt-1">{metricas.canceladas}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-300">
              <p className="text-xs font-bold text-gray-800 uppercase">Vencidas al Cierre</p>
              <p className="text-3xl font-black text-gray-950 mt-1">{metricas.vencidas}</p>
            </div>
          </div>

          {/* Gráficos de análisis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-green-600" />
                <h3 className="font-bold text-gray-800 text-sm">Distribución por Estado</h3>
              </div>
              <Chart
                chartType="ColumnChart"
                data={datosColumnas}
                options={{
                  chartArea: { width: "80%", height: "65%" },
                  legend: { position: "none" },
                  hAxis: { textStyle: { fontSize: 11, color: "#475569" } },
                  vAxis: { minValue: 0, textStyle: { fontSize: 11 } },
                  annotations: { alwaysOutside: true, textStyle: { fontSize: 11, bold: true } },
                }}
                width="100%"
                height="240px"
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <PieChart className="w-4 h-4 text-green-700" />
                <h3 className="font-bold text-gray-800 text-sm">Distribución por Tipo de Comida</h3>
              </div>
              <Chart
                chartType="PieChart"
                data={datosPastel}
                options={{
                  colors: ["#f59e0b", "#16a34a", "#2563eb"],
                  chartArea: { width: "85%", height: "80%" },
                  legend: { position: "right", textStyle: { fontSize: 11 } },
                  pieHole: 0.45,
                  pieSliceTextStyle: { fontSize: 12, bold: true },
                }}
                width="100%"
                height="240px"
              />
            </div>
          </div>

          {/* Evolución por hora si hay registros suficientes */}
          {datosLinea.length > 2 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-green-700" />
                <h3 className="font-bold text-gray-800 text-sm">Consumos por Franja Horaria</h3>
              </div>
              <Chart
                chartType="LineChart"
                data={datosLinea}
                options={{
                  chartArea: { width: "85%", height: "65%" },
                  colors: ["#16a34a"],
                  legend: { position: "none" },
                  curveType: "function",
                  pointSize: 5,
                  lineWidth: 3,
                  hAxis: { textStyle: { fontSize: 11, color: "#64748b" } },
                  vAxis: { minValue: 0, textStyle: { fontSize: 11 }, format: "0" },
                }}
                width="100%"
                height="220px"
              />
            </div>
          )}

          {/* Tabla de auditoría detallada */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-gray-500" />
                <h3 className="font-bold text-gray-800 text-sm">Detalle de Aprendices Atendidos</h3>
              </div>
              <span className="text-xs font-bold bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full">
                {historial.length} registros
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase">
                    <th className="px-4 py-3">Hora</th>
                    <th className="px-4 py-3">Aprendiz</th>
                    <th className="px-4 py-3">Documento</th>
                    <th className="px-4 py-3">Plato</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Flujo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historial.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                        No se registraron consumos en este turno
                      </td>
                    </tr>
                  ) : (
                    historial.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-gray-600 whitespace-nowrap">
                          {new Date(item.Timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-gray-900">{item.Aprendiz}</td>
                        <td className="px-4 py-2.5 text-gray-600">{item.NumDoc}</td>
                        <td className="px-4 py-2.5 text-gray-700 truncate max-w-xs">{item.Plato}</td>
                        <td className="px-4 py-2.5">
                          <span className="font-bold text-gray-800">{item.Tipo}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          {item.FlujoEspecial && <span className="font-semibold text-purple-600">Especial</span>}
                          {item.FlujoInterno && !item.FlujoEspecial && <span className="font-semibold text-green-600">Interno</span>}
                          {!item.FlujoEspecial && !item.FlujoInterno && <span className="font-semibold text-gray-500">Externo</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pie de página con firmas */}
          <div className="pt-6 border-t border-gray-200 grid grid-cols-2 gap-8 text-xs text-gray-500">
            <div>
              <p className="font-bold text-gray-800">Firma del Supervisor:</p>
              <div className="mt-8 border-b border-gray-300 w-48" />
              <p className="mt-1 text-gray-400">Supervisor de Turno Foodsys</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-800">Centro Agropecuario La Granja</p>
              <p className="text-gray-400">SENA Regional Tolima</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL: Registro (Supervisor)
// ─────────────────────────────────────────────────────────────────────────────
const Registro = () => {
  // ── ESTADOS PRINCIPALES ───────────────────────────────────────────────────
  const [turnoActivo, setTurnoActivo] = useState(false);
  const [horaInicioTurno, setHoraInicioTurno] = useState(null);
  const [horaFinTurno, setHoraFinTurno] = useState(null);
  const [historialTurno, setHistorialTurno] = useState([]);
  const [contCanceladas, setContCanceladas] = useState(0);
  const [contVencidas, setContVencidas] = useState(0);
  const [cargandoMetricas, setCargandoMetricas] = useState(false);

  // Estados del Escáner y Cámara
  const [tabActiva, setTabActiva] = useState("qr"); // "qr" | "manual"
  const [scannerListo, setScannerListo] = useState(false);
  const [qrDetectado, setQrDetectado] = useState(false);
  const [procesando, setProcesando] = useState(false);

  // Búsqueda Manual
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [cargandoManual, setCargandoManual] = useState(false);

  // Resultados & Modales
  const [ultimoResultado, setUltimoResultado] = useState(null);
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);
  const [exportandoPDF, setExportandoPDF] = useState(false);
  const [filtroHistorial, setFiltroHistorial] = useState("");
  const [tipoFiltroHistorial, setTipoFiltroHistorial] = useState("Todos");

  // Reloj y turnos
  const [horaActual, setHoraActual] = useState(new Date());

  // ── REFS ──────────────────────────────────────────────────────────────────
  const instanciaQRRef = useRef(null);
  const procesandoRef = useRef(false);
  const refReportePDF = useRef(null);
  const ultimoQRTextoRef = useRef("");
  const ultimoQRTiempoRef = useRef(0);
  const bufferPistolaRef = useRef("");
  const timerPistolaRef = useRef(null);

  // ── EFECTO: Reloj en vivo ─────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Identificar el turno de comida actual según la hora
  const turnoComidaActual = useMemo(() => {
    const minutosDia = horaActual.getHours() * 60 + horaActual.getMinutes();
    return HORARIOS_SERVICIO.find(
      (h) => minutosDia >= h.inicioMin && minutosDia <= h.finMin
    ) || null;
  }, [horaActual]);

  // ── OBTENER TOKEN ─────────────────────────────────────────────────────────
  const obtenerToken = () => localStorage.getItem("token") || "";

  // ── OBTENER CONTADORES EXTERNOS ───────────────────────────────────────────
  const obtenerContadoresExternos = useCallback(async () => {
    const fechaHoy = new Date().toISOString().split("T")[0];
    setCargandoMetricas(true);
    try {
      const [resCanc, resVenc] = await Promise.all([
        fetch(`${API_URL}/api/Reservas/canceladas/count?fecha=${fechaHoy}`, {
          headers: { Authorization: `Bearer ${obtenerToken()}` },
        }),
        fetch(`${API_URL}/api/Reservas/vencidas/count?fecha=${fechaHoy}`, {
          headers: { Authorization: `Bearer ${obtenerToken()}` },
        }),
      ]);
      if (resCanc.ok) {
        const dataCanc = await resCanc.json();
        setContCanceladas(dataCanc.total ?? 0);
      }
      if (resVenc.ok) {
        const dataVenc = await resVenc.json();
        setContVencidas(dataVenc.total ?? 0);
      }
    } catch {
      // Manejo silencioso en background
    } finally {
      setCargandoMetricas(false);
    }
  }, []);

  // ── LLAMAR API DE CONSUMO ─────────────────────────────────────────────────
  const llamarAPIConsumo = async (variante, body) => {
    try {
      const resp = await fetch(`${API_URL}/api/Reservas/consumir/${variante}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${obtenerToken()}`,
        },
        body: JSON.stringify(body),
      });

      const datos = await resp.json();

      if (!resp.ok) {
        setUltimoResultado({ Error: datos.message || "Error al validar la reserva" });
        return;
      }

      setUltimoResultado(datos);
      setHistorialTurno((prev) => [
        {
          Aprendiz: datos.Aprendiz || "Sin nombre",
          NumDoc: datos.NumDoc || "--",
          Tipo: datos.Tipo || "Almuerzo",
          Plato: datos.Plato || "Sin información",
          DescPlato: datos.DescPlato || "",
          ImgPlato: datos.ImgPlato || null,
          FlujoEspecial: Boolean(datos.flujoEspecial),
          FlujoInterno: Boolean(datos.flujoInterno),
          Id_Reserva: datos.Id_Reserva,
          Timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch {
      setUltimoResultado({ Error: "Error de conexión con el servidor Foodsys" });
    }
  };

  // ── PROCESAR TEXTO QR (Cámara o Pistola) ──────────────────────────────────
  const procesarTextoQR = useCallback(async (textoQR) => {
    const ahora = Date.now();

    // Deduplicación rápida: mismo QR leído hace menos de 1 segundo se ignora
    if (textoQR === ultimoQRTextoRef.current && ahora - ultimoQRTiempoRef.current < 1000) {
      return;
    }

    if (procesandoRef.current) return;

    ultimoQRTextoRef.current = textoQR;
    ultimoQRTiempoRef.current = ahora;
    procesandoRef.current = true;

    setQrDetectado(true);
    setProcesando(true);
    setUltimoResultado(null);

    let encriptadoQR = textoQR.trim();
    try {
      const url = new URL(textoQR);
      const param = url.searchParams.get("data");
      if (param) encriptadoQR = decodeURIComponent(param);
    } catch {}

    await llamarAPIConsumo("supervisor", { encriptadoQR });

    setProcesando(false);
    setQrDetectado(false);
    procesandoRef.current = false;
  }, []);

  // ── SOPORTE PARA PISTOLA LECTORA (USB / Bluetooth Keyboard Wedge) ──────────
  useEffect(() => {
    if (!turnoActivo) return;

    const manejarTecla = (e) => {
      const tag = e.target?.tagName?.toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "Enter") {
        const contenido = bufferPistolaRef.current.trim();
        bufferPistolaRef.current = "";
        clearTimeout(timerPistolaRef.current);
        if (contenido.length > 10) {
          procesarTextoQR(contenido);
        }
        return;
      }

      if (e.key.length === 1) {
        bufferPistolaRef.current += e.key;
        clearTimeout(timerPistolaRef.current);
        timerPistolaRef.current = setTimeout(() => {
          bufferPistolaRef.current = "";
        }, 500);
      }
    };

    window.addEventListener("keydown", manejarTecla);
    return () => {
      window.removeEventListener("keydown", manejarTecla);
      clearTimeout(timerPistolaRef.current);
    };
  }, [turnoActivo, procesarTextoQR]);

  // ── INICIALIZAR Y CONTROLAR CÁMARA QR ─────────────────────────────────────
  useEffect(() => {
    if (!scannerListo || tabActiva !== "qr" || !turnoActivo) return;

    const idDiv = "visor-qr-moderno";
    let isCancelled = false;

    const iniciarCamara = async () => {
      try {
        const elem = document.getElementById(idDiv);
        if (!elem || isCancelled) return;

        const scanner = new Html5Qrcode(idDiv);
        instanciaQRRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          CONFIG_QR,
          (textoQR) => {
            if (!procesandoRef.current) {
              procesarTextoQR(textoQR);
            }
          },
          () => {}
        );
      } catch (err) {
        if (!isCancelled) {
          console.error("Error al iniciar cámara:", err);
          setUltimoResultado({
            Error: `Error de cámara: ${err?.message || "No se pudo acceder al dispositivo de video"}. Verifica los permisos del navegador.`,
          });
        }
      }
    };

    const timer = setTimeout(iniciarCamara, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      if (instanciaQRRef.current) {
        instanciaQRRef.current
          .stop()
          .then(() => { instanciaQRRef.current = null; })
          .catch(() => { instanciaQRRef.current = null; });
      }
    };
  }, [scannerListo, tabActiva, turnoActivo, procesarTextoQR]);

  // ── DETECCIÓN INTELIGENTE DE BÚSQUEDA MANUAL ──────────────────────────────
  const tipoBusquedaDetectada = useMemo(() => {
    const val = terminoBusqueda.trim();
    if (!val) return "doc";
    if (isNaN(Number(val))) return "doc";
    return val.length >= 6 ? "doc" : "id";
  }, [terminoBusqueda]);

  const manejarBusquedaManual = async () => {
    const termino = terminoBusqueda.trim();
    if (!termino || cargandoManual || !turnoActivo) return;

    setCargandoManual(true);
    setUltimoResultado(null);

    const esID = !isNaN(Number(termino)) && termino.length < 6;

    if (esID) {
      await llamarAPIConsumo("id", { Id_Reserva: Number(termino) });
    } else {
      await llamarAPIConsumo("documento", { NumDoc: termino });
    }

    setCargandoManual(false);
    setTerminoBusqueda("");
  };

  // ── GESTIÓN DE INICIO / CIERRE DE TURNO ───────────────────────────────────
  const manejarIniciarTurno = () => {
    setTurnoActivo(true);
    setHoraInicioTurno(new Date().toISOString());
    setHoraFinTurno(null);
    setHistorialTurno([]);
    setContCanceladas(0);
    setContVencidas(0);
    setUltimoResultado(null);
    setTabActiva("qr");
    setScannerListo(true);
    obtenerContadoresExternos();
  };

  const manejarCerrarTurno = async () => {
    setTurnoActivo(false);
    setScannerListo(false);
    const fin = new Date().toISOString();
    setHoraFinTurno(fin);
    await obtenerContadoresExternos();
    setMostrarModalCierre(true);
  };

  // ── EXPORTAR REPORTE A PDF ────────────────────────────────────────────────
  const manejarExportarPDF = async () => {
    if (!refReportePDF.current || exportandoPDF) return;
    setExportandoPDF(true);
    try {
      const canvas = await html2canvas(refReportePDF.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 10;
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;

      let offsetY = margin;
      let restante = imgH;
      while (restante > 0) {
        doc.addImage(imgData, "PNG", margin, offsetY, imgW, imgH);
        restante -= pageH - margin * 2;
        if (restante > 0) {
          doc.addPage();
          offsetY = -(imgH - restante) - margin;
        }
      }
      doc.save(`reporte-turno-foodsys-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("Error al exportar PDF:", err);
    } finally {
      setExportandoPDF(false);
    }
  };

  // ── FILTRADO DEL HISTORIAL EN TIEMPO REAL ─────────────────────────────────
  const historialFiltrado = useMemo(() => {
    return historialTurno.filter((item) => {
      const coincideTexto =
        item.Aprendiz?.toLowerCase().includes(filtroHistorial.toLowerCase()) ||
        item.NumDoc?.toString().includes(filtroHistorial) ||
        item.Plato?.toLowerCase().includes(filtroHistorial.toLowerCase());

      const coincideTipo =
        tipoFiltroHistorial === "Todos" || item.Tipo === tipoFiltroHistorial;

      return coincideTexto && coincideTipo;
    });
  }, [historialTurno, filtroHistorial, tipoFiltroHistorial]);

  // Métricas calculadas del turno
  const metricas = {
    total: historialTurno.length,
    especiales: historialTurno.filter((r) => r.FlujoEspecial).length,
    canceladas: contCanceladas,
    vencidas: contVencidas,
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDERIZADO PRINCIPAL
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-12">
      {/* Estilos CSS para el visor de cámara y rayo láser HUD */}
      <style>{`
        /* Ocultar el recuadro blanco/sombreado nativo que inyecta la librería html5-qrcode */
        #visor-qr-moderno #qr-shaded-region {
          display: none !important;
        }
        #visor-qr-moderno video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 1.5rem !important;
        }
        @keyframes scanLaser {
          0% { top: 6%; opacity: 0.85; }
          50% { top: 90%; opacity: 1; }
          100% { top: 6%; opacity: 0.85; }
        }
        .animate-laser {
          animation: scanLaser 2.2s ease-in-out infinite;
        }
      `}</style>

      {/* ── CABECERA PRINCIPAL ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-3">
            {/* Título e identidad */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center shadow-xs">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                    Registro de Consumo
                  </h1>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-green-100 text-green-800">
                    SUPERVISOR
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Centro Agropecuario La Granja
                </p>
              </div>
            </div>

            {/* Acciones del header: SOLO cuando el turno está ACTIVO se muestra Cerrar Turno */}
            {turnoActivo && (
              <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-2 bg-green-50 border border-green-300 text-green-800 px-3 py-1.5 rounded-full text-xs font-bold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600" />
                  </span>
                  <span>Turno en progreso</span>
                </div>

                <button
                  onClick={manejarCerrarTurno}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Cerrar Turno</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── CONTENIDO PRINCIPAL ────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 sm:mt-6">
        {/* Banner de Horarios de Comida */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          {HORARIOS_SERVICIO.map((item) => {
            const esActivo = turnoComidaActual?.tipo === item.tipo;
            const ItemIcon = item.icon;
            return (
              <div
                key={item.tipo}
                className={`rounded-2xl p-3.5 border transition-all duration-200 flex items-center justify-between ${
                  esActivo
                    ? `${item.bg} ${item.border} shadow-xs ring-2 ring-green-600/30`
                    : "bg-white border-gray-200 opacity-75 hover:opacity-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white shadow-2xs ${item.color}`}>
                    <ItemIcon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-gray-900 text-sm">{item.tipo}</p>
                      {esActivo && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-green-600 text-white px-1.5 py-0.2 rounded-md">
                          En horario
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">{item.horario}</p>
                  </div>
                </div>
                {esActivo && <Check className="w-4 h-4 text-green-700 font-black" />}
              </div>
            );
          })}
        </div>

        {/* ── ESTADO INACTIVO (Antes de iniciar turno) ─────────────────────── */}
        {!turnoActivo && historialTurno.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-8 sm:p-14 text-center max-w-2xl mx-auto my-8">
            <div className="w-18 h-18 sm:w-20 sm:h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-green-700 shadow-2xs">
              <QrCode className="w-9 h-9 sm:w-10 sm:h-10" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Módulo de Registro Listo
            </h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto mt-2 leading-relaxed">
              Presiona el botón de abajo para activar la cámara del escáner QR, habilitar la búsqueda por documento y registrar los consumos de los aprendices.
            </p>

            <div className="mt-8 flex justify-center">
              <button
                onClick={manejarIniciarTurno}
                className="flex items-center gap-2.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white px-8 py-3.5 rounded-2xl font-bold text-base transition-all shadow-md shadow-green-600/20 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>Iniciar Turno</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mt-10 pt-8 border-t border-gray-100 text-xs text-gray-500">
              <div className="flex flex-col items-center gap-1.5">
                <Camera className="w-5 h-5 text-green-600" />
                <span className="font-semibold">Cámara QR</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Hash className="w-5 h-5 text-green-700" />
                <span className="font-semibold">Por Documento</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <FileText className="w-5 h-5 text-gray-600" />
                <span className="font-semibold">Reporte PDF</span>
              </div>
            </div>
          </div>
        ) : (
          /* ── LAYOUT ACTIVO DEL TURNO ─────────────────────────────────────── */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            {/* ── COLUMNA IZQUIERDA: Escáner & Búsqueda (7 cols en desktop) ── */}
            <div className="lg:col-span-7 space-y-5">
              {/* Tarjeta de pestañas y modos */}
              <div className="bg-white rounded-3xl shadow-xs border border-gray-200 overflow-hidden">
                {/* Switcher de Pestañas */}
                <div className="flex border-b border-gray-100 bg-gray-50 p-1.5 gap-1.5">
                  <button
                    onClick={() => {
                      setTabActiva("qr");
                      setTerminoBusqueda("");
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      tabActiva === "qr"
                        ? "bg-white text-green-700 shadow-2xs border border-gray-200"
                        : "text-gray-500 hover:text-gray-800 hover:bg-white/50"
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Escáner de Cámara QR</span>
                  </button>

                  <button
                    onClick={() => {
                      setTabActiva("manual");
                      setTerminoBusqueda("");
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      tabActiva === "manual"
                        ? "bg-white text-green-700 shadow-2xs border border-gray-200"
                        : "text-gray-500 hover:text-gray-800 hover:bg-white/50"
                    }`}
                  >
                    <Search className="w-4 h-4" />
                    <span>Búsqueda Manual / Doc</span>
                  </button>
                </div>

                <div className="p-4 sm:p-6">
                  {/* ── TAB: ESCÁNER DE CÁMARA QR ─────────────────────────── */}
                  {tabActiva === "qr" && (
                    <div className="space-y-4">
                      {turnoActivo ? (
                        <>
                          {/* Visor de Cámara con HUD de Escaneo */}
                          <div className="relative rounded-3xl overflow-hidden bg-black border-4 border-gray-900 shadow-sm" style={{ minHeight: "330px", maxHeight: "430px" }}>
                            {/* Div donde Html5Qrcode inyecta el stream de video */}
                            <div id="visor-qr-moderno" className="w-full h-full min-h-[330px]" />

                            {/* HUD Frame ÚNICO & Retícula de Escaneo alineada */}
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                              <div className="relative w-64 h-64 border-2 border-green-500/60 rounded-3xl">
                                {/* Esquinas decorativas verdes */}
                                <span className="absolute -top-2 -left-2 w-7 h-7 border-t-4 border-l-4 border-green-500 rounded-tl-2xl" />
                                <span className="absolute -top-2 -right-2 w-7 h-7 border-t-4 border-r-4 border-green-500 rounded-tr-2xl" />
                                <span className="absolute -bottom-2 -left-2 w-7 h-7 border-b-4 border-l-4 border-green-500 rounded-bl-2xl" />
                                <span className="absolute -bottom-2 -right-2 w-7 h-7 border-b-4 border-r-4 border-green-500 rounded-br-2xl" />

                                {/* Rayo láser animado */}
                                <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-md shadow-green-400 animate-laser" />
                              </div>
                            </div>

                            {/* Overlay de Procesamiento */}
                            {(qrDetectado || procesando) && (
                              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/75">
                                {procesando ? (
                                  <>
                                    <div className="w-16 h-16 rounded-2xl bg-green-500/20 border-2 border-green-400 flex items-center justify-center mb-3">
                                      <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
                                    </div>
                                    <p className="text-white font-extrabold text-base tracking-wide">
                                      Validando Reserva...
                                    </p>
                                    <p className="text-green-300 text-xs mt-1">
                                      Consultando autorización en el servidor
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-16 h-16 rounded-2xl bg-green-500/30 border-2 border-green-400 flex items-center justify-center mb-3 animate-pulse">
                                      <ScanLine className="w-8 h-8 text-green-300" />
                                    </div>
                                    <p className="text-green-300 font-extrabold text-base">
                                      QR Detectado
                                    </p>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
                            <span>Alinea el código QR dentro del recuadro central</span>
                            <span className="font-semibold text-green-700">Auto-detección activa</span>
                          </div>
                        </>
                      ) : (
                        <div className="py-14 text-center space-y-3">
                          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
                            <Camera className="w-7 h-7" />
                          </div>
                          <p className="text-gray-600 font-bold text-sm">Escáner inactivo</p>
                          <p className="text-gray-400 text-xs max-w-xs mx-auto">
                            Inicia el turno para encender la cámara y habilitar la lectura continua
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── TAB: BÚSQUEDA MANUAL UNIFICADA ─────────────────────── */}
                  {tabActiva === "manual" && (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-xs text-green-900 leading-relaxed flex items-start gap-3">
                        <Sparkles className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Búsqueda Inteligente:</strong> Escribe el número de documento del aprendiz (&ge; 6 dígitos) o el ID de reserva. El sistema detecta el tipo automáticamente.
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Ej: 1023456789 (Documento) o 452 (ID)"
                            value={terminoBusqueda}
                            onChange={(e) => setTerminoBusqueda(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && manejarBusquedaManual()}
                            disabled={!turnoActivo || cargandoManual}
                            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400 transition-all"
                          />
                          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          {terminoBusqueda && (
                            <button
                              onClick={() => setTerminoBusqueda("")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <button
                          onClick={manejarBusquedaManual}
                          disabled={!turnoActivo || cargandoManual || !terminoBusqueda.trim()}
                          className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm transition-all flex items-center gap-2 shrink-0 shadow-xs cursor-pointer"
                        >
                          {cargandoManual ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ArrowRight className="w-4 h-4" />
                          )}
                          <span className="hidden sm:inline">Validar</span>
                        </button>
                      </div>

                      {terminoBusqueda.trim() && (
                        <p className="text-xs text-gray-500 text-center font-medium">
                          Modo detectado:{" "}
                          <span className="font-bold text-green-700 uppercase">
                            {tipoBusquedaDetectada === "doc" ? "Documento de Identidad" : "ID de Reserva"}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── TARJETA DEL ÚLTIMO RESULTADO (Éxito o Error) ───────────── */}
              {ultimoResultado && (
                <TarjetaResultado resultado={ultimoResultado} />
              )}
            </div>

            {/* ── COLUMNA DERECHA: Métricas & Historial (5 cols en desktop) ── */}
            <div className="lg:col-span-5 space-y-5">
              {/* Tarjetas de Métricas de Turno (Reestructuradas compactas) */}
              <div className="grid grid-cols-2 gap-2.5">
                <TarjetaMetrica
                  label="Consumidas"
                  valor={metricas.total}
                  icon={CheckCircle2}
                  colorTheme="green"
                />
                <TarjetaMetrica
                  label="Especiales"
                  valor={metricas.especiales}
                  icon={Shield}
                  colorTheme="purple"
                />
                <TarjetaMetrica
                  label="Canceladas"
                  valor={metricas.canceladas}
                  icon={XCircle}
                  colorTheme="rose"
                  onRefresh={obtenerContadoresExternos}
                  loading={cargandoMetricas}
                />
                <TarjetaMetrica
                  label="Vencidas"
                  valor={metricas.vencidas}
                  icon={Clock}
                  colorTheme="slate"
                  onRefresh={obtenerContadoresExternos}
                  loading={cargandoMetricas}
                />
              </div>

              {/* Historial en Vivo del Turno */}
              <div className="bg-white rounded-3xl shadow-xs border border-gray-200 overflow-hidden flex flex-col">
                {/* Cabecera del Historial */}
                <div className="p-4 border-b border-gray-100 space-y-3 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-green-600" />
                      <h3 className="font-bold text-gray-900 text-sm">Historial del Turno</h3>
                    </div>
                    <span className="text-xs font-bold bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full">
                      {historialTurno.length} {historialTurno.length === 1 ? "consumo" : "consumos"}
                    </span>
                  </div>

                  {/* Filtro y Búsqueda en el Historial */}
                  {historialTurno.length > 0 && (
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Buscar por aprendiz, doc o plato..."
                          value={filtroHistorial}
                          onChange={(e) => setFiltroHistorial(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>

                      <div className="flex gap-1.5 overflow-x-auto text-[11px] pb-1">
                        {["Todos", "Desayuno", "Almuerzo", "Cena"].map((tipo) => (
                          <button
                            key={tipo}
                            onClick={() => setTipoFiltroHistorial(tipo)}
                            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${
                              tipoFiltroHistorial === tipo
                                ? "bg-green-600 text-white"
                                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {tipo}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Lista de Registros */}
                <div className="divide-y divide-gray-100 overflow-y-auto max-h-[380px]">
                  {historialTurno.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-xs">
                      <p>Sin registros en este turno aún</p>
                      <p className="text-[11px] text-gray-400 mt-1">Los aprendices escaneados aparecerán aquí</p>
                    </div>
                  ) : historialFiltrado.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-xs">
                      No se encontraron resultados con el filtro actual
                    </div>
                  ) : (
                    historialFiltrado.map((item, idx) => {
                      const cfgTipo = ESTILOS_TIPO[item.Tipo] || ESTILOS_TIPO.Almuerzo;
                      return (
                        <div key={idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-green-50/40 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-green-100 text-green-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                              {item.Aprendiz?.charAt(0)?.toUpperCase() || "A"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 text-xs truncate leading-tight">
                                {item.Aprendiz}
                              </p>
                              <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                Doc: {item.NumDoc} &middot; {item.Plato}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${cfgTipo.badge}`}>
                              {item.Tipo}
                            </span>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                              {new Date(item.Timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL DE CIERRE DE TURNO Y REPORTE ─────────────────────────────── */}
      {mostrarModalCierre && (
        <ModalCierreTurno
          datos={{
            horaInicio: horaInicioTurno,
            horaFin: horaFinTurno,
            historial: historialTurno,
            metricas,
          }}
          onCerrar={() => setMostrarModalCierre(false)}
          onExportarPDF={manejarExportarPDF}
          refReporte={refReportePDF}
          exportandoPDF={exportandoPDF}
        />
      )}
    </div>
  );
};

export default Registro;