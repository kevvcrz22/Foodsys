// Servicio_Correo.js
// Servicio centralizado y unificado para el envío de correos utilizando Nodemailer.
// Maneja restablecimiento de contraseñas, notificaciones de turnos y formulario de soporte.

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const port = Number(process.env.SMTP_PORT) || 587;
const isSecure = port === 465;

const transportador = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: port,
  secure: isSecure,
  auth: {
    user: process.env.SMTP_USER || 'fierrokkevin@gmail.com',
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || '',
  },
});

/**
 * Función genérica para enviar correos electrónicos.
 * @param {string} destinatario - Correo del usuario destino.
 * @param {string} asunto - Asunto del correo.
 * @param {string} htmlCuerpo - Contenido del correo en formato HTML.
 * @param {Array} adjuntos - Arreglo opcional de archivos adjuntos (Multer o buffers).
 */
export const Enviar_Correo = async (destinatario, asunto, htmlCuerpo, adjuntos = []) => {
  try {
    const opcionesCorreo = {
      from: `"Soporte Foodsys" <${process.env.SMTP_USER || 'fierrokkevin@gmail.com'}>`,
      to: destinatario,
      subject: asunto,
      html: htmlCuerpo,
      attachments: adjuntos.map(archivo => ({
        filename: archivo.originalname || archivo.filename || 'adjunto',
        content: archivo.buffer || archivo.content,
      })),
    };

    const resultado = await transportador.sendMail(opcionesCorreo);
    console.log(`✉️ Correo enviado exitosamente a: ${destinatario}`);
    return resultado;
  } catch (errorCorreo) {
    console.error(`❌ Error al enviar correo a ${destinatario}:`, errorCorreo.message);
    // Retornar objeto de error amigable para no tumbar flujos si SMTP no está configurado en desarrollo
    return { error: errorCorreo.message };
  }
};

/**
 * Adaptador flexible para enviarCorreo({ to, subject, html, text, attachments }).
 */
export const enviarCorreo = async ({ to, subject, html, text, attachments = [] }) => {
  const cuerpo = html || `<p style="white-space: pre-wrap; font-family: sans-serif;">${text || ''}</p>`;
  return await Enviar_Correo(to, subject, cuerpo, attachments);
};

/**
 * Envío de enlace para recuperación de contraseña.
 */
export const sendPasswordResetEmail = async (email, tokenForPassword) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${tokenForPassword}`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #1a1a2e; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #2E5792; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Foodsys SENA</h1>
      </div>
      <div style="padding: 30px; background-color: #f4f7fb;">
        <h2 style="color: #2E5792;">Recuperación de contraseña</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña en el sistema Foodsys.</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${resetUrl}" style="background-color: #2E5792; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Restablecer contraseña</a>
        </div>
        <p style="font-size: 13px; color: #64748b;">Este enlace vence en 15 minutos. Si no solicitaste este cambio, puedes ignorar este correo con total tranquilidad.</p>
      </div>
    </div>
  `;
  return await Enviar_Correo(email, "Restablecer contraseña - Foodsys", html);
};

/**
 * Notificación de inicio de turno de supervisor al correo institucional.
 */
