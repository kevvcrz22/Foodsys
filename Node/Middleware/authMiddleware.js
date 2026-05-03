import jwt from "jsonwebtoken";

// Verifica el token JWT enviado en la cabecera Authorization
// Si el token es valido, adjunta el payload decodificado a req.user y continua
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

    // req.user queda disponible para todos los middlewares y controladores siguientes
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalido o expirado" });
  }
}