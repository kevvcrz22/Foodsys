// Node/Utils/qrCrypto.js
// Modulo de criptografia ligera HMAC-SHA256 + compatibilidad Ed25519 para codigos QR de Foodsys.
// Payload ultraligero {"r": idReserva, "h": hashVerificacion} para lectura en camara < 0.5 segundos.

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEYS_DIR = path.resolve(__dirname, '../uploads/keys');

if (!fs.existsSync(KEYS_DIR)) {
  fs.mkdirSync(KEYS_DIR, { recursive: true });
}

const PRIV_KEY_PATH = path.join(KEYS_DIR, 'ed25519_private.pem');
const PUB_KEY_PATH = path.join(KEYS_DIR, 'ed25519_public.pem');

const obtenerClaveSimetricaQr = () =>
  process.env.QR_ENCRYPTION_KEY ||
  process.env.VITE_ENCRYPTION_KEY ||
  process.env.JWT_SECRET ||
  'foodsys-sena-la-granja-2026-secret-key';

export function generarHashQr(idReserva, uuidPrefix = '') {
  const base = uuidPrefix ? `${idReserva}:${uuidPrefix}` : `${idReserva}`;
  return crypto
    .createHmac('sha256', obtenerClaveSimetricaQr())
    .update(base)
    .digest('hex')
    .slice(0, 10);
}