export const notificarInicioTurno = async (supervisor, turno) => {
  const correoAdmin = process.env.CONTACT_EMAIL || process.env.SMTP_USER || 'fierrokkevin@gmail.com';
  const nombre = `${supervisor.Nom_Usuario || ''} ${supervisor.Ape_Usuario || ''}`.trim() || 'Supervisor';
  const fechaStr = new Date(turno.Fecha_Inicio || Date.now()).toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #2E5792; padding: 18px; text-align: center; color: white;">
        <h2 style="margin: 0; font-size: 20px;">Foodsys - Inicio de Turno</h2>
      </div>
      <div style="padding: 24px; background: #ffffff;">
        <p style="font-size: 15px;">Se ha registrado el inicio de un turno de supervisión en el comedor:</p>
        <ul style="line-height: 1.8; font-size: 14px; color: #334155;">
          <li><strong>Supervisor:</strong> ${nombre} (Doc: ${supervisor.NumDoc_Usuario || 'N/A'})</li>
          <li><strong>Fecha y hora de inicio:</strong> ${fechaStr}</li>
          <li><strong>ID Turno:</strong> #${turno.Id_Turno || 'En curso'}</li>
          ${turno.Observaciones ? `<li><strong>Observaciones iniciales:</strong> ${turno.Observaciones}</li>` : ''}
        </ul>
        <p style="color: #64748b; font-size: 12px; margin-top: 20px;">Notificación automática del sistema Foodsys.</p>
      </div>
    </div>
  `;
  return await Enviar_Correo(correoAdmin, `[Foodsys] Turno Iniciado por ${nombre}`, html);
};

/**
 * Notificación de fin de turno de supervisor al correo institucional.
 */
export const notificarFinTurno = async (supervisor, turno) => {
  const correoAdmin = process.env.CONTACT_EMAIL || process.env.SMTP_USER || 'fierrokkevin@gmail.com';
  const nombre = `${supervisor.Nom_Usuario || ''} ${supervisor.Ape_Usuario || ''}`.trim() || 'Supervisor';
  const fechaInicioStr = new Date(turno.Fecha_Inicio).toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  const fechaFinStr = new Date(turno.Fecha_Fin || Date.now()).toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #10b981; padding: 18px; text-align: center; color: white;">
        <h2 style="margin: 0; font-size: 20px;">Foodsys - Cierre de Turno</h2>
      </div>
      <div style="padding: 24px; background: #ffffff;">
        <p style="font-size: 15px;">El turno de supervisión ha finalizado exitosamente:</p>
        <ul style="line-height: 1.8; font-size: 14px; color: #334155;">
          <li><strong>Supervisor:</strong> ${nombre}</li>
          <li><strong>Inicio:</strong> ${fechaInicioStr}</li>
          <li><strong>Fin:</strong> ${fechaFinStr}</li>
          <li><strong>Total Consumos Registrados:</strong> ${turno.Total_Consumos_Registrados || 0}</li>
          ${turno.Observaciones ? `<li><strong>Observaciones:</strong> ${turno.Observaciones}</li>` : ''}
        </ul>
        <p style="color: #64748b; font-size: 12px; margin-top: 20px;">Notificación automática del sistema Foodsys.</p>
      </div>
    </div>
  `;
  return await Enviar_Correo(correoAdmin, `[Foodsys] Turno Finalizado por ${nombre}`, html);
};

/**
 * Notificación de solicitud de cesión de reserva al aprendiz receptor.
 */
export const enviarCorreoSolicitudCesion = async ({
  correoDestinatario,
  nombreDestinatario,
  nombreCedente,
  tipoComida,
  fechaReserva,
  nombrePlato,
  nombreBebida
}) => {
  if (!correoDestinatario) return null;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Foodsys — Centro Agropecuario La Granja</h1>
        <p style="color: #ecfdf5; margin: 6px 0 0 0; font-size: 14px;">Solicitud de Cesion Solidaria de Racion</p>
      </div>
      <div style="padding: 24px; background-color: #ffffff;">
        <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">¡Hola, ${nombreDestinatario}!</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">
          Tu companero <strong>${nombreCedente}</strong> te ha ofrecido cederte su reserva de alimentacion.
        </p>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <p style="margin: 4px 0; font-size: 14px;"><strong>Tipo de Comida:</strong> ${tipoComida}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Fecha del Servicio:</strong> ${fechaReserva}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Plato:</strong> ${nombrePlato || 'Plato del menu'}</p>
          ${nombreBebida ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Bebida:</strong> ${nombreBebida}</p>` : ''}
        </div>
        <p style="font-size: 14px; color: #64748b;">
          Para aceptar o rechazar esta reserva, ingresa a tu cuenta en Foodsys en la seccion <strong>"Mis Reservas"</strong> o revisa la campanita de notificaciones.
        </p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
          Si no realizas ninguna accion o rechazas la solicitud, la reserva se mantendra a nombre del titular original.
        </p>
      </div>
    </div>
  `;
  return await enviarCorreo({
    to: correoDestinatario,
    subject: `¡Te han ofrecido cederte una racion de ${tipoComida}! — Foodsys`,
    html
  });
};

export default {
  Enviar_Correo,
  enviarCorreo,
  sendPasswordResetEmail,
  notificarInicioTurno,
  notificarFinTurno,
  enviarCorreoSolicitudCesion,
};
