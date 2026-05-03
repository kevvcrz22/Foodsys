// Controllers/NovedadesController.js
// Controlador para el modulo de novedades
// Maneja las reservas excepcionales del dia

import NovedadesService from "../Services/NovedadesService.js";

// Retorna las reservas excepcionales del dia
export const Obtener_Excepcionales = async (req, res) => {
  try {
    const Reservas = await NovedadesService
      .Obtener_Excepcionales_Hoy();
    return res.status(200).json(Reservas);
  } catch (Err) {
    return res.status(500).json({
      message: Err.message,
    });
  }
};

// Retorna los tipos de comida permitidos para un usuario
// segun sus roles (logica que estaba en el frontend)
export const Obtener_Tipos = async (req, res) => {
  try {
    const Roles = req.user.roles || [];
    const Tipos = NovedadesService
      .Obtener_Tipos_Por_Rol(Roles);
    return res.status(200).json({ Tipos });
  } catch (Err) {
    return res.status(500).json({
      message: Err.message,
    });
  }
};
