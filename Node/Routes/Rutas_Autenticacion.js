// Rutas_Autenticacion.js
// Rutas exclusivas para recuperación de contraseña y contacto, aplicando principios Clean Code.

import express from 'express';
import multer from 'multer';
import {
  Generar_OTP,
  Validar_OTP,
  Cambiar_Contrasena_OTP,
  Enviar_Contacto
} from '../Controllers/Controlador_Autenticacion.js';

const Enrutador = express.Router();

// Configuración de Multer para manejar subidas en memoria (límite 2MB)
// Se almacenan en RAM (buffer) temporalmente para ser enviadas por Nodemailer, sin llenar el disco.
const limiteTamano = 2 * 1024 * 1024; // 2 MB
const configuracionMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: limiteTamano },
  fileFilter: (req, file, cb) => {
    // Solo permitir PDF, JPG y PNG
    const tiposPermitidos = ['image/jpeg', 'image/png', 'application/pdf'];
    if (tiposPermitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato no válido. Solo se permiten archivos JPG, PNG y PDF.'));
    }
  }
});

// Rutas de Recuperación de Contraseña (Flujo OTP)
Enrutador.post('/recuperar/generar-otp', Generar_OTP);
Enrutador.post('/recuperar/validar-otp', Validar_OTP);
Enrutador.post('/recuperar/cambiar-contrasena', Cambiar_Contrasena_OTP);

// Ruta de Contacto Público
// 'adjunto' es el nombre del campo en el FormData del frontend
Enrutador.post('/contacto', configuracionMulter.single('adjunto'), Enviar_Contacto);

// Middleware local para atrapar errores de Multer (ej. archivo muy grande)
Enrutador.use((error, peticion, respuesta, siguiente) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return respuesta.status(400).json({ mensaje: 'El archivo excede el límite de 2MB.' });
    }
  } else if (error) {
    return respuesta.status(400).json({ mensaje: error.message });
  }
  siguiente();
});

export default Enrutador;
