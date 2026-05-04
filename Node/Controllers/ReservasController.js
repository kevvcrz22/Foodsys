import ReservasServices from "../Services/ReservasServices.js";

// Genera una reserva para el dia siguiente segun el tipo de comida y plato elegido
export const generarAlimentoTomorrow = async (req, res) => {
  try {
    // El id y roles vienen del token JWT decodificado por authMiddleware
    const Id_Usuario = req.user.id;
    const rolesUsuario = req.user.roles || [];

    // Se eliminan espacios en blanco por si el cliente envia datos con padding
    const Tip_Reserva = req.body.Tip_Reserva?.trim();
    const { platoElegido, fechaReserva } = req.body;

    if (!Tip_Reserva) {
      return res.status(400).json({ message: "El Tipo de comida es obligatorio" });
    }
    
    if (!fechaReserva) {
      return res.status(400).json({ message: "La fecha de reserva es obligatoria" });
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
    console.log("ERROR:", err.message);
    return res.status(400).json({ message: err.message });
  }
};

// Retorna las ultimas 10 reservas del usuario autenticado
export const obtenerHistorial = async (req, res) => {
  try {
    const Id_Usuario = req.user.id;
    const historial = await ReservasServices.obtenerHistorial(Id_Usuario);
    return res.status(200).json(historial);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

// Retorna todas las reservas del usuario autenticado sin limite
export const obtenerHistorialCompleto = async (req, res) => {
  try {
    const Id_Usuario = req.user.id;
    const historial = await ReservasServices.obtenerHistorialCompleto(Id_Usuario);
    return res.status(200).json(historial);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

// Cambia el estado de una reserva a Cancelado.
// Solo funciona si la reserva pertenece al usuario y su estado es Generado.
export const cancelarReserva = async (req, res) => {
  try {
    const Id_Usuario = req.user.id;
    const Id_Reserva = parseInt(req.params.id);
    await ReservasServices.cancelarReserva(Id_Reserva, Id_Usuario);
    return res.status(200).json({ message: 'Reserva cancelada correctamente' });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};