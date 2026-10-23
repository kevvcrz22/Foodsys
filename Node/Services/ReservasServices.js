// Node/Services/ReservasServices.js
// Servicio central del ciclo de vida de una reserva en Foodsys.
// Implementa creacion, verificacion presencial/QR en cocina, consumo de supervisor,
// validacion criptografica Ed25519 offline, cesion solidaria (Habeas Data) y outbox sync.
// Comentarios didacticos sin tildes ni emojis para aprendices de primer semestre.

import crypto from "crypto";
import { Op } from "sequelize";
import db from "../Database/db.js";
import ReservaModel from "../Models/ReservasModel.js";
import UsuariosModel from "../Models/UsuariosModel.js";
import UsuariosRolModel from "../Models/UsuariosRolModel.js";
import RolesModel from "../Models/RolesModel.js";
import PlatosModels from "../Models/PlatosModels.js";
import FichasModel from "../Models/FichasModel.js";
import VencimientoService from "./VencimientoService.js";
import TurnosService from "./TurnosService.js";
import NotificacionesService from "./NotificacionesService.js";
import { generarQrFirmado, verificarQrOffline } from "../Utils/qrCrypto.js";
import { obtenerFechaColombia, obtenerHoraColombia } from "../Utils/dateUtils.js";

const ROLES_EXTERNOS = ["Aprendiz Externo", "Pasante Externo"];
const DIAS_DURACION_ESPECIAL = 30;

class ReservasServices {
  // Retorna la fecha de hoy en formato YYYY-MM-DD en la zona horaria de Colombia
  ObtenerFechaHoy() {
    return obtenerFechaColombia();
  }

  // Calcula la fecha y hora de vencimiento segun la fecha de reserva
  CalcularVencimiento(tipo, fechaReserva) {
    const vencimiento = new Date(`${fechaReserva}T00:00:00`);
    const fin = {
      Desayuno: { h: 7, m: 0 },
      Almuerzo: { h: 13, m: 30 },
      Cena: { h: 19, m: 0 }
    };
    if (!fin[tipo]) throw new Error("Tipo de comida no valido");
    vencimiento.setHours(fin[tipo].h, fin[tipo].m, 0, 0);
    return vencimiento;
  }

  // Valida que la cancelacion se haga con al menos 9 horas de anticipacion al inicio del turno
  ValidarCancelacionPermitida(tipo, fechaReserva) {
    const ahora = new Date();
    const inicioTurno = {
      Desayuno: { h: 6, m: 0 },
      Almuerzo: { h: 11, m: 30 },
      Cena: { h: 18, m: 0 }
    };
    if (!inicioTurno[tipo]) throw new Error("Tipo de comida no valido");
    const fechaInicio = new Date(`${fechaReserva}T00:00:00`);
    fechaInicio.setHours(inicioTurno[tipo].h, inicioTurno[tipo].m, 0, 0);
    const limiteMs = fechaInicio.getTime() - 9 * 60 * 60 * 1000;
    if (ahora.getTime() > limiteMs) {
      const limiteHora = new Date(limiteMs).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
      throw new Error(
        `Ya no es posible cancelar. El limite para cancelar ${tipo} era ` +
        `a las ${limiteHora} (9 horas antes del inicio del turno).`
      );
    }
    return true;
  }

  // Valida horario limite para ceder reservas (2 horas antes del turno oficial en Colombia)
  // Desayuno hasta 04:00 AM, Almuerzo hasta 09:30 AM, Cena hasta 04:00 PM (16:00)
  ValidarHorarioCesion(tipo, fechaReserva) {
    const { obtenerFechaColombia, obtenerHoraColombia } = require ? {} : {};
    const fechaHoyCol = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const horaActualCol = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
    const [hhActual, mmActual] = horaActualCol.split(':').map(Number);
    const minutosActuales = hhActual * 60 + mmActual;

    const limites = {
      Desayuno: { h: 4, m: 0, minutos: 4 * 60 },
      Almuerzo: { h: 9, m: 30, minutos: 9 * 60 + 30 },
      Cena: { h: 16, m: 0, minutos: 16 * 60 }
    };
    if (!limites[tipo]) return true;

    // Si la reserva es para un dia futuro, siempre se puede ceder
    if (fechaReserva > fechaHoyCol) {
      return true;
    }
    // Si la reserva es para una fecha pasada, ya no se puede ceder
    if (fechaReserva < fechaHoyCol) {
      throw new Error("No se pueden ceder reservas de fechas pasadas.");
    }
    // Si es para el dia de hoy, validar que no supere el horario limite
    if (minutosActuales > limites[tipo].minutos) {
      const horaStr = `${String(limites[tipo].h).padStart(2, "0")}:${String(limites[tipo].m).padStart(2, "0")}`;
      throw new Error(`El horario limite para ceder la reserva de ${tipo} vencio hoy a las ${horaStr}.`);
    }
    return true;
  }

  // Ventana horaria de consumo en el comedor
  ObtenerVentanaHoraria(tipo) {
    const ventanas = {
      Desayuno: { desde: 6, hasta: 8 },
      Almuerzo: { desde: 11, hasta: 14 },
      Cena: { desde: 17, hasta: 20 }
    };
    return ventanas[tipo] ?? null;
  }

