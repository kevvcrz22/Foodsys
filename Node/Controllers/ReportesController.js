// Node/Controllers/ReportesController.js
//
// Controlador de reportes estadisticos de Foodsys.
//
// Responsabilidad de este archivo:
//   1. Recibir la peticion HTTP (req) del router.
//   2. Extraer y validar los parametros (query, body, params).
//   3. Llamar al metodo correspondiente del servicio (ReportesServices.js).
//   4. Enviar la respuesta JSON al cliente (res).
//
// Lo que NO debe hacer este archivo:
//   - Escribir SQL o consultas de base de datos.
//   - Calcular totales, agrupar datos o transformar arrays.
//   - Acceder directamente a modelos de Sequelize.
//   Toda esa logica vive en ReportesServices.js.
//
// Funciones ORIGINALES — no se modifico ni una linea:
//   getReporteDiario, getReporteSemanal, getReporteMensual,
//   getReporteAnual, getReportePersonalizado, exportarPDF, exportarExcel
//
// Funciones NUEVAS — agregadas al final:
//   getReporteDiarioDetalle  -> detalle de reservas de un dia con filtros de tipo y estado
//   getReporteSemanalDesglose -> resumen dia a dia de una semana ISO especifica
//   getReporteDiaDetalle     -> detalle al hacer clic en un dia del desglose semanal
//   getResumenSemanalPlatos  -> ranking de platos consumidos en la semana
//   getReporteAnualDesglose  -> desglose mes a mes de un anio especifico
//   getTiempoReal            -> estadisticas del dia actual para polling en tiempo real
//   getAprendizReporte       -> perfil completo de reservas de un aprendiz por documento
//   actualizarSancion        -> cambia San_Usuario del aprendiz (Si / No)
//   getPlatosTopConsumo      -> top N platos consumidos en el periodo indicado

import ReportesService from "../Services/ReportesServices.js";
import ExportService from "../Services/ExportService.js";

// ===========================================================================
// FUNCIONES ORIGINALES — SIN NINGUNA MODIFICACION
// ===========================================================================

