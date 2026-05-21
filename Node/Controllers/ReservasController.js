// Controllers/ReservasController.js
//
// Controlador para el modulo de reservas en Foodsys.
// Cada funcion exportada corresponde a un endpoint de la API.
// El controlador no contiene logica de negocio: solo extrae los datos de la peticion,
// los pasa al servicio correspondiente y devuelve la respuesta HTTP apropiada.
//
// Endpoints de este controlador:
//   POST   /api/Reservas/reservar/generate-tomorrow    -> generarAlimentoTomorrow
//   GET    /api/Reservas/reservar/historial             -> obtenerHistorial
//   GET    /api/Reservas/reservar/historial/completo    -> obtenerHistorialCompleto
//   PATCH  /api/Reservas/reservar/:id/cancelar          -> cancelarReserva
//   PATCH  /api/Reservas/verificar/:id/cocina           -> verificarCocina
//   POST   /api/Reservas/consumir/supervisor            -> consumirQRSupervisor
// Importaciones de modelos y servicios necesarios para este controlador.
// ReservaModel se usa en ContarCanceladas y ContarVencidas para contar registros directamente.
// ReservasServices centraliza toda la logica de negocio (no se repite logica aqui).
import ReservaModel from "../Models/ReservasModel.js";
import MenuModel from "../Models/MenusModels.js";
import PlatosModel from "../Models/PlatosModels.js";
import ReservasServices from "../Services/ReservasServices.js";

// Genera una reserva para el dia siguiente segun el tipo de comida y plato elegido.
// El Id_Usuario y los roles vienen del token JWT decodificado por authMiddleware.
export const generarAlimentoTomorrow = async (req, res) => {
  try {
    const Id_Usuario = req.user.id;
    const rolesUsuario = req.user.roles || [];

    // Eliminar espacios en blanco por si el cliente envia datos con padding
    const Tip_Reserva = req.body.Tip_Reserva?.trim();
    const { platoElegido, fechaReserva } = req.body;

    if (!Tip_Reserva) {
      return res.status(400).json({ message: "El tipo de comida es obligatorio" });
    }

    if (!fechaReserva) {
      return res.status(400).json({ message: "La fecha de reserva es obligatoria" });
    }

    if (!platoElegido) {
      return res.status(400).json({ message: "El plato elegido es obligatorio" });
    }

    const result = await ReservasServices.generarReservaPass(
      Id_Usuario,
      rolesUsuario,
      Tip_Reserva,
      platoElegido,
      fechaReserva
    );

    return res.status(201).json(result);
  } catch (err) {
    console.error("[ReservasController] generarAlimentoTomorrow:", err.message);
    return res.status(400).json({ message: err.message });
  }
};

// Retorna las ultimas 10 reservas del usuario autenticado ordenadas por fecha descendente
export const obtenerHistorial = async (req, res) => {
  try {
    const Id_Usuario = req.user.id;
    const historial = await ReservasServices.obtenerHistorial(Id_Usuario);
    return res.status(200).json(historial);
  } catch (err) {
    console.error("[ReservasController] obtenerHistorial:", err.message);
    return res.status(400).json({ message: err.message });
  }
};

// Retorna todas las reservas del usuario autenticado sin limite de cantidad
export const obtenerHistorialCompleto = async (req, res) => {
  try {
    const Id_Usuario = req.user.id;
    const historial = await ReservasServices.obtenerHistorialCompleto(Id_Usuario);
    return res.status(200).json(historial);
  } catch (err) {
    console.error("[ReservasController] obtenerHistorialCompleto:", err.message);
    return res.status(400).json({ message: err.message });
  }
};

// Cambia el estado de una reserva a Cancelado.
// Solo funciona si la reserva pertenece al usuario autenticado y su estado es Generado.
export const cancelarReserva = async (req, res) => {
  try {
    const Id_Usuario = req.user.id;
    const Id_Reserva = parseInt(req.params.id);

    if (isNaN(Id_Reserva)) {
      return res.status(400).json({ message: "ID de reserva invalido" });
    }

    await ReservasServices.cancelarReserva(Id_Reserva, Id_Usuario);
    return res.status(200).json({ message: 'Reserva cancelada correctamente' });
  } catch (err) {
    console.error("[ReservasController] cancelarReserva:", err.message);
    return res.status(400).json({ message: err.message });
  }
};

