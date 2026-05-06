 import crypto from "crypto";
import db from '../Database/db.js';
import ReservaModel from "../Models/ReservasModel.js";
import UsuariosModel from "../Models/UsuariosModel.js";
import PlatosModels from "../Models/PlatosModels.js";
import MenusModel from "../Models/MenusModels.js";

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

    const horasLimite = { Desayuno: {h: 7, m: 0}, Almuerzo: {h: 14, m: 5}, Cena: {h: 19, m: 0} };
    if (!horasLimite[tipo]) throw new Error("Tipo de comida no valido");

    fechaObjetivo.setHours(horasLimite[tipo].h, horasLimite[tipo].m, 0, 0);

    const diferenciaMs = fechaObjetivo.getTime() - ahora.getTime();
    const diferenciaHoras = diferenciaMs / (1000 * 60 * 60);

    if (diferenciaHoras < 24) {
      throw new Error(
        `La reserva para ${tipo} debe hacerse con al menos 24 horas de antelacion` +
        ` (Cierre: ${horasLimite[tipo].h.toString().padStart(2, '0')}:${horasLimite[tipo].m.toString().padStart(2, '0')} del dia anterior).`
      );
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

  // Retorna los platos disponibles en el menu para una fecha y tipo de comida especificos
  // Se usa para que el usuario pueda elegir su plato antes de confirmar la reserva
  // CORRECCION: la tabla menus guarda un plato por fila, la asociacion en app.js
  // se llama as:'plato' (singular), por eso se usa findAll y se mapea cada fila
  async obtenerPlatosDelMenu(fechaReserva, tipComida) {

    // Se buscan TODAS las filas del menu que coincidan con la fecha y el tipo de comida
    // Antes se usaba findOne + as:'platos' (plural) lo cual era incorrecto
    const filas = await MenusModel.findAll({
      where: {
        Fec_Menu: fechaReserva,
        Tip_Menu: tipComida
      },
      // El alias 'plato' (singular) corresponde a la asociacion definida en app.js:
      // MenuModel.belongsTo(PlatosModel, { foreignKey: "Id_Plato", as: "plato" })
      include: [
        {
          model: PlatosModels,
          as: 'plato',
          attributes: ['Id_Plato', 'Nom_Plato', 'Des_Plato', 'Img_Plato', 'Tip_Plato']
        }
      ]
    });

    // Si no hay filas de menu para esa fecha y tipo, se informa al usuario
    if (!filas || filas.length === 0) {
      throw new Error(`No hay menu disponible para ${tipComida} del ${fechaReserva}`);
    }

    // Se extrae el objeto plato de cada fila del menu
    // filter(Boolean) elimina posibles nulos en caso de fila sin plato relacionado
    const platos = filas.map(fila => fila.plato).filter(Boolean);

    return platos;
  }

  // Crea una nueva reserva dentro de una transaccion para garantizar consistencia
  async generarReservaPass(Id_Usuario, rolesUsuario, Tip_Reserva, platoElegido, fechaReserva) {
    return await db.transaction(async (transaction) => {

      // Paso 1: confirmar que el usuario existe en la base de datos
      const usuario = await UsuariosModel.findByPk(Id_Usuario, { transaction });
      if (!usuario) throw new Error("Usuario no encontrado");

      // Verificar si el usuario esta sancionado
      // CORRECCION: San_Usuario es STRING con valor 'Si' o 'No', no numero 1
      // Antes se comparaba con === 1 (numero) lo cual nunca detectaba la sancion
      if (usuario.San_Usuario === 'Si') {
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

      // Paso 4: validar que se haga la reserva con al menos 24 horas de antelacion
      this.ValidarAntelacion24Horas(TipoNormalizado, fechaReserva);

      // Paso 5: calcular la fecha y hora en que vence la reserva
      const fechaVencimiento = this.CalcularVencimiento(TipoNormalizado, fechaReserva);

      // Paso 6: evitar duplicados, solo puede haber una reserva activa por tipo y dia
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
        // Se define la hora en que vence cada tipo de comida
        // Pasada esa hora el usuario podra volver a reservar para otro dia
        const horasVencimiento = {
          Desayuno: '07:00',
          Almuerzo: '14:05',
          Cena: '19:00'
        };

        // Se obtiene la hora de vencimiento segun el tipo de comida seleccionado
        const horaVencimiento = horasVencimiento[TipoNormalizado];

        throw new Error(
          `Ya tienes una reserva activa para ${TipoNormalizado} del ${fechaReserva}. ` +
          `Tu reserva vence a las ${horaVencimiento} de ese dia, ` +
          `despues de esa hora podras realizar una nueva reserva.`
        );
      }

      // Paso 7: insertar la reserva con el QR vacio, se llenara en el siguiente paso
      const nuevaReserva = await ReservaModel.create({
        Id_Usuario: usuario.Id_Usuario,
        Fec_Reserva: fechaReserva,
        Vec_Reserva: fechaVencimiento,
        Tip_Reserva: TipoNormalizado,
        Est_Reserva: 'Generado',
        Qr_Reserva: '',
        Id_Plato: platoElegido,
        Res_Excepcional: "No",
        Justificacion: null
      }, { transaction });

      // Paso 8: armar el objeto que se va a encriptar y guardar en el campo QR
      const datosQR = {
        Id_Reserva: nuevaReserva.Id_Reserva,
        Id_Usuario: usuario.Id_Usuario,
        Tipo: TipoNormalizado,
        Fec_Reserva: fechaReserva,
        Vencimiento: fechaVencimiento.toISOString()
      };

      // Paso 9: encriptar los datos y actualizar el campo Qr_Reserva en la base de datos
      const encriptado = this.EncriptarDatos(datosQR);
      await nuevaReserva.update({ Qr_Reserva: encriptado }, { transaction });

      // La URL que se codificara en el QR apunta al frontend con los datos encriptados
      const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const qrUrl = `${baseUrl}/ReservaCreada-checkin?data=${encodeURIComponent(encriptado)}`;

      return {
        Qr_Reserva: encriptado,
        validDate: fechaReserva,
        expiresAt: fechaVencimiento,
        qrUrl
      };
    });
  }
}

export default new ReservasServices();