// Frontend/vite.config.js
// Configuracion principal de Vite para Foodsys (Centro Agropecuario "La Granja" - SENA).
// Incluye:
//   1. Conexion directa por IPv4 (http://127.0.0.1:8000) para eliminar el error
//      AggregateError [ECONNREFUSED] causado por IPv6 (::1) en Windows y Node 20+.
//   2. Plugin supervisor automatico (autoIniciarBackendFoodsys) que verifica al ejecutar
//      "pnpm run dev" o "vite" si MySQL (3306) y el Backend Node.js (8000) estan activos,
//      y si no lo estan, los inicia automaticamente en segundo plano en la misma terminal.
//   3. Manejo resiliente de errores en el proxy HTTP para responder siempre en JSON espanol
//      amigable si el backend aun esta iniciando, evitando errores 500 vacios.
// Comentado en espanol sin tildes ni emojis para aprendices de primer semestre.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import net from "net";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_HOST = "127.0.0.1";
const BACKEND_PORT = 8000;
const MYSQL_PORT = 3306;

let procesoBackendHijo = null;
let iniciandoBackend = false;

/**
 * Verifica si un puerto TCP local esta escuchando en IPv4 (127.0.0.1).
 */
function verificarPuertoActivo(puerto, host = "127.0.0.1", timeoutMs = 800) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resuelto = false;

    const finalizar = (estado) => {
      if (!resuelto) {
        resuelto = true;
        socket.destroy();
        resolve(estado);
      }
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finalizar(true));
    socket.once("timeout", () => finalizar(false));
    socket.once("error", () => finalizar(false));
    socket.connect(puerto, host);
  });
}

/**
 * En Windows, si MySQL de XAMPP no esta encendido en el puerto 3306, lo inicia automaticamente.
 */
async function asegurarMysqlXamppActivo() {
  if (process.platform !== "win32") return;
  const mysqlActivo = await verificarPuertoActivo(MYSQL_PORT, "127.0.0.1", 600);
  if (mysqlActivo) return;

  const rutaMysqld = "C:\\xampp\\mysql\\bin\\mysqld.exe";
  const rutaMyIni = "C:\\xampp\\mysql\\bin\\my.ini";
  if (fs.existsSync(rutaMysqld)) {
    console.log("[Foodsys Local] Iniciando MySQL de XAMPP en segundo plano (puerto 3306)...");
    try {
      const procMysql = spawn(rutaMysqld, [`--defaults-file=${rutaMyIni}`, "--standalone"], {
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      });
      procMysql.unref();
      await new Promise((r) => setTimeout(r, 1800));
    } catch (err) {
      console.warn("[Foodsys Local] Aviso al intentar iniciar MySQL de XAMPP:", err.message);
    }
  }
}

/**
 * Verifica si el Backend (Node/App.js) esta escuchando en 127.0.0.1:8000.
 * Si el desarrollador solo ejecuto "vite" o "pnpm run dev" en Frontend/,
 * levanta automaticamente Node/App.js en segundo plano para evitar ECONNREFUSED.
 */
async function asegurarBackendActivo() {
  if (iniciandoBackend) return;
  const activo = await verificarPuertoActivo(BACKEND_PORT, BACKEND_HOST, 700);
  if (activo) return;

  const rutaCarpetaNode = path.resolve(__dirname, "../Node");
  const rutaAppJs = path.join(rutaCarpetaNode, "App.js");
  if (!fs.existsSync(rutaAppJs)) return;

  iniciandoBackend = true;
  try {
    await asegurarMysqlXamppActivo();

    const yaActivo = await verificarPuertoActivo(BACKEND_PORT, BACKEND_HOST, 500);
    if (yaActivo) {
      iniciandoBackend = false;
      return;
    }

    console.log("[Foodsys Local] Backend no detectado en puerto 8000. Iniciando Node/App.js automaticamente...");
    procesoBackendHijo = spawn(process.execPath, ["App.js"], {
      cwd: rutaCarpetaNode,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    procesoBackendHijo.stdout?.on("data", (datos) => {
      const texto = datos.toString().trim();
      if (texto) {
        console.log(`[Backend 8000] ${texto}`);
      }
    });

    procesoBackendHijo.stderr?.on("data", (datos) => {
      const texto = datos.toString().trim();
      if (texto) {
        console.error(`[Backend 8000] ${texto}`);
      }
    });

    procesoBackendHijo.on("exit", () => {
      procesoBackendHijo = null;
      iniciandoBackend = false;
    });

    // Esperar hasta 3 segundos a que el puerto 8000 quede listo
    for (let i = 0; i < 6; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (await verificarPuertoActivo(BACKEND_PORT, BACKEND_HOST, 400)) {
        break;
      }
    }
  } catch (err) {
    console.error("[Foodsys Local] Error al auto-iniciar Backend:", err.message);
  } finally {
    iniciandoBackend = false;
  }
}

/**
 * Plugin Vite que mantiene el Backend Node.js activo durante el desarrollo local.
 */
function autoIniciarBackendFoodsys() {
  return {
    name: "foodsys-auto-backend-supervisor",
    configureServer(server) {
      // Verificar y levantar Backend al iniciar Vite
      asegurarBackendActivo();

      // Monitoreo ligero cada 5 segundos por si el Backend se detiene
      const intervalo = setInterval(() => {
        asegurarBackendActivo();
      }, 5000);

      server.httpServer?.once("close", () => {
        clearInterval(intervalo);
        if (procesoBackendHijo && !procesoBackendHijo.killed) {
          try {
            procesoBackendHijo.kill();
          } catch {
            // Ignorar al cerrar
          }
        }
      });
    },
  };
}

/**
 * Configura el manejo de errores del proxy de Vite para nunca devolver un 500 vacio.
 */
function configurarResilienciaProxy(proxy) {
  proxy.on("error", async (err, req, res) => {
    // Disparar auto-arranque del backend si estaba apagado
    asegurarBackendActivo();

    if (res && !res.headersSent && typeof res.writeHead === "function") {
      res.writeHead(503, { "Content-Type": "application/json; charset=utf-8" });
      res.end(
        JSON.stringify({
          message:
            "Conectando con el servidor local de Foodsys (puerto 8000). Por favor intenta nuevamente en 2 segundos.",
          mensaje:
            "Conectando con el servidor local de Foodsys (puerto 8000). Por favor intenta nuevamente en 2 segundos.",
          codigo: "BACKEND_STARTING_OR_OFFLINE",
        })
      );
    }
  });
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    basicSsl(),
    autoIniciarBackendFoodsys(),
  ],
  server: {
    https: true,
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: `http://${BACKEND_HOST}:${BACKEND_PORT}`,
        changeOrigin: true,
        secure: false,
        configure: configurarResilienciaProxy,
      },
      "/uploads": {
        target: `http://${BACKEND_HOST}:${BACKEND_PORT}`,
        changeOrigin: true,
        secure: false,
        configure: configurarResilienciaProxy,
      },
      "/socket.io": {
        target: `http://${BACKEND_HOST}:${BACKEND_PORT}`,
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});