  // Valida que la reserva se haga con al menos 8 horas de antelacion
  ValidarAntelacion8Horas(tipo, fechaReserva) {
    const ahora = new Date();
    const fechaObjetivo = new Date(`${fechaReserva}T00:00:00`);
    const horasLimite = { Desayuno: { h: 22, m: 0 }, Almuerzo: { h: 5, m: 0 }, Cena: { h: 11, m: 0 } };
    if (!horasLimite[tipo]) throw new Error("Tipo de comida no valido");

    fechaObjetivo.setHours(horasLimite[tipo].h, horasLimite[tipo].m, 0, 0);
    const diferenciaMs = fechaObjetivo.getTime() - ahora.getTime();
    const diferenciaHoras = diferenciaMs / (1000 * 60 * 60);

    if (diferenciaHoras < 8) {
      throw new Error(
        `La reserva para ${tipo} debe hacerse con al menos 8 horas de antelacion ` +
        `(Cierre: ${String(horasLimite[tipo].h).padStart(2, "0")}:${String(horasLimite[tipo].m).padStart(2, "0")}).`
      );
    }
    return true;
  }

  // Tipos de comida permitidos segun rol
  ObtenerRolesPermitidos(roles) {
    const esInterno = roles.some(r => r === "Aprendiz Interno" || r === "Pasante Interno");
    if (esInterno) return ["Desayuno", "Almuerzo", "Cena"];
    const esExterno = roles.some(r => r === "Aprendiz Externo" || r === "Pasante Externo");
    if (esExterno) return ["Almuerzo"];
    return [];
  }

  // Encriptacion AES-256-CBC para retrocompatibilidad
  EncriptarDatos(idReserva) {
    if (!process.env.QR_ENCRYPTION_KEY) {
      return Buffer.from(String(idReserva)).toString("base64url");
    }
    try {
      const clave = Buffer.from(process.env.QR_ENCRYPTION_KEY, "hex");
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv("aes-256-cbc", clave, iv);
      const encriptado = Buffer.concat([cipher.update(String(idReserva), "utf8"), cipher.final()]);
      return iv.toString("base64url") + "." + encriptado.toString("base64url");
    } catch (e) {
      return Buffer.from(String(idReserva)).toString("base64url");
    }
  }

  // Desencriptacion clasica AES-256-CBC
  DesencriptarQR(encriptado) {
    if (!encriptado) throw new Error("Contenido del QR vacio");
    if (!process.env.QR_ENCRYPTION_KEY) {
      const id = parseInt(Buffer.from(encriptado, "base64url").toString("utf8"), 10);
      if (!isNaN(id)) return id;
    }

    try {
      const clave = Buffer.from(process.env.QR_ENCRYPTION_KEY, "hex");
      const partes = encriptado.split(".");
      if (partes.length < 2) {
        const idFallback = parseInt(encriptado, 10);
        if (!isNaN(idFallback)) return idFallback;
        throw new Error("Formato de QR invalido");
      }
      const iv = Buffer.from(partes[0], "base64url");
      const datos = Buffer.from(partes[1], "base64url");
      const decipher = crypto.createDecipheriv("aes-256-cbc", clave, iv);
      const resultado = Buffer.concat([decipher.update(datos), decipher.final()]);
      const id = parseInt(resultado.toString("utf8").trim(), 10);
      if (isNaN(id)) throw new Error("Contenido del QR invalido");
      return id;
    } catch (e) {
      const partes = encriptado.split(".");
      if (partes.length === 2) {
        try {
          const payload = JSON.parse(Buffer.from(partes[0], "base64url").toString("utf8"));
          if (payload.idReserva) return payload.idReserva;
        } catch (_) {}
      }
      throw new Error("No se pudo interpretar el codigo QR");
    }
  }

  // Verifica estado especial expirado
  async VerificarExpiracionEspecial(usuario, transaction = null) {
    if (usuario.Est_Usuario !== "Especial") return;
    const ahora = new Date();
    const fechaAsignacion = new Date(usuario.updatedAt);
    const diasTranscurridos = (ahora - fechaAsignacion) / (1000 * 60 * 60 * 24);
    if (diasTranscurridos >= DIAS_DURACION_ESPECIAL) {
      await usuario.update({ Est_Usuario: "En Formacion" }, { transaction });
    }
  }

  EsUsuarioEspecial(usuario, rolesUsuario) {
    const esExterno = rolesUsuario.some(r => ROLES_EXTERNOS.includes(r));
    return esExterno && usuario.Est_Usuario === "Especial";
  }

