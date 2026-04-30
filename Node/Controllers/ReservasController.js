import ReservasServices from "../Services/ReservasServices.js"
import db from "../Database/db.js";
import { QueryTypes } from "sequelize";

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
export const getReporteDetalleAprendiz = async (req, res) => {
  try {
    const data = await ReservasServices.reporteDetalleAprendiz(req.params.id);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
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



export const obtenerReporteAprendices = async (req, res) => {
  try {
    const { fecha, busqueda = "" } = req.query;
const query = `
  SELECT 
    u.Id_Usuario,
    u.Nom_Usuario AS aprendiz,
    u.NumDoc_Usuario,
    :fecha AS fecha,

    -- 🔹 DEL DÍA
    SUM(CASE WHEN r.Tipo = 'Desayuno' THEN 1 ELSE 0 END) AS desayuno,
    SUM(CASE WHEN r.Tipo = 'Almuerzo' THEN 1 ELSE 0 END) AS almuerzo,
    SUM(CASE WHEN r.Tipo = 'Cena' THEN 1 ELSE 0 END) AS cena,

    -- 🔥 HISTÓRICO POR TIPO
    (
      SELECT COUNT(*) 
      FROM reservas r2 
      WHERE r2.Id_Usuario = u.Id_Usuario 
      AND r2.Tipo = 'Desayuno'
    ) AS desayuno_global,

    (
      SELECT COUNT(*) 
      FROM reservas r2 
      WHERE r2.Id_Usuario = u.Id_Usuario 
      AND r2.Tipo = 'Almuerzo'
    ) AS almuerzo_global,

    (
      SELECT COUNT(*) 
      FROM reservas r2 
      WHERE r2.Id_Usuario = u.Id_Usuario 
      AND r2.Tipo = 'Cena'
    ) AS cena_global

  FROM Usuarios u

  LEFT JOIN UsuariosRol ur
    ON ur.Id_Usuario = u.Id_Usuario

  LEFT JOIN Roles ro
    ON ro.Id_Rol = ur.Id_Rol

  LEFT JOIN reservas r
    ON r.Id_Usuario = u.Id_Usuario
    AND r.Fec_Reserva = :fecha

  WHERE ro.Nom_Rol IN ('Aprendiz Interno', 'Aprendiz Externo')

  AND (
    :busqueda = '' OR
    u.Nom_Usuario LIKE :busqueda OR
    u.NumDoc_Usuario LIKE :busqueda
  )

  GROUP BY u.Id_Usuario, u.Nom_Usuario, u.NumDoc_Usuario

  ORDER BY u.Nom_Usuario ASC
`;

    const resultados = await db.query(query, {
      replacements: {
        fecha,
        busqueda: `%${busqueda}%`
      },
      type: QueryTypes.SELECT
    });

    res.json(resultados);

  } catch (error) {
    console.error("ERROR REPORTE:", error);
    res.status(500).json({
      mensaje: "Error al obtener reporte",
      error: error.message
    });
  }
};