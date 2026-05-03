import crypto from "crypto";
import db from '../Database/db.js';
import ReservaModel from "../Models/ReservasModel.js";
import UsuariosModel from "../Models/UsuariosModel.js";
import PlatosModels from "../Models/PlatosModels.js";

class ReservasServices {

  // Retorna la fecha de hoy en formato YYYY-MM-DD
  ObtenerFechaHoy() {
    return new Date().toISOString().split('T')[0];
  }

  // Calcula la fecha y hora de vencimiento: el dia siguiente a la hora del tipo de comida
  CalcularVencimiento(tipo) {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const horas = { Desayuno: 7, Almuerzo: 14, Cena: 19 };
    if (!horas[tipo]) throw new Error("Tipo de comida no valido");
    manana.setHours(horas[tipo], 0, 0, 0);
    return manana;
  }

  // Determina que tipos de comida puede reservar el usuario segun sus roles
  ObtenerRolesPermitidos(roles) {
    const esInterno = roles.some(r => r === 'Aprendiz Interno' || r === 'Pasante Interno');
    if (esInterno) return ['Desayuno', 'Almuerzo', 'Cena'];
    const esExterno = roles.some(r => r === 'Aprendiz Externo' || r === 'Pasante Externo');
    if (esExterno) return ['Almuerzo'];
    return [];
  }

  // Encripta el objeto de datos del QR usando AES-256-CBC
  // Retorna una cadena con formato: iv_en_hex:datos_encriptados_en_hex
  EncriptarDatos(datos) {
    if (!process.env.QR_ENCRYPTION_KEY) {
      throw new Error("QR_ENCRYPTION_KEY no esta definida en las variables de entorno");
    }
    const clave = Buffer.from(process.env.QR_ENCRYPTION_KEY, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', clave, iv);
    let encriptado = cipher.update(JSON.stringify(datos), 'utf8', 'hex');
    encriptado += cipher.final('hex');
    return iv.toString('hex') + ':' + encriptado;
  }

  // Crea una nueva reserva dentro de una transaccion para garantizar consistencia
  // Si algo falla en cualquier paso, se hace rollback y no queda ningun dato a medias
  async generarReservaPass(Id_Usuario, rolesUsuario, Tip_Reserva, platoElegido) {
    return await db.transaction(async (transaction) => {

      // Paso 1: confirmar que el usuario existe en la base de datos
      const usuario = await UsuariosModel.findByPk(Id_Usuario, { transaction });
      if (!usuario) throw new Error("Usuario no encontrado");

      // Paso 2: validar que el tipo de comida este permitido para los roles del usuario
      const tiposPermitidos = this.ObtenerRolesPermitidos(rolesUsuario);
      const TipoNormalizado = Tip_Reserva.charAt(0).toUpperCase() + Tip_Reserva.slice(1);
      if (!tiposPermitidos.includes(TipoNormalizado)) {
        throw new Error(`El tipo de comida "${Tip_Reserva}" no esta permitido para tu rol`);
      }

      // Paso 3: confirmar que el plato seleccionado existe
      const plato = await PlatosModels.findByPk(platoElegido, { transaction });
      if (!plato) throw new Error("El plato seleccionado no existe");

      // Paso 4: calcular las fechas de generacion y vencimiento
      const fechaGeneracion = this.ObtenerFechaHoy();
      const fechaVencimiento = this.CalcularVencimiento(TipoNormalizado);

      // Paso 5: evitar duplicados, solo puede existir una reserva activa por tipo y dia
      const existente = await ReservaModel.findOne({
        where: {
          Id_Usuario: usuario.Id_Usuario,
          Tip_Reserva: TipoNormalizado,
          Fec_Reserva: fechaGeneracion,
          Est_Reserva: 'Generado'
        },
        transaction
      });
      if (existente) {
        throw new Error(`Ya tienes una reserva activa para ${TipoNormalizado} generada hoy`);
      }

      // Paso 6: insertar la reserva con el QR vacio, se llenara en el paso 8
      const nuevaReserva = await ReservaModel.create({
        Id_Usuario: usuario.Id_Usuario,
        Fec_Reserva: fechaGeneracion,
        Vec_Reserva: fechaVencimiento,
        Tip_Reserva: TipoNormalizado,
        Est_Reserva: 'Generado',
        Qr_Reserva: '',
        Id_Plato: platoElegido
      }, { transaction });

      // Paso 7: armar el objeto que se va a encriptar y guardar en el QR
      const datosQR = {
        Id_Reserva: nuevaReserva.Id_Reserva,
        Id_Usuario: usuario.Id_Usuario,
        Tipo: TipoNormalizado,
        Fec_Reserva: fechaGeneracion,
        Vencimiento: fechaVencimiento.toISOString()
      };

      // Paso 8: encriptar los datos y actualizar el campo Qr_Reserva en la base de datos
      const encriptado = this.EncriptarDatos(datosQR);
      await nuevaReserva.update({ Qr_Reserva: encriptado }, { transaction });

      // La URL que se codificara en el QR apunta al frontend con los datos encriptados
      const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const qrUrl = `${baseUrl}/desayuno-checkin?data=${encodeURIComponent(encriptado)}`;

      return {
        Qr_Reserva: encriptado,
        validDate: fechaGeneracion,
        expiresAt: fechaVencimiento,
        qrUrl
      };
    });
  }

  // Retorna las ultimas 10 reservas del usuario ordenadas de la mas reciente a la mas antigua
  async obtenerHistorial(Id_Usuario) {
    return await ReservaModel.findAll({
      where: { Id_Usuario },
      include: [{ model: PlatosModels, attributes: ['Nom_Plato'] }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });
  }
}

export default new ReservasServices();