// Services/ReservasServices.js
//
// Servicio central del ciclo de vida de una reserva en Foodsys.
// Responsabilidades de este archivo:
//   - Crear reservas normales y por novedad (generarReservaPass)
//   - Encriptar y desencriptar los datos del codigo QR
//   - Validar roles, sanciones, antelacion de 24 horas y duplicados
//   - Procesar la verificacion de cocina (Generado -> Verificado)
//   - Procesar el escaneo del supervisor (Verificado -> Consumido)
//   - Aplicar el flujo privilegiado para usuarios con estado Especial
//   - Verificar de forma perezosa si el estado Especial de un usuario ha expirado
//   - Buscar y consumir una reserva directamente por numero de documento para el flujo de registro manual del supervisor (BuscarReservaPorDocumento)
//
// FLUJO NORMAL (Aprendiz/Pasante Externo SIN estado Especial):
//   Generado -> [Cocina verifica presencialmente] -> Verificado -> [Supervisor escanea QR] -> Consumido
//
// FLUJO ESPECIAL (Aprendiz/Pasante Externo CON estado Especial activo):
//   Generado -> [Supervisor escanea QR directamente] -> Consumido
//   El paso de cocina se omite completamente durante el periodo Especial.
//
// FLUJO INTERNO (Aprendiz Interno / Pasante Interno):
//   Generado -> [Supervisor escanea QR directamente] -> Consumido
//   Los internos nunca pasan por cocina, este es su flujo estandar.

import crypto from "crypto";
import db from '../Database/db.js';
import ReservaModel from "../Models/ReservasModel.js";
import UsuariosModel from "../Models/UsuariosModel.js";
import UsuariosRolModel from "../Models/UsuariosRolModel.js";
import RolesModel from "../Models/RolesModel.js";
import PlatosModels from "../Models/PlatosModels.js";
import MenusModel from "../Models/MenusModels.js";

// Roles que requieren pasar por cocina si no tienen estado Especial.
// Los internos (Aprendiz Interno, Pasante Interno) nunca pasan por este paso.
const ROLES_EXTERNOS = ['Aprendiz Externo', 'Pasante Externo'];

// Duracion en dias del estado Especial antes de revertir automaticamente a "En Formacion".
// Se centraliza aqui para que NovedadesService use la misma constante si la necesita.
const DIAS_DURACION_ESPECIAL = 30;

class ReservasServices {

  // Retorna la fecha de hoy en formato YYYY-MM-DD
  ObtenerFechaHoy() {
    return new Date().toISOString().split('T')[0];
  }

  // Calcula la fecha y hora de vencimiento segun la fecha de reserva.
  // El vencimiento es la hora de finalizacion del servicio de ese tipo de comida.
  CalcularVencimiento(tipo, fechaReserva) {
    const vencimiento = new Date(`${fechaReserva}T00:00:00`);
    const horas = { Desayuno: 7, Almuerzo: 14, Cena: 19 };
    if (!horas[tipo]) throw new Error("Tipo de comida no valido");
    vencimiento.setHours(horas[tipo], 0, 0, 0);
    return vencimiento;
  }

  // Retorna la ventana horaria en la que se puede consumir cada tipo de comida.
  // desde: hora minima (inclusive) para presentar el QR.
  // hasta: hora maxima (inclusive) para presentar el QR.
  // Si el tipo no tiene ventana definida, retorna null y se omite la validacion horaria.
  // Ejemplo: Desayuno solo se puede consumir entre las 5:00 y las 7:00.
  ObtenerVentanaHoraria(tipo) {
    const ventanas = {
      Desayuno: { desde: 5,  hasta: 7  },
      Almuerzo: { desde: 11, hasta: 14 },
      Cena:     { desde: 17, hasta: 19 }
    };
    return ventanas[tipo] ?? null;
  }

  // Valida que la reserva se haga con al menos 24 horas de antelacion.
  // Se usa para reservas normales (no novedades). Las novedades omiten esta validacion.
  // La validacion compara la hora actual con el limite de cierre del tipo de comida.
  ValidarAntelacion24Horas(tipo, fechaReserva) {
    // Reutilizamos ValidarAntelacion8Horas con el mismo criterio de 8 horas
    // porque la regla de negocio actual dice "8 horas de antelacion".
    // Si el proyecto decide cambiar a 24 horas, solo se cambia este metodo.
    return this.ValidarAntelacion8Horas(tipo, fechaReserva);
  }

