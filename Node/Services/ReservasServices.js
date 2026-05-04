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

  // Calcula la fecha y hora de vencimiento segun la fecha de reserva
  CalcularVencimiento(tipo, fechaReserva) {
    const vencimiento = new Date(`${fechaReserva}T00:00:00`);
    const horas = { Desayuno: 7, Almuerzo: 14, Cena: 19 };
    if (!horas[tipo]) throw new Error("Tipo de comida no valido");
    vencimiento.setHours(horas[tipo], 0, 0, 0);
    return vencimiento;
  }

  // Valida que la reserva se haga con al menos 24 horas de antelacion respecto al limite de servicio
  ValidarAntelacion24Horas(tipo, fechaReserva) {
    const ahora = new Date();
    const fechaObjetivo = new Date(`${fechaReserva}T00:00:00`);
    
    // Hora limite de servicio segun el tipo de comida
    const horasLimite = { Desayuno: {h: 7, m: 0}, Almuerzo: {h: 14, m: 5}, Cena: {h: 19, m: 0} };
    if (!horasLimite[tipo]) throw new Error("Tipo de comida no valido");
    
    fechaObjetivo.setHours(horasLimite[tipo].h, horasLimite[tipo].m, 0, 0);
    
    // Calcula la diferencia en horas
    const diferenciaMs = fechaObjetivo.getTime() - ahora.getTime();
    const diferenciaHoras = diferenciaMs / (1000 * 60 * 60);
    
    if (diferenciaHoras < 24) {
      throw new Error(`La reserva para ${tipo} debe hacerse con al menos 24 horas de antelación (Cierre: ${horasLimite[tipo].h.toString().padStart(2, '0')}:${horasLimite[tipo].m.toString().padStart(2, '0')} del día anterior).`);
    }
    return true;
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
  async generarReservaPass(Id_Usuario, rolesUsuario, Tip_Reserva, platoElegido, fechaReserva, esNovedad = false, justificacion = null) {
    return await db.transaction(async (transaction) => {

      // Paso 1: confirmar que el usuario existe en la base de datos
      const usuario = await UsuariosModel.findByPk(Id_Usuario, { transaction });
      if (!usuario) throw new Error("Usuario no encontrado");

      // Validar si el usuario esta sancionado
      if (usuario.Estado_Sancion === 1) {
        throw new Error("No puedes realizar reservas porque te encuentras sancionado.");
      }

      // Paso 2: validar que el tipo de comida este permitido para los roles del usuario
      const tiposPermitidos = this.ObtenerRolesPermitidos(rolesUsuario);
      const TipoNormalizado = Tip_Reserva.charAt(0).toUpperCase() + Tip_Reserva.slice(1);
      if (!tiposPermitidos.includes(TipoNormalizado)) {
        throw new Error(`El tipo de comida "${Tip_Reserva}" no esta permitido para tu rol`);
      }

      // Paso 3: confirmar que el plato seleccionado existe
      const plato = await PlatosModels.findByPk(platoElegido, { transaction });
      if (!plato) throw new Error("El plato seleccionado no existe");

      // Validar regla de 24 horas si no es reserva por novedad
      if (!esNovedad) {
        this.ValidarAntelacion24Horas(TipoNormalizado, fechaReserva);
      }

      // Paso 4: calcular las fechas de generacion y vencimiento
      const fechaVencimiento = this.CalcularVencimiento(TipoNormalizado, fechaReserva);

      // Paso 5: evitar duplicados, solo puede existir una reserva activa por tipo y dia
      const existente = await ReservaModel.findOne({
        where: {
          Id_Usuario: usuario.Id_Usuario,
          Tip_Reserva: TipoNormalizado,
          Fec_Reserva: fechaReserva,
          Est_Reserva: 'Generado'
        },
        transaction
      });
      if (existente) {
        throw new Error(`Ya tienes una reserva activa para ${TipoNormalizado} en la fecha ${fechaReserva}`);
      }

      // Paso 6: insertar la reserva con el QR vacio, se llenara en el paso 8
      const nuevaReserva = await ReservaModel.create({
        Id_Usuario: usuario.Id_Usuario,
        Fec_Reserva: fechaReserva,
        Vec_Reserva: fechaVencimiento,
        Tip_Reserva: TipoNormalizado,
        Est_Reserva: 'Generado',
        Qr_Reserva: '',
        Id_Plato: platoElegido,
        Res_Excepcional: esNovedad ? "Si" : "No",
        Justificacion: justificacion
      }, { transaction });

      // Paso 7: armar el objeto que se va a encriptar y guardar en el QR
      const datosQR = {
        Id_Reserva: nuevaReserva.Id_Reserva,
        Id_Usuario: usuario.Id_Usuario,
        Tipo: TipoNormalizado,
        Fec_Reserva: fechaReserva,
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
        validDate: fechaReserva,
        expiresAt: fechaVencimiento,
        qrUrl
      };
    });
  }

  // Retorna las ultimas 10 reservas del usuario ordenadas de la mas reciente a la mas antigua
  async obtenerHistorial(Id_Usuario) {
    return await ReservaModel.findAll({
      where: { Id_Usuario },
      include: [{ model: PlatosModels, as: 'plato', attributes: ['Nom_Plato', 'Img_Plato'] }],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });
  }

  // Retorna TODAS las reservas del usuario sin limite de cantidad
  async obtenerHistorialCompleto(Id_Usuario) {
    return await ReservaModel.findAll({
      where: { Id_Usuario },
      include: [{ model: PlatosModels, as: 'plato', attributes: ['Nom_Plato', 'Img_Plato'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  // Cambia el estado de una reserva a Cancelado.
  // Solo se puede cancelar si el estado actual es Generado y pertenece al usuario.
  async cancelarReserva(Id_Reserva, Id_Usuario) {
    const Reserva = await ReservaModel.findOne({
      where: { Id_Reserva, Id_Usuario },
    });
    if (!Reserva) {
      throw new Error('Reserva no encontrada o no pertenece al usuario');
    }
    if (Reserva.Est_Reserva !== 'Generado') {
      throw new Error(
        `No se puede cancelar una reserva con estado: ${Reserva.Est_Reserva}`
      );
    }
    await Reserva.update({ Est_Reserva: 'Cancelado' });
    return true;
  }
}

export default new ReservasServices();