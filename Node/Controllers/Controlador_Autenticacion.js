// Controlador_Autenticacion.js
// Controlador para gestionar el flujo de recuperación de contraseña (OTP) y Contacto.

import UsuariosModel from '../Models/UsuariosModel.js';
import bcrypt from 'bcrypt';
import Servicio_Correo from '../Services/Servicio_Correo.js';

// Mapa en memoria para almacenar los OTP temporalmente (10 minutos de expiración)
// En producción estricta esto iría en Redis o una tabla dedicada.
const otpsEnMemoria = new Map();

/**
 * Paso 1: Generar y enviar el código OTP al correo del usuario.
 */
export const Generar_OTP = async (peticion, respuesta) => {
  const { documento } = peticion.body;

  if (!documento) {
    return respuesta.status(400).json({ mensaje: "El documento es obligatorio." });
  }

  try {
    const usuario = await UsuariosModel.findOne({ where: { NumDoc_Usuario: documento } });
    if (!usuario) {
      return respuesta.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    if (!usuario.Cor_Usuario) {
      return respuesta.status(400).json({ mensaje: "El usuario no tiene un correo registrado." });
    }

    // Generar código numérico de 6 dígitos
    const codigoOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Guardar OTP en memoria con tiempo de expiración (10 min = 600000 ms)
    otpsEnMemoria.set(documento, {
      codigo: codigoOtp,
      expiracion: Date.now() + 600000
    });

    // Plantilla HTML corporativa
    const cuerpoHtml = `
      <div style="font-family: Arial, sans-serif; color: #1a1a2e; max-w-sm: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #42b72a; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Foodsys SENA</h1>
        </div>
        <div style="padding: 30px; background-color: #f4f7fb;">
          <p style="font-size: 16px;">Hola <strong>${usuario.Nom_Usuario}</strong>,</p>
          <p style="font-size: 16px;">Has solicitado recuperar tu contraseña. Usa el siguiente código de seguridad:</p>
          <div style="background-color: white; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0; border: 2px dashed #42b72a;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1861c1;">${codigoOtp}</span>
          </div>
          <p style="font-size: 14px; color: #5a6d8a;">Este código expirará en 10 minutos. Si no solicitaste este cambio, ignora este correo.</p>
        </div>
      </div>
    `;

    await Servicio_Correo.Enviar_Correo(usuario.Cor_Usuario, "Código de Seguridad - Recuperación de Contraseña", cuerpoHtml);

    return respuesta.status(200).json({ 
      mensaje: "Código enviado exitosamente", 
      correoOculto: usuario.Cor_Usuario.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length))
    });

  } catch (error) {
    console.error("Error al generar OTP:", error);
    return respuesta.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

/**
 * Paso 2: Validar el código OTP.
 */
export const Validar_OTP = async (peticion, respuesta) => {
  const { documento, codigo } = peticion.body;

  if (!documento || !codigo) {
    return respuesta.status(400).json({ mensaje: "Documento y código son obligatorios." });
  }

  const otpData = otpsEnMemoria.get(documento);

  if (!otpData) {
    return respuesta.status(400).json({ mensaje: "El código no existe o ya fue utilizado." });
  }

  if (Date.now() > otpData.expiracion) {
    otpsEnMemoria.delete(documento);
    return respuesta.status(400).json({ mensaje: "El código ha expirado. Por favor, solicita uno nuevo." });
  }

  if (otpData.codigo !== codigo.toString()) {
    return respuesta.status(400).json({ mensaje: "Código incorrecto." });
  }

  // Código correcto: extender el tiempo para permitir el cambio de contraseña (5 minutos extra)
  otpsEnMemoria.set(documento, {
    ...otpData,
    verificado: true,
    expiracion: Date.now() + 300000
  });

  return respuesta.status(200).json({ mensaje: "Código verificado correctamente." });
};

/**
 * Paso 3: Cambiar la contraseña después de validar el OTP.
 */
export const Cambiar_Contrasena_OTP = async (peticion, respuesta) => {
  const { documento, nuevaContrasena } = peticion.body;

  if (!documento || !nuevaContrasena || nuevaContrasena.length < 8) {
    return respuesta.status(400).json({ mensaje: "Datos incompletos o contraseña muy corta." });
  }

  const otpData = otpsEnMemoria.get(documento);

  if (!otpData || !otpData.verificado || Date.now() > otpData.expiracion) {
    return respuesta.status(400).json({ mensaje: "Sesión de recuperación expirada o no verificada." });
  }

  try {
    const hash = await bcrypt.hash(nuevaContrasena, 10);
    
    await UsuariosModel.update(
      { password: hash }, 
      { where: { NumDoc_Usuario: documento } }
    );

    // Invalidar el OTP después del uso
    otpsEnMemoria.delete(documento);

    return respuesta.status(200).json({ mensaje: "Contraseña actualizada exitosamente." });

  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    return respuesta.status(500).json({ mensaje: "Error interno al actualizar la contraseña." });
  }
};

/**
 * Formulario de contacto público
 */
export const Enviar_Contacto = async (peticion, respuesta) => {
  const { nombre, correo, mensaje } = peticion.body;
  const adjunto = peticion.file; // Gestionado por multer en la ruta

  if (!nombre || !correo || !mensaje) {
    return respuesta.status(400).json({ mensaje: "Todos los campos de texto son obligatorios." });
  }

  try {
    const cuerpoHtml = `
      <h3>Nuevo Mensaje de Contacto - Foodsys</h3>
      <p><strong>De:</strong> ${nombre} (${correo})</p>
      <p><strong>Mensaje:</strong></p>
      <p>${mensaje}</p>
    `;

    const adjuntos = adjunto ? [adjunto] : []; // Si hay archivo, lo mandamos como array

    // Enviar a la cuenta de soporte configurada en Servicio_Correo
    const correoSoporte = process.env.SMTP_USER || 'soportefootsies@cena.edu.co';
    await Servicio_Correo.Enviar_Correo(correoSoporte, `Contacto de ${nombre}`, cuerpoHtml, adjuntos);

    return respuesta.status(200).json({ mensaje: "Tu mensaje ha sido enviado exitosamente al equipo de soporte." });
  } catch (error) {
    console.error("Error en el formulario de contacto:", error);
    return respuesta.status(500).json({ mensaje: "Error al enviar el mensaje." });
  }
};
