// Node/Controllers/ReportesController.js
//
// Controlador de reportes estadisticos para FoodSys.
// Cada funcion extrae los parametros de la peticion HTTP, llama al metodo
// correspondiente de ReportesService y devuelve la respuesta JSON.
//
// No existe logica de negocio ni SQL en este archivo.
// Todo el procesamiento de datos ocurre en Services/ReportesServices.js.
//
// Funciones originales (sin modificacion):
//   getReporteDiario, getReporteSemanal, getReporteMensual,
//   getReporteAnual, getReportePersonalizado, exportarPDF, exportarExcel
//
// Funciones nuevas:
//   getReporteDiarioDetalle  - Detalle de reservas de un dia con datos de usuario y plato
//   getReporteSemanalDesglose - Desglose dia a dia de una semana ISO
//   getReporteDiaDetalle     - Detalle al hacer clic en un dia del desglose semanal
//   getResumenSemanalPlatos  - Top platos consumidos en la semana
//   getReporteAnualDesglose  - Desglose mes a mes de un año especifico
//   getTiempoReal            - Estadisticas del dia actual sin cache (polling)
//   getAprendizReporte       - Perfil completo de reservas de un aprendiz por documento
//   actualizarSancion        - Cambia San_Usuario del aprendiz (Si / No)
//   getPlatosTopConsumo      - Top N platos consumidos en un periodo dado

import ReportesService from "../Services/ReportesServices.js";
import ExportService   from "../Services/ExportService.js";

// =========================================================================
// FUNCIONES ORIGINALES — sin ninguna modificacion
// =========================================================================

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