  /**
   * Genera una reserva pass, firma el QR criptograficamente con Ed25519
   * y registra el evento en sync_outbox
   */
  async generarReservaPass(Id_Usuario, rolesUsuario, Tip_Reserva, platoElegido, fechaReserva, esNovedad = false, Jus_Reserva = null) {
    return await db.transaction(async (transaction) => {
      await VencimientoService.procesarVencimientosUsuario(Id_Usuario, transaction);

      const usuario = await UsuariosModel.findByPk(Id_Usuario, {
        include: [{ model: FichasModel, as: "ficha" }],
        transaction
      });
      if (!usuario) throw new Error("Usuario no encontrado");

      if (usuario.San_Usuario === "Si") {
        throw new Error("No puedes realizar reservas porque te encuentras sancionado.");
      }

      await this.VerificarExpiracionEspecial(usuario, transaction);

      const tiposPermitidos = this.ObtenerRolesPermitidos(rolesUsuario);
      const TipoNormalizado = Tip_Reserva.charAt(0).toUpperCase() + Tip_Reserva.slice(1);
      if (!tiposPermitidos.includes(TipoNormalizado)) {
        throw new Error(`El tipo de comida "${Tip_Reserva}" no esta permitido para tu rol`);
      }

      const plato = await PlatosModels.findByPk(platoElegido, { transaction });
      if (!plato) throw new Error("El plato seleccionado no existe");

      if (!esNovedad) {
        this.ValidarAntelacion8Horas(TipoNormalizado, fechaReserva);
      }

      const fechaVencimiento = this.CalcularVencimiento(TipoNormalizado, fechaReserva);

      const existente = await ReservaModel.findOne({
        where: {
          Id_Usuario: usuario.Id_Usuario,
          Tip_Reserva: TipoNormalizado,
          Fec_Reserva: fechaReserva,
          Est_Reserva: "Generado"
        },
        transaction
      });

      if (existente) {
        throw new Error(`Ya tienes una reserva activa para ${TipoNormalizado} del ${fechaReserva}.`);
      }

      const uuidReserva = crypto.randomUUID();

      // Crear reserva inicial
      const nuevaReserva = await ReservaModel.create({
        uuid_reserva: uuidReserva,
        nodo_origen: process.env.NODE_ROLE || "CLOUD",
        Id_Usuario: usuario.Id_Usuario,
        Fec_Reserva: fechaReserva,
        Vec_Reserva: fechaVencimiento,
        Tip_Reserva: TipoNormalizado,
        Est_Reserva: "Generado",
        Qr_Reserva: "",
        Id_Plato: platoElegido,
        Exc_Reserva: esNovedad ? "Si" : "No",
        Jus_Reserva: Jus_Reserva,
        sync_status: "PENDING"
      }, { transaction });

      // Generar QR firmado digitalmente con Ed25519
      const qrFirmado = generarQrFirmado({
        uuid_reserva: uuidReserva,
        Id_Reserva: nuevaReserva.Id_Reserva,
        NumDoc_Usuario: usuario.NumDoc_Usuario,
        Nom_Usuario: `${usuario.Nom_Usuario} ${usuario.Ape_Usuario}`.trim(),
        Num_Ficha: usuario.ficha?.Num_Ficha || "",
        Rol: rolesUsuario[0] || "Aprendiz",
        Fec_Reserva: fechaReserva,
        Tip_Reserva: TipoNormalizado,
        Id_Plato: platoElegido,
        nodo_origen: process.env.NODE_ROLE || "CLOUD"
      });

      await nuevaReserva.update({ Qr_Reserva: qrFirmado }, { transaction });

      // Encolar evento CREATE en sync_outbox
      await db.query(`
        INSERT INTO sync_outbox (event_id, source_node, entidad, operacion, entity_uuid, payload, sync_status, created_at)
        VALUES (?, ?, 'RESERVA', 'CREATE', ?, ?, 'PENDING', NOW())
      `, {
        replacements: [
          crypto.randomUUID(),
          process.env.NODE_ROLE || "LOCAL",
          uuidReserva,
          JSON.stringify({
            ...nuevaReserva.toJSON(),
            Qr_Reserva: qrFirmado
          })
        ],
        transaction
      });

      const baseUrl = process.env.FRONTEND_URL || "https://foodsyslagranja.com";
      const qrUrl = `${baseUrl}/ReservaCreada-checkin?data=${encodeURIComponent(qrFirmado)}`;

      return {
        Qr_Reserva: qrFirmado,
        uuid_reserva: uuidReserva,
        validDate: fechaReserva,
        expiresAt: fechaVencimiento,
        qrUrl
      };
    });
  }

  /**
   * Unica definicion atomica de verificacion presencial de cocina (Generado -> Verificado)
   * Exclusivo para Aprendices Externos y Pasantes Externos sin estado Especial
   */
  async procesarVerificacionCocina(Id_Reserva) {
    return await db.transaction(async (transaction) => {
      const reserva = await ReservaModel.findByPk(Id_Reserva, {
        include: [
          {
            model: UsuariosModel,
            as: "usuario",
            attributes: ["Id_Usuario", "Nom_Usuario", "Ape_Usuario", "NumDoc_Usuario", "Est_Usuario"]
          },
          {
            model: PlatosModels,
            as: "plato",
            attributes: ["Nom_Plato", "Des_Plato", "Img_Plato"]
          }
        ],
        transaction
      });

      if (!reserva) {
        throw new Error("La reserva indicada no existe en la base de datos.");
      }

      if (reserva.Est_Reserva === "Verificado") {
        return {
          message: "Esta reserva ya fue verificada previamente en Cocina",
          Id_Reserva: reserva.Id_Reserva,
          Aprendiz: `${reserva.usuario?.Nom_Usuario ?? ""} ${reserva.usuario?.Ape_Usuario ?? ""}`.trim(),
          NumDoc: reserva.usuario?.NumDoc_Usuario,
          Tipo: reserva.Tip_Reserva,
          Plato: reserva.plato?.Nom_Plato ?? "Sin plato asignado",
          ImgPlato: reserva.plato?.Img_Plato ?? null,
          nuevoEstado: "Verificado"
        };
      }

      if (reserva.Est_Reserva !== "Generado") {
        throw new Error(`No se puede verificar una reserva con estado '${reserva.Est_Reserva}'`);
      }

      await reserva.update({ Est_Reserva: "Verificado" }, { transaction });

      // Encolar evento VERIFY en sync_outbox
      if (reserva.uuid_reserva) {
        await db.query(`
          INSERT INTO sync_outbox (event_id, source_node, entidad, operacion, entity_uuid, payload, sync_status, created_at)
          VALUES (?, ?, 'RESERVA', 'VERIFY', ?, ?, 'PENDING', NOW())
        `, {
          replacements: [
            crypto.randomUUID(),
            process.env.NODE_ROLE || "LOCAL",
            reserva.uuid_reserva,
            JSON.stringify({ uuid_reserva: reserva.uuid_reserva, Est_Reserva: "Verificado" })
          ],
          transaction
        });
      }

      return {
        message: "Reserva verificada exitosamente en Cocina. El aprendiz ya puede presentar su QR ante el supervisor.",
        Id_Reserva: reserva.Id_Reserva,
        Aprendiz: `${reserva.usuario?.Nom_Usuario ?? ""} ${reserva.usuario?.Ape_Usuario ?? ""}`.trim(),
        NumDoc: reserva.usuario?.NumDoc_Usuario,
        Tipo: reserva.Tip_Reserva,
        Plato: reserva.plato?.Nom_Plato ?? "Sin plato asignado",
        ImgPlato: reserva.plato?.Img_Plato ?? null,
        nuevoEstado: "Verificado"
      };
    });
  }