// Verifica presencialmente una reserva por parte del personal de cocina.
// Cambia Est_Reserva de Generado a Verificado.
//
// Este endpoint solo debe ser accedido por usuarios con rol Cocina.
// El middleware de rol en la ruta se encarga de esa validacion.
//
// Solo aplica para Aprendiz Externo y Pasante Externo sin estado Especial.
// Si el usuario tiene estado Especial, el supervisor puede escanear directamente
// y este paso no es estrictamente necesario, aunque el sistema lo acepta sin error.
export const verificarCocina = async (req, res) => {
  try {
    const Id_Reserva = parseInt(req.params.id);

    if (isNaN(Id_Reserva)) {
      return res.status(400).json({ message: "ID de reserva invalido" });
    }

    const resultado = await ReservasServices.procesarVerificacionCocina(Id_Reserva);
    return res.status(200).json(resultado);
  } catch (err) {
    console.error("[ReservasController] verificarCocina:", err.message);
    return res.status(400).json({ message: err.message });
  }
};

// Procesa el escaneo del QR por parte del supervisor para registrar el consumo.
// Cambia Est_Reserva a Consumido aplicando el flujo correcto segun el perfil del usuario:
//   - Internos y Externos con estado Especial: pueden consumir desde Generado
//   - Externos sin estado Especial: deben estar en Verificado (cocina verifico primero)
//
// El cuerpo de la peticion debe incluir:
//   { encriptadoQR: "string con los datos encriptados del QR" }
//
// El encriptadoQR es el mismo valor almacenado en Qr_Reserva de la base de datos
// y codificado en el codigo QR que el aprendiz presenta al supervisor.
export const consumirQRSupervisor = async (req, res) => {
  try {
    const { encriptadoQR } = req.body;

    if (!encriptadoQR) {
      return res.status(400).json({ message: "El contenido del QR es obligatorio" });
    }

    const resultado = await ReservasServices.procesarConsumoSupervisor(encriptadoQR);
    return res.status(200).json(resultado);
  } catch (err) {
    console.error("[ReservasController] consumirQRSupervisor:", err.message);
    return res.status(400).json({ message: err.message });
  }
};
// Retorna los tipos de comida permitidos para el usuario autenticado segun sus roles.
// ReservaForm.jsx la llama al montar para saber que opciones mostrar en el select.
export const ObtenerTiposPermitidos = async (req, res) => {
  try {
    const Roles_Usuario = req.user.roles || [];
    const Tipos_Permitidos = ReservasServices.ObtenerRolesPermitidos(Roles_Usuario);
    return res.status(200).json({ tiposPermitidos: Tipos_Permitidos });
  } catch (Err) {
    console.error("[ReservasController] ObtenerTiposPermitidos:", Err.message);
    return res.status(400).json({ message: Err.message });
  }
};

// Retorna los platos del menu para una fecha y tipo de comida especificos.
// ReservaForm.jsx la llama cuando el usuario cambia el tipo de comida en el select.
// Params: fecha (YYYY-MM-DD), tipo (Desayuno | Almuerzo | Cena)
export const ObtenerMenuPorFechaYTipo = async (req, res) => {
  try {
    const { Fecha, Tipo } = req.params;
    const Platos_Menu = await MenuModel.findAll({
      where: { Fec_Menu: Fecha, Tip_Menu: Tipo },
      include: [{ model: PlatosModel, as: "plato" }],
    });
    return res.status(200).json(Platos_Menu);
  } catch (Err) {
    console.error("[ReservasController] ObtenerMenuPorFechaYTipo:", Err.message);
    return res.status(400).json({ message: Err.message });
  }
};

export const ContarCanceladas = async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!fecha) return res.status(400).json({ message: "La fecha es obligatoria" });

    const total = await ReservaModel.count({
      where: { Est_Reserva: 'Cancelado', Fec_Reserva: fecha }
    });

    return res.status(200).json({ total });
  } catch (err) {
    console.error("[ReservasController] ContarCanceladas:", err.message);
    return res.status(500).json({ message: err.message });
  }
};

// Retorna todas las reservas del sistema con datos del aprendiz y el plato.
// La usa CrudReservas.jsx (vista administrativa) para mostrar el listado completo.
export const ObtenerTodasLasReservas = async (req, res) => {
  try {
    const Reservas = await ReservasServices.ObtenerTodas();
    return res.status(200).json(Reservas);
  } catch (Err) {
    console.error("[ReservasController] ObtenerTodasLasReservas:", Err.message);
    return res.status(400).json({ message: Err.message });
  }
};

// Cuenta las reservas con estado Vencido para una fecha dada.
// Se llama desde el frontend para mostrar estadisticas del dia en los reportes.
// Query param: ?fecha=YYYY-MM-DD
export const ContarVencidas = async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!fecha) return res.status(400).json({ message: "La fecha es obligatoria" });

    // Contamos directamente en la base de datos sin traer todos los registros
    const total = await ReservaModel.count({
      where: { Est_Reserva: 'Vencido', Fec_Reserva: fecha }
    });

    return res.status(200).json({ total });
  } catch (err) {
    console.error("[ReservasController] ContarVencidas:", err.message);
    return res.status(500).json({ message: err.message });
  }
};

