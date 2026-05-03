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

// Genera una reserva excepcional ignorando la regla de 24h
export const generarReservaExcepcional = async (req, res) => {
  try {
    const { Id_Usuario, Tip_Reserva, platoElegido, fechaReserva, justificacion } = req.body;

    if (!Id_Usuario || !Tip_Reserva || !platoElegido || !fechaReserva || !justificacion) {
      return res.status(400).json({ message: "Faltan datos obligatorios para la reserva excepcional" });
    }

    const Tip_Reserva_L = Tip_Reserva.trim();

    // Reutilizamos generarReservaPass pero pasamos esNovedad = true para ignorar 24h
    // Usamos roles genericos para permitir la creacion
    const result = await ReservasServices.generarReservaPass(
      Id_Usuario,
      ['Aprendiz Interno', 'Aprendiz Externo'], // forzamos permisos para permitir crear
      Tip_Reserva_L,
      platoElegido,
      fechaReserva,
      true, // esNovedad
      justificacion
    );
    
    // Opcional: Actualizar el estado a 'Reserva por Novedad' o algo similar si es necesario
    // Pero por defecto queda en 'Generado' para que pueda ser redimido.

    return res.status(201).json({ message: "Reserva excepcional creada", ...result });
  } catch (err) {
    console.log("ERROR:", err.message);
    return res.status(400).json({ message: err.message });
  }
};