  /**
   * Verifica la reserva en Cocina leyendo el QR por camara o lector laser
   */
  async procesarVerificacionQRCocina(contenidoQR) {
    if (!contenidoQR) throw new Error("El contenido del codigo QR es obligatorio");

    // Probar verificacion Ed25519
    let payload = null;
    try {
      payload = verificarQrOffline(contenidoQR, null, this.ObtenerFechaHoy());
    } catch (_) {}

    if (payload && payload.idReserva) {
      return await this.procesarVerificacionCocina(payload.idReserva);
    }

    const Id_Reserva = this.DesencriptarQR(contenidoQR);
    return await this.procesarVerificacionCocina(Id_Reserva);
  }

  /**
   * Procesa el consumo del supervisor (Verificado/Generado -> Consumido)
   * Soporta firma Ed25519 offline, comprobacion unica en qr_consumidos_control
   * y creacion automatica de réplica local si el aprendiz reservo en la nube durante un corte de internet.
   */
  async procesarConsumoSupervisor(contenidoQR, idSupervisor = null) {
    return await db.transaction(async (transaction) => {
      let payloadEd25519 = null;
      const fechaHoy = this.ObtenerFechaHoy();

      // 1. Intentar verificacion matematica Ed25519
      try {
        payloadEd25519 = verificarQrOffline(contenidoQR, null, fechaHoy);
      } catch (errEd) {
        if (errEd.message && errEd.message.includes("FRAUDE DETECTADO")) {
          throw errEd;
        }
      }

      let reserva = null;
      let usuario = null;

      if (payloadEd25519) {
        // Bloqueo estricto anti-fraude: Comprobar si ya fue consumido hoy
        const [consumoPrevio] = await db.query(`
          SELECT uuid_reserva, Fecha_Consumo FROM qr_consumidos_control
          WHERE NumDoc_Usuario = ? AND Fec_Reserva = ? AND Tip_Reserva = ?
        `, {
          replacements: [payloadEd25519.doc, payloadEd25519.fecha, payloadEd25519.comida],
          transaction
        });

        if (consumoPrevio.length > 0) {
          throw new Error(`Esta reserva ya fue consumida el dia de hoy para el turno de ${payloadEd25519.comida}.`);
        }

        // Buscar reserva por UUID o por ID
        reserva = await ReservaModel.findOne({
          where: {
            [Op.or]: [
              { uuid_reserva: payloadEd25519.id },
              ...(payloadEd25519.idReserva ? [{ Id_Reserva: payloadEd25519.idReserva }] : [])
            ]
          },
          include: [{ model: PlatosModels, as: "plato", attributes: ["Nom_Plato", "Des_Plato", "Img_Plato"] }],
          transaction
        });

        // Caso contingencia offline: el aprendiz reservo en Hetzner pero La Granja no tiene internet
        if (!reserva) {
          usuario = await UsuariosModel.findOne({
            where: { NumDoc_Usuario: String(payloadEd25519.doc) },
            include: [{
              model: UsuariosRolModel,
              as: "rolesUsuario",
              include: [{ model: RolesModel, as: "rolUsuario" }]
            }],
            transaction
          });

          reserva = await ReservaModel.create({
            uuid_reserva: payloadEd25519.id,
            nodo_origen: "CLOUD",
            Id_Usuario: usuario ? usuario.Id_Usuario : null,
            Fec_Reserva: payloadEd25519.fecha,
            Vec_Reserva: this.CalcularVencimiento(payloadEd25519.comida, payloadEd25519.fecha),
            Tip_Reserva: payloadEd25519.comida,
            Est_Reserva: "Consumido",
            Qr_Reserva: contenidoQR,
            Id_Plato: payloadEd25519.plato,
            sync_status: "PENDING"
          }, { transaction });
        }
      } else {
        // Modo QR clasico
        const Id_Reserva = this.DesencriptarQR(contenidoQR);
        reserva = await ReservaModel.findByPk(Id_Reserva, {
          include: [{ model: PlatosModels, as: "plato", attributes: ["Nom_Plato", "Des_Plato", "Img_Plato"] }],
          transaction
        });
      }

      if (!reserva) throw new Error("La reserva asociada al QR no existe en la base de datos.");

      if (reserva.Est_Reserva === "Consumido") {
        throw new Error("Esta reserva ya fue consumida previamente.");
      }

      // Validar usuario y roles
      if (!usuario) {
        usuario = await UsuariosModel.findByPk(reserva.Id_Usuario, {
          include: [{
            model: UsuariosRolModel,
            as: "rolesUsuario",
            include: [{ model: RolesModel, as: "rolUsuario" }]
          }],
          transaction
        });
      }

      if (!usuario) throw new Error("El usuario propietario del QR no existe.");

      await this.VerificarExpiracionEspecial(usuario, transaction);

      const rolesUsuario = usuario.rolesUsuario?.map(ur => ur.rolUsuario?.Nom_Rol).filter(Boolean) || [];
      const esInterno = rolesUsuario.some(r => r === "Aprendiz Interno" || r === "Pasante Interno");
      const esEspecial = this.EsUsuarioEspecial(usuario, rolesUsuario);

      // Flujo de validacion de estados
      if (esInterno || esEspecial) {
        if (!["Generado", "Verificado"].includes(reserva.Est_Reserva)) {
          throw new Error(`No se puede consumir una reserva con estado: ${reserva.Est_Reserva}`);
        }
      } else {
        if (reserva.Est_Reserva === "Generado") {
          throw new Error("La reserva aun no ha sido verificada en cocina. El aprendiz debe presentarse primero en cocina.");
        }
        if (reserva.Est_Reserva !== "Verificado") {
          throw new Error(`No se puede consumir una reserva con estado: ${reserva.Est_Reserva}`);
        }
      }

      // Marcar como consumida
      await reserva.update({ Est_Reserva: "Consumido" }, { transaction });

      // Registrar en qr_consumidos_control para garantizar uso unico offline
      const uuidControl = reserva.uuid_reserva || crypto.randomUUID();
      await db.query(`
        INSERT INTO qr_consumidos_control (uuid_reserva, NumDoc_Usuario, Fec_Reserva, Tip_Reserva, Id_Supervisor, nodo_consumo)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE Fecha_Consumo = NOW()
      `, {
        replacements: [
          uuidControl,
          usuario.NumDoc_Usuario,
          reserva.Fec_Reserva,
          reserva.Tip_Reserva,
          idSupervisor,
          process.env.NODE_ROLE || "LOCAL"
        ],
        transaction
      });

      // Encolar evento CONSUME en sync_outbox
      await db.query(`
        INSERT INTO sync_outbox (event_id, source_node, entidad, operacion, entity_uuid, payload, sync_status, created_at)
        VALUES (?, ?, 'RESERVA', 'CONSUME', ?, ?, 'PENDING', NOW())
      `, {
        replacements: [
          crypto.randomUUID(),
          process.env.NODE_ROLE || "LOCAL",
          uuidControl,
          JSON.stringify({
            uuid_reserva: uuidControl,
            Id_Reserva: reserva.Id_Reserva,
            Est_Reserva: "Consumido",
            NumDoc_Usuario: usuario.NumDoc_Usuario
          })
        ],
        transaction
      });

      // Incrementar contador en turno activo
      TurnosService.incrementarConsumoTurnoActivo().catch(() => {});

      return {
        message: "Alimentacion registrada como consumida exitosamente",
        Id_Reserva: reserva.Id_Reserva,
        Aprendiz: `${usuario.Nom_Usuario} ${usuario.Ape_Usuario}`.trim(),
        NumDoc: usuario.NumDoc_Usuario,
        Tipo: reserva.Tip_Reserva,
        Plato: reserva.plato?.Nom_Plato ?? "Sin informacion de plato",
        DescPlato: reserva.plato?.Des_Plato ?? "",
        ImgPlato: reserva.plato?.Img_Plato ?? null,
        flujoEspecial: esEspecial,
        flujoInterno: esInterno
      };
    });
  }