  // Valida que la reserva se haga con al menos 8 horas de antelacion respecto al limite de servicio.
  // Esta validacion se omite cuando esNovedad = true, ya que las novedades son del mismo dia.
  ValidarAntelacion8Horas(tipo, fechaReserva) {
    const ahora = new Date();
    const fechaObjetivo = new Date(`${fechaReserva}T00:00:00`);

    // Hora limite de cierre de reservas por tipo de comida
    const horasLimite = { Desayuno: { h: 22, m: 0 }, Almuerzo: { h: 5, m: 0 }, Cena: { h: 11, m: 0 } };
    if (!horasLimite[tipo]) throw new Error("Tipo de comida no valido");

    fechaObjetivo.setHours(horasLimite[tipo].h, horasLimite[tipo].m, 0, 0);

    const diferenciaMs = fechaObjetivo.getTime() - ahora.getTime();
    const diferenciaHoras = diferenciaMs / (1000 * 60 * 60);

    if (diferenciaHoras < 8) {
      throw new Error(
        `La reserva para ${tipo} debe hacerse con al menos 8 horas de antelacion ` +
        `(Cierre: ${horasLimite[tipo].h.toString().padStart(2, '0')}:` +
        `${horasLimite[tipo].m.toString().padStart(2, '0')} ).`
      );
    }
    return true;
  }

  // Determina que tipos de comida puede reservar el usuario segun sus roles.
  // Aprendiz/Pasante Interno: puede reservar las 3 comidas.
  // Aprendiz/Pasante Externo: solo puede reservar almuerzo.
  // Cualquier otro rol sin clasificacion: no tiene comidas permitidas.
  ObtenerRolesPermitidos(roles) {
    const esInterno = roles.some(r => r === 'Aprendiz Interno' || r === 'Pasante Interno');
    if (esInterno) return ['Desayuno', 'Almuerzo', 'Cena'];
    const esExterno = roles.some(r => r === 'Aprendiz Externo' || r === 'Pasante Externo');
    if (esExterno) return ['Almuerzo'];
    return [];
  }

