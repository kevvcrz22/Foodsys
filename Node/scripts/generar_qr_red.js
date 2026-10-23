// Node/scripts/generar_qr_red.js
// Genera el codigo QR de acceso rapido para celulares y tablets en la red local.

import os from 'os';
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

async function main() {
  const ip = process.argv[2] || obtenerIpLocal();
  const url = `https://${ip}:5173`;
  const salidaRoot = path.join(rootDir, 'QR_Acceso_Foodsys.png');
  const salidaFrontend = path.join(rootDir, 'Frontend', 'QR_Acceso_Foodsys.png');

  try {
    await QRCode.toFile(salidaRoot, url, {
      width: 450,
      margin: 2,
      color: {
        dark: '#0f766e', // Color institucional teal-700
        light: '#ffffff'
      }
    });

    await QRCode.toFile(salidaFrontend, url, {
      width: 450,
      margin: 2,
      color: {
        dark: '#0f766e',
        light: '#ffffff'
      }
    });

    console.log(`[QR] Codigo generado exitosamente para: ${url}`);
    console.log(`[QR] Guardado en: ${salidaRoot}`);
  } catch (err) {
    console.error('[QR] Error al generar el codigo:', err.message);
  }
}

main();
