// Pantalla principal del supervisor para el control de consumo de reservas.
//
// CAMBIOS RESPECTO A LA VERSION ANTERIOR:
//   - Overlay animado sobre la camara al detectar un QR ("Detectado" → "Procesando...")
//   - Estado QRDetectado para feedback visual inmediato antes de llamar al API
//   - TarjetaResultado con categorias visuales ampliadas (fecha invalida, ya consumido, vencido, etc.)
//   - Scanner optimizado: fps:30, experimentalFeatures activo, deduplicacion inteligente de 1s
//   - Los mensajes de exito/error persisten hasta el siguiente escaneo o busqueda manual
//   - Tabs de busqueda manual (documento, ID) completamente funcionales
//   - Soporte pistola de codigos USB/Bluetooth (keyboard wedge)
//   - Encriptacion base64url en backend: QR ~33% mas pequeno, lectura mas rapida
//
// FLUJOS DE CONSUMO (definidos en ReservasServices.js):
//   EXTERNO NORMAL   -> Generado -> Verificado (cocina) -> Consumido (supervisor)
//   EXTERNO ESPECIAL -> Generado -> Consumido (supervisor directo)
//   INTERNO          -> Generado -> Consumido (supervisor directo)
//
// ENDPOINTS API REQUERIDOS:
//   POST /api/Reservas/consumir/supervisor  -> { encriptadoQR }
//   POST /api/Reservas/consumir/documento   -> { NumDoc }
//   POST /api/Reservas/consumir/id          -> { Id_Reserva }
//   GET  /api/Reservas/canceladas/count?fecha=YYYY-MM-DD
//   GET  /api/Reservas/vencidas/count?fecha=YYYY-MM-DD
//
// DEPENDENCIAS NPM:
//   npm install html5-qrcode react-google-charts jspdf html2canvas

import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Chart } from "react-google-charts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  QrCode, Search, Play, Square, ClipboardList,
  CheckCircle2, XCircle, Clock, AlertCircle,
  User, Utensils, Camera, Hash, FileText,
  Download, X, RefreshCw, TrendingUp, BarChart3,
  PieChart, Shield, ChevronRight, Loader2,
  ScanLine, CalendarX, Ban, AlertTriangle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES DE CONFIGURACION
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// fps:30 detecta el QR practicamente en el momento en que entra al encuadre.
// qrbox cuadrado de 260px funciona bien tanto para QRs en pantalla como impresos.
// useBarCodeDetectorIfSupported usa la API nativa del navegador (mucho mas rapida que ZXing JS puro).
const CONFIG_QR = {
  fps: 30,
  qrbox: { width: 260, height: 260 },
  aspectRatio: 1.0,
  disableFlip: false,
  experimentalFeatures: { useBarCodeDetectorIfSupported: true },
};

// Estilos semanticos por estado de reserva.
const ESTILOS_ESTADO = {
  Generado: "bg-blue-100   text-blue-700   border border-blue-200",
  Verificado: "bg-amber-100  text-amber-700  border border-amber-200",
  Consumido: "bg-green-100  text-green-700  border border-green-200",
  Cancelado: "bg-red-100    text-red-700    border border-red-200",
  Vencido: "bg-slate-100  text-slate-600  border border-slate-200",
};

