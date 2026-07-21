// Servicio_Correo.js
// Servicio centralizado para el envío de correos utilizando Nodemailer.

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transportador = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com', // Ajustar según el proveedor real de SENA
  port: process.env.SMTP_PORT || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'soportefootsies@cena.edu.co',
    pass: process.env.SMTP_PASS || 'password_segura',
  },
});

/**
 * Función genérica para enviar correos electrónicos.
 * @param {string} destinatario - Correo del usuario destino.
 * @param {string} asunto - Asunto del correo.
 * @param {string} htmlCuerpo - Contenido del correo en formato HTML.
 * @param {Array} adjuntos - Arreglo opcional de archivos adjuntos (Multer format).
 */
const Enviar_Correo = async (destinatario, asunto, htmlCuerpo, adjuntos = []) => {
  try {
    const opcionesCorreo = {
      from: `"Soporte Foodsys" <${process.env.SMTP_USER || 'soportefootsies@cena.edu.co'}>`,
      to: destinatario,
      subject: asunto,
      html: htmlCuerpo,
      attachments: adjuntos.map(archivo => ({
        filename: archivo.originalname,
        content: archivo.buffer
      })),
    };

    const resultado = await transportador.sendMail(opcionesCorreo);
    console.log(`✉️ Correo enviado exitosamente a: ${destinatario}`);
    return resultado;
  } catch (errorCorreo) {
    console.error(`❌ Error al enviar correo a ${destinatario}:`, errorCorreo.message);
    throw new Error('No se pudo enviar el correo electrónico. Intente más tarde.');
  }
};

export default { Enviar_Correo };