  // Encripta el objeto de datos del QR usando AES-256-CBC.
  // Retorna una cadena con formato: iv_en_hex:datos_encriptados_en_hex
  // La clave debe estar en .env como QR_ENCRYPTION_KEY en formato hexadecimal de 64 caracteres (256 bits).
  EncriptarDatos(datos) {
    if (!process.env.QR_ENCRYPTION_KEY) {
      throw new Error("QR_ENCRYPTION_KEY no esta definida en las variables de entorno");
    }
    const clave = Buffer.from(process.env.QR_ENCRYPTION_KEY, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', clave, iv);
    const encriptado = Buffer.concat([
      cipher.update(JSON.stringify(datos), 'utf8'),
      cipher.final()
    ]);
    // base64url es ~33% mas corto que hex → QR menos denso → lectura mas rapida
    return iv.toString('base64url') + '.' + encriptado.toString('base64url');
  };

  // Desencripta una cadena generada por EncriptarDatos.
  // Retorna el objeto original con los datos de la reserva.
  // Lanza un error si el formato es invalido o la clave no coincide.
  DesencriptarDatos(encriptado) {
    if (!process.env.QR_ENCRYPTION_KEY) {
      throw new Error("QR_ENCRYPTION_KEY no esta definida en las variables de entorno");
    }
    const clave = Buffer.from(process.env.QR_ENCRYPTION_KEY, 'hex');

    const partes = encriptado.split('.');
    if (partes.length < 2) throw new Error("Formato de QR invalido");

    const iv = Buffer.from(partes[0], 'base64url');
    const datos = Buffer.from(partes[1], 'base64url');

    const decipher = crypto.createDecipheriv('aes-256-cbc', clave, iv);
    const resultado = Buffer.concat([decipher.update(datos), decipher.final()]);

    return JSON.parse(resultado.toString('utf8'));
  }

  // Verifica de forma perezosa si el estado Especial del usuario ha expirado (30 dias).
  // Se llama en cada peticion relevante (generar reserva, escaneo QR) para no depender
  // de un proceso cron externo.
  //
  // LIMITACION TECNICA CONOCIDA:
  // Este metodo usa el campo updatedAt de UsuariosModel como referencia del inicio del estado
  // Especial. Si cualquier otro campo del usuario se actualiza despues de asignar el estado,
  // updatedAt se reinicia y el contador de 30 dias se reinicia tambien.
  // Para mayor precision en produccion, agregar el campo Fec_Especial DATETIME a la tabla
  // usuarios y reemplazar la referencia a updatedAt por ese campo.
  async VerificarExpiracionEspecial(usuario, transaction = null) {
    if (usuario.Est_Usuario !== 'Especial') return;

    const ahora = new Date();
    const fechaAsignacion = new Date(usuario.updatedAt);
    const diasTranscurridos = (ahora - fechaAsignacion) / (1000 * 60 * 60 * 24);

    if (diasTranscurridos >= DIAS_DURACION_ESPECIAL) {
      // El estado expiro: revertir a "En Formacion" dentro de la misma transaccion
      await usuario.update({ Est_Usuario: 'En Formacion' }, { transaction });
    }
  }

  // Determina si un usuario externo tiene el estado Especial activo.
  // Solo aplica para Aprendiz Externo y Pasante Externo.
  // Los internos no necesitan este estado porque su flujo ya omite cocina por defecto.
  EsUsuarioEspecial(usuario, rolesUsuario) {
    const esExterno = rolesUsuario.some(r => ROLES_EXTERNOS.includes(r));
    return esExterno && usuario.Est_Usuario === 'Especial';
  }

  // Crea una nueva reserva dentro de una transaccion para garantizar consistencia.
  // Si algo falla en cualquier paso, se hace rollback automatico y no queda ningun dato a medias.
  //
  // Parametros:
  //   Id_Usuario     - ID del aprendiz que recibe la reserva
  //   rolesUsuario   - Array de strings con los nombres de roles del aprendiz
  //   Tip_Reserva    - "Desayuno", "Almuerzo" o "Cena"
  //   platoElegido   - ID del plato seleccionado
  //   fechaReserva   - Fecha en formato YYYY-MM-DD
  //   esNovedad      - true si el coordinador crea la reserva como novedad del dia
  //   Justificacion  - Texto explicando el motivo si es novedad
  async generarReservaPass(Id_Usuario, rolesUsuario, Tip_Reserva, platoElegido, fechaReserva, esNovedad = false, Jus_Reserva = null) {
    return await db.transaction(async (transaction) => {

      // Paso 1: confirmar que el usuario existe en la base de datos
      const usuario = await UsuariosModel.findByPk(Id_Usuario, { transaction });
      if (!usuario) throw new Error("Usuario no encontrado");

      // Validar si el usuario esta sancionado. Un usuario sancionado no puede reservar
      // bajo ninguna circunstancia, ni siquiera a traves de novedades del coordinador.
      if (usuario.San_Usuario === 1) {
        throw new Error("No puedes realizar reservas porque te encuentras sancionado.");
      }

      // Verificar de forma perezosa si el estado Especial expiro antes de generar la reserva.
      // Esto actualiza Est_Usuario en la misma transaccion si aplica.
      await this.VerificarExpiracionEspecial(usuario, transaction);

      // Paso 2: validar que el tipo de comida este permitido para los roles del usuario
      const tiposPermitidos = this.ObtenerRolesPermitidos(rolesUsuario);
      const TipoNormalizado = Tip_Reserva.charAt(0).toUpperCase() + Tip_Reserva.slice(1);
      if (!tiposPermitidos.includes(TipoNormalizado)) {
        throw new Error(`El tipo de comida "${Tip_Reserva}" no esta permitido para tu rol`);
      }

      // Paso 3: confirmar que el plato seleccionado existe
      const plato = await PlatosModels.findByPk(platoElegido, { transaction });
      if (!plato) throw new Error("El plato seleccionado no existe");

      // Validar regla de 24 horas solo para reservas normales.
      // Las novedades omiten esta validacion porque son del mismo dia por definicion.
      if (!esNovedad) {
        this.ValidarAntelacion24Horas(TipoNormalizado, fechaReserva);
      }

      // Paso 4: calcular la fecha y hora de vencimiento del QR
      const fechaVencimiento = this.CalcularVencimiento(TipoNormalizado, fechaReserva);

      // Paso 5: evitar duplicados. Solo puede existir una reserva activa por tipo y dia por usuario.
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
        const horasVencimiento = {
          Desayuno: '07:00',
          Almuerzo: '14:05',
          Cena: '19:00'
        };
        const horaVencimiento = horasVencimiento[TipoNormalizado];
        throw new Error(
          `Ya tienes una reserva activa para ${TipoNormalizado} del ${fechaReserva}. ` +
          `Tu reserva vence a las ${horaVencimiento} de ese dia, ` +
          `despues de esa hora podras realizar una nueva reserva.`
        );
      }

      // Paso 6: insertar la reserva con el QR vacio, se actualizara en el paso 8
      const nuevaReserva = await ReservaModel.create({
        Id_Usuario: usuario.Id_Usuario,
        Fec_Reserva: fechaReserva,
        Vec_Reserva: fechaVencimiento,
        Tip_Reserva: TipoNormalizado,
        Est_Reserva: 'Generado',
        Qr_Reserva: '',
        Id_Plato: platoElegido,
        Exc_Reserva: esNovedad ? "Si" : "No",
        Jus_Reserva: Jus_Reserva
      }, { transaction });

      // Paso 7: armar el objeto que se encriptara y almacenara en el QR
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

      // La URL que se codificara en el QR apunta al frontend con los datos encriptados como parametro
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

  // Procesa la verificacion presencial de cocina: cambia Est_Reserva de Generado a Verificado.
  //
  // Este paso SOLO aplica para Aprendiz Externo y Pasante Externo SIN estado Especial.
  // El personal de cocina confirma presencialmente que el aprendiz esta en el lugar
  // antes de que el supervisor pueda escanear el QR final.
  async procesarVerificacionCocina(Id_Reserva) {
    return await db.transaction(async (transaction) => {
      const reserva = await ReservaModel.findByPk(Id_Reserva, { transaction });

      if (!reserva) throw new Error("Reserva no encontrada");
      if (reserva.Est_Reserva !== 'Generado') {
        throw new Error(`No se puede verificar una reserva con estado: ${reserva.Est_Reserva}`);
      }

      await reserva.update({ Est_Reserva: 'Verificado' }, { transaction });

      return {
        message: 'Reserva verificada correctamente por cocina',
        Id_Reserva,
        nuevoEstado: 'Verificado'
      };
    });
  }

  // Procesa el escaneo del QR por parte del supervisor para marcar la reserva como Consumida.
  //
  // Este metodo determina automaticamente el flujo correcto segun el perfil del usuario:
  //
  //   Interno (Aprendiz/Pasante Interno):
  //     Puede consumir desde Generado directamente. Los internos nunca pasan por cocina.
  //
  //   Externo CON estado Especial activo:
  //     Puede consumir desde Generado directamente. El estado Especial les da el mismo
  //     privilegio que a los internos por el periodo de 30 dias.
  //
  //   Externo SIN estado Especial:
  //     Debe estar en Verificado para poder consumir. Si llega en Generado,
  //     se le indica que debe pasar primero por cocina.
  //
  // ADICION: Ahora incluye el plato (Nom_Plato) en la respuesta para que el supervisor
  //          pueda informar al personal de cocina que alimento debe preparar o entregar.
  //          Tambien incluye NumDoc para identificacion en la pantalla de registro.
  async procesarConsumoSupervisor(encriptadoQR) {
    return await db.transaction(async (transaction) => {

      // Paso 1: desencriptar el QR para extraer los datos de la reserva
      const datosQR = this.DesencriptarDatos(encriptadoQR);

      const fechaHoy = this.ObtenerFechaHoy(); // YYYY-MM-DD
      // if (datosQR.Fec_Reserva !== fechaHoy) {
      //   const fechaLegible = new Date(datosQR.Fec_Reserva + 'T12:00:00')
      //     .toLocaleDateString('es-CO', {
      //       weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      //     });
      //   throw new Error(
      //     `Este código QR es para el ${fechaLegible}. ` +
      //     `Solo se pueden consumir reservas del día de hoy.`
      //   );
      // }

      // Paso 2: validar que el QR no haya superado su hora de vencimiento
      const ahora = new Date();
      const vencimiento = new Date(datosQR.Vencimiento);
      if (ahora > vencimiento) {
        throw new Error("El codigo QR ha vencido y no puede ser utilizado para recibir alimentacion");
      }
      const horaActual = new Date().getHours(); // 0-23

      const ventana = this.ObtenerVentanaHoraria(datosQR.Tipo);
      if (ventana && (horaActual < ventana.desde || horaActual >= ventana.hasta)) {
        throw new Error(
          `Este QR es para ${datosQR.Tipo}, pero el servicio de ${datosQR.Tipo.toLowerCase()} ` +
          `está habilitado de ${ventana.desde}:00 a ${ventana.hasta}:00. ` +
          `Fuera de ese horario no es posible registrar el consumo.`
        );
      }
      // Paso 3: obtener la reserva con su plato incluido y el usuario propietario con sus roles
      // en paralelo para reducir el tiempo de espera total de la transaccion.
      // Se incluye el plato en la consulta de reserva para evitar una segunda consulta separada.
      // Se consultan los roles directamente desde la DB para no depender del token JWT,
      // que podria estar desactualizado si el coordinador cambio los roles recientemente.
      const [reserva, usuario] = await Promise.all([
        ReservaModel.findByPk(datosQR.Id_Reserva, {
          // Incluir el plato con todos sus campos para la ventana flotante del supervisor.
          // Des_Plato se muestra en el modal para que cocina sepa exactamente que preparar.
          include: [{ model: PlatosModels, as: 'plato', attributes: ['Nom_Plato', 'Des_Plato', 'Img_Plato'] }],
          transaction
        }),
        UsuariosModel.findByPk(datosQR.Id_Usuario, {
          // Solo se traen los roles del usuario para evaluar el flujo de consumo.
          // Los datos del plato vienen desde reserva.plato (consulta paralela de arriba).
          include: [
            {
              model: UsuariosRolModel,
              as: 'rolesUsuario',
              include: [{ model: RolesModel, as: 'rolUsuario' }]
            }
          ],
          transaction
        })
      ]);

      if (!reserva) throw new Error("La reserva asociada al QR no existe en la base de datos");
      if (!usuario) throw new Error("El usuario propietario del QR no existe");

      // Paso 4: verificar si el estado Especial expiro antes de evaluar el flujo
      await this.VerificarExpiracionEspecial(usuario, transaction);

      // Paso 5: extraer los nombres de roles del usuario para la evaluacion de flujo
      const rolesUsuario = usuario.rolesUsuario
        ?.map(ur => ur.rolUsuario?.Nom_Rol)
        .filter(Boolean) || [];

      const esInterno = rolesUsuario.some(r => r === 'Aprendiz Interno' || r === 'Pasante Interno');
      const esEspecial = this.EsUsuarioEspecial(usuario, rolesUsuario);

      // Paso 6: aplicar las reglas de flujo segun el perfil del usuario
      if (esInterno || esEspecial) {
        // Flujo directo: internos y externos con estado Especial pueden ir de Generado a Consumido
        if (reserva.Est_Reserva !== 'Generado' && reserva.Est_Reserva !== 'Verificado') {
          throw new Error(`No se puede consumir una reserva con estado: ${reserva.Est_Reserva}`);
        }
      } else {
        // Flujo estandar para externos sin estado Especial: requiere pasar por cocina primero
        if (reserva.Est_Reserva === 'Generado') {
          throw new Error(
            "La reserva aun no ha sido verificada por el area de cocina. " +
            "El aprendiz debe presentarse primero en cocina para continuar."
          );
        }
        if (reserva.Est_Reserva !== 'Verificado') {
          throw new Error(`No se puede consumir una reserva con estado: ${reserva.Est_Reserva}`);
        }
      }

      // Paso 7: marcar la reserva como consumida
      await reserva.update({ Est_Reserva: 'Consumido' }, { transaction });

      // Paso 8: retornar la informacion completa del consumo.
      // El frontend la usa para la ventana flotante que el supervisor lee en voz alta:
      //   - Aprendiz y NumDoc: para identificar a la persona.
      //   - Nom_Plato, Des_Plato, Img_Plato: para que cocina sepa que preparar.
      //   - Tipo: Desayuno, Almuerzo o Cena para orientacion rapida.
      return {
        message: 'Alimentacion registrada como consumida exitosamente',
        Id_Reserva: reserva.Id_Reserva,
        Aprendiz: `${usuario.Nom_Usuario} ${usuario.Ape_Usuario}`,
        NumDoc: usuario.NumDoc_Usuario,
        Tipo: reserva.Tip_Reserva,
        // Nombre del plato: campo principal que el supervisor comunica al aprendiz.
        Plato: reserva.plato?.Nom_Plato ?? 'Sin informacion de plato',
        // Descripcion del plato: texto adicional para que cocina tenga mas contexto.
        DescPlato: reserva.plato?.Des_Plato ?? '',
        // Imagen del plato: URL relativa al servidor de uploads para mostrar en el modal.
        ImgPlato: reserva.plato?.Img_Plato ?? null,
        flujoEspecial: esEspecial,
        flujoInterno: esInterno
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ADICION: BuscarReservaPorDocumento
  // ─────────────────────────────────────────────────────────────────────────────
  //
  // Busca la reserva activa del dia para un usuario identificado por su numero
  // de documento y la procesa como consumida usando el mismo flujo del QR.
  //
  // Este metodo es usado por el endpoint POST /api/Reservas/consumir/documento
  // que el supervisor llama cuando registra manualmente (sin camara) a un aprendiz
  // que no puede presentar el codigo QR por problemas tecnicos o descarga del dispositivo.
  //
  // El flujo aplicado es identico al del QR:
  //   - Externos normales requieren estar en Verificado
  //   - Internos y Especiales pueden consumir desde Generado
  //
  // Parametros:
  //   NumDoc - Numero de documento del aprendiz (string o number, se convierte internamente)
  //
  // Lanza error si:
  //   - No existe usuario con ese documento
  //   - No hay reserva activa para hoy
  //   - La reserva ya fue consumida, cancelada o vencida
  async BuscarReservaPorDocumento(NumDoc) {

    // Paso 1: buscar el usuario por numero de documento en la tabla de usuarios
    // Se convierte a string para la busqueda ya que NumDoc_Usuario es int en la DB
    const Usuario = await UsuariosModel.findOne({
      where: { NumDoc_Usuario: String(NumDoc) }
    });

    // Si no existe el usuario, no tiene sentido continuar buscando reservas
    if (!Usuario) {
      throw new Error("No se encontro ningun usuario registrado con ese numero de documento");
    }

    // Paso 2: calcular la fecha de hoy en formato YYYY-MM-DD para filtrar reservas del dia
    const FechaHoy = this.ObtenerFechaHoy();

    // Paso 3: buscar la reserva de hoy que tenga estado Generado o Verificado
    // Se ordena por fecha de creacion descendente para obtener la mas reciente si hay varias
    const Reserva = await ReservaModel.findOne({
      where: {
        Id_Usuario: Usuario.Id_Usuario,
        Fec_Reserva: FechaHoy
      },
      // Incluir el plato para devolverlo en la respuesta al frontend
      include: [{ model: PlatosModels, as: 'plato', attributes: ['Nom_Plato', 'Img_Plato', 'Des_Plato'] }],
      order: [['createdAt', 'DESC']]
    });

    // Si no hay reserva para hoy, informar al supervisor sin procesar nada
    if (!Reserva) {
      throw new Error("Este aprendiz no tiene reserva registrada para el dia de hoy");
    }

    // Paso 4: validar que la reserva este en un estado que permita el consumo
    // Generado y Verificado son los dos unicos estados que permiten continuar el proceso
    if (!['Generado', 'Verificado'].includes(Reserva.Est_Reserva)) {
      throw new Error(
        `La reserva de este aprendiz ya fue ${Reserva.Est_Reserva.toLowerCase()}. ` +
        `No es posible procesarla nuevamente.`
      );
    }

    // Paso 5: reutilizar el metodo procesarConsumoSupervisor con el QR almacenado en la reserva.
    // Esto garantiza que se aplique exactamente el mismo flujo de validacion de roles
    // y estado Especial que se usa cuando el aprendiz presenta el codigo QR con la camara.
    return await this.procesarConsumoSupervisor(Reserva.Qr_Reserva);
  }

  // Retorna las ultimas 10 reservas del usuario ordenadas de la mas reciente a la mas antigua
  async obtenerHistorial(Id_Usuario) {
    return await ReservaModel.findAll({
      where: { Id_Usuario },
      include: [{ model: PlatosModels, as: 'plato', attributes: ['Nom_Plato', 'Img_Plato', 'Des_Plato'] }],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });
  }

  // Retorna TODAS las reservas del usuario sin limite de cantidad
  async obtenerHistorialCompleto(Id_Usuario) {
    return await ReservaModel.findAll({
      where: { Id_Usuario },
      include: [{ model: PlatosModels, as: 'plato', attributes: ['Nom_Plato', 'Img_Plato', 'Des_Plato'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  // Cambia el estado de una reserva a Cancelado.
  // Solo se puede cancelar si el estado actual es Generado y la reserva pertenece al usuario.
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
  // Retorna todas las reservas del sistema con datos del aprendiz y el plato.
  // Usada por el CrudReservas administrativo para mostrar el listado completo.
  async ObtenerTodas() {
    return await ReservaModel.findAll({
      include: [
        {
          model: UsuariosModel,
          as: "usuario",
          attributes: ["Id_Usuario", "Nom_Usuario", "Ape_Usuario", "NumDoc_Usuario"],
        },
        {
          model: PlatosModels,
          as: "plato",
          attributes: ["Nom_Plato", "Img_Plato", "Des_Plato"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }
}

export default new ReservasServices();