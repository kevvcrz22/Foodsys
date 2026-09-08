// Node/Services/SocketService.js
//
// Servicio centralizado de WebSockets (Socket.IO) para Foodsys.
// Permite comunicar eventos en tiempo real al frontend (ej. reservas consumidas,
// turnos vencidos, nuevas novedades, etc.) de forma liviana y eficiente.

import { Server } from "socket.io";

let io = null;
let temporizadorDebounce = null;

export const initSocket = (httpServer, corsOptions = {}) => {
  io = new Server(httpServer, {
    cors: {
      origin: corsOptions.origin || "http://localhost:5173",
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
      credentials: true,
    },
    // Opciones para optimizar recursos y evitar sobrecarga de red
    pingTimeout: 30000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    // Conexión silenciosa y eficiente
    socket.on("disconnect", () => {});
  });

  console.log("⚡ Servidor Socket.IO inicializado correctamente");
  return io;
};

export const getIO = () => io;

/**
 * Notifica a todos los clientes conectados que hubo un cambio en las reservas
 * (consumo, cancelación, vencimiento de turno, etc.).
 * Implementa un debounce de 300ms para evitar saturar clientes cuando se actualizan
 * múltiples registros en lote.
 */
export const notificarCambioReservas = (payload = {}) => {
  if (!io) return;

  clearTimeout(temporizadorDebounce);
  temporizadorDebounce = setTimeout(() => {
    try {
      io.emit("reservas:actualizadas", {
        timestamp: new Date().toISOString(),
        ...payload,
      });
    } catch (err) {
      console.error("[SocketService] Error emitiendo reservas:actualizadas:", err.message);
    }
  }, 300);
};

export default {
  initSocket,
  getIO,
  notificarCambioReservas,
};
