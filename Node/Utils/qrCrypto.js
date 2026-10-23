// Node/Utils/qrCrypto.js
// Modulo de criptografia asimetrica Ed25519 para generacion y verificacion
// de codigos QR de reservas offline y online.
// Permite verificar la autenticidad matematica de una reserva emitida en la nube
// por Hetzner aunque el servidor local de La Granja no tenga conexion a internet.

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEYS_DIR = path.resolve(__dirname, '../uploads/keys');

// Asegura la existencia del directorio de llaves
if (!fs.existsSync(KEYS_DIR)) {
  fs.mkdirSync(KEYS_DIR, { recursive: true });
}

const PRIV_KEY_PATH = path.join(KEYS_DIR, 'ed25519_private.pem');
const PUB_KEY_PATH = path.join(KEYS_DIR, 'ed25519_public.pem');

// Obtiene o genera el par de llaves Ed25519 del sistema
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

  // Generar nuevo par si no existen
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  fs.writeFileSync(PRIV_KEY_PATH, privateKey, { mode: 0o600 });
  fs.writeFileSync(PUB_KEY_PATH, publicKey, { mode: 0o644 });

  return { privateKeyPem: privateKey, publicKeyPem: publicKey };
}

// Genera un codigo QR firmado digitalmente con Ed25519
// Retorna un string con formato: <payloadBase64Url>.<firmaBase64Url>
export function generarQrFirmado(datosReserva, customPrivateKeyPem = null) {
  const { privateKeyPem } = customPrivateKeyPem
    ? { privateKeyPem: customPrivateKeyPem }
    : obtenerLlavesEd25519();

  const payload = {
    id: datosReserva.uuid_reserva || datosReserva.uuid || crypto.randomUUID(),
    idReserva: datosReserva.Id_Reserva || null,
    doc: Number(datosReserva.NumDoc_Usuario || datosReserva.documento),
    nombre: String(datosReserva.Nom_Usuario || datosReserva.nombre || '').trim(),
    ficha: String(datosReserva.Num_Ficha || datosReserva.ficha || '').trim(),
    rol: String(datosReserva.Rol || datosReserva.rol || 'Aprendiz').trim(),
    fecha: String(datosReserva.Fec_Reserva || datosReserva.fecha).trim(),
    comida: String(datosReserva.Tip_Reserva || datosReserva.tipoComida || datosReserva.comida).trim(),
    plato: datosReserva.Id_Plato || datosReserva.plato || null,
    nodo: datosReserva.nodo_origen || datosReserva.nodoOrigen || 'CLOUD',
    creadoEn: Date.now()
  };

  const datosBase64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const firma = crypto.sign(null, Buffer.from(datosBase64), privateKeyPem).toString('base64url');

  return `${datosBase64}.${firma}`;
}

// Verifica un codigo QR de forma totalmente offline en el servidor local de La Granja
// Valida la firma matematica, fecha de servicio y turno
export function verificarQrOffline(contenidoQr, customPublicKeyPem = null, fechaHoyServidor = null, turnoActual = null) {
  if (!contenidoQr || typeof contenidoQr !== 'string') {
    throw new Error('Formato de QR invalido o contenido vacio.');
  }

  const partes = contenidoQr.trim().split('.');
  if (partes.length !== 2) {
    // Si no tiene el formato con punto, puede ser un QR clasico AES o no valido
    return null;
  }

  const [datosBase64, firmaBase64] = partes;
  const { publicKeyPem } = customPublicKeyPem
    ? { publicKeyPem: customPublicKeyPem }
    : obtenerLlavesEd25519();

  // 1. Verificacion matematica de la firma digital
  let esAutentico = false;
  try {
    esAutentico = crypto.verify(
      null,
      Buffer.from(datosBase64),
      publicKeyPem,
      Buffer.from(firmaBase64, 'base64url')
    );
  } catch (errFirma) {
    throw new Error('FRAUDE DETECTADO: Firma digital invalida o clave publica no coincide.');
  }

  if (!esAutentico) {
    throw new Error('FRAUDE DETECTADO: Firma digital invalida. Este codigo no fue emitido por Foodsys.');
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(datosBase64, 'base64url').toString('utf8'));
  } catch (errJson) {
    throw new Error('Formato de datos interno del QR no legible.');
  }

  // 2. Verificacion de fecha de la reserva contra el reloj del servidor
  if (fechaHoyServidor && payload.fecha && payload.fecha !== fechaHoyServidor) {
    throw new Error(`QR fuera de fecha. La reserva corresponde al dia ${payload.fecha} y hoy es ${fechaHoyServidor}.`);
  }

  // 3. Verificacion de turno de comida (Desayuno, Almuerzo, Cena)
  if (turnoActual && payload.comida && payload.comida.toLowerCase() !== turnoActual.toLowerCase()) {
    throw new Error(`QR fuera de turno. La reserva corresponde a ${payload.comida} y el turno actual es ${turnoActual}.`);
  }

  return payload;
}

export default {
  obtenerLlavesEd25519,
  generarQrFirmado,
  verificarQrOffline
};
