import ReservasServices from "../Services/ReservasServices.js";

// Genera una reserva para el dia siguiente segun el tipo de comida y plato elegido
export const generarAlimentoTomorrow = async (req, res) => {
  try {
    // El id y roles vienen del token JWT decodificado por authMiddleware
    const Id_Usuario = req.user.id;
    const rolesUsuario = req.user.roles || [];

    // Se eliminan espacios en blanco por si el cliente envia datos con padding
    const Tip_Reserva = req.body.Tip_Reserva?.trim();
    const { platoElegido } = req.body;

    if (!Tip_Reserva) {
      return res.status(400).json({ message: "El Tipo de comida es obligatorio" });
    }

    const result = await ReservasServices.generarReservaPass(
      Id_Usuario,
      rolesUsuario,
      Tip_Reserva,
      platoElegido
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