// Frontend/src/Paginas/Reservas/GuardarAlmuerzoCampo.jsx
// Modulo: Guardar Almuerzo por Jornada de Campo (Fichas / SENA Empresa)
// Permite a Instructores, Voceros, SENA Empresa, Bienestar, Coordinacion y Admin
// registrar solicitudes de almuerzo guardado con hora extendida para evitar inasistencias injustificadas.

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Wheat, Search, Calendar, Clock, CheckSquare, Square,
  AlertTriangle, CheckCircle2, FileText, Download,
  Users, Building2, HelpCircle, ChevronDown, ChevronUp,
  Loader2, RefreshCw, Eye, X, ShieldAlert, Sparkles
} from "lucide-react";
import apiAxios from "../../api/axiosConfig";
import FoodsysToast from "../../Components/UI/FoodsysToast";
import FoodsysConfirmModal from "../../Components/UI/FoodsysConfirmModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

const UNIDADES_PRODUCTIVAS = [
  { id: "GANADERIA", nombre: "Ganadería (Bovinos y Lechería)" },
  { id: "PISCICULTURA", nombre: "Piscicultura (Estanques y Reproductores)" },
  { id: "PORCINOS", nombre: "Porcinos (Cría y Ceba)" },
  { id: "AVICULTURA", nombre: "Avicultura (Galpones y Postura)" },
  { id: "CULTIVOS_AGRICOLAS", nombre: "Cultivos Agrícolas y Frutales" },
  { id: "MECANIZACION_AGRICOLA", nombre: "Mecanización Agrícola y Tractores" },
  { id: "AGROINDUSTRIA", nombre: "Agroindustria y Procesamiento" },
  { id: "SENA_EMPRESA_GENERAL", nombre: "SENA Empresa General" },
  { id: "SALIDA_PEDAGOGICA", nombre: "Salida Pedagógica de Campo" },
  { id: "OTRA_UNIDAD", nombre: "Otra Unidad Productiva" }
];