// GET /api/Reportes/diario
// Retorna el resumen de los ultimos 7 dias para el grafico de barras principal.
export const getReporteDiario = async (req, res) => {
  try {
    const data = await ReportesService.getDiario();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/Reportes/semanal
// Retorna el resumen de las ultimas 8 semanas ISO.
export const getReporteSemanal = async (req, res) => {
  try {
    const data = await ReportesService.getSemanal();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/Reportes/mensual
// Retorna el resumen de los ultimos 12 meses.
export const getReporteMensual = async (req, res) => {
  try {
    const data = await ReportesService.getMensual();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/Reportes/anual
// Retorna el resumen de los ultimos 5 anios.
export const getReporteAnual = async (req, res) => {
  try {
    const data = await ReportesService.getAnual();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/Reportes/personalizado
// Query params: fechaInicio (obligatorio), fechaFin (obligatorio), tipoAlimento (opcional)
// Retorna el resumen de reservas en el rango de fechas indicado.
export const getReportePersonalizado = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, tipoAlimento } = req.query;

    // Validar que las fechas esten presentes antes de consultar el servicio
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ message: "Las fechas de inicio y fin son obligatorias." });
    }
    const data = await ReportesService.getPersonalizado(fechaInicio, fechaFin, tipoAlimento);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/Reportes/exportar/pdf
// Genera y envia un archivo PDF con el reporte del periodo indicado.
// Query params: periodo (default: mensual), fechaInicio, fechaFin, tipoAlimento
export const exportarPDF = async (req, res) => {
  try {
    const { periodo = "mensual", fechaInicio, fechaFin, tipoAlimento } = req.query;

    // Obtener los datos del periodo usando el enrutador interno del servicio
    const datos = await ReportesService.getPorPeriodo(periodo, { fechaInicio, fechaFin, tipoAlimento });
    const pdfBuffer = await ExportService.generarPDF(datos, periodo);

    // Indicar al navegador que es un archivo PDF descargable
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Reporte_${periodo}.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/Reportes/exportar/excel
// Genera y envia un archivo Excel (.xlsx) con el reporte del periodo indicado.
// Query params: periodo (default: mensual), fechaInicio, fechaFin, tipoAlimento
export const exportarExcel = async (req, res) => {
  try {
    const { periodo = "mensual", fechaInicio, fechaFin, tipoAlimento } = req.query;

    const datos = await ReportesService.getPorPeriodo(periodo, { fechaInicio, fechaFin, tipoAlimento });
    const buffer = await ExportService.generarExcel(datos, periodo);

    // Indicar al navegador que es un archivo Excel descargable
    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Reporte_${periodo}.xlsx"`,
    });
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===========================================================================
// FUNCIONES NUEVAS — AGREGADAS AL FINAL SIN MODIFICAR LAS ANTERIORES
// ===========================================================================

// GET /api/Reportes/diario/detalle?fecha=YYYY-MM-DD&tipo=Almuerzo&estado=Consumido
//
// Retorna el listado completo de reservas de un dia especifico con datos
// de usuario (nombre, documento, correo, telefono, rol) y plato consumido.
//
// Paso a paso:
//   1. Extraer los parametros fecha, tipo y estado del query string.
//   2. Validar que fecha este presente (es obligatorio).
//   3. Llamar al servicio getDiarioDetalle con los filtros.
//   4. Retornar el objeto { resumen, reservas } al frontend.
export const getReporteDiarioDetalle = async (req, res) => {
  try {
    // Extraer los tres parametros posibles del query string
    const { fecha, tipo, estado } = req.query;

    // La fecha es obligatoria; sin ella no se puede construir la consulta
    if (!fecha) {
      return res.status(400).json({ message: "El parametro fecha es obligatorio (YYYY-MM-DD)" });
    }

    // Llamar al servicio y retornar la respuesta directamente
    const data = await ReportesService.getDiarioDetalle(fecha, tipo, estado);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/Reportes/semanal/desglose?anio=2026&semana=19
//
// Retorna el resumen dia a dia (Lunes-Domingo) de una semana ISO especifica.
// El frontend lo usa para el panel semanal con filas clicables que expanden el detalle.
//
// Paso a paso:
//   1. Extraer anio y semana del query string.
//   2. Convertir a enteros con parseInt para pasarlos correctamente al servicio.
//   3. Validar que ambos esten presentes.
//   4. Llamar a getSemanalDesglose y retornar el resultado.
export const getReporteSemanalDesglose = async (req, res) => {
  try {
    const { anio, semana } = req.query;

    // Ambos parametros son obligatorios para identificar la semana exacta
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
// Se activa cuando el Coordinador hace clic en una fila del panel semanal.
// Internamente reutiliza getDiaDetalle del servicio que a su vez usa getDiarioDetalle.
//
// Paso a paso:
//   1. Extraer la fecha del dia seleccionado y los filtros opcionales.
//   2. Validar que la fecha este presente.
//   3. Delegar al servicio y retornar la respuesta.
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
// Retorna los platos mas consumidos durante la semana indicada.
// Incluye Img_Plato y Des_Plato para el panel visual de ranking de platos.
// Solo cuenta reservas con estado Consumido.
//
// Paso a paso:
//   1. Extraer anio y semana del query string.
//   2. Validar presencia de ambos parametros.
//   3. Llamar al servicio getResumenSemanalPlatos.
//   4. Retornar el ranking de platos.
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
// Retorna el desglose mes a mes de un anio especifico.
// Diferente de getReporteAnual que agrupa varios anios; este profundiza en uno solo.
// El Coordinador puede ver enero, febrero... de 2026 con sus respectivos totales.
//
// Paso a paso:
//   1. Extraer el anio del query string.
//   2. Validar que este presente.
//   3. Llamar al servicio getAnualDesglose.
//   4. Retornar el desglose mensual.
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
// Retorna las estadisticas del dia actual calculadas en tiempo real.
// El frontend hace polling cada 30 segundos con esta ruta para el panel en vivo.
// No requiere parametros; siempre usa la fecha del dia actual.
//
// La respuesta incluye:
//   resumen         - Contadores del dia (total, consumidas, vencidas, etc.)
//   ultimosConsumos - Ultimas 10 reservas consumidas hoy
//   porHora         - Consumos agrupados por hora para la curva de demanda
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
// El objeto de respuesta contiene perfil, roles e historial de reservas.
//
// Paso a paso:
//   1. Extraer documento, fechaInicio y fechaFin del query string.
//   2. Validar que el documento este presente.
//   3. Llamar al servicio getAprendizReporte.
//   4. Si el aprendiz no existe, retornar 404 en lugar de 500.
//   5. Retornar el objeto con perfil, roles e historial.
export const getAprendizReporte = async (req, res) => {
  try {
    const { documento, fechaInicio, fechaFin } = req.query;

    if (!documento) {
      return res.status(400).json({ message: "El numero de documento es obligatorio" });
    }

    const data = await ReportesService.getAprendizReporte(documento, fechaInicio, fechaFin);

    // El servicio retorna null si no existe el aprendiz; en ese caso responder 404
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
// Solo debe ser accedido por roles administrativos (validado en la ruta con middleware).
//
// Body esperado: { Id_Usuario: number, San_Usuario: "Si" | "No" }
//
// Paso a paso:
//   1. Extraer Id_Usuario y San_Usuario del cuerpo de la peticion.
//   2. Validar que Id_Usuario este presente y San_Usuario sea "Si" o "No".
//   3. Llamar al servicio actualizarSancion.
//   4. Retornar el mensaje de confirmacion con los datos actualizados.
export const actualizarSancion = async (req, res) => {
  try {
    const { Id_Usuario, San_Usuario } = req.body;

    // Validar que el ID y el valor de sancion sean correctos antes de tocar la BD
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
// El frontend lo usa para el ranking visual de platos en los reportes.
//
// Parametros:
//   periodo - "diario" | "semanal" | "mensual" | "anual" (default: mensual)
//   n       - Cantidad de platos a retornar (max 20, default 5)
//
// Paso a paso:
//   1. Extraer periodo y n del query string con valores por defecto.
//   2. Llamar al servicio getPlatosTopConsumo.
//   3. Retornar el ranking de platos con su informacion completa.
export const getPlatosTopConsumo = async (req, res) => {
  try {
    const { periodo = "mensual", n = 5 } = req.query;
    const data = await ReportesService.getPlatosTopConsumo(periodo, n);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};