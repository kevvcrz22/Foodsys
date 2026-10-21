// Frontend/src/utils/exportUtils.js
// Utilidad universal y multiplataforma para exportar datos a Excel (.xlsx) y PDF (.pdf)
// Compatible con iOS Safari, Android, Windows, macOS y Linux
// Codigo didactico sin tildes ni emojis para aprendices de primer semestre

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from "sweetalert2";

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
export const confirmarExportacion = async ({
  totalOriginal,
  totalFiltrado,
  tieneFiltrosActivos = false,
  formato = "Excel", // 'Excel' o 'PDF'
  nombreModulo = "registros"
}) => {
  // Caso A: No hay filtros activos
  if (!tieneFiltrosActivos || totalOriginal === totalFiltrado) {
    const resultado = await Swal.fire({
      title: `¿Exportar ${formato}?`,
      text: `No has aplicado ningun filtro en esta tabla. ¿Deseas exportar todos los ${totalOriginal} ${nombreModulo} completos?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2E5792",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Si, exportar todos (${totalOriginal})`,
      cancelButtonText: "Cancelar",
      reverseButtons: true
    });

    return resultado.isConfirmed ? "todos" : null;
  }

  // Caso B: Si hay filtros aplicados
  const resultado = await Swal.fire({
    title: `¿Que deseas exportar a ${formato}?`,
    html: `Tienes filtros activos en pantalla.<br>Puedes descargar los <b>${totalFiltrado}</b> registros filtrados o la lista completa de <b>${totalOriginal}</b> registros.`,
    icon: "question",
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonColor: "#2E5792",
    denyButtonColor: "#0d9488",
    cancelButtonColor: "#6b7280",
    confirmButtonText: `Exportar filtrados (${totalFiltrado})`,
    denyButtonText: `Exportar todos (${totalOriginal})`,
    cancelButtonText: "Cancelar"
  });

  if (resultado.isConfirmed) return "filtrados";
  if (resultado.isDenied) return "todos";
  return null;
};

/**
 * Genera y descarga un archivo Excel (.xlsx) con auto-ajuste de columnas
 */
export const exportarAExcel = ({
  datos,
  columnas = null,
  nombreArchivo = "Reporte_Foodsys",
  nombreHoja = "Datos",
  tituloHoja = "Datos"
}) => {
  if (!datos || datos.length === 0) {
    Swal.fire({
      title: "Sin datos",
      text: "No hay registros disponibles para exportar.",
      icon: "info",
      confirmButtonColor: "#2E5792"
    });
    return;
  }

  const nombreFinalHoja = (tituloHoja || nombreHoja || "Datos").substring(0, 31);

  // Mapear datos a encabezados legibles si se proporciono la definicion de columnas
  let datosExportar = datos;
  if (Array.isArray(columnas) && columnas.length > 0 && typeof datos[0] === "object" && !Array.isArray(datos[0])) {
    datosExportar = datos.map((fila) => {
      const filaMapeada = {};
      columnas.forEach((col) => {
        const key = typeof col === "object" && col !== null ? col.key : col;
        const header = typeof col === "object" && col !== null ? (col.header || col.title || col.key) : col;
        const valor = fila[key];
        filaMapeada[header] = valor !== null && valor !== undefined ? valor : "";
      });
      return filaMapeada;
    });
  }

  // Crear libro y hoja con los datos
  const hoja = XLSX.utils.json_to_sheet(datosExportar);
  const libro = XLSX.utils.book_new();

  // Calcular ancho automatico de columnas basado en el contenido
  const encabezados = Object.keys(datosExportar[0] || {});
  const anchos = encabezados.map((col) => {
    let maxLongitud = col.length;
    datosExportar.forEach((fila) => {
      const val = fila[col] !== null && fila[col] !== undefined ? String(fila[col]) : "";
      if (val.length > maxLongitud) {
        maxLongitud = val.length;
      }
    });
    return { wch: Math.min(Math.max(maxLongitud + 3, 12), 45) };
  });

  hoja["!cols"] = anchos;
  XLSX.utils.book_append_sheet(libro, hoja, nombreFinalHoja);

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
  columnas = [], // Array de encabezados visibles: ['N° Doc', 'Nombre'] o [{ header: 'Doc', key: 'NumDoc' }]
  datos = [],    // Matriz de filas [['1003810', 'Carlos']] o array de objetos [{ NumDoc: '1003810' }]
  nombreArchivo = "Reporte_Foodsys",
  orientacion = "landscape" // 'portrait' o 'landscape'
}) => {
  if (!datos || datos.length === 0) {
    Swal.fire({
      title: "Sin datos",
      text: "No hay registros disponibles para exportar.",
      icon: "info",
      confirmButtonColor: "#2E5792"
    });
    return;
  }

  // Normalizar encabezados de columna para evitar [object Object]
  const encabezadosTexto = (columnas || []).map((col) => {
    if (typeof col === "object" && col !== null) {
      return col.header || col.title || col.key || "";
    }
    return String(col);
  });

  // Normalizar filas para autoTable
  let filasNormalizadas = [];
  if (datos.length > 0) {
    if (Array.isArray(datos[0])) {
      // Ya viene como matriz de arrays [[val1, val2]]
      filasNormalizadas = datos;
    } else {
      // Viene como array de objetos [{ key: val }]
      filasNormalizadas = datos.map((fila) => {
        return (columnas || []).map((col) => {
          const key = typeof col === "object" && col !== null ? col.key : col;
          const valor = fila[key];
          if (valor === null || valor === undefined) return "";
          return String(valor);
        });
      });
    }
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

  // Tabla con AutoTable
  autoTable(doc, {
    startY: 110,
    head: [encabezadosTexto],
    body: filasNormalizadas,
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
