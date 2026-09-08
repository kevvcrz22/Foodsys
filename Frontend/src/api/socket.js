// Frontend/src/api/socket.js
//
// Cliente singleton de Socket.IO para Foodsys.
// Proporciona conexión en tiempo real optimizada y el hook useSocketListener
// para actualizar componentes sin sobrecargar peticiones ni consumir recursos innecesarios.

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    const SOCKET_URL =
      import.meta.env.VITE_API_URL ||
      (window.location.hostname === "localhost" ? "http://localhost:8000" : window.location.origin);

    socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
      autoConnect: true,
    });

    socketInstance.on("connect", () => {
      // Conexión exitosa
    });

    socketInstance.on("connect_error", () => {
      // Manejo silencioso de errores de conexión sin romper la UI
    });
  }

  return socketInstance;
};

/**
 * Hook reutilizable para escuchar eventos de Socket.IO en componentes React.
 * Registra el callback cuando el componente está montado y remueve el listener
 * al desmontarse, evitando fugas de memoria o múltiples llamadas.
 *
 * @param {string} eventName - Nombre del evento (ej: "reservas:actualizadas")
 * @param {Function} handler - Función a ejecutar al recibir el evento
 */
export const useSocketListener = (eventName, handler) => {
  const handlerRef = useRef(handler);

  // Mantener la referencia actualizada del handler sin forzar reconexiones
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const eventListener = (...args) => {
      if (typeof handlerRef.current === "function") {
        handlerRef.current(...args);
      }
    };

    socket.on(eventName, eventListener);

    return () => {
      socket.off(eventName, eventListener);
    };
  }, [eventName]);
};

export default {
  getSocket,
  useSocketListener,
};
