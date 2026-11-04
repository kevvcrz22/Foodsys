import jwt from "jsonwebtoken";
import UsuariosModel from "../Models/UsuariosModel.js";

// Verifica el token JWT enviado en la cabecera Authorization
// Valida sesión única verificando tokenVersion en base de datos
export default async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.get("Authorization");
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    // El formato esperado es: "Bearer <token>"
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ message: "Invalid authorization format" });
    }

    const token = parts[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validación de sesión única: verificar si el tokenVersion sigue siendo vigente
    if (decoded.id && decoded.tokenVersion !== undefined) {
      const usuario = await UsuariosModel.findByPk(decoded.id, {
        attributes: ['Id_Usuario', 'tokenVersion', 'San_Usuario', 'Est_Usuario']
      });

      if (!usuario) {
        return res.status(401).json({ message: "Usuario no encontrado", code: "USER_NOT_FOUND" });
      }

      if (usuario.tokenVersion && usuario.tokenVersion !== decoded.tokenVersion) {
        return res.status(401).json({
          message: "Sesión cerrada: iniciaste sesión en otro dispositivo o tu sesión expiró.",
          code: "SESSION_EXPIRED"
        });
      }
    }

    // req.user y req.usuario quedan disponibles para todos los middlewares y controladores siguientes
    req.user = decoded;
    req.usuario = {
      Id_Usuario: decoded.id,
      id: decoded.id,
      roles: decoded.roles || [],
      tokenVersion: decoded.tokenVersion
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalido o expirado" });
  }
}