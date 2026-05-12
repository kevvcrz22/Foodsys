// Routes/ReservasRoute.js
//
// Define las rutas HTTP para el modulo de reservas en Foodsys.
// Cada ruta esta protegida por authMiddleware que verifica el JWT del usuario.
// Las rutas que requieren un rol especifico (Cocina, Supervisor) usan
// verificarRol como segundo middleware antes del controlador.
//
// Mapa de rutas de este archivo:
//
//   POST   /api/Reservas/reservar/generate-tomorrow
//     Crea una nueva reserva para el dia siguiente.
//     Acceso: cualquier usuario autenticado (aprendiz, pasante).
//
//   GET    /api/Reservas/reservar/historial
//     Ultimas 10 reservas del usuario autenticado.
//     Acceso: cualquier usuario autenticado.
//
//   GET    /api/Reservas/reservar/historial/completo
//     Todas las reservas del usuario autenticado sin limite.
//     Acceso: cualquier usuario autenticado.
//
//   PATCH  /api/Reservas/reservar/:id/cancelar
//     Cancela una reserva propia con estado Generado.
//     Acceso: cualquier usuario autenticado.
//
//   PATCH  /api/Reservas/verificar/:id/cocina
//     Cambia Est_Reserva de Generado a Verificado.
//     Acceso: solo rol Cocina.
//
//   POST   /api/Reservas/consumir/supervisor
//     Desencripta el QR y cambia Est_Reserva a Consumido.
//     Aplica el flujo correcto segun si el usuario es Especial o no.
//     Acceso: solo rol Supervisor.

import { Router } from "express";
import authMiddleware from "../Middleware/authMiddleware.js";
import ReservarMiddleware from "../Middleware/ReservarMiddleware.js";
import {
  generarAlimentoTomorrow,
  obtenerHistorial,
  obtenerHistorialCompleto,
  cancelarReserva,
  verificarCocina,
  consumirQRSupervisor,
  ObtenerTiposPermitidos,
  ObtenerMenuPorFechaYTipo,
  ObtenerTodasLasReservas,
} from "../Controllers/ReservasController.js";
const router = Router();

// Genera una nueva reserva para el dia siguiente.
// El tipo de comida disponible (Desayuno/Almuerzo/Cena) depende del rol del usuario
// y se valida en ReservasServices.ObtenerRolesPermitidos.
router.post(
  '/reservar/generate-tomorrow',
  authMiddleware,
  generarAlimentoTomorrow
);

// Retorna las ultimas 10 reservas del usuario autenticado
router.get(
  '/reservar/historial',
  authMiddleware,
  obtenerHistorial
);

// Retorna todas las reservas del usuario autenticado sin limite de cantidad
router.get(
  '/reservar/historial/completo',
  authMiddleware,
  obtenerHistorialCompleto
);

// Cancela una reserva con estado Generado que pertenece al usuario autenticado.
// No se puede cancelar si el estado es Verificado, Consumido, Vencido o Cancelado.
router.patch(
  '/reservar/:id/cancelar',
  authMiddleware,
  cancelarReserva
);

// Verifica presencialmente una reserva. El personal de cocina confirma que el
// aprendiz externo se presento y cambia el estado de Generado a Verificado.
// Acceso restringido al rol Cocina.
router.patch(
  '/verificar/:id/cocina',
  authMiddleware,
  ReservarMiddleware,
  verificarCocina
);

// Escaneo final del supervisor. Desencripta el QR, valida el estado y marca
// la reserva como Consumida. Aplica el flujo correcto segun el perfil del usuario:
//   - Internos y Externos con estado Especial: pueden consumir desde Generado
//   - Externos normales: deben estar en Verificado antes de este paso
// Acceso restringido al rol Supervisor.
router.post(
  '/consumir/supervisor',
  authMiddleware,
  ReservarMiddleware,
  consumirQRSupervisor
);
// Retorna los tipos de comida disponibles para el usuario segun su rol.
// ReservaForm.jsx la llama al montar para poblar el select de tipo de comida.
router.get(
  '/reservar/Tipos-Permitidos',
  authMiddleware,
  ObtenerTiposPermitidos
);

// Retorna los platos del menu para una fecha y tipo dados.
// ReservaForm.jsx la llama cada vez que el usuario cambia el tipo de comida.
router.get(
  '/reservar/Menu/:Fecha/:Tipo',
  authMiddleware,
  ObtenerMenuPorFechaYTipo
);

// Retorna todas las reservas del sistema. Solo para vistas administrativas.
router.get(
  '/Todas',
  authMiddleware,
  ObtenerTodasLasReservas
);

export default router;
