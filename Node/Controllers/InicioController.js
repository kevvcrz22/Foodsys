// Controllers/InicioController.js
// Controlador del endpoint de Inicio
// Recibe la peticion, extrae el rol activo del query
// y delega al servicio para obtener las vistas

import InicioService from "../Services/InicioService.js";

// Devuelve las vistas disponibles para el rol activo
// El rol se envia como query param: ?rol=Administrador
export const ObtenerVistas = async (req, res) => {
  try {
    const Rol_Activo = req.query.rol;

    // Valida que se envie el parametro de rol
    if (!Rol_Activo) {
      return res.status(400).json({
        message: "El parametro 'rol' es requerido",
      });
    }

    // Verifica que el rol enviado coincida con los del token
    const Roles_Token = req.user.roles || [];
    if (!Roles_Token.includes(Rol_Activo)) {
      return res.status(403).json({
        message: "El rol no corresponde al usuario",
      });
    }

    // Obtiene las vistas del servicio
    const Vistas = InicioService.ObtenerVistasPorRol(
      Rol_Activo
    );

    // Retorna el nombre del usuario y las vistas
    return res.status(200).json({
      Rol: Rol_Activo,
      Vistas,
    });
  } catch (Err) {
    return res.status(500).json({
      message: Err.message,
    });
  }
};
