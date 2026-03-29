// Node/Controllers/ReportesController.js
import ReportesService from "../Services/ReportesServices.js";
import ExportService   from "../Services/ExportService.js";

export const getReporteDiario = async (req, res) => {
  try {
    const data = await ReportesService.getDiario();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getReporteSemanal = async (req, res) => {
  try {
    const data = await ReportesService.getSemanal();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getReporteMensual = async (req, res) => {
  try {
    const data = await ReportesService.getMensual();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getReporteAnual = async (req, res) => {
  try {
    const data = await ReportesService.getAnual();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── Exportar PDF ── */
export const exportarPDF = async (req, res) => {
  try {
    const { periodo = "mensual" } = req.query;
    const datos = await ReportesService.getPorPeriodo(periodo);
    const pdfBuffer = await ExportService.generarPDF(datos, periodo);
    res.set({
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="Reporte_${periodo}.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── Exportar Excel ── */
export const exportarExcel = async (req, res) => {
  try {
    const { periodo = "mensual" } = req.query;
    const datos = await ReportesService.getPorPeriodo(periodo);
    const buffer = await ExportService.generarExcel(datos, periodo);
    res.set({
      "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Reporte_${periodo}.xlsx"`,
    });
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};