  /**
   * Buscar y consumir reserva directamente por numero de documento (modo manual)
   */
  async BuscarReservaPorDocumento(NumDoc, idSupervisor = null) {
    const Usuario = await UsuariosModel.findOne({
      where: { NumDoc_Usuario: String(NumDoc) }
    });
    if (!Usuario) throw new Error("No se encontro ningun usuario registrado con ese numero de documento.");

    const FechaHoy = this.ObtenerFechaHoy();
    const Reserva = await ReservaModel.findOne({
      where: {
        Id_Usuario: Usuario.Id_Usuario,
        Fec_Reserva: FechaHoy
      },
      include: [{ model: PlatosModels, as: "plato", attributes: ["Nom_Plato", "Img_Plato", "Des_Plato"] }],
      order: [["createdAt", "DESC"]]
    });

    if (!Reserva) throw new Error("Este aprendiz no tiene reserva registrada para el dia de hoy.");
    if (!["Generado", "Verificado"].includes(Reserva.Est_Reserva)) {
      throw new Error(`La reserva de este aprendiz ya fue ${Reserva.Est_Reserva.toLowerCase()}.`);
    }

    return await this.procesarConsumoSupervisor(Reserva.Qr_Reserva, idSupervisor);
  }

  // ─────────────────────────────────────────────────────────────
  // MODULO CEDER RESERVA (HABEAS DATA Y TRANSFERENCIA ATOMICA)
  // ─────────────────────────────────────────────────────────────

