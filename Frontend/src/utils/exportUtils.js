// Frontend/src/utils/exportUtils.js
// Utilidad universal y multiplataforma para exportar datos a Excel (.xlsx) y PDF (.pdf)
// Compatible con iOS Safari, Android, Windows, macOS y Linux
// Codigo didactico sin tildes ni emojis para aprendices de primer semestre

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  confirmarAccionFoodsys,
  notificarExito,
  notificarError,
  notificarInfo
} from "./notificacionesFoodsys.jsx";

/**
 * Limpia y normaliza el nombre de un archivo para evitar errores en sistemas de archivos
 * de Linux, Windows o macOS.
 */
export const limpiarNombreArchivo = (nombre) => {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_\-\.]/g, "_")
    .replace(/_+/g, "_");
};

/**
 * Descarga universal y segura para navegadores de escritorio y moviles (iOS/Android)
 */
export const descargarBlobUniversal = (blob, nombreArchivo) => {
  const nombreLimpio = limpiarNombreArchivo(nombreArchivo);
  const url = window.URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.style.display = "none";
  enlace.href = url;
  enlace.setAttribute("download", nombreLimpio);

  // Requerido por iOS Safari y Android WebView: adjuntar al DOM antes de disparar el clic
  document.body.appendChild(enlace);
  enlace.click();

  // Retrasar revocacion de URL para dar tiempo a la descarga en navegadores moviles
  setTimeout(() => {
    document.body.removeChild(enlace);
    window.URL.revokeObjectURL(url);
  }, 2000);
};

/**
 * Dialogo inteligente de confirmacion al exportar:
 * Pregunta amigablemente si desea exportar todos o solo los filtrados
 */
export const confirmarExportacion = async (params = {}) => {
  const totalOrig = params.totalOriginal ?? params.totalRegistros ?? 0;
  const totalFilt = params.totalFiltrado ?? params.totalFiltrados ?? totalOrig;
  const hayFiltros = Boolean(params.tieneFiltrosActivos ?? params.tieneFiltros ?? false);
  const formato = params.formato || "Excel";
  const nombreModulo = params.nombreModulo || "registros";

  // Caso A: No hay filtros activos
  if (!hayFiltros || totalOrig === totalFilt) {
    const respuesta = await confirmarAccionFoodsys({
      titulo: `¿Exportar ${formato}?`,
      mensaje: `No has aplicado ningún filtro en esta tabla. ¿Deseas exportar todos los ${totalOrig} ${nombreModulo} completos?`,
      textoConfirmar: `Sí, exportar todos (${totalOrig})`,
      textoCancelar: "Cancelar",
      variante: "primario"
    });

    return respuesta === "confirmado" ? "todos" : null;
  }

  // Caso B: Si hay filtros aplicados
  const respuesta = await confirmarAccionFoodsys({
    titulo: `¿Qué deseas exportar a ${formato}?`,
    mensaje: `Tienes filtros activos en pantalla. Puedes descargar los ${totalFilt} registros filtrados o la lista completa de ${totalOrig} registros.`,
    textoConfirmar: `Exportar filtrados (${totalFilt})`,
    textoSecundario: `Exportar todos (${totalOrig})`,
    textoCancelar: "Cancelar",
    variante: "primario"
  });

  if (respuesta === "confirmado") return "filtrados";
  if (respuesta === "secundario") return "todos";
  return null;
};

/**
 * Genera y descarga un archivo Excel (.xlsx) con auto-ajuste de columnas
 */