export default function GuardarAlmuerzoCampo() {
  const hoyBogotaStr = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

  // Estados de busqueda y formulario
  const [numFichaBusqueda, setNumFichaBusqueda] = useState("");
  const [fechaServicio, setFechaServicio] = useState(hoyBogotaStr);
  const [cargandoFicha, setCargandoFicha] = useState(false);
  const [datosFicha, setDatosFicha] = useState(null);

  // Seleccion de aprendices con reserva
  const [seleccionados, setSeleccionados] = useState(new Set());

  // Campos de la solicitud
  const [unidadProductiva, setUnidadProductiva] = useState("GANADERIA");
  const [detalleLugar, setDetalleLugar] = useState("");
  const [justificacion, setJustificacion] = useState("");
  const [horaLlegada, setHoraLlegada] = useState("14:30");
  const [modalidad, setModalidad] = useState("GUARDAR_EN_COMEDOR");

  // Control de interfaz
  const [guardando, setGuardando] = useState(false);
  const [mostrarGuia, setMostrarGuia] = useState(false);
  const [modalConfirmar, setModalConfirmar] = useState(false);

  // Listado de actas existentes
  const [actas, setActas] = useState([]);
  const [cargandoActas, setCargandoActas] = useState(false);
  const [actaDetalle, setActaDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // Cargar actas del dia o periodo al montar
  const cargarActas = useCallback(async () => {
    setCargandoActas(true);
    try {
      const res = await apiAxios.get(`/api/Campo/solicitudes?fecha=${fechaServicio}`);
      setActas(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error al cargar actas de campo:", err);
    } finally {
      setCargandoActas(false);
    }
  }, [fechaServicio]);

  useEffect(() => {
    cargarActas();
  }, [cargarActas]);

  // Consultar ficha y reservas
  const consultarFicha = async (e) => {
    if (e) e.preventDefault();
    const limpia = numFichaBusqueda.trim().replace(/\D/g, "");
    if (!limpia) {
      FoodsysToast.warning("Ingresa un número de ficha válido.");
      return;
    }

    setCargandoFicha(true);
    setDatosFicha(null);
    setSeleccionados(new Set());

    try {
      const res = await apiAxios.get(`/api/Campo/ficha/${limpia}?fecha=${fechaServicio}`);
      setDatosFicha(res.data);
      // Preseleccionar automaticamente a todos los que tienen reserva
      if (res.data.aprendicesConReserva?.length > 0) {
        const todos = new Set(res.data.aprendicesConReserva.map(a => a.Id_Reserva));
        setSeleccionados(todos);
        FoodsysToast.success(`Ficha #${limpia} cargada: ${res.data.totalConReserva} aprendices con reserva.`);
      } else {
        FoodsysToast.warning(`La ficha #${limpia} no tiene aprendices con reserva de almuerzo para ${fechaServicio}.`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Error al consultar la ficha";
      FoodsysToast.error(msg);
    } finally {
      setCargandoFicha(false);
    }
  };

  // Alternar seleccion individual
  const toggleSeleccion = (idReserva) => {
    setSeleccionados(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(idReserva)) {
        nuevo.delete(idReserva);
      } else {
        nuevo.add(idReserva);
      }
      return nuevo;
    });
  };

  // Alternar todos los que tienen reserva
  const toggleTodos = () => {
    if (!datosFicha?.aprendicesConReserva) return;
    if (seleccionados.size === datosFicha.aprendicesConReserva.length) {
      setSeleccionados(new Set());
    } else {
      const todos = new Set(datosFicha.aprendicesConReserva.map(a => a.Id_Reserva));
      setSeleccionados(todos);
    }
  };

  // Validar y abrir modal de confirmacion
  const handlePreConfirmar = (e) => {
    e.preventDefault();
    if (!datosFicha) {
      FoodsysToast.warning("Primero debes consultar una ficha.");
      return;
    }
    if (seleccionados.size === 0) {
      FoodsysToast.warning("Debes seleccionar al menos un aprendiz con reserva.");
      return;
    }
    if (!detalleLugar.trim()) {
      FoodsysToast.warning("Indica el lote o lugar de la práctica.");
      return;
    }
    if (!justificacion.trim()) {
      FoodsysToast.warning("Escribe una justificación del motivo de la jornada de campo.");
      return;
    }
    setModalConfirmar(true);
  };

  // Guardar solicitud en el backend
  const ejecutarGuardar = async () => {
    setGuardando(true);
    try {
      const payload = {
        Id_Ficha: datosFicha.ficha.Id_Ficha,
        Num_Ficha: datosFicha.ficha.Num_Ficha,
        Nom_Programa: datosFicha.ficha.Nom_Programa,
        Fec_Servicio: fechaServicio,
        Unidad_Productiva: unidadProductiva,
        Detalle_Lugar_Practica: detalleLugar.trim(),
        Justificacion: justificacion.trim(),
        Hora_Estimada_Llegada: `${horaLlegada}:00`,
        Modalidad_Guardado: modalidad,
        idsReservasSeleccionadas: Array.from(seleccionados)
      };

      const res = await apiAxios.post("/api/Campo/solicitud", payload);
      FoodsysToast.success(res.data.mensaje || "Acta de almuerzos guardados creada con éxito.");
      setModalConfirmar(false);
      // Limpiar y recargar
      setDetalleLugar("");
      setJustificacion("");
      setDatosFicha(null);
      setSeleccionados(new Set());
      setNumFichaBusqueda("");
      cargarActas();

      // Abrir inmediatamente la descarga o visualizacion del acta creada
      if (res.data.solicitud?.Id_Solicitud_Campo) {
        verDetalleActa(res.data.solicitud.Id_Solicitud_Campo);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Error al crear la solicitud";
      FoodsysToast.error(msg);
    } finally {
      setGuardando(false);
    }
  };

  // Ver detalle nominal de un acta
  const verDetalleActa = async (idSolicitud) => {
    setCargandoDetalle(true);
    try {
      const res = await apiAxios.get(`/api/Campo/solicitudes/${idSolicitud}`);
      setActaDetalle(res.data);
    } catch (err) {
      FoodsysToast.error("Error al cargar el detalle del acta");
    } finally {
      setCargandoDetalle(false);
    }
  };

  // Generar y descargar PDF oficial del Acta de Almuerzos Guardados
  const descargarActaPDF = async (detalle) => {
    if (!detalle?.solicitud) return;
    const sol = detalle.solicitud;
    const lista = detalle.aprendices || [];

    try {
      const doc = new jsPDF("p", "mm", "a4");

      // Generar codigo QR en Base64 con el codigo del acta
      const qrDataUrl = await QRCode.toDataURL(sol.Codigo_Acta, {
        width: 140,
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" }
      });

      // Encabezado institucional
      doc.setFillColor(30, 41, 59); // Slate-800
      doc.rect(0, 0, 210, 28, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("CENTRO AGROPECUARIO 'LA GRANJA' — SENA REGIONAL TOLIMA", 14, 11);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("SISTEMA INTEGRADO DE GESTION ALIMENTARIA FOODSYS — JORNADA DE CAMPO / SENA EMPRESA", 14, 18);
      doc.text(`ACTA DE ALMUERZOS GUARDADOS EN COMEDOR | CODIGO: ${sol.Codigo_Acta}`, 14, 24);

      // Embeber codigo QR
      doc.addImage(qrDataUrl, "PNG", 175, 4, 22, 22);

      // Cuadro de datos generales
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("DATOS OFICIALES DE LA PRÁCTICA Y DE LA FICHA", 14, 36);

      const infoBasica = [
        ["Código de Acta:", sol.Codigo_Acta, "Fecha de Servicio:", sol.Fec_Servicio],
        ["N° de Ficha:", `Ficha ${sol.Num_Ficha}`, "Unidad Productiva:", sol.Unidad_Productiva],
        ["Programa de Formación:", sol.Nom_Programa || "--", "Modalidad:", sol.Modalidad_Guardado === "GUARDAR_EN_COMEDOR" ? "Guardar en Comedor" : "Empacar Ración"],
        ["Lugar Específico / Lote:", sol.Detalle_Lugar_Practica || "--", "Hora Máxima Recogida:", sol.Hora_Estimada_Llegada ? sol.Hora_Estimada_Llegada.substring(0, 5) : "14:30"],
        ["Solicitado por:", `${sol.solicitante ? `${sol.solicitante.Nom_Usuario} ${sol.solicitante.Ape_Usuario}` : "Instructor / Vocero"} (${sol.Rol_Solicitante})`, "Total Almuerzos:", `${sol.Total_Aprendices_Guardados} raciones autorizadas`]
      ];

      autoTable(doc, {
        body: infoBasica,
        startY: 39,
        theme: "plain",
        styles: { fontSize: 8, cellPadding: 1.5, textColor: [30, 41, 59] },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 38 },
          1: { cellWidth: 62 },
          2: { fontStyle: "bold", cellWidth: 38 },
          3: { cellWidth: 44 }
        }
      });

      // Justificacion
      const posYJust = doc.lastAutoTable.finalY + 3;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("JUSTIFICACIÓN DE LA JORNADA DE CAMPO:", 14, posYJust);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const lineasJust = doc.splitTextToSize(sol.Justificacion || "Sin justificación detallada.", 182);
      doc.text(lineasJust, 14, posYJust + 4);

      // Tabla nominal de aprendices autorizados
      const startNominal = posYJust + 6 + (lineasJust.length * 4);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text(`LISTA NOMINAL DE APRENDICES AUTORIZADOS (${lista.length} PERSONAS)`, 14, startNominal);

      const filasTabla = lista.map((a, idx) => [
        idx + 1,
        `${a.TipDoc} ${a.NumDoc}`,
        a.NombreCompleto,
        a.CenCon_Usuario === "Si" ? "Interno" : "Externo",
        a.Nom_Plato,
        `${a.Nom_Bebida} (${a.Subtipo_Bebida === "CALIENTE" ? "Caliente" : "Fría"})`,
        a.Est_Reserva === "Consumido" ? "RECLAMADO" : "GUARDADO",
        ""
      ]);

      autoTable(doc, {
        head: [["#", "Documento", "Nombre Completo", "Modalidad", "Plato", "Bebida", "Estado", "Firma Entrega"]],
        body: filasTabla,
        startY: startNominal + 3,
        theme: "grid",
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 7.5, fontStyle: "bold" },
        styles: { fontSize: 7, cellPadding: 2, textColor: [30, 41, 59] },
        columnStyles: {
          0: { cellWidth: 8, halign: "center" },
          1: { cellWidth: 24 },
          2: { cellWidth: 46 },
          3: { cellWidth: 16, halign: "center" },
          4: { cellWidth: 32 },
          5: { cellWidth: 28 },
          6: { cellWidth: 18, halign: "center" },
          7: { cellWidth: 20 }
        }
      });

      // Bloques de firmas institucionales
      const finalY = Math.min(doc.lastAutoTable.finalY + 18, 260);

      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.4);

      // Firma 1: Solicitante
      doc.line(16, finalY, 68, finalY);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text("Firma Instructor / Vocero", 16, finalY + 4);
      doc.setFont("helvetica", "normal");
      doc.text("Responsable de Práctica", 16, finalY + 8);

      // Firma 2: Cocina / Comedor
      doc.line(78, finalY, 130, finalY);
      doc.setFont("helvetica", "bold");
      doc.text("Firma Cocina / Supervisor", 78, finalY + 4);
      doc.setFont("helvetica", "normal");
      doc.text("Entrega de Raciones", 78, finalY + 8);

      // Firma 3: Bienestar / Coordinacion
      doc.line(140, finalY, 192, finalY);
      doc.setFont("helvetica", "bold");
      doc.text("Vo.Bo. SENA Empresa / Coord.", 140, finalY + 4);
      doc.setFont("helvetica", "normal");
      doc.text("Validación y Auditoría", 140, finalY + 8);

      doc.save(`Acta_Campo_${sol.Codigo_Acta}.pdf`);
      FoodsysToast.success("Acta en PDF descargada correctamente.");
    } catch (err) {
      console.error("Error al generar PDF de campo:", err);
      FoodsysToast.error("Error al generar el PDF del acta.");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ============================================================
          BANNER DE BIENVENIDA Y GUIA DIDACTICA
      ============================================================ */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Wheat size={240} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 rounded-full px-3 py-1 text-xs font-semibold text-emerald-200">
              <Sparkles size={13} /> Jornada de Campo & SENA Empresa (Almuerzos Guardados)
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
              🌾 Guardar Almuerzo por Jornada de Campo
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Permite a Instructores, Voceros y encargados de SENA Empresa autorizar la reserva extendida de almuerzos para fichas que realizan labores agrícolas, pecuarias o agroindustriales en lotes lejanos.
            </p>
          </div>

          <button
            onClick={() => setMostrarGuia(!mostrarGuia)}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl px-4 py-2.5 text-xs font-semibold transition backdrop-blur-xs shrink-0 self-start md:self-center"
          >
            <HelpCircle size={15} />
            {mostrarGuia ? "Ocultar guía" : "¿Cómo funciona este módulo?"}
            {mostrarGuia ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {/* Acordeon didactico */}
        {mostrarGuia && (
          <div className="mt-6 pt-6 border-t border-white/10 grid sm:grid-cols-3 gap-4 text-xs text-slate-200 animate-in fade-in duration-200">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-1">
              <p className="font-bold text-emerald-300 text-sm">1. Consulta de Ficha</p>
              <p>Busca la ficha por número. El sistema te mostrará quiénes <strong>YA tienen reserva activa de almuerzo</strong> para hoy y quiénes no alcanzaron a reservar.</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-1">
              <p className="font-bold text-teal-300 text-sm">2. Selección y Justificación</p>
              <p>Marca con casillas a los aprendices que están en campo, selecciona el área de SENA Empresa, lugar de la práctica y la hora estimada de recogida (hasta las 3:00 PM).</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-1">
              <p className="font-bold text-sky-300 text-sm">3. Protección Antivencimiento</p>
              <p>Las raciones seleccionadas <strong>NO vencerán a la 1:30 PM</strong>. Quedarán protegidas para entrega tardía y se generará un Acta institucional con código QR.</p>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================
          BUSCADOR DE FICHA Y SELECCION DE FECHA
      ============================================================ */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Search size={16} className="text-emerald-600" /> Paso 1: Consultar Ficha y Reservas de Almuerzo
        </h2>

        <form onSubmit={consultarFicha} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Número de Ficha *</label>
            <div className="relative">
              <input
                type="text"
                value={numFichaBusqueda}
                onChange={(e) => setNumFichaBusqueda(e.target.value)}
                placeholder="Ej. 2994856"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                required
              />
            </div>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha del Servicio *</label>
            <div className="relative">
              <input
                type="date"
                value={fechaServicio}
                onChange={(e) => setFechaServicio(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                required
              />
            </div>
          </div>

          <div className="sm:col-span-3 flex items-end">
            <button
              type="submit"
              disabled={cargandoFicha}
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-4 py-2.5 text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              {cargandoFicha ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Consultar Ficha
            </button>
          </div>
        </form>

        {/* Tarjeta de advertencia de horario oficial */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-amber-800">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Horario oficial de solicitud:</strong> Puedes registrar el guardado de almuerzos desde el día anterior o el mismo día del servicio <strong>hasta las 11:00 AM</strong>. Los almuerzos guardados podrán ser reclamados en comedor hasta la hora estimada indicada (máximo 3:00 PM).
          </div>
        </div>
      </div>

      {/* ============================================================
          RESULTADOS DE LA FICHA Y LISTADO DE APRENDICES
      ============================================================ */}
      {datosFicha && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
          {/* Header de la ficha */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-0.5 rounded-lg text-xs">
                  Ficha #{datosFicha.ficha.Num_Ficha}
                </span>
                <span className="text-xs text-slate-500">Fecha: {datosFicha.fechaServicio}</span>
              </div>
              <h2 className="text-base font-extrabold text-slate-900 mt-1">
                {datosFicha.ficha.Nom_Programa}
              </h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-xl border border-slate-200">
                Total Ficha: <strong>{datosFicha.totalAprendicesFicha}</strong>
              </span>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-3 py-1.5 rounded-xl border border-emerald-200">
                Con Reserva: <strong>{datosFicha.totalConReserva}</strong>
              </span>
              <span className="text-xs bg-rose-50 text-rose-700 font-semibold px-3 py-1.5 rounded-xl border border-rose-200">
                Sin Reserva: <strong>{datosFicha.totalSinReserva}</strong>
              </span>
            </div>
          </div>

          {/* Tabla de aprendices con reserva */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Paso 2: Seleccionar Aprendices para Guardar Almuerzo ({seleccionados.size} de {datosFicha.totalConReserva})
                </h3>
                <p className="text-xs text-slate-500">
                  Solo los aprendices seleccionados tendrán extensión de horario y ración reservada.
                </p>
              </div>

              {datosFicha.aprendicesConReserva?.length > 0 && (
                <button
                  type="button"
                  onClick={toggleTodos}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
                >
                  {seleccionados.size === datosFicha.aprendicesConReserva.length ? (
                    <>
                      <Square size={14} /> Desmarcar todos
                    </>
                  ) : (
                    <>
                      <CheckSquare size={14} /> Seleccionar todos ({datosFicha.aprendicesConReserva.length})
                    </>
                  )}
                </button>
              )}
            </div>

            {datosFicha.aprendicesConReserva?.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                Ningún aprendiz de esta ficha tiene reserva de almuerzo para la fecha seleccionada.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">Sel.</th>
                      <th className="py-3 px-3">Aprendiz</th>
                      <th className="py-3 px-3">Documento</th>
                      <th className="py-3 px-3">Tipo</th>
                      <th className="py-3 px-3">Plato Elegido</th>
                      <th className="py-3 px-3">Bebida Elegida</th>
                      <th className="py-3 px-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {datosFicha.aprendicesConReserva.map(a => {
                      const isSel = seleccionados.has(a.Id_Reserva);
                      return (
                        <tr
                          key={a.Id_Reserva}
                          onClick={() => toggleSeleccion(a.Id_Reserva)}
                          className={`cursor-pointer transition-colors ${
                            isSel ? "bg-emerald-50/70 hover:bg-emerald-50" : "hover:bg-slate-50/60"
                          }`}
                        >
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSel}
                              onChange={() => {}} // controlado por el click de fila
                              className="rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            {a.NombreCompleto}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">
                            {a.TipDoc_Usuario} {a.NumDoc_Usuario}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              a.CenCon_Usuario === "Si"
                                ? "bg-purple-100 text-purple-700 border border-purple-200"
                                : "bg-sky-100 text-sky-700 border border-sky-200"
                            }`}>
                              {a.CenCon_Usuario === "Si" ? "Interno" : "Externo"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-700 font-medium">
                            {a.Nom_Plato}
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                              {a.Subtipo_Bebida === "CALIENTE" ? "☕" : "🧊"} {a.Nom_Bebida}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {a.Est_Reserva}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ============================================================
              FORMULARIO DE SENA EMPRESA Y JUSTIFICACION
          ============================================================ */}
          {datosFicha.aprendicesConReserva?.length > 0 && (
            <form onSubmit={handlePreConfirmar} className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Building2 size={16} className="text-teal-600" /> Paso 3: Datos de SENA Empresa y Justificación
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Unidad Productiva */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Unidad Productiva / Área SENA Empresa *
                  </label>
                  <select
                    value={unidadProductiva}
                    onChange={(e) => setUnidadProductiva(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  >
                    {UNIDADES_PRODUCTIVAS.map(u => (
                      <option key={u.id} value={u.id}>{u.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Detalle del lugar o lote */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Lugar / Lote Específico *
                  </label>
                  <input
                    type="text"
                    value={detalleLugar}
                    onChange={(e) => setDetalleLugar(e.target.value)}
                    placeholder="Ej. Lote 4 Ganadería / Reproductores"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>

                {/* Modalidad */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Modalidad de Entrega *
                  </label>
                  <select
                    value={modalidad}
                    onChange={(e) => setModalidad(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  >
                    <option value="GUARDAR_EN_COMEDOR">Guardar en Comedor (Llegada tardía)</option>
                    <option value="EMPACA_PARA_LLEVAR">Empacar Ración para Unidad Productiva</option>
                  </select>
                </div>

                {/* Hora estimada de recogida */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Hora Estimada de Recogida * (máx 15:00)
                  </label>
                  <input
                    type="time"
                    min="13:30"
                    max="15:00"
                    value={horaLlegada}
                    onChange={(e) => setHoraLlegada(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Justificacion obligatoria */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Justificación de la Jornada de Campo *
                </label>
                <textarea
                  rows={2}
                  value={justificacion}
                  onChange={(e) => setJustificacion(e.target.value)}
                  placeholder="Explica detalladamente la labor que realiza la ficha y por qué no alcanzan a llegar en el horario habitual (11:30 a 1:30)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
                  required
                />
              </div>

              {/* Boton de confirmar */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={seleccionados.size === 0 || guardando}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl px-6 py-3 text-xs font-bold transition shadow-md disabled:opacity-50"
                >
                  {guardando ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Guardando Acta...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> Confirmar y Guardar {seleccionados.size} Almuerzos
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ============================================================
          SECCION: ACTAS REGISTRADAS DE ALMUERZOS GUARDADOS
      ============================================================ */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-teal-600" /> Actas de Almuerzos Guardados ({actas.length})
            </h2>
            <p className="text-xs text-slate-500">
              Solicitudes registradas para el servicio del {fechaServicio}
            </p>
          </div>
          <button
            onClick={cargarActas}
            disabled={cargandoActas}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
          >
            <RefreshCw size={14} className={cargandoActas ? "animate-spin" : ""} /> Actualizar
          </button>
        </div>

        {cargandoActas ? (
          <div className="p-8 text-center text-slate-400 text-xs">Cargando actas registradas...</div>
        ) : actas.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
            No hay actas de almuerzos guardados registradas para la fecha seleccionada ({fechaServicio}).
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actas.map(acta => (
              <div
                key={acta.Id_Solicitud_Campo}
                className="bg-slate-50/70 border border-slate-200 hover:border-teal-400 rounded-2xl p-4 space-y-3 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-md">
                      {acta.Codigo_Acta}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">
                      Ficha #{acta.Num_Ficha}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate max-w-[200px]" title={acta.Nom_Programa}>
                      {acta.Nom_Programa}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    acta.Estado_Solicitud === "ENTREGADA_COMPLETA"
                      ? "bg-slate-200 text-slate-700"
                      : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {acta.Estado_Solicitud === "ENTREGADA_COMPLETA" ? "Entregada" : "Guardada"}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                  <p><strong>Unidad:</strong> {acta.Unidad_Productiva}</p>
                  <p><strong>Lugar:</strong> {acta.Detalle_Lugar_Practica}</p>
                  <p><strong>Hora límite:</strong> {acta.Hora_Estimada_Llegada ? acta.Hora_Estimada_Llegada.substring(0, 5) : "14:30"}</p>
                  <p><strong>Raciones:</strong> {acta.Total_Almuerzos_Entregados} entregadas de {acta.Total_Aprendices_Guardados}</p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => verDetalleActa(acta.Id_Solicitud_Campo)}
                    className="flex-1 inline-flex items-center justify-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl py-2 text-xs font-semibold transition"
                  >
                    <Eye size={13} /> Ver Detalle
                  </button>
                  <button
                    onClick={async () => {
                      const res = await apiAxios.get(`/api/Campo/solicitudes/${acta.Id_Solicitud_Campo}`);
                      descargarActaPDF(res.data);
                    }}
                    className="inline-flex items-center justify-center gap-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-3 py-2 text-xs font-semibold transition shadow-xs"
                    title="Descargar Acta en PDF"
                  >
                    <Download size={13} /> PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================
          MODAL DETALLE NOMINAL DEL ACTA SELECCIONADA
      ============================================================ */}
      {actaDetalle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header modal */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 to-emerald-50">
              <div>
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                  {actaDetalle.solicitud?.Codigo_Acta}
                </span>
                <h2 className="text-base font-extrabold text-slate-900 mt-1">
                  Almuerzos Guardados — Ficha #{actaDetalle.solicitud?.Num_Ficha}
                </h2>
                <p className="text-xs text-slate-500">
                  {actaDetalle.solicitud?.Nom_Programa} · {actaDetalle.solicitud?.Unidad_Productiva}
                </p>
              </div>
              <button
                onClick={() => setActaDetalle(null)}
                className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Contenido modal */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Lugar Práctica</span>
                  <span className="font-semibold text-slate-800">{actaDetalle.solicitud?.Detalle_Lugar_Practica}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Hora Máxima</span>
                  <span className="font-semibold text-slate-800">{actaDetalle.solicitud?.Hora_Estimada_Llegada?.substring(0, 5)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Solicitante</span>
                  <span className="font-semibold text-slate-800">{actaDetalle.solicitud?.solicitante?.Nom_Usuario || "Instructor"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Raciones</span>
                  <span className="font-semibold text-emerald-700">{actaDetalle.solicitud?.Total_Almuerzos_Entregados} de {actaDetalle.solicitud?.Total_Aprendices_Guardados} entregadas</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Justificación</span>
                <p className="bg-slate-50 p-3 rounded-2xl text-slate-700 leading-relaxed border border-slate-100">
                  {actaDetalle.solicitud?.Justificacion}
                </p>
              </div>

              {/* Lista nominal */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 uppercase text-[11px] tracking-wider">
                  Aprendices Autorizados ({actaDetalle.aprendices?.length || 0})
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Aprendiz</th>
                        <th className="py-2.5 px-3">Documento</th>
                        <th className="py-2.5 px-3">Plato</th>
                        <th className="py-2.5 px-3">Bebida</th>
                        <th className="py-2.5 px-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {actaDetalle.aprendices?.map((ap, i) => (
                        <tr key={ap.Id_Reserva} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 text-slate-400">{i + 1}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{ap.NombreCompleto}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{ap.TipDoc} {ap.NumDoc}</td>
                          <td className="py-2 px-3 text-slate-700">{ap.Nom_Plato}</td>
                          <td className="py-2 px-3 text-slate-700">
                            {ap.Subtipo_Bebida === "CALIENTE" ? "☕" : "🧊"} {ap.Nom_Bebida}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ap.Est_Reserva === "Consumido"
                                ? "bg-slate-200 text-slate-700"
                                : "bg-emerald-100 text-emerald-800"
                            }`}>
                              {ap.Est_Reserva === "Consumido" ? "Reclamado" : "Guardado"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer modal */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setActaDetalle(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Cerrar
              </button>
              <button
                onClick={() => descargarActaPDF(actaDetalle)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm"
              >
                <Download size={14} /> Descargar Acta en PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL DE CONFIRMACION ANTES DE GUARDAR
      ============================================================ */}
      <FoodsysConfirmModal
        isOpen={modalConfirmar}
        onClose={() => setModalConfirmar(false)}
        onConfirm={ejecutarGuardar}
        title="Confirmar Acta de Almuerzos Guardados"
        message={`¿Estás seguro de autorizar el guardado de ${seleccionados.size} raciones de almuerzo para la Ficha #${datosFicha?.ficha?.Num_Ficha} (${unidadProductiva}) con hora límite de recogida a las ${horaLlegada}?`}
        confirmText="Sí, Crear Acta y Guardar"
        cancelText="Revisar"
        type="primary"
        loading={guardando}
      />
    </div>
  );
}