export function obtenerLlavesEd25519() {
  let privateKeyPem = process.env.ED25519_PRIVATE_KEY || null;
  let publicKeyPem = process.env.ED25519_PUBLIC_KEY || null;

  if (privateKeyPem && publicKeyPem) {
    return { privateKeyPem, publicKeyPem };
  }

  if (fs.existsSync(PRIV_KEY_PATH) && fs.existsSync(PUB_KEY_PATH)) {
    privateKeyPem = fs.readFileSync(PRIV_KEY_PATH, 'utf8');
    publicKeyPem = fs.readFileSync(PUB_KEY_PATH, 'utf8');
    return { privateKeyPem, publicKeyPem };
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  fs.writeFileSync(PRIV_KEY_PATH, privateKey, { mode: 0o600 });
  fs.writeFileSync(PUB_KEY_PATH, publicKey, { mode: 0o644 });

  return { privateKeyPem: privateKey, publicKeyPem: publicKey };
}

/**
 * Genera un payload QR ultraligero (< 35 caracteres) con clave simetrica HMAC
 * Ejemplo: {"r":1045,"h":"9b3d4e1a20"}
 * Garantiza baja densidad de matriz QR (version 2-3, nivel M/L) y lectura instantanea (< 2.5s).
 */
export function generarQrFirmado(datosReserva) {
  const idReserva = datosReserva.Id_Reserva || datosReserva.idReserva || null;
  const uuidFull = String(datosReserva.uuid_reserva || datosReserva.uuid || '').trim();
  const uuidPrefix = uuidFull ? uuidFull.slice(0, 8) : '';

  if (idReserva) {
    const h = generarHashQr(idReserva, '');
    return JSON.stringify(uuidPrefix ? { r: Number(idReserva), u: uuidPrefix, h } : { r: Number(idReserva), h });
  }

  // Fallback por UUID si aun no tiene ID numerico
  const ref = uuidFull || crypto.randomUUID();
  const h = generarHashQr(ref, '');
  return JSON.stringify({ r: ref, h });
}

/**
 * Extrae el contenido util si el QR viene envuelto en una URL (?data=...)
 */
export function limpiarEnvolturaUrlQr(contenidoQr) {
  if (!contenidoQr || typeof contenidoQr !== 'string') return '';
  let limpio = contenidoQr.trim();
  if (limpio.includes('data=')) {
    try {
      const idx = limpio.indexOf('data=');
      const rawParam = limpio.slice(idx + 5).split('&')[0];
      limpio = decodeURIComponent(rawParam);
    } catch {
      // conservar cadena original si falla decodeURIComponent
    }
  }
  return limpio;
}

/**
 * Verifica un codigo QR tanto en el nuevo formato ligero {"r": idReserva, "h": hash}
 * como en el formato heredado Ed25519 (<payloadBase64>.<firmaBase64>).
 */
export function verificarQrOffline(contenidoQr, customPublicKeyPem = null, fechaHoyServidor = null, turnoActual = null) {
  if (!contenidoQr || typeof contenidoQr !== 'string') {
    throw new Error('Formato de QR invalido o contenido vacio.');
  }

  const limpio = limpiarEnvolturaUrlQr(contenidoQr);

  // 1. Nuevo formato ultraligero JSON: {"r": idReserva, "h": hash}
  if (limpio.startsWith('{') && limpio.endsWith('}')) {
    let parsed = null;
    try {
      parsed = JSON.parse(limpio);
    } catch {
      parsed = null;
    }

    if (parsed && parsed.r !== undefined && parsed.h) {
      const hashEsperadoSimple = generarHashQr(parsed.r, '');
      const hashEsperadoConUuid = parsed.u ? generarHashQr(parsed.r, parsed.u) : null;

      if (parsed.h !== hashEsperadoSimple && parsed.h !== hashEsperadoConUuid) {
        throw new Error('FRAUDE DETECTADO: El hash de verificacion del codigo QR es invalido.');
      }

      return {
        esLigero: true,
        idReserva: typeof parsed.r === 'number' || /^\d+$/.test(String(parsed.r)) ? Number(parsed.r) : null,
        id: typeof parsed.r === 'string' && String(parsed.r).length > 12 ? parsed.r : null,
        uuidPrefix: parsed.u || null
      };
    }
  }

  // 2. Compatibilidad con QR de Campo heredado: SENAGRANJA-CAMPO-<idUsu>-<fecha>
  if (limpio.startsWith('SENAGRANJA-CAMPO-')) {
    const partesCampo = limpio.replace('SENAGRANJA-CAMPO-', '').split('-');
    if (partesCampo.length >= 4) {
      const idUsuario = Number(partesCampo[0]);
      const fecha = `${partesCampo[1]}-${partesCampo[2]}-${partesCampo[3]}`;
      return {
        esLigero: true,
        esCampoLegacy: true,
        idUsuario,
        fecha
      };
    }
  }

  // 3. Compatibilidad con formato heredado Ed25519 (<datosBase64>.<firmaBase64>)
  const partes = limpio.split('.');
  if (partes.length !== 2) {
    return null;
  }

  const [datosBase64, firmaBase64] = partes;
  const { publicKeyPem } = customPublicKeyPem
    ? { publicKeyPem: customPublicKeyPem }
    : obtenerLlavesEd25519();

  let esAutentico = false;
  try {
    esAutentico = crypto.verify(
      null,
      Buffer.from(datosBase64),
      publicKeyPem,
      Buffer.from(firmaBase64, 'base64url')
    );
  } catch {
    throw new Error('FRAUDE DETECTADO: Firma digital invalida o clave publica no coincide.');
  }

  if (!esAutentico) {
    throw new Error('FRAUDE DETECTADO: Firma digital invalida. Este codigo no fue emitido por Foodsys.');
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(datosBase64, 'base64url').toString('utf8'));
  } catch {
    throw new Error('Formato de datos interno del QR no legible.');
  }

  if (fechaHoyServidor && payload.fecha && payload.fecha !== fechaHoyServidor) {
    throw new Error(`No se puede consumir: Esta reserva corresponde al turno de ${payload.comida || 'Comida'} de la fecha ${payload.fecha}. Actualmente hoy es ${fechaHoyServidor}.`);
  }

  if (turnoActual && payload.comida && payload.comida.toLowerCase() !== turnoActual.toLowerCase()) {
    throw new Error(`No se puede consumir: Esta reserva corresponde al turno de ${payload.comida} de la fecha ${payload.fecha || fechaHoyServidor}. Actualmente el sistema solo permite registrar ${turnoActual}.`);
  }

  return payload;
}

export default {
  obtenerLlavesEd25519,
  generarHashQr,
  generarQrFirmado,
  limpiarEnvolturaUrlQr,
  verificarQrOffline
};