export const exportarAExcel = ({
  datos,
  nombreArchivo = "Reporte_Foodsys",
  nombreHoja = "Datos"
}) => {
  if (!datos || datos.length === 0) {
    notificarInfo("No hay registros disponibles para exportar a Excel.");
    return;
  }

  // Crear libro y hoja con los datos
  const hoja = XLSX.utils.json_to_sheet(datos);
  const libro = XLSX.utils.book_new();

  // Calcular ancho automatico de columnas basado en el contenido
  const encabezados = Object.keys(datos[0] || {});
  const anchos = encabezados.map((col) => {
    let maxLongitud = col.length;
    datos.forEach((fila) => {
      const val = fila[col] !== null && fila[col] !== undefined ? String(fila[col]) : "";
      if (val.length > maxLongitud) {
        maxLongitud = val.length;
      }
    });
    return { wch: Math.min(Math.max(maxLongitud + 3, 12), 45) };
  });

  hoja["!cols"] = anchos;
  XLSX.utils.book_append_sheet(libro, hoja, nombreHoja.substring(0, 31));

  // Generar buffer en formato ArrayBuffer
  const excelBuffer = XLSX.write(libro, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  const fechaHoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
  descargarBlobUniversal(blob, `${nombreArchivo}_${fechaHoy}.xlsx`);
};

/**
 * Genera y descarga un documento PDF con tabla profesional estilizada
 */
export const exportarAPDF = ({
  titulo = "Reporte del Sistema Foodsys",
  subtitulo = "Centro Agropecuario La Granja - Espinal Tolima",
  columnas = [], // Array de encabezados visibles: ['N° Doc', 'Nombre', 'Ficha', 'Estado']
  datos = [],    // Matriz de filas: [['1003810', 'Carlos Perez', '255481', 'Activo']]
  nombreArchivo = "Reporte_Foodsys",
  orientacion = "landscape" // 'portrait' o 'landscape'
}) => {
  if (!datos || datos.length === 0) {
    notificarInfo("No hay registros disponibles para exportar a PDF.");
    return;
  }

  const doc = new jsPDF({
    orientation: orientacion,
    unit: "pt",
    format: "letter"
  });

  const fechaHoy = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "full",
    timeStyle: "medium"
  }).format(new Date());

  // Encabezado institucional
  doc.setFillColor(46, 87, 146); // Azul institucional Foodsys #2E5792
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 60, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("FOODSYS - SISTEMA DE ALIMENTACION SENA", 40, 32);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(subtitulo, 40, 48);

  // Titulo del reporte y fecha
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(titulo, 40, 85);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generado: ${fechaHoy} | Total registros: ${datos.length}`, 40, 100);

  // Normalizar encabezados (soportar tanto array de strings como array de objetos { header: '...', key: '...' })
  const encabezados = columnas.map((c) =>
    typeof c === "object" && c !== null ? (c.header || c.title || c.name || "") : String(c)
  );

  // Normalizar filas (soportar array de arrays o array de objetos)
  let filasDatos = datos;
  if (datos.length > 0 && !Array.isArray(datos[0]) && typeof datos[0] === "object") {
    const keys = columnas.map((c) =>
      typeof c === "object" && c !== null ? (c.key || c.dataKey || c.field || null) : null
    );
    filasDatos = datos.map((fila) => {
      const valoresObj = Object.values(fila);
      return encabezados.map((enc, idx) => {
        const k = keys[idx];
        if (k && fila[k] !== undefined) return String(fila[k] ?? "");
        if (fila[enc] !== undefined) return String(fila[enc] ?? "");
        return String(valoresObj[idx] ?? "");
      });
    });
  }

  // Tabla con AutoTable
  autoTable(doc, {
    startY: 110,
    head: [encabezados],
    body: filasDatos,
    theme: "striped",
    headStyles: {
      fillColor: [46, 87, 146],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "center"
    },
    styles: {
      fontSize: 8,
      cellPadding: 4,
      overflow: "linebreak",
      valign: "middle"
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { top: 110, left: 30, right: 30, bottom: 40 },
    didDrawPage: (data) => {
      // Pie de pagina en cada hoja
      const str = `Pagina ${doc.internal.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        str,
        data.settings.margin.left,
        doc.internal.pageSize.getHeight() - 15
      );
      doc.text(
        'Centro Agropecuario "La Granja" del Espinal-Tolima - Oficina de Bienestar al Aprendiz',
        doc.internal.pageSize.getWidth() - data.settings.margin.right,
        doc.internal.pageSize.getHeight() - 15,
        { align: "right" }
      );
    }
  });

  const fechaArchivo = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
  doc.save(`${limpiarNombreArchivo(nombreArchivo)}_${fechaArchivo}.pdf`);
};

export default {
  exportarAExcel,
  exportarAPDF,
  confirmarExportacion,
  descargarBlobUniversal,
  limpiarNombreArchivo
};