export const getReportePersonalizado = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, tipoAlimento } = req.query;
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ message: "Las fechas de inicio y fin son obligatorias." });
    }
    const data = await ReportesService.getPersonalizado(fechaInicio, fechaFin, tipoAlimento);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const exportarPDF = async (req, res) => {
  try {
    const { periodo = "mensual", fechaInicio, fechaFin, tipoAlimento } = req.query;
    const datos = await ReportesService.getPorPeriodo(periodo, { fechaInicio, fechaFin, tipoAlimento });
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

export const exportarExcel = async (req, res) => {
  try {
    const { periodo = "mensual", fechaInicio, fechaFin, tipoAlimento } = req.query;
    const datos = await ReportesService.getPorPeriodo(periodo, { fechaInicio, fechaFin, tipoAlimento });
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

// =========================================================================
// FUNCIONES NUEVAS
// =========================================================================

// GET /api/Reportes/diario/detalle?fecha=YYYY-MM-DD&tipo=Almuerzo&estado=Consumido
//
// Retorna el listado completo de reservas de un dia especifico con datos
// de usuario (nombre, documento, correo, telefono, rol) y plato consumido.
// Los parametros tipo y estado son opcionales; si se omiten se traen todos.
// El frontend usa esta respuesta para renderizar la tabla detallada debajo de las graficas.
export const getReporteDiarioDetalle = async (req, res) => {
  try {
    const { fecha, tipo, estado } = req.query;
    if (!fecha) {
      return res.status(400).json({ message: "El parametro fecha es obligatorio (YYYY-MM-DD)" });
    }
    const data = await ReportesService.getDiarioDetalle(fecha, tipo, estado);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/Reportes/semanal/desglose?anio=2026&semana=19
//
// Retorna el resumen dia a dia (Lunes-Domingo) de una semana ISO especifica.
// Cada elemento del array tiene el nombre del dia, totales por tipo de comida
// y contadores de estado (consumidas, canceladas, vencidas).
// El frontend lo usa para el panel de semana con filas clicables.
export const getReporteSemanalDesglose = async (req, res) => {
  try {
    const { anio, semana } = req.query;
    if (!anio || !semana) {
      return res.status(400).json({ message: "Los parametros anio y semana son obligatorios" });
    }
    const data = await ReportesService.getSemanalDesglose(parseInt(anio), parseInt(semana));
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/Reportes/semanal/dia?fecha=YYYY-MM-DD&tipo=Todos&estado=Todos
//
// Retorna el detalle individual de las reservas de un dia dentro del desglose semanal.
// Se activa cuando el coordinador hace clic en una fila del panel semanal (Miercoles, etc.).
// Reutiliza getDiarioDetalle internamente; el endpoint separado existe para claridad de URL.
export const getReporteDiaDetalle = async (req, res) => {
  try {
    const { fecha, tipo, estado } = req.query;
    if (!fecha) {
      return res.status(400).json({ message: "El parametro fecha es obligatorio (YYYY-MM-DD)" });
    }
    const data = await ReportesService.getDiaDetalle(fecha, tipo, estado);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/Reportes/semanal/platos?anio=2026&semana=19
//
// Retorna los platos mas consumidos durante la semana indicada agrupados por tipo.
// Incluye Img_Plato y Des_Plato para el panel visual de ranking de platos.
// Solo cuenta reservas con estado Consumido.
export const getResumenSemanalPlatos = async (req, res) => {
  try {
    const { anio, semana } = req.query;
    if (!anio || !semana) {
      return res.status(400).json({ message: "Los parametros anio y semana son obligatorios" });
    }
    const data = await ReportesService.getResumenSemanalPlatos(parseInt(anio), parseInt(semana));
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/Reportes/anual/desglose?anio=2026
//
// Retorna el desglose mes a mes de un año especifico.
// Diferencia de getReporteAnual: ese agrupa varios años; este profundiza en un año puntual.
// Permite al Coordinador ver enero, febrero... de 2026 con sus respectivos totales.
export const getReporteAnualDesglose = async (req, res) => {
  try {
    const { anio } = req.query;
    if (!anio) {
      return res.status(400).json({ message: "El parametro anio es obligatorio" });
    }
    const data = await ReportesService.getAnualDesglose(parseInt(anio));
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/Reportes/tiempo-real
//
// Retorna las estadisticas del dia actual calculadas en el momento de la peticion.
// El frontend hace polling cada 30 segundos con esta ruta para el panel de tiempo real.
// No se aplica cache porque los datos deben reflejar el estado exacto de la BD.
//
// La respuesta incluye:
//   resumen         - Contadores globales del dia (total, consumidas, vencidas, etc.)
//   ultimasConsumos - Ultimas 10 reservas consumidas hoy (feed en vivo)
//   porHora         - Consumos por hora (curva de demanda del dia)
export const getTiempoReal = async (req, res) => {
  try {
    const data = await ReportesService.getTiempoReal();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/Reportes/aprendiz?documento=1003810633&fechaInicio=2026-01-01&fechaFin=2026-05-09
//
// Retorna el perfil completo de un aprendiz identificado por su numero de documento.
// El objeto de respuesta contiene:
//   perfil   - Datos personales y totales agregados de reservas
//   roles    - Array de strings con los nombres de roles del aprendiz
//   historial - Array de reservas ordenadas por fecha descendente
//
// Los parametros fechaInicio y fechaFin son opcionales.
// Si se omiten se retorna todo el historial del aprendiz sin filtro de fecha.
export const getAprendizReporte = async (req, res) => {
  try {
    const { documento, fechaInicio, fechaFin } = req.query;
    if (!documento) {
      return res.status(400).json({ message: "El numero de documento es obligatorio" });
    }
    const data = await ReportesService.getAprendizReporte(documento, fechaInicio, fechaFin);
    if (!data) {
      return res.status(404).json({ message: "No se encontro ningun aprendiz con ese documento" });
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/Reportes/aprendiz/sancion
//
// Cambia el campo San_Usuario de un aprendiz especifico.
// Body: { Id_Usuario: number, San_Usuario: "Si" | "No" }
//
// Solo debe ser accedido por roles administrativos (Coordinador, Administrador, Bienestar).
// La validacion de rol se hace en la ruta mediante el middleware correspondiente.
export const actualizarSancion = async (req, res) => {
  try {
    const { Id_Usuario, San_Usuario } = req.body;
    if (!Id_Usuario || !["Si", "No"].includes(San_Usuario)) {
      return res.status(400).json({
        message: "Id_Usuario es obligatorio y San_Usuario debe ser 'Si' o 'No'"
      });
    }
    await ReportesService.actualizarSancion(parseInt(Id_Usuario), San_Usuario);
    res.status(200).json({ message: `Sancion actualizada correctamente a '${San_Usuario}'` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/Reportes/platos/top?periodo=mensual&n=5
//
// Retorna los N platos mas consumidos en el periodo indicado.
// Parametros:
//   periodo - "diario" | "semanal" | "mensual" | "anual"  (default: mensual)
//   n       - Cantidad de platos a retornar (max 20, default 5)
//
// Incluye Img_Plato, Nom_Plato, Des_Plato y veces_consumido.
// El frontend lo usa para el ranking visual de platos en el panel de tiempo real y reportes.
export const getPlatosTopConsumo = async (req, res) => {
  try {
    const { periodo = "mensual", n = 5 } = req.query;
    const data = await ReportesService.getPlatosTopConsumo(periodo, n);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};