// Busca la reserva activa del dia por numero de documento del aprendiz
// y la procesa como consumida usando el mismo flujo del QR.
// Usado por el supervisor cuando el aprendiz no puede mostrar el codigo QR.
// Body esperado: { NumDoc: "1001234567" }
export const consumirPorDocumento = async (req, res) => {
  try {
    const { NumDoc } = req.body;
    if (!NumDoc) {
      return res.status(400).json({ message: "El numero de documento es obligatorio" });
    }

    // El servicio busca al usuario por NumDoc_Usuario, obtiene su reserva de hoy
    // y aplica el mismo flujo de validacion de roles que procesarConsumoSupervisor
    const resultado = await ReservasServices.BuscarReservaPorDocumento(NumDoc);
    return res.status(200).json(resultado);
  } catch (err) {
    console.error("[ReservasController] consumirPorDocumento:", err.message);
    return res.status(400).json({ message: err.message });
  }
};

export const consumirPorSupervisor = async (req, res) => {
  try {
    const resultado = await ReservasServices.procesarConsumoSupervisor(req.body.encriptadoQR);
    return res.status(200).json(resultado);
  } catch (err) {
    // ← Este catch es el que convierte el throw del service en { message: "..." }
    return res.status(400).json({ message: err.message });
  }
};

// Busca y procesa el consumo de una reserva directamente por su Id_Reserva.
// Alternativa al escaneo QR cuando el supervisor conoce el ID exacto de la reserva.
// Body esperado: { Id_Reserva: 42 }
export const consumirPorId = async (req, res) => {
  try {
    const { Id_Reserva } = req.body;
    if (!Id_Reserva) {
      return res.status(400).json({ message: "El ID de reserva es obligatorio" });
    }

    // Buscamos la reserva por ID para obtener su QR encriptado
    // y luego reutilizamos procesarConsumoSupervisor con ese QR
    const reserva = await ReservaModel.findByPk(Number(Id_Reserva));
    if (!reserva) {
      return res.status(404).json({ message: "No se encontro la reserva con ese ID" });
    }
    if (!reserva.Qr_Reserva) {
      return res.status(400).json({ message: "La reserva no tiene codigo QR asociado" });
    }

    // Reutilizamos el flujo completo del supervisor para mantener consistencia
    const resultado = await ReservasServices.procesarConsumoSupervisor(reserva.Qr_Reserva);
    return res.status(200).json(resultado);
  } catch (err) {
    console.error("[ReservasController] consumirPorId:", err.message);
    return res.status(400).json({ message: err.message });
  }
};
// Resumen del turno actual para el supervisor.
// Devuelve conteos de reservas del día agrupados por estado
// y lista las reservas pendientes (Generado / Verificado) con nombre del aprendiz.
// GET /api/Reservas/supervisor/resumen-hoy
export const ResumenSupervisor = async (req, res) => {
  try {
    const { Op } = await import('sequelize');
    const hoy = new Date().toISOString().split('T')[0];

    // Contar por cada estado para el día de hoy
    const estados = ['Generado', 'Verificado', 'Consumido', 'Vencido', 'Cancelado'];
    const conteos = {};
    for (const est of estados) {
      conteos[est] = await ReservaModel.count({
        where: { Fec_Reserva: hoy, Est_Reserva: est }
      });
    }

    // Listar las que aún están pendientes (con datos del aprendiz)
    // para que el supervisor sepa quiénes faltan
    const UsuariosModel = (await import('../Models/UsuariosModel.js')).default;
    const pendientes = await ReservaModel.findAll({
      where: {
        Fec_Reserva: hoy,
        Est_Reserva: { [Op.in]: ['Generado', 'Verificado'] }
      },
      include: [{
        model: UsuariosModel,
        as: 'usuario',
        attributes: ['Nom_Usuario', 'Ape_Usuario', 'NumDoc_Usuario']
      }],
      attributes: ['Id_Reserva', 'Tip_Reserva', 'Est_Reserva'],
      order: [['Tip_Reserva', 'ASC']]
    });

    return res.status(200).json({
      fecha: hoy,
      conteos,      // { Generado: 3, Verificado: 1, Consumido: 12, Vencido: 0, Cancelado: 2 }
      pendientes    // array con nombre + tipo de cada reserva abierta
    });
  } catch (err) {
    console.error('[ReservasController] ResumenSupervisor:', err.message);
    return res.status(500).json({ message: err.message });
  }
};