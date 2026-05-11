// Controllers/NovedadesController.js
//
// Controlador para el modulo de novedades y estado Especial en FoodSys.
// Todos los endpoints de este controlador deben estar protegidos por authMiddleware
// y la mayoria requieren adicionalmente el rol Coordinador (verificado en la ruta).
//
// Endpoints de este controlador:
//   GET    /api/Novedades/hoy                           -> obtenerNovedadesHoy
//   GET    /api/Novedades/tipos-comida                  -> obtenerTiposPorRol
//   POST   /api/Novedades/crear                         -> crearNovedad
//   GET    /api/Novedades/reporte/hoy                   -> obtenerReporteDelDia
//   PATCH  /api/Novedades/especial/asignar              -> asignarEstadoEspecial
//   POST   /api/Novedades/especial/importar-excel       -> importarEspecialesExcel
//   POST   /api/Novedades/especial/revertir-expirados   -> revertirEspecialesExpirados

import NovedadesService from "../Services/NovedadesService.js";

// Retorna las reservas excepcionales (novedades) creadas durante el dia actual.
// Incluye nombre, documento del aprendiz, tipo de comida, estado y justificacion.
export const obtenerNovedadesHoy = async (req, res) => {
  try {
    const novedades = await NovedadesService.Obtener_Excepcionales_Hoy();
    return res.status(200).json(novedades);
  } catch (err) {
    console.error("[NovedadesController] obtenerNovedadesHoy:", err.message);
    return res.status(500).json({ message: err.message });
  }
};

// Retorna los tipos de comida disponibles para el usuario autenticado segun sus roles.
// Util para que el frontend del Coordinador sepa que opciones mostrar al crear una novedad
// para un aprendiz especifico. Recibe los roles del aprendiz en el body, no del coordinador.
export const obtenerTiposPorRol = async (req, res) => {
  try {
    // El Coordinador puede consultar los tipos para un aprendiz especifico
    // enviando sus roles en el cuerpo, o consultar los suyos propios desde el token
    const roles = req.body.roles || req.user.roles || [];
    const tipos = NovedadesService.Obtener_Tipos_Por_Rol(roles);
    return res.status(200).json({ tipos });
  } catch (err) {
    console.error("[NovedadesController] obtenerTiposPorRol:", err.message);
    return res.status(500).json({ message: err.message });
  }
};

// Crea una reserva por novedad para el dia actual para un aprendiz especifico.
// Solo accesible para usuarios con rol Coordinador.
//
// Body esperado:
//   {
//     Id_UsuarioAprendiz : number  -> ID del aprendiz que recibe la novedad
//     Tip_Reserva        : string  -> "Almuerzo" o "Cena"
//     platoElegido       : number  -> ID del plato seleccionado
//     justificacion      : string  -> Motivo de la novedad (obligatorio)
//   }
//
// La reserva queda automaticamente en el historial del aprendiz porque se crea
// con su Id_Usuario. El campo Res_Excepcional queda en "Si" para identificarla.
export const crearNovedad = async (req, res) => {
  try {
    const Id_UsuarioCoordinador = req.user.id;
    const { Id_UsuarioAprendiz, Tip_Reserva, platoElegido, Jus_Reserva } = req.body;

    if (!Id_UsuarioAprendiz) {
      return res.status(400).json({ message: "El ID del aprendiz es obligatorio" });
    }
    if (!Tip_Reserva) {
      return res.status(400).json({ message: "El tipo de comida es obligatorio" });
    }
    if (!platoElegido) {
      return res.status(400).json({ message: "El plato elegido es obligatorio" });
    }
    if (!Jus_Reserva || Jus_Reserva.trim().length < 5) {
      return res.status(400).json({
        message: "La justificacion es obligatoria y debe tener al menos 5 caracteres"
      });
    }

    const resultado = await NovedadesService.CrearNovedad(
      parseInt(Id_UsuarioAprendiz),
      Id_UsuarioCoordinador,
      Tip_Reserva.trim(),
      parseInt(platoElegido),
      Jus_Reserva.trim()
    );

    return res.status(201).json({
      message: "Novedad creada exitosamente",
      reserva: resultado
    });
  } catch (err) {
    console.error("[NovedadesController] crearNovedad:", err.message);
    return res.status(400).json({ message: err.message });
  }
};