const ESTILOS_TIPO = {
  Desayuno: "bg-orange-100 text-orange-700 border border-orange-200",
  Almuerzo: "bg-teal-100   text-teal-700   border border-teal-200",
  Cena: "bg-indigo-100 text-indigo-700 border border-indigo-200",
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILIDAD: ClasificarError
// Analiza el mensaje de error del backend y retorna categoria + color + icono.
// ─────────────────────────────────────────────────────────────────────────────
const ClasificarError = (mensaje) => {
  if (!mensaje) return { tipo: "generico", color: "red" };

  const m = mensaje.toLowerCase();

  if (m.includes("código qr es para el") || m.includes("codigo qr es para el") || m.includes("fecha")) {
    return { tipo: "fecha_invalida", color: "amber" };
  }
  if (m.includes("vencido")) {
    return { tipo: "qr_vencido", color: "slate" };
  }
  if (m.includes("consumido") || m.includes("ya fue consumida")) {
    return { tipo: "ya_consumido", color: "blue" };
  }
  if (m.includes("cancelado") || m.includes("cancelada")) {
    return { tipo: "cancelado", color: "orange" };
  }
  if (m.includes("cocina") || m.includes("verificada")) {
    return { tipo: "falta_cocina", color: "amber" };
  }
  if (m.includes("horario") || m.includes("habilitado")) {
    return { tipo: "fuera_horario", color: "amber" };
  }
  if (m.includes("sancionado")) {
    return { tipo: "sancionado", color: "red" };
  }

  return { tipo: "generico", color: "red" };
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: TarjetaMetrica
// ─────────────────────────────────────────────────────────────────────────────
const TarjetaMetrica = ({
  Label, Valor, Icono: Comp,
  ColorFondo, ColorTexto, ColorIcono,
}) => (
  <div className={`rounded-2xl p-4 sm:p-5 ${ColorFondo} flex items-center gap-3 sm:gap-4`}>
    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-white/70 shrink-0">
      <Comp className={`w-5 h-5 sm:w-6 sm:h-6 ${ColorIcono}`} />
    </div>
    <div>
      <p className={`text-3xl sm:text-4xl font-extrabold ${ColorTexto} leading-none`}>
        {Valor}
      </p>
      <p className={`text-xs sm:text-sm font-medium ${ColorTexto} opacity-75 mt-1`}>
        {Label}
      </p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: TarjetaResultado
// ─────────────────────────────────────────────────────────────────────────────
const TarjetaResultado = ({ Resultado }) => {
  if (!Resultado) return null;

  if (Resultado.Error) {
    const { tipo } = ClasificarError(Resultado.Error);

    const ConfigError = {
      fecha_invalida: {
        Icono: CalendarX,
        Titulo: "Reserva de otra fecha",
        BgCard: "bg-amber-50 border-amber-200",
        BgIcono: "bg-amber-100",
        ColorIcono: "text-amber-600",
        ColorTitulo: "text-amber-800",
        ColorMensaje: "text-amber-700",
      },
      qr_vencido: {
        Icono: Clock,
        Titulo: "QR vencido",
        BgCard: "bg-slate-50 border-slate-200",
        BgIcono: "bg-slate-100",
        ColorIcono: "text-slate-500",
        ColorTitulo: "text-slate-700",
        ColorMensaje: "text-slate-600",
      },
      ya_consumido: {
        Icono: CheckCircle2,
        Titulo: "Ya fue consumida",
        BgCard: "bg-blue-50 border-blue-200",
        BgIcono: "bg-blue-100",
        ColorIcono: "text-blue-500",
        ColorTitulo: "text-blue-700",
        ColorMensaje: "text-blue-600",
      },
      cancelado: {
        Icono: Ban,
        Titulo: "Reserva cancelada",
        BgCard: "bg-orange-50 border-orange-200",
        BgIcono: "bg-orange-100",
        ColorIcono: "text-orange-500",
        ColorTitulo: "text-orange-700",
        ColorMensaje: "text-orange-600",
      },
      falta_cocina: {
        Icono: AlertTriangle,
        Titulo: "Verificacion pendiente",
        BgCard: "bg-amber-50 border-amber-200",
        BgIcono: "bg-amber-100",
        ColorIcono: "text-amber-600",
        ColorTitulo: "text-amber-800",
        ColorMensaje: "text-amber-700",
      },
      fuera_horario: {
        Icono: Clock,
        Titulo: "Fuera del horario de servicio",
        BgCard: "bg-amber-50 border-amber-200",
        BgIcono: "bg-amber-100",
        ColorIcono: "text-amber-600",
        ColorTitulo: "text-amber-800",
        ColorMensaje: "text-amber-700",
      },
      sancionado: {
        Icono: Shield,
        Titulo: "Aprendiz sancionado",
        BgCard: "bg-red-50 border-red-200",
        BgIcono: "bg-red-100",
        ColorIcono: "text-red-500",
        ColorTitulo: "text-red-700",
        ColorMensaje: "text-red-600",
      },
      generico: {
        Icono: XCircle,
        Titulo: "No se pudo procesar",
        BgCard: "bg-red-50 border-red-200",
        BgIcono: "bg-red-100",
        ColorIcono: "text-red-500",
        ColorTitulo: "text-red-700",
        ColorMensaje: "text-red-600",
      },
    };

    const C = ConfigError[tipo] ?? ConfigError.generico;
    const IconoError = C.Icono;

    return (
      <div className={`border rounded-2xl p-4 sm:p-5 flex items-start gap-3 ${C.BgCard}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${C.BgIcono}`}>
          <IconoError className={`w-5 h-5 ${C.ColorIcono}`} />
        </div>
        <div>
          <p className={`font-bold text-sm sm:text-base ${C.ColorTitulo}`}>
            {C.Titulo}
          </p>
          <p className={`text-sm mt-1 leading-relaxed ${C.ColorMensaje}`}>
            {Resultado.Error}
          </p>
        </div>
      </div>
    );
  }

  // Bloque de exito: se muestra cuando el consumo fue registrado correctamente
  // Incluye nombre del aprendiz, documento, imagen del plato, nombre y descripcion del plato
  //
  // La URL de uploads apunta a la raiz del servidor (sin /api).
  // Se elimina el sufijo /api de API_URL si lo tiene para que la ruta quede bien formada.
  // Ejemplo: http://localhost:8000/api -> http://localhost:8000/uploads/foto.jpg
  const BaseServidor = API_URL.replace(/\/api$/, "");
  const UrlImagen = Resultado.ImgPlato
    ? `${BaseServidor}/uploads/${Resultado.ImgPlato}`
    : null;

  return (
    <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        </div>
        <p className="font-bold text-green-700 text-base sm:text-lg">
          Consumo registrado
        </p>
        {Resultado.flujoEspecial && (
          <span className="ml-auto text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full">
            ESPECIAL
          </span>
        )}
        {Resultado.flujoInterno && !Resultado.flujoEspecial && (
          <span className="ml-auto text-xs font-bold bg-teal-100 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full">
            INTERNO
          </span>
        )}
        {!Resultado.flujoEspecial && !Resultado.flujoInterno && (
          <span className="ml-auto text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full">
            EXTERNO
          </span>
        )}
      </div>

      {/* Imagen del plato si esta disponible */}
      {UrlImagen && (
        <div className="flex justify-center mb-4">
          <img
            src={UrlImagen}
            alt={Resultado.Plato}
            className="w-24 h-24 object-cover rounded-xl border border-green-100 shadow-sm"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoFila Icono={User} Label="Aprendiz" Valor={Resultado.Aprendiz} />
        <InfoFila Icono={Hash} Label="Documento" Valor={Resultado.NumDoc} />
        <InfoFila Icono={Utensils} Label="Plato" Valor={Resultado.Plato} />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/80 flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400 leading-none">Tipo</p>
            <span className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${ESTILOS_TIPO[Resultado.Tipo] || "bg-gray-100 text-gray-600"}`}>
              {Resultado.Tipo}
            </span>
          </div>
        </div>
      </div>

      {/* Descripcion del plato: informacion adicional para el personal de cocina */}
      {Resultado.DescPlato && (
        <p className="mt-3 text-xs text-green-700 leading-relaxed border-t border-green-200 pt-3">
          {Resultado.DescPlato}
        </p>
      )}
    </div>
  );
};

const InfoFila = ({ Icono: Comp, Label, Valor }) => (
  <div className="flex items-center gap-2">
    <div className="w-7 h-7 rounded-lg bg-white/80 flex items-center justify-center shrink-0">
      <Comp className="w-3.5 h-3.5 text-gray-400" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-400 leading-none">{Label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">{Valor}</p>
    </div>
  </div>
);

const FilaHistorial = ({ Item }) => (
  <div className="px-4 sm:px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
    <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
      <CheckCircle2 className="w-4 h-4 text-teal-600" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-gray-800 text-sm truncate">{Item.Aprendiz}</p>
      <p className="text-xs text-gray-400 truncate">{Item.Plato}</p>
    </div>
    <div className="shrink-0 text-right">
      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${ESTILOS_TIPO[Item.Tipo] || "bg-gray-100 text-gray-600"}`}>
        {Item.Tipo}
      </span>
      <p className="text-xs text-gray-400 mt-0.5">
        {new Date(Item.Timestamp).toLocaleTimeString("es-CO", {
          hour: "2-digit", minute: "2-digit",
        })}
      </p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: OverlayCamara
// ─────────────────────────────────────────────────────────────────────────────
const OverlayCamara = ({ QRDetectado, Procesando }) => {
  if (!QRDetectado && !Procesando) return null;

  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl"
      style={{ background: "rgba(0,0,0,0.60)", backdropFilter: "blur(2px)" }}
    >
      {Procesando ? (
        <>
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-white font-bold text-sm tracking-wide">
            Procesando reserva...
          </p>
          <p className="text-white/60 text-xs">
            Consultando al servidor
          </p>
        </>
      ) : (
        <>
          <div className="w-14 h-14 rounded-2xl bg-teal-500/30 border-2 border-teal-400 flex items-center justify-center">
            <ScanLine className="w-8 h-8 text-teal-300" />
          </div>
          <p className="text-teal-300 font-bold text-sm tracking-wide">
            QR detectado
          </p>
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: ModalCierreTurno
// ─────────────────────────────────────────────────────────────────────────────
const ModalCierreTurno = ({
  Datos, OnCerrar, OnExportarPDF, RefReporte, ExportandoPDF,
}) => {
  const { HoraInicio, HoraFin, Historial, Metricas } = Datos;

  const FormatearHora = (Iso) =>
    new Date(Iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

  const FormatearFecha = (Iso) =>
    new Date(Iso).toLocaleDateString("es-CO", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

  const DatosColumnas = [
    ["Categoria", "Cantidad", { role: "style" }, { role: "annotation" }],
    ["Consumidas", Metricas.Total, "color: #0d9488", String(Metricas.Total)],
    ["Especiales", Metricas.Especiales, "color: #7c3aed", String(Metricas.Especiales)],
    ["Canceladas", Metricas.Canceladas, "color: #ef4444", String(Metricas.Canceladas)],
    ["Vencidas", Metricas.Vencidas, "color: #64748b", String(Metricas.Vencidas)],
  ];

  const ContarPorTipo = (Tipo) => Historial.filter((R) => R.Tipo === Tipo).length;

  const DatosPastel = [
    ["Tipo", "Cantidad"],
    ["Desayuno", ContarPorTipo("Desayuno")],
    ["Almuerzo", ContarPorTipo("Almuerzo")],
    ["Cena", ContarPorTipo("Cena")],
  ].filter((F, I) => I === 0 || F[1] > 0);

  if (DatosPastel.length === 1) DatosPastel.push(["Sin datos", 1]);

  const ConsumoPorHora = Historial.reduce((Acc, Item) => {
    const Hora = new Date(Item.Timestamp).getHours();
    const Key = `${Hora.toString().padStart(2, "0")}:00`;
    Acc[Key] = (Acc[Key] || 0) + 1;
    return Acc;
  }, {});

  const DatosLinea = [
    ["Hora", "Consumos"],
    ...Object.entries(ConsumoPorHora)
      .sort(([A], [B]) => A.localeCompare(B))
      .map(([H, C]) => [H, C]),
  ];

  if (DatosLinea.length < 3) {
    DatosLinea.push(["00:00", 0]);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-5xl max-h-[95vh] sm:max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm rounded-t-3xl border-b border-gray-100 px-5 sm:px-8 py-4 sm:py-5 flex items-start sm:items-center justify-between z-10 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center">
                <Square className="w-3.5 h-3.5 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Resumen del Turno
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 ml-9">
              {FormatearFecha(HoraInicio)} &middot; {FormatearHora(HoraInicio)} - {FormatearHora(HoraFin)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={OnExportarPDF}
              disabled={ExportandoPDF}
              className="flex items-center gap-1.5 sm:gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-sm"
            >
              {ExportandoPDF
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                : <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              }
              <span className="hidden xs:inline sm:inline">
                {ExportandoPDF ? "Generando..." : "Exportar PDF"}
              </span>
            </button>
            <button
              onClick={OnCerrar}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors shrink-0"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div ref={RefReporte} className="px-5 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 bg-white">
          <div className="border-b border-gray-100 pb-4 sm:pb-6">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">
              Reporte de turno — Foodsys
            </p>
            <p className="text-gray-600 text-sm">
              Supervisor &middot; {FormatearFecha(HoraInicio)}
            </p>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <TarjetaMetrica Label="Total Consumidas" Valor={Metricas.Total} Icono={CheckCircle2} ColorFondo="bg-teal-50" ColorTexto="text-teal-700" ColorIcono="text-teal-600" />
            <TarjetaMetrica Label="Flujo Especial" Valor={Metricas.Especiales} Icono={Shield} ColorFondo="bg-purple-50" ColorTexto="text-purple-700" ColorIcono="text-purple-600" />
            <TarjetaMetrica Label="Canceladas (dia)" Valor={Metricas.Canceladas} Icono={XCircle} ColorFondo="bg-red-50" ColorTexto="text-red-700" ColorIcono="text-red-600" />
            <TarjetaMetrica Label="Vencidas al cierre" Valor={Metricas.Vencidas} Icono={Clock} ColorFondo="bg-slate-50" ColorTexto="text-slate-700" ColorIcono="text-slate-600" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <BarChart3 className="w-4 h-4 text-teal-500" />
                <p className="font-semibold text-gray-700 text-sm">Totales por categoria</p>
              </div>
              <Chart
                chartType="ColumnChart"
                data={DatosColumnas}
                options={{
                  chartArea: { width: "75%", height: "62%" },
                  legend: { position: "none" },
                  hAxis: { textStyle: { fontSize: 11, color: "#64748b" } },
                  vAxis: { minValue: 0, textStyle: { fontSize: 11 } },
                  animation: { startup: true, duration: 600, easing: "out" },
                  bar: { groupWidth: "55%" },
                  annotations: { alwaysOutside: true, textStyle: { fontSize: 12, bold: true } },
                }}
                width="100%"
                height="280px"
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <PieChart className="w-4 h-4 text-amber-500" />
                <p className="font-semibold text-gray-700 text-sm">Distribucion por tipo de comida</p>
              </div>
              <Chart
                chartType="PieChart"
                data={DatosPastel}
                options={{
                  colors: ["#f97316", "#0d9488", "#6366f1"],
                  chartArea: { width: "85%", height: "80%" },
                  legend: { position: "right", textStyle: { fontSize: 12 } },
                  pieHole: 0.42,
                  animation: { startup: true, duration: 600 },
                  pieSliceTextStyle: { fontSize: 13, bold: true },
                }}
                width="100%"
                height="280px"
              />
            </div>
          </div>

          {DatosLinea.length > 2 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <p className="font-semibold text-gray-700 text-sm">Evolucion de consumos por hora</p>
              </div>
              <Chart
                chartType="LineChart"
                data={DatosLinea}
                options={{
                  chartArea: { width: "80%", height: "65%" },
                  colors: ["#0d9488"],
                  legend: { position: "none" },
                  curveType: "function",
                  pointSize: 6,
                  lineWidth: 3,
                  hAxis: { textStyle: { fontSize: 11, color: "#64748b" } },
                  vAxis: { minValue: 0, textStyle: { fontSize: 11 }, format: "0" },
                  animation: { startup: true, duration: 800, easing: "out" },
                }}
                width="100%"
                height="260px"
              />
            </div>
          )}

          {Historial.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <ClipboardList className="w-4 h-4 text-gray-400" />
                <p className="font-semibold text-gray-700 text-sm">Detalle completo del turno</p>
                <span className="ml-auto bg-teal-100 text-teal-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {Historial.length} registros
                </span>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left border-b border-gray-100">
                      <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Hora</th>
                      <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Aprendiz</th>
                      <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden sm:table-cell">Documento</th>
                      <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Plato</th>
                      <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Tipo</th>
                      <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Perfil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {Historial.map((Item, Idx) => (
                      <tr key={Idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-gray-500 text-xs font-medium whitespace-nowrap">
                          {new Date(Item.Timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{Item.Aprendiz}</td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell text-sm">{Item.NumDoc}</td>
                        <td className="px-4 py-3 text-gray-600 hidden lg:table-cell text-xs leading-relaxed max-w-xs truncate">{Item.Plato}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${ESTILOS_TIPO[Item.Tipo] || "bg-gray-100 text-gray-600"}`}>
                            {Item.Tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {Item.FlujoEspecial && <span className="text-xs font-semibold text-purple-600">Especial</span>}
                          {Item.FlujoInterno && <span className="text-xs font-semibold text-teal-600">Interno</span>}
                          {!Item.FlujoEspecial && !Item.FlujoInterno && <span className="text-xs text-gray-400">Externo</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4 text-xs text-gray-400 flex flex-wrap gap-2 justify-between">
            <span>Inicio: {new Date(HoraInicio).toLocaleString("es-CO")}</span>
            <span>Cierre: {new Date(HoraFin).toLocaleString("es-CO")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL: Registro
// ─────────────────────────────────────────────────────────────────────────────
const Registro = () => {

  // ── ESTADOS ───────────────────────────────────────────────────────────────
  const [TurnoActivo, SetTurnoActivo] = useState(false);
  const [HoraInicioTurno, SetHoraInicioTurno] = useState(null);
  const [HoraFinTurno, SetHoraFinTurno] = useState(null);
  const [HistorialTurno, SetHistorialTurno] = useState([]);
  const [ContCanceladas, SetContCanceladas] = useState(0);
  const [ContVencidas, SetContVencidas] = useState(0);
  const [ScannerListo, SetScannerListo] = useState(false);
  const [QRDetectado, SetQRDetectado] = useState(false);
  const [Procesando, SetProcesando] = useState(false);
  const [TabActiva, SetTabActiva] = useState("qr");
  const [TerminoBusqueda, SetTerminoBusqueda] = useState("");
  const [CargandoManual, SetCargandoManual] = useState(false);
  const [UltimoResultado, SetUltimoResultado] = useState(null);
  const [MostrarModalCierre, SetMostrarModalCierre] = useState(false);
  const [ExportandoPDF, SetExportandoPDF] = useState(false);
  const [HoraActual, SetHoraActual] = useState(
    () => new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
  );

  // ── REFS ──────────────────────────────────────────────────────────────────
  const InstanciaQR = useRef(null);
  const ProcesandoRef = useRef(false);
  const RefReportePDF = useRef(null);
  const UltimoQRTexto = useRef('');  // contenido del ultimo QR procesado
  const UltimoQRTiempo = useRef(0);   // timestamp del ultimo escaneo
  // Refs pistola — declarados aqui para que esten disponibles en el useEffect de pistola
  const BufferPistola = useRef('');
  const TimerPistola = useRef(null);

  // ── EFECTO: reloj en header ───────────────────────────────────────────────
  useEffect(() => {
    const I = setInterval(() => {
      SetHoraActual(
        new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
      );
    }, 30_000);
    return () => clearInterval(I);
  }, []);

  // ── UTILIDAD: obtener token ───────────────────────────────────────────────
  const ObtenerToken = () => localStorage.getItem("token") ?? "";

  // ── ObtenerContadoresExternos ─────────────────────────────────────────────
  const ObtenerContadoresExternos = async () => {
    const FechaHoy = new Date().toISOString().split("T")[0];
    try {
      const R = await fetch(`${API_URL}/api/Reservas/canceladas/count?fecha=${FechaHoy}`, {
        headers: { Authorization: `Bearer ${ObtenerToken()}` },
      });
      if (R.ok) SetContCanceladas((await R.json()).total ?? 0);
    } catch { }
    try {
      const R = await fetch(`${API_URL}/api/Reservas/vencidas/count?fecha=${FechaHoy}`, {
        headers: { Authorization: `Bearer ${ObtenerToken()}` },
      });
      if (R.ok) SetContVencidas((await R.json()).total ?? 0);
    } catch { }
  };

  // ── LlamarAPIConsumo ──────────────────────────────────────────────────────
  const LlamarAPIConsumo = async (Variante, Body) => {
    try {
      const Resp = await fetch(`${API_URL}/api/Reservas/consumir/${Variante}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ObtenerToken()}`,
        },
        body: JSON.stringify(Body),
      });

      const Datos = await Resp.json();

      if (!Resp.ok) {
        SetUltimoResultado({ Error: Datos.message || "Error al procesar la reserva" });
        return;
      }

      SetUltimoResultado(Datos);
      SetHistorialTurno((Prev) => [
        {
          Aprendiz: Datos.Aprendiz ?? "Sin nombre",
          NumDoc: Datos.NumDoc ?? "--",
          Tipo: Datos.Tipo ?? "Almuerzo",
          Plato: Datos.Plato ?? "Sin informacion",
          // DescPlato e ImgPlato se almacenan para que el PDF del cierre de turno
          // pueda mostrarlos en la tabla de detalle si en el futuro se requiere
          DescPlato: Datos.DescPlato ?? "",
          ImgPlato: Datos.ImgPlato ?? null,
          FlujoEspecial: Boolean(Datos.flujoEspecial),
          FlujoInterno: Boolean(Datos.flujoInterno),
          Id_Reserva: Datos.Id_Reserva,
          Timestamp: new Date().toISOString(),
        },
        ...Prev,
      ]);
    } catch {
      SetUltimoResultado({ Error: "Error de conexion. Verifica que el servidor este disponible." });
    }
  };

  // ── ProcesarTextoQR ───────────────────────────────────────────────────────
  // DEBE declararse ANTES del useEffect de la pistola que lo referencia.
  // Deduplicacion inteligente: mismo QR dentro de 1 segundo = ignorar.
  // Sin delay global de 3 segundos: el scanner queda libre al instante.
  const ProcesarTextoQR = useCallback(async (TextoQR) => {
    const Ahora = Date.now();

    // Si es el mismo QR escaneado hace menos de 1 segundo, ignorar (evita doble registro)
    if (
      TextoQR === UltimoQRTexto.current &&
      Ahora - UltimoQRTiempo.current < 1000
    ) {
      return;
    }

    // Si ya hay una llamada al API en curso, ignorar nuevo escaneo
    if (ProcesandoRef.current) return;

    UltimoQRTexto.current = TextoQR;
    UltimoQRTiempo.current = Ahora;
    ProcesandoRef.current = true;

    SetQRDetectado(true);
    SetProcesando(true);
    SetUltimoResultado(null);

    // Extraer el token encriptado si viene como parametro de URL
    let EncriptadoQR = TextoQR.trim();
    try {
      const Url = new URL(TextoQR);
      const Param = Url.searchParams.get("data");
      if (Param) EncriptadoQR = decodeURIComponent(Param);
    } catch { }

    await LlamarAPIConsumo("supervisor", { encriptadoQR: EncriptadoQR });

    SetProcesando(false);
    SetQRDetectado(false);
    ProcesandoRef.current = false;
    // Sin setTimeout de bloqueo. El siguiente aprendiz puede escanear de inmediato.
  }, []);

  // ── SOPORTE PISTOLA DE CODIGOS (USB / Bluetooth keyboard wedge) ───────────
  // La pistola "escribe" el contenido del QR caracter a caracter y envia Enter.
  // Este efecto captura esa secuencia cuando el foco NO esta en un input manual.
  // IMPORTANTE: debe estar despues de ProcesarTextoQR para evitar ReferenceError.
  useEffect(() => {
    if (!TurnoActivo) return;

    const ManejarTecla = (E) => {
      // Si el foco esta en un input o textarea del formulario, no interferir
      const Tag = E.target?.tagName?.toUpperCase();
      if (Tag === 'INPUT' || Tag === 'TEXTAREA') return;

      if (E.key === 'Enter') {
        const Contenido = BufferPistola.current.trim();
        BufferPistola.current = '';
        clearTimeout(TimerPistola.current);
        // Minimo 10 caracteres para ignorar pulsaciones accidentales de Enter
        if (Contenido.length > 10) {
          ProcesarTextoQR(Contenido);
        }
        return;
      }

      if (E.key.length === 1) {
        BufferPistola.current += E.key;
        // Resetear buffer si pasan mas de 500 ms sin nueva tecla (tecleo humano normal)
        clearTimeout(TimerPistola.current);
        TimerPistola.current = setTimeout(() => {
          BufferPistola.current = '';
        }, 500);
      }
    };

    window.addEventListener('keydown', ManejarTecla);
    return () => {
      window.removeEventListener('keydown', ManejarTecla);
      clearTimeout(TimerPistola.current);
    };
  }, [TurnoActivo, ProcesarTextoQR]);

  // ── EFECTO: iniciar / detener el scanner QR ───────────────────────────────
  useEffect(() => {
    if (!ScannerListo || TabActiva !== "qr") return;

    const IdDiv = "visor-qr-principal";

    const IniciarScanner = async () => {
      try {
        const Scanner = new Html5Qrcode(IdDiv);
        InstanciaQR.current = Scanner;

        await Scanner.start(
          { facingMode: "environment" },
          CONFIG_QR,
          (TextoQR) => {
            // El callback no puede leer estado React por closure stale.
            // Usamos ref para saber si ya hay un procesamiento en curso.
            if (!ProcesandoRef.current) {
              ProcesarTextoQR(TextoQR);
            }
          },
          () => {
            // Frame sin QR: comportamiento normal.
          }
        );
      } catch (Err) {
        console.error("[Registro] Error al acceder a la camara:", Err.message);
        SetUltimoResultado({
          Error: "No se pudo activar la camara. Verifica que el navegador tenga permiso de acceso.",
        });
        SetScannerListo(false);
      }
    };

    // Delay para asegurar que el div ya esta en el DOM antes de llamar start()
    const Timer = setTimeout(IniciarScanner, 150);

    return () => {
      clearTimeout(Timer);
      if (InstanciaQR.current) {
        InstanciaQR.current
          .stop()
          .then(() => { InstanciaQR.current = null; })
          .catch(() => { InstanciaQR.current = null; });
      }
    };
  }, [ScannerListo, TabActiva, ProcesarTextoQR]);

  // ── EFECTO: detener scanner al cambiar de tab ─────────────────────────────
  useEffect(() => {
    if (TabActiva !== "qr" && InstanciaQR.current) {
      InstanciaQR.current
        .stop()
        .then(() => { InstanciaQR.current = null; })
        .catch(() => { InstanciaQR.current = null; });
    }
  }, [TabActiva]);

  // ── EFECTO: obtener contadores al activar el turno ────────────────────────
  useEffect(() => {
    if (TurnoActivo) ObtenerContadoresExternos();
  }, [TurnoActivo]);

  // ── ManejarBusquedaManual ─────────────────────────────────────────────────
  const ManejarBusquedaManual = async () => {
    const Termino = TerminoBusqueda.trim();
    if (!Termino || CargandoManual) return;

    SetCargandoManual(true);
    SetUltimoResultado(null);

    // Detectar automaticamente si es documento (>= 6 digitos) o ID reserva
    const EsDocumento = !isNaN(Number(Termino)) && Termino.length >= 6;
    const EsID       = !isNaN(Number(Termino)) && Termino.length < 6;

    if (TabActiva === 'manual') {
      if (EsID) {
        await LlamarAPIConsumo('id', { Id_Reserva: Number(Termino) });
      } else if (EsDocumento) {
        await LlamarAPIConsumo('documento', { NumDoc: Termino });
      } else {
        // Texto no numerico: buscar por documento de todas formas
        await LlamarAPIConsumo('documento', { NumDoc: Termino });
      }
    } else if (TabActiva === 'doc') {
      await LlamarAPIConsumo('documento', { NumDoc: Termino });
    } else if (TabActiva === 'id') {
      await LlamarAPIConsumo('id', { Id_Reserva: Number(Termino) });
    }

    SetCargandoManual(false);
    SetTerminoBusqueda('');
  };

  // ── Handlers de turno ─────────────────────────────────────────────────────
  const ManejarIniciarTurno = () => {
    SetTurnoActivo(true);
    SetHoraInicioTurno(new Date().toISOString());
    SetHoraFinTurno(null);
    SetHistorialTurno([]);
    SetContCanceladas(0);
    SetContVencidas(0);
    SetUltimoResultado(null);
    SetTabActiva("qr");
    SetScannerListo(true);
  };

  const ManejarCerrarTurno = async () => {
    SetTurnoActivo(false);
    SetScannerListo(false);
    SetHoraFinTurno(new Date().toISOString());
    await ObtenerContadoresExternos();
    SetMostrarModalCierre(true);
  };

  // ── ManejarExportarPDF ────────────────────────────────────────────────────
  const ManejarExportarPDF = async () => {
    if (!RefReportePDF.current || ExportandoPDF) return;
    SetExportandoPDF(true);
    try {
      const Canvas = await html2canvas(RefReportePDF.current, {
        scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false,
      });
      const ImgData = Canvas.toDataURL("image/png");
      const Doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const PageW = Doc.internal.pageSize.getWidth();
      const PageH = Doc.internal.pageSize.getHeight();
      const Margin = 10;
      const ImgW = PageW - Margin * 2;
      const ImgH = (Canvas.height * ImgW) / Canvas.width;

      let OffsetY = Margin;
      let Restante = ImgH;
      while (Restante > 0) {
        Doc.addImage(ImgData, "PNG", Margin, OffsetY, ImgW, ImgH);
        Restante -= PageH - Margin * 2;
        if (Restante > 0) {
          Doc.addPage();
          OffsetY = -(ImgH - Restante) - Margin;
        }
      }
      Doc.save(`reporte-turno-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (Err) {
      console.error("[Registro] Error al generar PDF:", Err.message);
    } finally {
      SetExportandoPDF(false);
    }
  };

  // ── Metricas del turno ────────────────────────────────────────────────────
  const Metricas = {
    Total: HistorialTurno.length,
    Especiales: HistorialTurno.filter((R) => R.FlujoEspecial).length,
    Canceladas: ContCanceladas,
    Vencidas: ContVencidas,
  };

  // Las tabs ya no incluyen busqueda separada por doc/id.
  // Se mantiene solo la tab de camara. La busqueda manual usa una barra unificada.
  const Tabs = [
    { Id: "qr", Label: "Camara QR", Icono: Camera },
    { Id: "manual", Label: "Busqueda Manual", Icono: Search },
  ];

  // Determina si la busqueda es por documento o por ID segun la longitud.
  // >= 6 digitos numericos = documento de cedula | < 6 = ID de reserva
  const DetectarTipoBusqueda = (valor) => {
    const v = valor.trim();
    if (!v || isNaN(Number(v))) return 'doc'; // texto = documento
    return v.length >= 6 ? 'doc' : 'id';
  };

  // Horarios de consumo y cierre de turnos (informacion para el Supervisor)
  const HORARIOS_INFO = [
    { turno: 'Desayuno', consumo: '06:00 – 07:00', cierre: '07:00', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    { turno: 'Almuerzo', consumo: '11:30 – 13:30', cierre: '13:30', color: 'text-teal-600',   bg: 'bg-teal-50',   border: 'border-teal-200'   },
    { turno: 'Cena',     consumo: '18:00 – 19:00', cierre: '19:00', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* Barra superior */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-sm">
                <QrCode className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-extrabold text-gray-900 leading-tight tracking-tight">
                  Registro de Consumo
                </h1>
                <p className="text-xs text-gray-400 leading-none mt-0.5">
                  Supervisor &middot; {HoraActual}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {TurnoActivo && (
                <div className="hidden sm:flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                  Turno activo
                </div>
              )}
              {!TurnoActivo ? (
                <button
                  onClick={ManejarIniciarTurno}
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white px-4 sm:px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm"
                >
                  <Play className="w-4 h-4" />
                  <span>Iniciar Turno</span>
                </button>
              ) : (
                <button
                  onClick={ManejarCerrarTurno}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 active:scale-95 text-white px-4 sm:px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm"
                >
                  <Square className="w-4 h-4" />
                  <span>Cerrar Turno</span>
                </button>
              )}
            </div>
          </div>

          {TurnoActivo && (
            <div className="sm:hidden pb-2 flex items-center gap-2 text-xs text-teal-700">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span className="font-semibold">
                Turno activo desde{" "}
                {new Date(HoraInicioTurno).toLocaleTimeString("es-CO", {
                  hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Pantalla de espera */}
      {!TurnoActivo && HistorialTurno.length === 0 && (
        <div className="flex flex-col items-center justify-center px-4 py-20 sm:py-32 text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-teal-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
            <QrCode className="w-10 h-10 sm:w-12 sm:h-12 text-teal-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-3">
            Listo para iniciar
          </h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-sm leading-relaxed">
            Presiona{" "}
            <span className="text-teal-600 font-bold">Iniciar Turno</span> para
            activar el scanner y comenzar a registrar el consumo de los aprendices.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 sm:gap-6 text-center text-xs text-gray-400 max-w-xs">
            {[
              { Icono: Camera, Label: "Escaneo QR" },
              { Icono: Hash, Label: "Por documento" },
              { Icono: BarChart3, Label: "Reporte PDF" },
            ].map(({ Icono: Ico, Label }) => (
              <div key={Label} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Ico className="w-5 h-5 text-gray-400" />
                </div>
                <span>{Label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contenido del turno */}
      {(TurnoActivo || HistorialTurno.length > 0) && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6">

            {/* Columna principal */}
            <div className="xl:col-span-2 space-y-5">

              {/* Panel de tabs */}
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-100">
                  {Tabs.map(({ Id, Label, Icono: Ico }) => (
                    <button
                      key={Id}
                      onClick={() => {
                        SetTabActiva(Id);
                        SetTerminoBusqueda("");
                        SetUltimoResultado(null);
                        if (Id === "qr" && TurnoActivo) {
                          SetScannerListo(false);
                          setTimeout(() => SetScannerListo(true), 100);
                        }
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold transition-colors border-b-2 ${TabActiva === Id
                          ? "border-teal-600 text-teal-700 bg-teal-50/60"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      <Ico className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>{Label}</span>
                    </button>
                  ))}
                </div>

                <div className="p-4 sm:p-6">

                                  {/* Tab: Camara QR */}
                  {TabActiva === "qr" && (
                    <div className="space-y-4">
                      {TurnoActivo ? (
                        <>
                          <div className="relative rounded-2xl overflow-hidden bg-black" style={{ minHeight: "300px", maxHeight: "420px" }}>
                            <div id="visor-qr-principal" className="w-full h-full" />
                            <OverlayCamara QRDetectado={QRDetectado} Procesando={Procesando} />
                          </div>
                          <p className="text-center text-xs text-gray-400">
                            La camara detecta y procesa el QR automaticamente. No es necesario presionar ningun boton.
                          </p>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                            <Camera className="w-8 h-8 text-slate-400" />
                          </div>
                          <p className="text-gray-500 font-medium text-sm">Scanner inactivo</p>
                          <p className="text-gray-400 text-xs mt-1">El turno ha finalizado</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab: Busqueda Manual Unificada (Documento o ID en una sola barra) */}
                  {TabActiva === "manual" && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-blue-700 leading-relaxed">
                        <strong>Busqueda inteligente:</strong> escribe el documento del aprendiz (6+ digitos)
                        o el ID de reserva (numero corto) — el sistema detecta el tipo automaticamente.
                      </div>
                      <div className="flex gap-2 sm:gap-3">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Documento (ej: 1023456789) o ID reserva (ej: 342)"
                          value={TerminoBusqueda}
                          onChange={(E) => SetTerminoBusqueda(E.target.value)}
                          onKeyDown={(E) => E.key === "Enter" && ManejarBusquedaManual()}
                          disabled={!TurnoActivo}
                          className="flex-1 px-4 py-3 sm:py-3.5 rounded-xl border border-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition-all"
                        />
                        <button
                          onClick={ManejarBusquedaManual}
                          disabled={!TurnoActivo || CargandoManual || !TerminoBusqueda.trim()}
                          className="px-4 sm:px-5 py-3 sm:py-3.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center gap-2 font-semibold"
                        >
                          {CargandoManual
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Search className="w-4 h-4" />
                          }
                          <span className="hidden sm:inline text-sm">Buscar</span>
                        </button>
                      </div>
                      {/* Indicador del tipo detectado */}
                      {TerminoBusqueda.trim() && (
                        <p className="text-xs text-center text-gray-400">
                          Se buscara por:{' '}
                          <span className="font-semibold text-teal-600">
                            {DetectarTipoBusqueda(TerminoBusqueda) === 'doc'
                              ? 'Numero de documento'
                              : 'ID de reserva'}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Resultado del ultimo procesamiento */}
              {UltimoResultado && (
                <TarjetaResultado Resultado={UltimoResultado} />
              )}

              {/* Historial del turno (solo en desktop) */}
              <div className="hidden xl:block bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2.5">
                  <ClipboardList className="w-4 h-4 text-gray-400" />
                  <h3 className="font-bold text-gray-700 text-sm">Historial del turno</h3>
                  <span className="ml-auto bg-teal-100 text-teal-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {HistorialTurno.length}
                  </span>
                </div>
                <div className="divide-y divide-gray-50 overflow-y-auto" style={{ maxHeight: "320px" }}>
                  {HistorialTurno.length === 0 ? (
                    <div className="py-10 text-center text-gray-400 text-sm">
                      Sin registros en este turno aun
                    </div>
                  ) : (
                    HistorialTurno.map((Item, Idx) => <FilaHistorial key={Idx} Item={Item} />)
                  )}
                </div>
              </div>
            </div>

            {/* Columna lateral: metricas + historial movil */}
            <div className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-2 xl:grid-cols-1 gap-3 sm:gap-4">
                <TarjetaMetrica Label="Consumidas" Valor={Metricas.Total} Icono={CheckCircle2} ColorFondo="bg-teal-50" ColorTexto="text-teal-700" ColorIcono="text-teal-600" />
                <TarjetaMetrica Label="Flujo Especial" Valor={Metricas.Especiales} Icono={Shield} ColorFondo="bg-purple-50" ColorTexto="text-purple-700" ColorIcono="text-purple-600" />
                <div className="relative">
                  <TarjetaMetrica Label="Canceladas (dia)" Valor={Metricas.Canceladas} Icono={XCircle} ColorFondo="bg-red-50" ColorTexto="text-red-700" ColorIcono="text-red-600" />
                  <button
                    onClick={ObtenerContadoresExternos}
                    title="Actualizar contadores"
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3 text-red-400" />
                  </button>
                </div>
                <TarjetaMetrica Label="Vencidas al cierre" Valor={Metricas.Vencidas} Icono={Clock} ColorFondo="bg-slate-50" ColorTexto="text-slate-700" ColorIcono="text-slate-600" />
              </div>

              {/* Historial en movil/tablet */}
              <div className="xl:hidden bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100">
                <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-gray-50 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-gray-400" />
                  <h3 className="font-bold text-gray-700 text-sm">Historial</h3>
                  <span className="ml-auto bg-teal-100 text-teal-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {HistorialTurno.length}
                  </span>
                </div>
                <div className="divide-y divide-gray-50 overflow-y-auto" style={{ maxHeight: "280px" }}>
                  {HistorialTurno.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-sm">Sin registros aun</div>
                  ) : (
                    HistorialTurno.map((Item, Idx) => <FilaHistorial key={Idx} Item={Item} />)
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Modal de cierre de turno */}
      {MostrarModalCierre && (
        <ModalCierreTurno
          Datos={{ HoraInicio: HoraInicioTurno, HoraFin: HoraFinTurno, Historial: HistorialTurno, Metricas }}
          OnCerrar={() => SetMostrarModalCierre(false)}
          OnExportarPDF={ManejarExportarPDF}
          RefReporte={RefReportePDF}
          ExportandoPDF={ExportandoPDF}
        />
      )}
    </div>
  );
};

export default Registro;