  /**
   * Busca companeros disponibles para ceder la reserva protegiendo datos sensibles.
   * Enmascara nombres (iniciales de apellidos) y documento (ultimos 3 digitos).
   */
  async BuscarCompaneroParaCeder(busqueda, idUsuarioActual, tipReserva, fecReserva) {
    if (!busqueda || busqueda.trim().length < 2) {
      throw new Error("Ingresa al menos 2 caracteres para buscar al companero.");
    }

    const termino = busqueda.trim();
    const palabras = termino.split(/\s+/).filter(Boolean);

    // Condiciones de busqueda flexibles: nombre, apellido, documento o nombre completo concatenado
    const orCondiciones = [
      { Nom_Usuario: { [Op.like]: `%${termino}%` } },
      { Ape_Usuario: { [Op.like]: `%${termino}%` } },
      { NumDoc_Usuario: { [Op.like]: `%${termino}%` } },
      db.where(
        db.fn("CONCAT", db.col("Nom_Usuario"), " ", db.fn("COALESCE", db.col("Ape_Usuario"), "")),
        { [Op.like]: `%${termino}%` }
      )
    ];

    if (palabras.length > 1) {
      orCondiciones.push({
        [Op.and]: palabras.map(p => db.where(
          db.fn("CONCAT", db.col("Nom_Usuario"), " ", db.fn("COALESCE", db.col("Ape_Usuario"), "")),
          { [Op.like]: `%${p}%` }
        ))
      });
    }

    const usuarios = await UsuariosModel.findAll({
      where: {
        Id_Usuario: { [Op.ne]: idUsuarioActual },
        Est_Usuario: { [Op.ne]: "Inactivo" },
        [Op.or]: orCondiciones
      },
      include: [
        { model: FichasModel, as: "ficha", attributes: ["Num_Ficha"] },
        {
          model: UsuariosRolModel,
          as: "rolesUsuario",
          include: [{ model: RolesModel, as: "rolUsuario", attributes: ["Nom_Rol"] }]
        }
      ],
      limit: 15
    });

    // Consultar si alguno ya tiene reserva activa para esa fecha y turno
    const idsCandidatos = usuarios.map(u => u.Id_Usuario);
    const reservasExistentes = idsCandidatos.length > 0 ? await ReservaModel.findAll({
      where: {
        Id_Usuario: { [Op.in]: idsCandidatos },
        Fec_Reserva: fecReserva,
        Tip_Reserva: tipReserva,
        Est_Reserva: { [Op.in]: ["Generado", "Verificado", "Consumido"] }
      },
      attributes: ["Id_Usuario"]
    }) : [];
    const setIdsConReserva = new Set(reservasExistentes.map(r => r.Id_Usuario));

    const resultados = usuarios.map(u => {
      // Enmascaramiento de nombres: conservar primer nombre, iniciales de apellidos
      const nombres = u.Nom_Usuario || "";
      const apellidos = u.Ape_Usuario || "";
      const inicialesApe = apellidos
        .split(" ")
        .filter(Boolean)
        .map(a => `${a.charAt(0).toUpperCase()}.`)
        .join(" ");
      const nombreEnmascarado = `${nombres} ${inicialesApe}`.trim();

      // Enmascaramiento de documento: solo ultimos 3 digitos visibles
      const docStr = String(u.NumDoc_Usuario || "");
      const ultimos3 = docStr.slice(-3);
      const docEnmascarado = `*******${ultimos3}`;

      // Comprobar rol permitido segun tipo de reserva
      const roles = u.rolesUsuario?.map(r => r.rolUsuario?.Nom_Rol).filter(Boolean) || [];
      const esInterno = roles.some(r => String(r).toLowerCase().includes("interno")) || String(u.CenCon_Usuario).toLowerCase() === "si";
      let rolValido = true;
      if (tipReserva === "Desayuno" || tipReserva === "Cena") {
        rolValido = esInterno;
      }

      // Sancion
      const estaSancionado = u.San_Usuario === "Si";
      const tieneReserva = setIdsConReserva.has(u.Id_Usuario);

      let disponible = true;
      let mensajeRestriccion = "Disponible para recibir reserva";

      if (tieneReserva) {
        disponible = false;
        mensajeRestriccion = "Ya cuenta con reserva para este turno";
      } else if (!rolValido) {
        disponible = false;
        mensajeRestriccion = "Su rol no tiene habilitado este tipo de comida";
      } else if (estaSancionado) {
        disponible = false;
        // Mensaje neutro para no revelar estado sancionado a companeros
        mensajeRestriccion = "No disponible para este turno";
      }

      return {
        Id_Usuario: u.Id_Usuario,
        Nombre_Enmascarado: nombreEnmascarado,
        Documento_Enmascarado: docEnmascarado,
        Num_Ficha: u.ficha?.Num_Ficha ? `Ficha ${u.ficha.Num_Ficha}` : "Sin ficha",
        Disponible: disponible,
        Mensaje_Restriccion: mensajeRestriccion
      };
    });
    return resultados;
  }

