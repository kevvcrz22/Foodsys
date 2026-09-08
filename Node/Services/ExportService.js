// Node/Services/ExportService.js
import PDFDocument from "pdfkit";
import ExcelJS     from "exceljs";

class ExportService {

  /* ═══════════════════════════════════════
     PDF  —  usa pdfkit
     npm install pdfkit
  ═══════════════════════════════════════ */
  async generarPDF(datos, periodo) {
    return new Promise((resolve, reject) => {
      const doc     = new PDFDocument({ margin: 50, size: "A4" });
      const chunks  = [];

      doc.on("data",  (chunk) => chunks.push(chunk));
      doc.on("end",   ()      => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      /* ── Encabezado ── */
      doc
        .fontSize(20)
        .fillColor("#1e3a8a")
        .text("FOODSYS — Reporte de Reservas", { align: "center" });

      doc
        .fontSize(12)
        .fillColor("#6b7280")
        .text(`Período: ${periodo.charAt(0).toUpperCase() + periodo.slice(1)}`, { align: "center" });

      doc
        .fontSize(10)
        .text(`Generado: ${new Date().toLocaleString("es-CO")}`, { align: "center" })
        .moveDown(1.5);

      /* ── Tabla ── */
      const cols  = ["Período", "Total", "Desayunos", "Almuerzos", "Cenas"];
      const widths = [160, 70, 80, 80, 80];
      const startX = 50;
      let   y      = doc.y;

      // Cabecera
      doc.rect(startX, y, widths.reduce((a, b) => a + b, 0), 20).fill("#1e3a8a");
      let x = startX;
      cols.forEach((col, i) => {
        doc
          .fontSize(9)
          .fillColor("#ffffff")
          .text(col, x + 4, y + 5, { width: widths[i] - 8, align: "center" });
        x += widths[i];
      });
      y += 20;

      // Filas
      datos.forEach((row, idx) => {
        const bg = idx % 2 === 0 ? "#f0f9ff" : "#ffffff";
        doc.rect(startX, y, widths.reduce((a, b) => a + b, 0), 18).fill(bg);

        const values = [
          row.label || row.periodo,
          row.total,
          row.desayunos,
          row.almuerzos,
          row.cenas,
        ];
        x = startX;
        values.forEach((val, i) => {
          doc
            .fontSize(9)
            .fillColor("#1f2937")
            .text(String(val ?? 0), x + 4, y + 4, { width: widths[i] - 8, align: i === 0 ? "left" : "center" });
          x += widths[i];
        });
        y += 18;

        // Nueva página si es necesario
        if (y > doc.page.height - 80) { doc.addPage(); y = 50; }
      });

      /* ── Totales ── */
      const total = datos.reduce((acc, r) => acc + Number(r.total || 0), 0);
      doc.moveDown(1)
        .fontSize(11)
        .fillColor("#1e3a8a")
        .text(`Total general de reservas: ${total}`, startX, y + 10);

      doc.end();
    });
  }

  /* ═══════════════════════════════════════
     EXCEL  —  usa exceljs
     npm install exceljs
  ═══════════════════════════════════════ */
  async generarExcel(datos, periodo) {
    const wb  = new ExcelJS.Workbook();
    const ws  = wb.addWorksheet(`Reporte ${periodo}`);

    /* Metadatos */
    wb.creator  = "Foodsys";
    wb.created  = new Date();
    wb.modified = new Date();

    /* ── Título ── */
    ws.mergeCells("A1:E1");
    ws.getCell("A1").value     = `FOODSYS — Reporte ${periodo.charAt(0).toUpperCase() + periodo.slice(1)}`;
    ws.getCell("A1").font      = { bold: true, size: 14, color: { argb: "FF1E3A8A" } };
    ws.getCell("A1").alignment = { horizontal: "center" };

    ws.mergeCells("A2:E2");
    ws.getCell("A2").value     = `Generado: ${new Date().toLocaleString("es-CO")}`;
    ws.getCell("A2").font      = { italic: true, size: 10, color: { argb: "FF6B7280" } };
    ws.getCell("A2").alignment = { horizontal: "center" };

    ws.addRow([]);

    /* ── Cabecera de tabla ── */
    const headerRow = ws.addRow(["Período", "Total", "Desayunos", "Almuerzos", "Cenas"]);
    headerRow.eachCell((cell) => {
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
      cell.font      = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.alignment = { horizontal: "center" };
      cell.border    = {
        top:    { style: "thin" },
        left:   { style: "thin" },
        bottom: { style: "thin" },
        right:  { style: "thin" },
      };
    });

    /* ── Filas de datos ── */
    datos.forEach((row, idx) => {
      const dataRow = ws.addRow([
        row.label || row.periodo,
        Number(row.total      || 0),
        Number(row.desayunos  || 0),
        Number(row.almuerzos  || 0),
        Number(row.cenas      || 0),
      ]);
      const bg = idx % 2 === 0 ? "FFF0F9FF" : "FFFFFFFF";
      dataRow.eachCell((cell, col) => {
        cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
        cell.alignment = { horizontal: col === 1 ? "left" : "center" };
        cell.border    = {
          top:    { style: "hair" },
          left:   { style: "hair" },
          bottom: { style: "hair" },
          right:  { style: "hair" },
        };
      });
    });

    /* ── Fila de total ── */
    const totalReservas = datos.reduce((acc, r) => acc + Number(r.total || 0), 0);
    ws.addRow([]);
    const totalRow = ws.addRow(["TOTAL GENERAL", totalReservas, "", "", ""]);
    totalRow.getCell(1).font = { bold: true };
    totalRow.getCell(2).font = { bold: true };

    /* ── Anchos de columna ── */
    ws.columns = [
      { width: 22 },
      { width: 10 },
      { width: 13 },
      { width: 13 },
      { width: 10 },
    ];

    return wb.xlsx.writeBuffer();
  }

  /* ═══════════════════════════════════════
     PDF INASISTENCIAS / NO CONSUMIDOS
  ═══════════════════════════════════════ */
  async generarPDFNoConsumidos(data, filtros = {}) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      /* ── Encabezado ── */
      doc
        .fontSize(18)
        .fillColor("#b91c1c")
        .text("FOODSYS — Inasistencias y Reservas No Consumidas", { align: "center" });

      const periodoLabel = (filtros.periodo || "Diario").toUpperCase();
      doc
        .fontSize(11)
        .fillColor("#4b5563")
        .text(`Período: ${periodoLabel}  |  Alimento: ${filtros.tipoAlimento || "Todos"}`, { align: "center" });

      doc
        .fontSize(9)
        .text(`Generado: ${new Date().toLocaleString("es-CO")}`, { align: "center" })
        .moveDown(1);

      /* ── Métricas Resumen ── */
      const res = data.resumen || {};
      const resumenText = `Total No Consumidos: ${res.totalNoConsumidos || 0}  |  Desayunos: ${res.desayunos || 0}  |  Almuerzos: ${res.almuerzos || 0}  |  Cenas: ${res.cenas || 0}  |  Aprendices: ${res.totalAprendicesUnicos || 0}`;
      doc
        .fontSize(9)
        .fillColor("#1f2937")
        .text(resumenText, { align: "center" })
        .moveDown(1);

      /* ── Tabla ── */
      const cols = ["Fecha", "Aprendiz", "Documento", "Ficha", "Tipo", "Plato Reservado"];
      const widths = [65, 140, 75, 55, 65, 115];
      const startX = 40;
      let y = doc.y;

      // Cabecera de la tabla
      doc.rect(startX, y, widths.reduce((a, b) => a + b, 0), 20).fill("#b91c1c");
      let x = startX;
      cols.forEach((col, i) => {
        doc
          .fontSize(8.5)
          .fillColor("#ffffff")
          .text(col, x + 3, y + 5, { width: widths[i] - 6, align: i === 1 || i === 5 ? "left" : "center" });
        x += widths[i];
      });
      y += 20;

      // Filas
      const registros = data.registros || [];
      registros.forEach((row, idx) => {
        const bg = idx % 2 === 0 ? "#fef2f2" : "#ffffff";
        doc.rect(startX, y, widths.reduce((a, b) => a + b, 0), 18).fill(bg);

        const values = [
          row.Fec_Reserva || "--",
          row.aprendiz?.nombreCompleto || "--",
          row.aprendiz?.NumDoc_Usuario || "--",
          row.aprendiz?.Num_Ficha || "--",
          row.Tip_Reserva || "--",
          row.plato?.Nom_Plato || "--"
        ];

        x = startX;
        values.forEach((val, i) => {
          doc
            .fontSize(8)
            .fillColor("#1f2937")
            .text(String(val), x + 3, y + 4, {
              width: widths[i] - 6,
              align: i === 1 || i === 5 ? "left" : "center",
              ellipsis: true
            });
          x += widths[i];
        });
        y += 18;

        if (y > doc.page.height - 60) {
          doc.addPage();
          y = 40;
        }
      });

      if (registros.length === 0) {
        doc.rect(startX, y, widths.reduce((a, b) => a + b, 0), 25).fill("#f9fafb");
        doc
          .fontSize(9)
          .fillColor("#6b7280")
          .text("No se encontraron inasistencias para el período y filtros seleccionados.", startX, y + 8, {
            width: widths.reduce((a, b) => a + b, 0),
            align: "center"
          });
      }

      doc.end();
    });
  }

  /* ═══════════════════════════════════════
     EXCEL INASISTENCIAS / NO CONSUMIDOS
  ═══════════════════════════════════════ */
  async generarExcelNoConsumidos(data, filtros = {}) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("No Consumidos");

    wb.creator = "Foodsys";
    wb.created = new Date();

    const periodoLabel = (filtros.periodo || "Diario").toUpperCase();
    const titulo = ws.addRow([`FOODSYS — REPORTE DE INASISTENCIAS (${periodoLabel})`]);
    titulo.font = { size: 14, bold: true, color: { argb: "FFB91C1C" } };
    ws.addRow([`Fecha de generación: ${new Date().toLocaleString("es-CO")}  |  Filtro Alimento: ${filtros.tipoAlimento || "Todos"}`]);
    
    const res = data.resumen || {};
    ws.addRow([
      `Total no consumidos: ${res.totalNoConsumidos || 0}`,
      `Desayunos: ${res.desayunos || 0}`,
      `Almuerzos: ${res.almuerzos || 0}`,
      `Cenas: ${res.cenas || 0}`,
      `Aprendices únicos: ${res.totalAprendicesUnicos || 0}`,
      `Sancionados: ${res.totalSancionados || 0}`
    ]);
    ws.addRow([]);

    const cabeceras = [
      "#",
      "Fecha",
      "Tipo Doc",
      "Documento",
      "Aprendiz",
      "Ficha",
      "Programa de Formación",
      "Tipo de Comida",
      "Plato Reservado",
      "Estado",
      "Sancionado",
      "Teléfono",
      "Correo"
    ];

    const headerRow = ws.addRow(cabeceras);
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB91C1C" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    const registros = data.registros || [];
    registros.forEach((row, idx) => {
      const dataRow = ws.addRow([
        idx + 1,
        row.Fec_Reserva || "",
        row.aprendiz?.TipDoc_Usuario || "",
        row.aprendiz?.NumDoc_Usuario || "",
        row.aprendiz?.nombreCompleto || "",
        row.aprendiz?.Num_Ficha || "",
        row.aprendiz?.Nom_Programa || "",
        row.Tip_Reserva || "",
        row.plato?.Nom_Plato || "",
        row.Est_Reserva || "",
        row.aprendiz?.San_Usuario || "No",
        row.aprendiz?.Tel_Usuario || "",
        row.aprendiz?.Cor_Usuario || ""
      ]);

      const bg = idx % 2 === 0 ? "FFFEF2F2" : "FFFFFFFF";
      dataRow.eachCell((cell, col) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
        cell.alignment = {
          horizontal: [1, 2, 3, 4, 8, 10, 11].includes(col) ? "center" : "left",
          vertical: "middle"
        };
        cell.border = {
          top: { style: "hair" },
          left: { style: "hair" },
          bottom: { style: "hair" },
          right: { style: "hair" },
        };
      });
    });

    ws.columns = [
      { width: 6 },
      { width: 13 },
      { width: 10 },
      { width: 15 },
      { width: 28 },
      { width: 12 },
      { width: 30 },
      { width: 15 },
      { width: 25 },
      { width: 12 },
      { width: 12 },
      { width: 14 },
      { width: 28 },
    ];

    return wb.xlsx.writeBuffer();
  }
}

export default new ExportService();