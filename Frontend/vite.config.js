import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

// Direccion del backend local. Se usa 127.0.0.1 (IPv4) en lugar de "localhost"
// porque en Windows "localhost" puede resolver primero a ::1 (IPv6) y el
// backend escucha en 0.0.0.0 (solo IPv4).
const BACKEND_URL = "http://127.0.0.1:8000";

// Cuando el backend todavia esta arrancando (revisando tablas de MySQL) o esta
// apagado, el proxy recibe ECONNREFUSED. En vez de devolver un 500 generico,
// respondemos 503 con un mensaje claro para el usuario.
const manejarErrorProxy = (proxy) => {
  proxy.on("error", (err, _req, res) => {
    // En conexiones WebSocket "res" es un socket y no tiene writeHead
    if (!res || typeof res.writeHead !== "function" || res.headersSent) return;
    res.writeHead(503, { "Content-Type": "application/json; charset=utf-8" });
    res.end(
      JSON.stringify({
        message:
          "El servidor de Foodsys se esta iniciando o no esta encendido. Espera unos segundos e intenta de nuevo.",
        code: err?.code || "BACKEND_NO_DISPONIBLE",
      })
    );
  });
};

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    basicSsl(),
  ],
  server: {
    https: true,
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: BACKEND_URL, // puerto del backend
        changeOrigin: true,
        secure: false,
        configure: manejarErrorProxy,
      },
      "/uploads": {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
        configure: manejarErrorProxy,
      },
      "/socket.io": {
        target: BACKEND_URL,
        ws: true,
        changeOrigin: true,
        secure: false,
        configure: manejarErrorProxy,
      },
    },
  },
});