  /**
   * Transfiere una reserva a un companero de forma atomica
   */
  async CederReservaACompanero(idReserva, idUsuarioCedente, idUsuarioReceptor, motivo = "") {
    return await db.transaction(async (t) => {
      const reserva = await ReservaModel.findByPk(idReserva, {
        include: [{ model: PlatosModels, as: "plato" }],
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!reserva) throw new Error("Reserva no encontrada");
      if (reserva.Id_Usuario !== idUsuarioCedente) {
        throw new Error("No tienes autorizacion para ceder esta reserva.");
      }
      if (reserva.Est_Reserva !== "Generado") {
        throw new Error(`Solo puedes ceder reservas en estado Generado (Estado actual: ${reserva.Est_Reserva}).`);
      }
      if (reserva.Id_Usuario_Cedente) {
        throw new Error("Esta reserva ya fue cedida previamente. No se permite re-ceder en cadena.");
      }

      // Validar horario de antelacion de cesion (2h antes)
      this.ValidarHorarioCesion(reserva.Tip_Reserva, reserva.Fec_Reserva);

      const receptor = await UsuariosModel.findByPk(idUsuarioReceptor, {
        include: [
          { model: FichasModel, as: "ficha" },
          {
            model: UsuariosRolModel,
            as: "rolesUsuario",
            include: [{ model: RolesModel, as: "rolUsuario" }]
          }
        ],
        transaction: t
      });

      if (!receptor) throw new Error("El aprendiz destinatario no existe.");
      if (receptor.San_Usuario === "Si") {
        throw new Error("El destinatario no puede recibir reservas debido a una restriccion activa.");
      }

      // Verificar que el receptor no tenga ya reserva en ese turno
      const yaTiene = await ReservaModel.findOne({
        where: {
          Id_Usuario: idUsuarioReceptor,
          Fec_Reserva: reserva.Fec_Reserva,
          Tip_Reserva: reserva.Tip_Reserva,
          Est_Reserva: { [Op.in]: ["Generado", "Verificado", "Consumido"] }
        },
        transaction: t
      });
      if (yaTiene) {
        throw new Error("El companero seleccionado ya cuenta con una reserva para este mismo turno.");
      }

      const cedente = await UsuariosModel.findByPk(idUsuarioCedente, { transaction: t });

      // Regenerar QR firmado a nombre del receptor
      const rolesReceptor = receptor.rolesUsuario?.map(r => r.rolUsuario?.Nom_Rol).filter(Boolean) || [];
      const nuevoUuid = crypto.randomUUID();

      const nuevoQr = generarQrFirmado({
        uuid_reserva: nuevoUuid,
        Id_Reserva: reserva.Id_Reserva,
        NumDoc_Usuario: receptor.NumDoc_Usuario,
        Nom_Usuario: `${receptor.Nom_Usuario} ${receptor.Ape_Usuario}`.trim(),
        Num_Ficha: receptor.ficha?.Num_Ficha || "",
        Rol: rolesReceptor[0] || "Aprendiz",
        Fec_Reserva: reserva.Fec_Reserva,
        Tip_Reserva: reserva.Tip_Reserva,
        Id_Plato: reserva.Id_Plato,
        nodo_origen: process.env.NODE_ROLE || "LOCAL"
      });

      await reserva.update({
        uuid_reserva: nuevoUuid,
        Id_Usuario: idUsuarioReceptor,
        Id_Usuario_Cedente: idUsuarioCedente,
        Fec_Cesion: new Date(),
        motivo_cesion: motivo || "Cesion solidaria entre aprendices",
        Qr_Reserva: nuevoQr
      }, { transaction: t });

      // Encolar evento TRANSFER en sync_outbox
      await db.query(`
        INSERT INTO sync_outbox (event_id, source_node, entidad, operacion, entity_uuid, payload, sync_status, created_at)
        VALUES (?, ?, 'RESERVA', 'TRANSFER', ?, ?, 'PENDING', NOW())
      `, {
        replacements: [
          crypto.randomUUID(),
          process.env.NODE_ROLE || "LOCAL",
          nuevoUuid,
          JSON.stringify({
            uuid_reserva: nuevoUuid,
            Id_Reserva: reserva.Id_Reserva,
            Id_Usuario_Nuevo: idUsuarioReceptor,
            Id_Usuario_Cedente: idUsuarioCedente,
            Fec_Cesion: new Date(),
            motivo_cesion: motivo,
            Qr_Reserva: nuevoQr
          })
        ],
        transaction: t
      });

      // Crear notificaciones internas
      await NotificacionesService.crearNotificacion({
        Id_Usuario: idUsuarioReceptor,
        Titulo: "¡Te han cedido una racion de comida!",
        Mensaje: `${cedente?.Nom_Usuario || 'Un companero'} te ha cedido su reserva de ${reserva.Tip_Reserva} para el dia ${reserva.Fec_Reserva}. Ya puedes ver tu nuevo codigo QR en Mis Reservas.`,
        Tipo: "exito"
      });

      await NotificacionesService.crearNotificacion({
        Id_Usuario: idUsuarioCedente,
        Titulo: "Reserva cedida con exito",
        Mensaje: `Tu reserva de ${reserva.Tip_Reserva} para el dia ${reserva.Fec_Reserva} fue transferida correctamente a tu companero.`,
        Tipo: "info"
      });

      return {
        exito: true,
        mensaje: "Reserva transferida exitosamente a tu companero.",
        nuevoQr
      };
    });
  }

  /**
   * Libera una reserva a la Bolsa Solidaria de Bienestar al Aprendiz
   */
  async LiberarBolsaSolidaria(idReserva, idUsuarioCedente, motivo = "Liberacion a bolsa solidaria") {
    return await db.transaction(async (t) => {
      const reserva = await ReservaModel.findByPk(idReserva, {
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!reserva) throw new Error("Reserva no encontrada");
      if (reserva.Id_Usuario !== idUsuarioCedente) {
        throw new Error("No tienes autorizacion para liberar esta reserva.");
      }
      if (reserva.Est_Reserva !== "Generado") {
        throw new Error(`Solo puedes liberar reservas en estado Generado.`);
      }

      // Para bolsa solidaria, permitir liberar en cualquier momento del dia antes de que expire el servicio
      const fechaHoyCol = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      if (reserva.Fec_Reserva < fechaHoyCol) {
        throw new Error("No se pueden liberar reservas de fechas pasadas.");
      }

      await reserva.update({
        Id_Usuario_Cedente: idUsuarioCedente,
        Fec_Cesion: new Date(),
        motivo_cesion: `BOLSA_SOLIDARIA: ${motivo}`,
        Est_Reserva: "Cancelado"
      }, { transaction: t });

      // Encolar cancelacion/liberacion
      if (reserva.uuid_reserva) {
        await db.query(`
          INSERT INTO sync_outbox (event_id, source_node, entidad, operacion, entity_uuid, payload, sync_status, created_at)
          VALUES (?, ?, 'RESERVA', 'CANCEL', ?, ?, 'PENDING', NOW())
        `, {
          replacements: [
            crypto.randomUUID(),
            process.env.NODE_ROLE || "LOCAL",
            reserva.uuid_reserva,
            JSON.stringify({ uuid_reserva: reserva.uuid_reserva, Est_Reserva: "Cancelado", motivo: "BOLSA_SOLIDARIA" })
          ],
          transaction: t
        });
      }

      await NotificacionesService.crearNotificacion({
        Id_Usuario: idUsuarioCedente,
        Titulo: "Cupo liberado para la comunidad",
        Mensaje: `Tu cupo de ${reserva.Tip_Reserva} ha sido liberado para beneficiar a otro aprendiz en lista de espera. ¡Gracias por tu solidaridad!`,
        Tipo: "exito"
      });

      return {
        exito: true,
        mensaje: "Tu reserva ha sido liberada a la Bolsa Solidaria de Bienestar al Aprendiz."
      };
    });
  }

  // Historial de reservas
  async obtenerHistorial(Id_Usuario) {
    return await ReservaModel.findAll({
      where: { Id_Usuario },
      include: [{ model: PlatosModels, as: "plato", attributes: ["Nom_Plato", "Img_Plato", "Des_Plato"] }],
      order: [["createdAt", "DESC"]],
      limit: 10
    });
  }

  async obtenerHistorialCompleto(Id_Usuario) {
    return await ReservaModel.findAll({
      where: { Id_Usuario },
      include: [{ model: PlatosModels, as: "plato", attributes: ["Nom_Plato", "Img_Plato", "Des_Plato"] }],
      order: [["createdAt", "DESC"]]
    });
  }

  // Retorna todas las reservas con los datos del usuario y del plato para reportes y panel administrativo
  async ObtenerTodas() {
    return await ReservaModel.findAll({
      include: [
        {
          model: UsuariosModel,
          as: "usuario",
          attributes: ["Id_Usuario", "Nom_Usuario", "Ape_Usuario", "NumDoc_Usuario", "Cor_Usuario"]
        },
        {
          model: PlatosModels,
          as: "plato",
          attributes: ["Id_Plato", "Nom_Plato", "Img_Plato", "Des_Plato"]
        }
      ],
      order: [["Fec_Reserva", "DESC"], ["createdAt", "DESC"]]
    });
  }

  async obtenerTodas() {
    return await this.ObtenerTodas();
  }

  async cancelarReserva(Id_Reserva, Id_Usuario) {
    const Reserva = await ReservaModel.findOne({
      where: { Id_Reserva, Id_Usuario }
    });
    if (!Reserva) throw new Error("Reserva no encontrada o no pertenece al usuario");
    if (Reserva.Est_Reserva !== "Generado") {
      throw new Error(`No se puede cancelar una reserva con estado: ${Reserva.Est_Reserva}`);
    }

    this.ValidarCancelacionPermitida(Reserva.Tip_Reserva, Reserva.Fec_Reserva);
    await Reserva.update({ Est_Reserva: "Cancelado" });

    if (Reserva.uuid_reserva) {
      await db.query(`
        INSERT INTO sync_outbox (event_id, source_node, entidad, operacion, entity_uuid, payload, sync_status, created_at)
        VALUES (?, ?, 'RESERVA', 'CANCEL', ?, ?, 'PENDING', NOW())
      `, {
        replacements: [
          crypto.randomUUID(),
          process.env.NODE_ROLE || "LOCAL",
          Reserva.uuid_reserva,
          JSON.stringify({ uuid_reserva: Reserva.uuid_reserva, Est_Reserva: "Cancelado" })
        ]
      }).catch(() => {});
    }

    return true;
  }
}

export default new ReservasServices();