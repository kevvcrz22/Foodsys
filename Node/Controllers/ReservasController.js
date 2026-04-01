import ReservasServices from "../Services/ReservasServices.js"

export const getAllReservas = async (req, res) => {
  try {
    const Reservas = await ReservasServices.getAll();
    res.status(200).json(Reservas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const checkDisponibilidad = async (req, res) => {
    try {
        const { fecha, tipo, usuario } = req.query;

        if (!fecha || !tipo || !usuario) {
            return res.status(400).json({ message: "Faltan parámetros" });
        }

        const disponible = await ReservasServices.checkDisponibilidad(usuario, fecha, tipo);
        res.status(200).json({ disponible });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 🔢 Devuelve el total de reservas con Est_Reserva = "Cancelada"
export const countCanceladas = async (req, res) => {
    try {
        const total = await ReservasServices.countCanceladas();
        res.status(200).json({ total });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getReservas = async (req, res) => {
  try {
    const Reservas = await ReservasServices.getById(req.params.id);
    res.status(200).json(Reservas);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createReservas = async (req, res) => {
  try {
    const reserva = await ReservasServices.create(req.body);
    res.status(201).json({ message: "Reserva Creada", reserva });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateReservas = async (req, res) => {
  try {
    await ReservasServices.update(parseInt(req.params.id), req.body);
    res.status(200).json({ message: "Reserva Actualizada Correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteReservas = async (req, res) => {
  try {
    await ReservasServices.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/* ✅ NUEVO: cambia estado de reserva al escanear QR */
export const actualizarEstado = async (req, res) => {
  try {
    const { id }     = req.params;
    const { estado } = req.body;

    const estadosValidos = ["Generada", "Usada", "Vencida", "Cancelada"];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        message: `Estado inválido. Valores permitidos: ${estadosValidos.join(", ")}`,
      });
    }

    await ReservasServices.update(parseInt(id), { Est_Reserva: estado });
    res.status(200).json({ message: `Estado actualizado a "${estado}"` });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
export const crearReservaExcepcional = async (req, res) => {
    try {
        const reserva = await ReservasServices.crearExcepcional(req.body);
        res.status(201).json({ message: "Reserva excepcional creada", reserva });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};