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
}

export default new ExportService();