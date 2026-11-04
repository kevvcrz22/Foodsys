// Node/Services/ExportService.js
import PDFDocument from "pdfkit";
import ExcelJS     from "exceljs";

class ExportService {

  /* ═══════════════════════════════════════
     PDF  —  usa pdfkit
     npm install pdfkit
  ═══════════════════════════════════════ */
  /* ═══════════════════════════════════════
     PDF  —  usa pdfkit institucional
     npm install pdfkit
  ═══════════════════════════════════════ */
  async generarPDF(datos, periodo = "mensual", filtros = {}) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 36, size: "A4", bufferPages: true });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const esNuevoFormato = datos && datos.resumen && Array.isArray(datos.registros);
      const res = esNuevoFormato ? datos.resumen : {};
      const registros = esNuevoFormato ? datos.registros : (Array.isArray(datos) ? datos : []);
      const rango = esNuevoFormato && datos.rango ? `${datos.rango.inicio} a ${datos.rango.fin}` : "";

      /* ── Encabezado Institucional ── */
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor("#0f3f80")
        .text("SENA — CENTRO AGROPECUARIO 'LA GRANJA'", { align: "center" });

      doc
        .fontSize(9.5)
        .font("Helvetica")
        .fillColor("#374151")
        .text("Foodsys — Sistema Integral de Gestión Alimentaria · Regional Tolima", { align: "center" });

      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .fillColor("#1e3a8a")
        .text(`Reporte de Auditoría y Reservas — Período: ${periodo.toUpperCase()}${rango ? ` (${rango})` : ""}`, { align: "center" });

      doc
        .fontSize(8.5)
        .font("Helvetica")
        .fillColor("#6b7280")
        .text(`Generado: ${new Date().toLocaleString("es-CO")}  |  Filtro Alimento: ${filtros.tipoAlimento || "Todos"}`, { align: "center" })
        .moveDown(0.8);

      /* ── Tarjetas y Métricas Resumen ── */
      const startX = 36;
      const widthTotal = doc.page.width - 72;
      let y = doc.y;

      if (esNuevoFormato) {
        doc.rect(startX, y, widthTotal, 44).fill("#f8fafc").stroke("#e2e8f0");
        doc.fillColor("#0f172a");

        const colW = widthTotal / 5;
        const metricas = [
          { label: "Total Reservas", val: res.totalReservas || 0 },
          { label: "Consumidas", val: res.totalConsumidas || 0 },
          { label: "Verificadas", val: res.totalVerificadas || 0 },
          { label: "Inasistencias / Venc.", val: res.totalVencidas || 0 },
          { label: "% Cumplimiento", val: `${res.porcentajeAsistencia || 0}%` },
        ];

        metricas.forEach((m, idx) => {
          const mx = startX + idx * colW;
          doc.fontSize(8).font("Helvetica").fillColor("#64748b").text(m.label, mx + 2, y + 6, { width: colW - 4, align: "center" });
          doc.fontSize(11).font("Helvetica-Bold").fillColor("#0f3f80").text(String(m.val), mx + 2, y + 22, { width: colW - 4, align: "center" });
        });

        y += 52;

        /* ── Gráfica Vectorial Integrada de Estados ── */
        doc.fontSize(9).font("Helvetica-Bold").fillColor("#1e293b").text("Distribución Comparativa por Estado de Reserva:", startX, y);
        y += 14;

        const estadosGrafica = [
          { label: "Generadas", count: res.totalGeneradas || 0, color: "#10B981" },
          { label: "Consumidas", count: res.totalConsumidas || 0, color: "#64748B" },
          { label: "Verificadas", count: res.totalVerificadas || 0, color: "#F59E0B" },
          { label: "Canceladas / Vencidas", count: (res.totalCanceladas || 0) + (res.totalVencidas || 0), color: "#EF4444" }
        ];

        const maxCount = Math.max(...estadosGrafica.map(g => g.count), 1);
        const barMaxW = 280;

        estadosGrafica.forEach(item => {
          const barW = Math.max((item.count / maxCount) * barMaxW, 4);
          doc.fontSize(8).font("Helvetica").fillColor("#334155").text(item.label, startX, y + 2, { width: 110 });
          doc.rect(startX + 115, y, barW, 10).fill(item.color);
          doc.fontSize(8).font("Helvetica-Bold").fillColor("#0f172a").text(String(item.count), startX + 120 + barW, y + 1);
          y += 14;
        });

        y += 10;
        doc.y = y;
      }

      /* ── Tabla Nominal Detallada (100% de los registros del periodo) ── */
      y = doc.y;
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#0f3f80").text(`Detalle Nominal Completo de Reservas (${registros.length} registros):`, startX, y);
      y += 16;

      const cols = ["Fecha", "Documento", "Aprendiz / Pasante", "Rol", "Ficha", "Comida", "Plato", "Bebida", "Estado"];
      const widths = [52, 62, 110, 48, 48, 48, 70, 52, 44];
      const tableW = widths.reduce((a, b) => a + b, 0);

      // Cabecera de la tabla nominal
      doc.rect(startX, y, tableW, 18).fill("#0f3f80");
      let x = startX;
      cols.forEach((col, i) => {
        doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#ffffff").text(col, x + 2, y + 4, { width: widths[i] - 4, align: i === 2 || i === 6 ? "left" : "center" });
        x += widths[i];
      });
      y += 18;

      registros.forEach((row, idx) => {
        const bg = idx % 2 === 0 ? "#f8fafc" : "#ffffff";
        doc.rect(startX, y, tableW, 16).fill(bg);

        const values = [
          row.Fecha || row.periodo || "—",
          String(row.NumDoc || "—"),
          row.NombreCompleto || row.label || "—",
          row.Rol ? (row.Rol.includes("Interno") ? "Interno" : "Externo") : "—",
          String(row.Num_Ficha || "—"),
          row.Tipo_Comida || "—",
          row.Plato || "—",
          row.Bebida || "Ninguna",
          row.Estado || "—"
        ];

        x = startX;
        values.forEach((val, i) => {
          let textCol = "#1f2937";
          if (i === 8) {
            if (val === "Generado") textCol = "#059669";
            else if (val === "Consumido") textCol = "#475569";
            else if (val === "Verificado") textCol = "#d97706";
            else if (val === "Cancelado" || val === "Vencido") textCol = "#dc2626";
          }

          doc.fontSize(7).font(i === 8 ? "Helvetica-Bold" : "Helvetica").fillColor(textCol).text(String(val), x + 2, y + 4, {
            width: widths[i] - 4,
            align: i === 2 || i === 6 ? "left" : "center",
            ellipsis: true
          });
          x += widths[i];
        });
        y += 16;

        if (y > doc.page.height - 45) {
          doc.addPage();
          y = 36;
          // Repetir cabecera en nueva página
          doc.rect(startX, y, tableW, 18).fill("#0f3f80");
          let xHeader = startX;
          cols.forEach((col, i) => {
            doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#ffffff").text(col, xHeader + 2, y + 4, { width: widths[i] - 4, align: i === 2 || i === 6 ? "left" : "center" });
            xHeader += widths[i];
          });
          y += 18;
        }
      });

      if (registros.length === 0) {
        doc.rect(startX, y, tableW, 20).fill("#f9fafb");
        doc.fontSize(8).font("Helvetica").fillColor("#6b7280").text("No se registraron reservas para este período y filtros.", startX, y + 6, { width: tableW, align: "center" });
      }

      doc.end();
    });
  }

  /* ═══════════════════════════════════════
     EXCEL  —  usa exceljs institucional
     npm install exceljs
  ═══════════════════════════════════════ */
  async generarExcel(datos, periodo = "mensual", filtros = {}) {
    const wb = new ExcelJS.Workbook();
    wb.creator = "Foodsys - Centro Agropecuario La Granja";
    wb.created = new Date();

    const ws = wb.addWorksheet(`Reporte ${periodo.toUpperCase()}`);

    const esNuevoFormato = datos && datos.resumen && Array.isArray(datos.registros);
    const res = esNuevoFormato ? datos.resumen : {};
    const registros = esNuevoFormato ? datos.registros : (Array.isArray(datos) ? datos : []);
    const rango = esNuevoFormato && datos.rango ? `${datos.rango.inicio} a ${datos.rango.fin}` : "";

    /* ── Títulos Institucionales ── */
    ws.mergeCells("A1:O1");
    ws.getCell("A1").value = "SENA — CENTRO AGROPECUARIO 'LA GRANJA' (REGIONAL TOLIMA)";
    ws.getCell("A1").font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
    ws.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F3F80" } };
    ws.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(1).height = 28;

    ws.mergeCells("A2:O2");
    ws.getCell("A2").value = `FOODSYS — REPORTE DE AUDITORÍA Y CONTROL DE RESERVAS (${periodo.toUpperCase()}${rango ? ` - ${rango}` : ""})`;
    ws.getCell("A2").font = { bold: true, size: 11, color: { argb: "FF0F3F80" } };
    ws.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(2).height = 20;

    ws.mergeCells("A3:O3");
    ws.getCell("A3").value = `Fecha de Generación: ${new Date().toLocaleString("es-CO")}  |  Filtro Alimento: ${filtros.tipoAlimento || "Todos"}`;
    ws.getCell("A3").font = { italic: true, size: 9, color: { argb: "FF4B5563" } };
    ws.getCell("A3").alignment = { horizontal: "center", vertical: "middle" };

    ws.addRow([]);

    /* ── Bloque Resumen Ejecutivo ── */
    if (esNuevoFormato) {
      ws.mergeCells("A5:O5");
      ws.getCell("A5").value = "RESUMEN EJECUTIVO Y ESTADÍSTICAS DEL PERÍODO";
      ws.getCell("A5").font = { bold: true, size: 10, color: { argb: "FF1E3A8A" } };
      ws.getCell("A5").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F9FF" } };

      const filaMetricas = ws.addRow([
        `Total: ${res.totalReservas || 0}`,
        `Consumidas: ${res.totalConsumidas || 0}`,
        `Verificadas: ${res.totalVerificadas || 0}`,
        `Generadas: ${res.totalGeneradas || 0}`,
        `Inasistencias: ${res.totalVencidas || 0}`,
        `Canceladas: ${res.totalCanceladas || 0}`,
        `Desayunos: ${res.desayunos || 0}`,
        `Almuerzos: ${res.almuerzos || 0}`,
        `Cenas: ${res.cenas || 0}`,
        `Internos: ${res.internos || 0}`,
        `Externos: ${res.externos || 0}`,
        `Cumplimiento: ${res.porcentajeAsistencia || 0}%`,
        "", "", ""
      ]);
      filaMetricas.font = { bold: true, size: 9, color: { argb: "FF0F172A" } };
      ws.addRow([]);
    }

    /* ── Cabecera Tabla Nominal ── */
    const cabeceras = [
      "#",
      "Fecha",
      "Tipo Doc",
      "Documento",
      "Nombre Completo del Aprendiz / Pasante",
      "Rol",
      "Centro Convivencia",
      "N° Ficha",
      "Programa de Formación",
      "Tipo de Comida",
      "Plato",
      "Bebida",
      "Estado",
      "Teléfono",
      "Correo Electrónico"
    ];

    const headerRow = ws.addRow(cabeceras);
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F3F80" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9.5 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    /* ── 100% de los Registros Nominales ── */
    registros.forEach((r, idx) => {
      const dataRow = ws.addRow([
        idx + 1,
        r.Fecha || r.periodo || "",
        r.TipDoc || "CC",
        r.NumDoc || "",
        r.NombreCompleto || r.label || "",
        r.Rol || "",
        r.CenCon_Usuario || "No",
        r.Num_Ficha || "",
        r.Programa || "",
        r.Tipo_Comida || "",
        r.Plato || "",
        r.Bebida || "Ninguna",
        r.Estado || "",
        r.Tel_Usuario || "",
        r.Cor_Usuario || ""
      ]);

      const bg = idx % 2 === 0 ? "FFF8FAFC" : "FFFFFFFF";
      dataRow.eachCell((cell, col) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
        cell.alignment = {
          horizontal: [1, 2, 3, 4, 7, 8, 10, 13].includes(col) ? "center" : "left",
          vertical: "middle"
        };
        cell.font = { size: 9 };
        cell.border = {
          top: { style: "hair" },
          left: { style: "hair" },
          bottom: { style: "hair" },
          right: { style: "hair" },
        };
      });
    });

    ws.columns = [
      { width: 5 },
      { width: 13 },
      { width: 9 },
      { width: 14 },
      { width: 28 },
      { width: 18 },
      { width: 14 },
      { width: 12 },
      { width: 26 },
      { width: 14 },
      { width: 24 },
      { width: 18 },
      { width: 14 },
      { width: 14 },
      { width: 26 },
    ];

    ws.autoFilter = {
      from: { row: headerRow.number, column: 1 },
      to: { row: headerRow.number, column: cabeceras.length }
    };

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