// Retorna el reporte estructurado de novedades del dia actual.
// El reporte incluye totales por tipo de comida, por estado, y el detalle de cada novedad.
// El frontend puede usar este JSON para generar un PDF, Excel o mostrar una tabla imprimible.
// Solo accesible para usuarios con rol Coordinador.
export const obtenerReporteDelDia = async (req, res) => {
  try {
    const reporte = await NovedadesService.GenerarReporteDelDia();
    return res.status(200).json(reporte);
  } catch (err) {
    console.error("[NovedadesController] obtenerReporteDelDia:", err.message);
    return res.status(500).json({ message: err.message });
  }
};

// Asigna el estado Especial a una lista de aprendices externos.
// Solo accesible para usuarios con rol Coordinador.
//
// Body esperado:
//   { idsUsuarios: [1, 5, 12, ...] }
//
// El servicio valida que cada ID corresponda a un Aprendiz Externo o Pasante Externo.
// Retorna un resumen con los usuarios actualizados y los rechazados con su motivo.
// La duracion del estado es de 30 dias calculados desde el momento de la asignacion.
export const asignarEstadoEspecial = async (req, res) => {
  try {
    const { idsUsuarios } = req.body;

    if (!Array.isArray(idsUsuarios) || idsUsuarios.length === 0) {
      return res.status(400).json({
        message: "Se debe enviar un array 'idsUsuarios' con al menos un ID"
      });
    }

    const resultado = await NovedadesService.ActualizarEstadoEspecial(idsUsuarios);
    return res.status(200).json({
      message: `Proceso completado: ${resultado.actualizados.length} actualizados, ${resultado.rechazados.length} rechazados`,
      resultado
    });
  } catch (err) {
    console.error("[NovedadesController] asignarEstadoEspecial:", err.message);
    return res.status(400).json({ message: err.message });
  }
};

// Procesa la importacion masiva de aprendices con estado Especial desde un archivo Excel.
// Solo accesible para usuarios con rol Coordinador.
//
// El archivo se recibe como multipart/form-data usando el middleware multer.
// La ruta debe configurar multer antes de este controlador (ver NovedadesRoute.js).
//
// Formato del Excel:
//   Hoja 1 con columna "Id_Usuario" o "NumDoc_Usuario" (no ambas, la primera que encuentre)
//
// Retorna el mismo resumen que asignarEstadoEspecial: actualizados y rechazados.
export const importarEspecialesExcel = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        message: "No se recibio ningun archivo. Use multipart/form-data con el campo 'archivo'"
      });
    }

    // Validar que sea un archivo Excel por su mimetype
    const mimetypesPermitidos = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel'                                            // .xls
    ];
    if (!mimetypesPermitidos.includes(req.file.mimetype)) {
      return res.status(400).json({
        message: "El archivo debe ser un Excel (.xlsx o .xls)"
      });
    }

    const resultado = await NovedadesService.ImportarEspecialesDesdeExcel(req.file.buffer);

    return res.status(200).json({
      message: `Importacion completada: ${resultado.actualizados.length} actualizados, ${resultado.rechazados.length} rechazados`,
      resultado
    });
  } catch (err) {
    console.error("[NovedadesController] importarEspecialesExcel:", err.message);
    return res.status(400).json({ message: err.message });
  }
};

// Revierte manualmente los estados Especiales que hayan expirado (superado 30 dias).
// Normalmente este proceso se ejecuta al iniciar el servidor (ver app.js),
// pero este endpoint permite al Coordinador forzarlo en cualquier momento.
// Util para verificar el estado del sistema o forzar la limpieza en entornos de desarrollo.
export const revertirEspecialesExpirados = async (req, res) => {
  try {
    const resultado = await NovedadesService.RevertirEspecialesExpirados();
    return res.status(200).json({
      message: `Se revirtieron ${resultado.revertidos} usuarios de Especial a En Formacion`,
      resultado
    });
  } catch (err) {
    console.error("[NovedadesController] revertirEspecialesExpirados:", err.message);
    return res.status(500).json({ message: err.message });
  }
};