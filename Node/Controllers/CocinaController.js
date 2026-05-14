// Controllers/CocinaController.js
//
// Controlador del modulo de planificacion para el rol Cocina.
// Cada funcion corresponde a un endpoint de la API.
// La logica de negocio vive en CocinaService, no aqui.
//
// Endpoints:
//   GET /api/Cocina/plan/:fecha           -> resumen completo de un dia
//   GET /api/Cocina/plan-hoy              -> resumen de hoy (atajo)
//   GET /api/Cocina/reporte-previo/:tipo  -> reporte 8h antes del turno
//   GET /api/Cocina/excepcionales-hoy     -> novedades del dia en tiempo real
//   GET /api/Cocina/turno-actual/:tipo    -> balance del turno en progreso

import CocinaService from '../Services/CocinaService.js';

// Resumen completo de reservas para una fecha especifica
// Params: fecha en formato YYYY-MM-DD
export const GetResumenPorFecha = async (req, res) => {
  try {
    const { fecha } = req.params;
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ message: 'Formato de fecha invalido. Use YYYY-MM-DD' });
    }
    const resumen = await CocinaService.ResumenPorFecha(fecha);
    return res.status(200).json(resumen);
  } catch (err) {
    console.error('[CocinaController] GetResumenPorFecha:', err.message);
    return res.status(500).json({ message: err.message });
  }
};

// Resumen de hoy (atajo que no requiere parametro de fecha)
export const GetResumenHoy = async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const resumen = await CocinaService.ResumenPorFecha(hoy);
    return res.status(200).json(resumen);
  } catch (err) {
    console.error('[CocinaController] GetResumenHoy:', err.message);
    return res.status(500).json({ message: err.message });
  }
};

// Reporte previo al turno: cuantos platos de cada tipo hay que preparar.
// Se genera 8 horas antes del inicio del turno.
// Params: tipo (Desayuno|Almuerzo|Cena), fecha (YYYY-MM-DD)
export const GetReportePrevioTurno = async (req, res) => {
  try {
    const { tipo } = req.params;
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
    const reporte = await CocinaService.ReportePrevioTurno(tipo, fecha);
    return res.status(200).json(reporte);
  } catch (err) {
    console.error('[CocinaController] GetReportePrevioTurno:', err.message);
    return res.status(400).json({ message: err.message });
  }
};

// Retorna las reservas excepcionales del dia de hoy.
// Se usa para la notificacion en tiempo real cuando el Coordinador crea una novedad.
// Cocina debe saber que hay platos adicionales fuera del conteo normal.
export const GetExcepcionalesHoy = async (req, res) => {
  try {
    const resultado = await CocinaService.ReservasExcepcionalesHoy();
    return res.status(200).json(resultado);
  } catch (err) {
    console.error('[CocinaController] GetExcepcionalesHoy:', err.message);
    return res.status(500).json({ message: err.message });
  }
};

// Resumen del turno actual: balance en tiempo real durante el servicio.
// Muestra consumidos, pendientes, cancelados y vencidos del turno activo.
// Params: tipo (Desayuno|Almuerzo|Cena)
export const GetResumenTurnoActual = async (req, res) => {
  try {
    const { tipo } = req.params;
    const resumen = await CocinaService.ResumenTurnoActual(tipo);
    return res.status(200).json(resumen);
  } catch (err) {
    console.error('[CocinaController] GetResumenTurnoActual:', err.message);
    return res.status(500).json({ message: err.message });
  }
};
