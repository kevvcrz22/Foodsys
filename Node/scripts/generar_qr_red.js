// Node/scripts/generar_qr_red.js
// Genera el codigo QR de acceso rapido para celulares y tablets en la red local.

import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

function obtenerIpLocal() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // Filtrar IPv4 internas, loopback y direcciones APIPA 169.254.x.x
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254.')) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

function obtenerRutasEscritorio() {
  const home = os.homedir();
  const posibles = [
    path.join(home, 'OneDrive', 'Documentos', 'Desktop'),
    path.join(home, 'OneDrive', 'Desktop'),
    path.join(home, 'Desktop'),
    path.join(home, 'OneDrive', 'Escritorio'),
    path.join(home, 'Escritorio')
  ];
  return posibles.filter(r => fs.existsSync(r));
}

async function main() {
  const ip = process.argv[2] || obtenerIpLocal();
  const url = `https://${ip}:5173`;
  const salidaRoot = path.join(rootDir, 'QR_Acceso_Foodsys.png');
  const salidaFrontend = path.join(rootDir, 'Frontend', 'QR_Acceso_Foodsys.png');

  try {
    const opcionesQR = {
      width: 500,
      margin: 2,
      color: {
        dark: '#0f766e', // Color institucional teal-700
        light: '#ffffff'
      }
    };

    // 1. Guardar en carpeta del proyecto
    await QRCode.toFile(salidaRoot, url, opcionesQR);
    await QRCode.toFile(salidaFrontend, url, opcionesQR);

    // 2. Guardar directamente en el Escritorio del usuario (para acceso inmediato)
    const escritorios = obtenerRutasEscritorio();
    for (const esc of escritorios) {
      const dest = path.join(esc, 'QR_Acceso_Foodsys.png');
      try {
        await QRCode.toFile(dest, url, opcionesQR);
        console.log(`[QR] Guardado en Escritorio: ${dest}`);
      } catch (eEsc) {
        // Ignorar si hay bloqueo
      }
    }

    console.log(`=======================================================`);
    console.log(`[QR] Codigo generado exitosamente para: ${url}`);
    console.log(`[QR] Abre en el celular: ${url}`);
    console.log(`=======================================================`);
  } catch (err) {
    console.error('[QR] Error al generar el codigo:', err.message);
  }
}

main();
