// Routes/NovedadesRoute.js
//
// Define las rutas HTTP para el modulo de novedades y estado Especial en FoodSys.
// Todas las rutas requieren autenticacion (authMiddleware).
// Las rutas administrativas (crear novedad, estado Especial, reporte) ademas
// requieren el rol Coordinador verificado por verificarRol.
//
// Mapa de rutas de este archivo:
//
//   GET    /api/Novedades/hoy
//     Novedades del dia actual. Acceso: rol Coordinador.
//
//   POST   /api/Novedades/tipos-comida
//     Tipos de comida disponibles para un aprendiz segun sus roles.
//     Acceso: rol Coordinador (consulta al abrir el formulario de novedad).
//
//   POST   /api/Novedades/crear
//     Crea una novedad del dia para un aprendiz. Acceso: rol Coordinador.
//
//   GET    /api/Novedades/reporte/hoy
//     Reporte JSON de novedades del dia para generar PDF/Excel. Acceso: rol Coordinador.
//
//   PATCH  /api/Novedades/especial/asignar
//     Asigna estado Especial a una lista de usuarios. Acceso: rol Coordinador.
//
//   POST   /api/Novedades/especial/importar-excel
//     Importa masivamente aprendices con estado Especial desde un Excel.
//     Usa multer en memoria. Acceso: rol Coordinador.
//
//   POST   /api/Novedades/especial/revertir-expirados
//     Fuerza la reversion de estados Especiales expirados. Acceso: rol Coordinador.

import { Router } from "express";
import multer from "multer";
import authMiddleware from "../Middleware/authMiddleware.js";

import {
  obtenerNovedadesHoy,
  obtenerTiposPorRol,
  crearNovedad,
  obtenerReporteDelDia,
  asignarEstadoEspecial,
  importarEspecialesExcel,
  revertirEspecialesExpirados,
} from "../Controllers/NovedadesController.js";

const router = Router();

// Configuracion de multer para la importacion de Excel.
// Se usa memoryStorage para mantener el archivo en RAM como Buffer,
// sin escribirlo al disco. Esto simplifica el manejo y evita archivos huerfanos.
// El limite de 5MB es suficiente para archivos Excel con cientos o miles de filas.
const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB maximo
  fileFilter: (req, file, cb) => {
    // Aceptar solo archivos Excel por su extension
    const extensionesPermitidas = /\.(xlsx|xls)$/i;
    if (!extensionesPermitidas.test(file.originalname)) {
      return cb(new Error("Solo se permiten archivos Excel (.xlsx o .xls)"), false);
    }
    cb(null, true);
  }
});

// Retorna las novedades del dia con datos del aprendiz, plato y estado de cada reserva
router.get(
  '/hoy',
  authMiddleware,
  obtenerNovedadesHoy
);

// Retorna los tipos de comida disponibles segun los roles enviados en el body.
// El Coordinador la usa al abrir el formulario de novedad para saber que opciones mostrar.
// Body: { roles: ["Aprendiz Externo"] }
router.post(
  '/tipos-comida',
  authMiddleware ,
  obtenerTiposPorRol
);

// Crea una reserva por novedad para el dia actual para un aprendiz especifico.
// Body: { Id_UsuarioAprendiz, Tip_Reserva, platoElegido, justificacion }
router.post(
  '/crear',
  authMiddleware,
  crearNovedad
);

// Retorna el reporte JSON del dia listo para generar PDF o tabla imprimible.
// Incluye totales por tipo de comida, por estado, y el detalle de cada novedad.
router.get(
  '/reporte/hoy',
  authMiddleware,
  obtenerReporteDelDia
);

// Asigna estado Especial a los usuarios indicados en el array del body.
// Body: { idsUsuarios: [1, 5, 12] }
// Solo aplica para Aprendiz Externo y Pasante Externo. Los internos son rechazados.
router.patch(
  '/especial/asignar',
  authMiddleware,
  asignarEstadoEspecial
);

// Importa masivamente aprendices con estado Especial desde un archivo Excel.
// Peticion: multipart/form-data con el campo "archivo" conteniendo el Excel.
// El middleware uploadExcel.single('archivo') procesa el archivo antes del controlador.
router.post(
  '/especial/importar-excel',
  authMiddleware,
  uploadExcel.single('archivo'),
  importarEspecialesExcel
);

// Fuerza la reversion de estados Especiales expirados (mas de 30 dias).
// Util para verificar el sistema o forzar la limpieza manualmente.
router.post(
  '/especial/revertir-expirados',
  authMiddleware,
  revertirEspecialesExpirados
);

export default router;