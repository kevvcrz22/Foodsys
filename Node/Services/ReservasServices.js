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
import ConfigHorariosModel from "../Models/ConfigHorariosModel.js";
import VencimientoService from "./VencimientoService.js";
import TurnosService from "./TurnosService.js";
import NotificacionesService from "./NotificacionesService.js";
import { notificarCambioReservas } from "./SocketService.js";
import { enviarCorreoSolicitudCesion } from "./Servicio_Correo.js";
import { generarQrFirmado, verificarQrOffline } from "../Utils/qrCrypto.js";
import {
  obtenerFechaColombia,
  obtenerFechaMananaColombia,
  obtenerFechaPasadoMananaColombia,
  obtenerFechaObjetivoReserva,
  obtenerHoraColombia
} from "../Utils/dateUtils.js";
import { dispararCicloSyncDebounced } from "./SyncOutboxService.js";

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
      Desayuno: { h: 8, m: 0 },
      Almuerzo: { h: 13, m: 30 },
      Cena: { h: 20, m: 0 }
    };
    if (!fin[tipo]) throw new Error("Tipo de comida no valido");
    vencimiento.setHours(fin[tipo].h, fin[tipo].m, 0, 0);
    return vencimiento;
  }

  // Valida que la cancelacion se haga antes de la hora limite (por defecto 21:00 del dia anterior)
  async ValidarCancelacionPermitida(tipo, fechaReserva) {
    const fechaHoy = obtenerFechaColombia();
    const horaActualStr = obtenerHoraColombia();
    const [hh, mm] = horaActualStr.split(":").map(Number);
    const minutosActuales = hh * 60 + mm;

    let horaLimiteStr = "22:30:00";
    try {
      const config = await ConfigHorariosModel.findOne({ where: { Tip_Racion: tipo } });
      if (config?.Hora_Limite_Cancelacion) {
        horaLimiteStr = config.Hora_Limite_Cancelacion;
      }
    } catch (_) {}

    const [limH, limM] = horaLimiteStr.split(":").map(Number);
    const minutosLimite = limH * 60 + limM;
    const horaLegible = `${String(limH).padStart(2, "0")}:${String(limM).padStart(2, "0")}`;

    // Si la reserva es para hoy o una fecha pasada, la ventana ya cerro
    if (fechaReserva <= fechaHoy) {
      throw new Error(
        `Ya no es posible cancelar. El limite para cancelar ${tipo} era a las ${horaLegible} de la noche anterior al turno.`
      );
    }

    // Si la reserva es para manana, validar que no supere la hora limite de cancelacion de hoy
    const fechaManana = obtenerFechaMananaColombia();
    if (fechaReserva === fechaManana && minutosActuales > minutosLimite) {
      throw new Error(
        `Ya no es posible cancelar. El limite para cancelar ${tipo} era a las ${horaLegible} de la noche anterior.`
      );
    }

    return true;
  }

  // Valida horario limite para ceder reservas (permite ceder a cualquier hora antes de que finalice el servicio)
  async ValidarHorarioCesion(tipo, fechaReserva) {
    const fechaHoyCol = obtenerFechaColombia();
    const horaActualCol = obtenerHoraColombia();
    const [hhActual, mmActual] = horaActualCol.split(":").map(Number);
    const minutosActuales = hhActual * 60 + mmActual;

    if (fechaReserva < fechaHoyCol) {
      throw new Error("No se pueden ceder reservas de fechas pasadas.");
    }

    if (fechaReserva > fechaHoyCol) {
      // Las reservas para dias futuros se pueden ceder a cualquier hora (ej. 6:00 PM de la vispera o madrugada)
      return true;
    }

    // Para el dia actual de servicio: se permite ceder libremente a cualquier hora antes de que finalice el servicio en comedor
    // Desayuno hasta 08:30 AM, Almuerzo hasta 02:00 PM (14:00), Cena hasta 08:30 PM (20:30)
    let limiteMinutos = 14 * 60; // 02:00 PM para Almuerzo
    let horaStr = "02:00 PM (14:00)";

    if (tipo === "Desayuno") {
      limiteMinutos = 8 * 60 + 30; // 08:30 AM
      horaStr = "08:30 AM";
    } else if (tipo === "Cena") {
      limiteMinutos = 20 * 60 + 30; // 08:30 PM (20:30)
      horaStr = "08:30 PM (20:30)";
    }

    try {
      const config = await ConfigHorariosModel.findOne({ where: { Tip_Racion: tipo } });
      if (config?.Hora_Fin_Servicio) {
        const [cH, cM] = config.Hora_Fin_Servicio.split(":").map(Number);
        limiteMinutos = cH * 60 + cM;
        horaStr = `${String(cH).padStart(2, "0")}:${String(cM).padStart(2, "0")}`;
      }
    } catch (_) {}

    if (minutosActuales > limiteMinutos) {
      throw new Error(`El turno de ${tipo} ha finalizado por hoy (limite para ceder: ${horaStr}).`);
    }

    return true;
  }

  // Ventana horaria de consumo en el comedor
  ObtenerVentanaHoraria(tipo) {
    const ventanas = {
      Desayuno: { desde: 6, hasta: 8 },
      Almuerzo: { desde: 11, hasta: 14 },
      Cena: { desde: 18, hasta: 20 }
    };
    return ventanas[tipo] ?? null;
  }

  // Valida que la reserva ordinaria cumpla las fechas y horarios limites oficiales de Foodsys
  async ValidarHorarioReservaOficial(tipo, fechaReserva, esNovedad = false) {
    const fechaHoy = obtenerFechaColombia();
    const fechaManana = obtenerFechaMananaColombia();
    const fechaPasadoManana = obtenerFechaPasadoMananaColombia();
    const horaActualStr = obtenerHoraColombia();
    const [hh, mm] = horaActualStr.split(":").map(Number);
    const minutosActuales = hh * 60 + mm;

    // 0. Consultar estado activo en configuracion_raciones
    let configRacion = null;
    try {
      configRacion = await ConfigHorariosModel.findOne({ where: { Tip_Racion: tipo } });
    } catch (e) {
      console.warn("Nota al consultar ConfigHorariosModel:", e.message);
    }

    if (configRacion && !configRacion.Racion_Activa) {
      throw new Error(`El servicio de ${tipo} se encuentra temporalmente deshabilitado por Administracion.`);
    }

    // 1. Manejo de Novedades (exclusivo para Almuerzo el mismo dia hasta las 09:00 AM)
    if (esNovedad) {
      if (tipo !== "Almuerzo") {
        throw new Error("Las novedades unicamente estan permitidas para Almuerzo.");
      }
      if (fechaReserva !== fechaHoy) {
        throw new Error(`Las novedades solo se pueden registrar para el mismo dia (${fechaHoy}).`);
      }
      if (minutosActuales >= 9 * 60) {
        throw new Error(
          "El horario limite para registrar novedades de Almuerzo es hasta las 09:00 AM del mismo dia. El plazo de hoy ya cerro."
        );
      }
      return true;
    }

    // 2. Bloqueo de fechas pasadas
    if (fechaReserva < fechaHoy) {
      throw new Error("No es posible realizar reservas para fechas pasadas.");
    }

    // 3. Excepcion Unica Temporal para el Martes 27 de Octubre de 2026 (Almuerzo hasta las 08:00 AM)
    const esExcepcionTemporal = (tipo === "Almuerzo" && fechaReserva === "2026-10-27");
    if (esExcepcionTemporal) {
      if (fechaHoy === "2026-10-26") {
        // Durante todo el 26 de octubre se permite agendar el almuerzo del 27
        return true;
      }
      if (fechaHoy === "2026-10-27") {
        // El 27 de octubre hasta las 08:00:00 AM
        if (minutosActuales <= 8 * 60) {
          return true;
        } else {
          throw new Error(
            "El plazo maximo de la excepcion temporal para reservar el Almuerzo del martes 27 de octubre cerro a las 08:00 AM."
          );
        }
      }
    }

    // 4. Regla General Diaria:
    // No permitir reserva ordinaria para el mismo dia
    if (fechaReserva === fechaHoy) {
      throw new Error(
        `La reserva ordinaria de ${tipo} no se puede efectuar para el mismo dia. ` +
        "Para el dia de hoy solo aplica Novedades de Almuerzo hasta las 09:00 AM."
      );
    }

    // Ciclo diario de 22:31 a 22:30:
    // Si la hora es menor o igual a las 10:30 PM (22:30:00 = 1350 minutos):
    // Se permite reservar para manana (o dias posteriores).
    // Si la hora es mayor a las 10:30 PM (>= 22:31:00 = 1351 minutos):
    // Ya cerro para manana; debe reservar para pasado manana (o dias posteriores).
    if (fechaReserva === fechaManana) {
      if (minutosActuales > 1350) {
        throw new Error(
          `El horario limite para reservar ${tipo} para manana (${fechaManana}) finalizo a las 10:30 PM (22:30). ` +
          `A partir de las 10:31 PM el sistema agenda automaticamente para pasado manana (${fechaPasadoManana}).`
        );
      }
      return true;
    }

    // Para pasado manana o dias posteriores, esta habilitado
    if (fechaReserva >= fechaPasadoManana) {
      return true;
    }

    return true;
  }

  // Alias para mantener compatibilidad con llamadas existentes
  async ValidarAntelacion8Horas(tipo, fechaReserva) {
    return await this.ValidarHorarioReservaOficial(tipo, fechaReserva, false);
  }

  // Valida que las novedades sean exclusivamente para el dia de hoy y hasta las 9:00 AM
  ValidarNovedadAlmuerzo(tipo, fechaReserva) {
    if (tipo !== "Almuerzo") {
      throw new Error("Las novedades unicamente estan permitidas para Almuerzo.");
    }

    const fechaHoy = obtenerFechaColombia();
    if (fechaReserva !== fechaHoy) {
      throw new Error(`Las novedades solo se pueden registrar para el mismo dia (${fechaHoy}).`);
    }

    const horaActualStr = obtenerHoraColombia();
    const partes = horaActualStr.split(":").map(Number);
    const hh = partes[0];
    const mm = partes[1];
    const ss = partes[2] || 0;

    if (hh > 9 || (hh === 9 && (mm > 0 || ss > 0))) {
      throw new Error(
        "El horario limite para registrar novedades de Almuerzo es hasta las 09:00 AM del mismo dia. El plazo de hoy ya cerro."
      );
    }

    return true;
  }

  // Tipos de comida permitidos segun rol y condicion de internado
  ObtenerRolesPermitidos(roles, cenCon = "No") {
    const esAdminOGestor = roles.some(r => 
      r === "Administrador" || 
      r === "SENA Empresa" || 
      r === "Bienestar" || 
      r === "Coordinador"
    );
    if (esAdminOGestor) return ["Desayuno", "Almuerzo", "Cena"];

    const esInterno = roles.some(r => r === "Aprendiz Interno" || r === "Pasante Interno") || cenCon === "Si";
    if (esInterno) return ["Desayuno", "Almuerzo", "Cena"];

    const esExterno = roles.some(r => r === "Aprendiz Externo" || r === "Pasante Externo" || r === "Instructor" || r === "Vocero");
    if (esExterno) return ["Almuerzo"];

    return ["Almuerzo"];
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
  async generarReservaPass(
    Id_Usuario,
    rolesUsuario,
    Tip_Reserva,
    platoElegido,
    fechaReserva,
    esNovedad = false,
    Jus_Reserva = null,
    Id_Bebida = null,
    Tipo_Bebida = "FRIA",
    Lleva_Sopa = true
  ) {
    const resultado = await db.transaction(async (transaction) => {
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

      const tiposPermitidos = this.ObtenerRolesPermitidos(rolesUsuario, usuario.CenCon_Usuario);
      const TipoNormalizado = Tip_Reserva.charAt(0).toUpperCase() + Tip_Reserva.slice(1);
      if (!tiposPermitidos.includes(TipoNormalizado)) {
        throw new Error(`El tipo de comida "${Tip_Reserva}" no esta permitido para tu rol`);
      }

      const plato = await PlatosModels.findByPk(platoElegido, { transaction });
      if (!plato) throw new Error("El plato seleccionado no existe");

      let bebida = null;
      if (Id_Bebida) {
        bebida = await PlatosModels.findByPk(Id_Bebida, { transaction });
      }

      // Validacion oficial de horarios y ciclos de 22:30 con excepcion del 27 de octubre
      await this.ValidarHorarioReservaOficial(TipoNormalizado, fechaReserva, esNovedad);

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

      // Crear reserva con plato, bebida caliente/fria y sopa
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
        Id_Bebida: Id_Bebida || null,
        Tipo_Bebida: Tipo_Bebida || "FRIA",
        Lleva_Sopa: Lleva_Sopa !== undefined ? Boolean(Lleva_Sopa) : true,
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
        Id_Bebida: Id_Bebida || null,
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
    dispararCicloSyncDebounced();
    return resultado;
  }

  /**
   * Unica definicion atomica de verificacion presencial de cocina (Generado -> Verificado)
   * Exclusivo para Aprendices Externos y Pasantes Externos sin estado Especial
   */
  async procesarVerificacionCocina(Id_Reserva) {
    const resultado = await db.transaction(async (transaction) => {
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
          },
          {
            model: PlatosModels,
            as: "bebida",
            attributes: ["Nom_Plato", "Des_Plato", "Img_Plato", "Subtipo_Bebida"]
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
          Bebida: reserva.bebida ? `${reserva.bebida.Nom_Plato} (${reserva.bebida.Subtipo_Bebida === 'FRIA' ? 'Bebida Fría' : 'Bebida Caliente'})` : "Sin bebida asignada",
          SubtipoBebida: reserva.bebida?.Subtipo_Bebida || null,
          ImgBebida: reserva.bebida?.Img_Plato ?? null,
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
        Bebida: reserva.bebida ? `${reserva.bebida.Nom_Plato} (${reserva.bebida.Subtipo_Bebida === 'FRIA' ? 'Bebida Fría' : 'Bebida Caliente'})` : "Sin bebida asignada",
        SubtipoBebida: reserva.bebida?.Subtipo_Bebida || null,
        ImgBebida: reserva.bebida?.Img_Plato ?? null,
        nuevoEstado: "Verificado"
      };
    });
    dispararCicloSyncDebounced();
    return resultado;
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
   * Verifica la reserva en Cocina mediante pistola de codigo de barras o teclado manual por numero de cedula
   */
  async procesarVerificacionCocinaPorDocumento(NumDoc) {
    if (!NumDoc) throw new Error("El numero de documento es obligatorio");
    const docLimpio = String(NumDoc).trim();
    const usuario = await UsuariosModel.findOne({
      where: { NumDoc_Usuario: docLimpio }
    });
    if (!usuario) {
      throw new Error("No se encontro ningun usuario registrado con ese numero de documento.");
    }

    const fechaHoy = this.ObtenerFechaHoy();
    const reserva = await ReservaModel.findOne({
      where: {
        Id_Usuario: usuario.Id_Usuario,
        Fec_Reserva: fechaHoy
      },
      order: [["createdAt", "DESC"]]
    });

    if (!reserva) {
      throw new Error("Este aprendiz no tiene ninguna reserva registrada para el dia de hoy.");
    }

    return await this.procesarVerificacionCocina(reserva.Id_Reserva);
  }

  /**
   * Procesa el consumo del supervisor (Verificado/Generado -> Consumido)
   * Soporta firma Ed25519 offline, comprobacion unica en qr_consumidos_control
   * y creacion automatica de réplica local si el aprendiz reservo en la nube durante un corte de internet.
   */
  async procesarConsumoSupervisor(contenidoQR, idSupervisor = null) {
    const resultado = await db.transaction(async (transaction) => {
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
          include: [
            { model: PlatosModels, as: "plato", attributes: ["Nom_Plato", "Des_Plato", "Img_Plato"] },
            { model: PlatosModels, as: "bebida", attributes: ["Nom_Plato", "Des_Plato", "Img_Plato", "Subtipo_Bebida"] }
          ],
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
          include: [
            { model: PlatosModels, as: "plato", attributes: ["Nom_Plato", "Des_Plato", "Img_Plato"] },
            { model: PlatosModels, as: "bebida", attributes: ["Nom_Plato", "Des_Plato", "Img_Plato", "Subtipo_Bebida"] }
          ],
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
        Bebida: reserva.bebida ? `${reserva.bebida.Nom_Plato} (${reserva.bebida.Subtipo_Bebida === 'FRIA' ? 'Bebida Fría' : 'Bebida Caliente'})` : "Sin bebida asignada",
        SubtipoBebida: reserva.bebida?.Subtipo_Bebida || null,
        ImgBebida: reserva.bebida?.Img_Plato ?? null,
        flujoEspecial: esEspecial,
        flujoInterno: esInterno
      };
    });
    dispararCicloSyncDebounced();
    return resultado;
  }

  /**
   * Buscar y consumir reserva directamente por numero de documento (modo manual o lector de codigo de barras)
   */
  async BuscarReservaPorDocumento(NumDoc, idSupervisor = null) {
    const docLimpio = String(NumDoc).trim();
    const Usuario = await UsuariosModel.findOne({
      where: { NumDoc_Usuario: docLimpio }
    });
    if (!Usuario) throw new Error("No se encontro ningun usuario registrado con ese numero de documento.");

    const FechaHoy = this.ObtenerFechaHoy();
    const Reserva = await ReservaModel.findOne({
      where: {
        Id_Usuario: Usuario.Id_Usuario,
        Fec_Reserva: FechaHoy
      },
      include: [
        { model: PlatosModels, as: "plato", attributes: ["Nom_Plato", "Img_Plato", "Des_Plato"] },
        { model: PlatosModels, as: "bebida", attributes: ["Nom_Plato", "Img_Plato", "Des_Plato", "Subtipo_Bebida"] }
      ],
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
  /**
   * Busca companeros disponibles para ceder la reserva mostrando nombre completo real
   * y ocultando datos sensibles (telefono, correo, direccion, estado de sancion).
   * Filtro estricto: Desayuno/Cena -> Solo Internos. Almuerzo -> Internos y Externos.
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
      limit: 25
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

    const resultados = [];
    for (const u of usuarios) {
      const roles = u.rolesUsuario?.map(r => r.rolUsuario?.Nom_Rol).filter(Boolean) || [];
      const esInterno = roles.some(r => String(r).toLowerCase().includes("interno")) || String(u.CenCon_Usuario).toLowerCase() === "si";
      const esExterno = roles.some(r => String(r).toLowerCase().includes("externo"));

      // Desayuno y Cena SOLO se pueden ceder a Internos (regla institucional)
      if ((tipReserva === "Desayuno" || tipReserva === "Cena") && !esInterno) {
        continue;
      }

      // Almuerzo permite Internos o Externos (excluyendo roles que no sean aprendices/pasantes)
      if (tipReserva === "Almuerzo" && !esInterno && !esExterno) {
        continue;
      }

      const tieneReserva = setIdsConReserva.has(u.Id_Usuario);
      const estaSancionado = u.San_Usuario === "Si";

      let disponible = true;
      let mensajeRestriccion = "Disponible para recibir reserva";

      if (tieneReserva) {
        disponible = false;
        mensajeRestriccion = "Ya cuenta con reserva para este turno";
      } else if (estaSancionado) {
        disponible = false;
        mensajeRestriccion = "No disponible para este turno";
      }

      // Mostrar el nombre completo real del companero
      const nombreCompleto = `${u.Nom_Usuario || ""} ${u.Ape_Usuario || ""}`.trim();
      const numFicha = u.ficha?.Num_Ficha ? `Ficha ${u.ficha.Num_Ficha}` : "Sin ficha asignada";

      // Documento enmascarado parcialmente (ultimos 4 digitos)
      const docStr = String(u.NumDoc_Usuario || "");
      const ultimos4 = docStr.slice(-4);
      const docEnmascarado = `******${ultimos4}`;

      resultados.push({
        Id_Usuario: u.Id_Usuario,
        Nombre_Completo: nombreCompleto,
        Nombre_Enmascarado: `${nombreCompleto} — ${numFicha}`,
        Documento_Enmascarado: docEnmascarado,
        Num_Ficha: numFicha,
        Rol_Tipo: esInterno ? "Interno" : "Externo",
        Disponible: disponible,
        Mensaje_Restriccion: mensajeRestriccion
      });
    }

    return resultados;
  }

  /**
   * Envia una solicitud de cesion a un companero
   * La reserva no cambia todavia de dueno ni de QR hasta que el receptor acepte
   */
  async SolicitarCesionReserva(idReserva, idUsuarioCedente, idUsuarioReceptor, motivo = "") {
    const resultado = await db.transaction(async (t) => {
      const reserva = await ReservaModel.findByPk(idReserva, {
        include: [
          { model: PlatosModels, as: "plato" },
          { model: PlatosModels, as: "bebida" }
        ],
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

      await this.ValidarHorarioCesion(reserva.Tip_Reserva, reserva.Fec_Reserva);

      const receptor = await UsuariosModel.findByPk(idUsuarioReceptor, {
        include: [{ model: FichasModel, as: "ficha" }],
        transaction: t
      });

      if (!receptor) throw new Error("El aprendiz destinatario no existe.");
      if (receptor.San_Usuario === "Si") {
        throw new Error("El destinatario no puede recibir reservas debido a una restriccion activa.");
      }

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
      const nombreCedente = `${cedente?.Nom_Usuario || ""} ${cedente?.Ape_Usuario || ""}`.trim();
      const nombreReceptor = `${receptor?.Nom_Usuario || ""} ${receptor?.Ape_Usuario || ""}`.trim();

      const tokenCesion = crypto.randomUUID();

      await reserva.update({
        Id_Usuario_Receptor_Pendiente: idUsuarioReceptor,
        Estado_Cesion: "PENDIENTE_ACEPTACION",
        Token_Aceptacion_Cesion: tokenCesion,
        motivo_cesion: motivo || "Solicitud de cesion voluntaria"
      }, { transaction: t });

      // Notificacion interna en la aplicacion (campanita y emergente)
      await NotificacionesService.crearNotificacion({
        Id_Usuario: idUsuarioReceptor,
        Titulo: `¡Te han ofrecido una racion de ${reserva.Tip_Reserva}!`,
        Mensaje: `${nombreCedente} te ha ofrecido cederte su reserva de ${reserva.Tip_Reserva} para el ${reserva.Fec_Reserva}. Revisa tus reservas para Aceptar o Rechazar.`,
        Tipo: "cesion"
      });

      // Enviar correo electronico
      if (receptor.Cor_Usuario) {
        enviarCorreoSolicitudCesion({
          correoDestinatario: receptor.Cor_Usuario,
          nombreDestinatario: nombreReceptor,
          nombreCedente: nombreCedente,
          tipoComida: reserva.Tip_Reserva,
          fechaReserva: reserva.Fec_Reserva,
          nombrePlato: reserva.plato?.Nom_Plato,
          nombreBebida: reserva.bebida?.Nom_Plato
        }).catch(err => console.warn("Nota al enviar correo cesion:", err.message));
      }

      return {
        exito: true,
        mensaje: `Solicitud de cesion enviada exitosamente a ${nombreReceptor}. Tu codigo QR original y tu reserva continuan a tu nombre hasta que tu companero acepte.`
      };
    });

    return resultado;
  }

  /**
   * Responder a una solicitud de cesion (Aceptar o Rechazar)
   */
  async ResponderCesionReserva(idReserva, idUsuarioReceptor, accion = "ACEPTAR") {
    const accionNormalizada = String(accion).toUpperCase();
    const resultado = await db.transaction(async (t) => {
      const reserva = await ReservaModel.findByPk(idReserva, {
        include: [
          { model: PlatosModels, as: "plato" },
          { model: PlatosModels, as: "bebida" },
          { model: UsuariosModel, as: "usuario" }
        ],
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!reserva) throw new Error("Reserva no encontrada");
      if (reserva.Id_Usuario_Receptor_Pendiente !== idUsuarioReceptor) {
        throw new Error("No tienes una solicitud de cesion pendiente para esta reserva.");
      }
      if (reserva.Estado_Cesion !== "PENDIENTE_ACEPTACION") {
        throw new Error("Esta solicitud de cesion ya no se encuentra en estado pendiente.");
      }

      const cedente = reserva.usuario;
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

      const nombreCedente = `${cedente?.Nom_Usuario || ""} ${cedente?.Ape_Usuario || ""}`.trim();
      const nombreReceptor = `${receptor?.Nom_Usuario || ""} ${receptor?.Ape_Usuario || ""}`.trim();

      if (accionNormalizada === "RECHAZAR") {
        // Restaurar estado a NINGUNA y conservar titular original
        await reserva.update({
          Id_Usuario_Receptor_Pendiente: null,
          Estado_Cesion: "NINGUNA",
          Token_Aceptacion_Cesion: null
        }, { transaction: t });

        await NotificacionesService.crearNotificacion({
          Id_Usuario: reserva.Id_Usuario,
          Titulo: "Solicitud de cesion rechazada",
          Mensaje: `${nombreReceptor} no pudo aceptar tu reserva de ${reserva.Tip_Reserva}. Tu codigo QR original y tu cupo siguen vigentes a tu nombre.`,
          Tipo: "alerta"
        });

        return {
          exito: true,
          mensaje: "Has rechazado la solicitud de cesion. La reserva y su codigo QR continuan a nombre de su titular original."
        };
      }

      // Si es ACEPTAR:
      await this.ValidarHorarioCesion(reserva.Tip_Reserva, reserva.Fec_Reserva);

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
        throw new Error("Ya cuentas con una reserva activa para este mismo turno.");
      }

      const rolesReceptor = receptor.rolesUsuario?.map(r => r.rolUsuario?.Nom_Rol).filter(Boolean) || [];
      const nuevoUuid = crypto.randomUUID();

      const nuevoQr = generarQrFirmado({
        uuid_reserva: nuevoUuid,
        Id_Reserva: reserva.Id_Reserva,
        NumDoc_Usuario: receptor.NumDoc_Usuario,
        Nom_Usuario: nombreReceptor,
        Num_Ficha: receptor.ficha?.Num_Ficha || "",
        Rol: rolesReceptor[0] || "Aprendiz",
        Fec_Reserva: reserva.Fec_Reserva,
        Tip_Reserva: reserva.Tip_Reserva,
        Id_Plato: reserva.Id_Plato,
        Id_Bebida: reserva.Id_Bebida,
        nodo_origen: process.env.NODE_ROLE || "LOCAL"
      });

      const idUsuarioCedente = reserva.Id_Usuario;

      await reserva.update({
        uuid_reserva: nuevoUuid,
        Id_Usuario: idUsuarioReceptor,
        Id_Usuario_Cedente: idUsuarioCedente,
        Id_Usuario_Receptor_Pendiente: null,
        Estado_Cesion: "ACEPTADA",
        Token_Aceptacion_Cesion: null,
        Fec_Cesion: new Date(),
        Qr_Reserva: nuevoQr
      }, { transaction: t });

      // Encolar evento TRANSFER en outbox
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
            Qr_Reserva: nuevoQr
          })
        ],
        transaction: t
      });

      await NotificacionesService.crearNotificacion({
        Id_Usuario: idUsuarioReceptor,
        Titulo: "¡Reserva aceptada exitosamente!",
        Mensaje: `Has aceptado la reserva de ${reserva.Tip_Reserva} cedida por ${nombreCedente}. Tu nuevo codigo QR ya esta disponible en Mis Reservas.`,
        Tipo: "exito"
      });

      await NotificacionesService.crearNotificacion({
        Id_Usuario: idUsuarioCedente,
        Titulo: "Tu companero acepto la reserva",
        Mensaje: `${nombreReceptor} acepto tu reserva de ${reserva.Tip_Reserva}. La transferencia ha quedado formalizada.`,
        Tipo: "info"
      });

      return {
        exito: true,
        mensaje: "Reserva aceptada exitosamente. Tu nuevo codigo QR ya esta activo en tu cuenta.",
        nuevoQr
      };
    });

    dispararCicloSyncDebounced();
    return resultado;
  }

  /**
   * Obtiene las solicitudes de cesion pendientes para un usuario receptor
   */
  async ObtenerCesionesPendientes(idUsuario) {
    return await ReservaModel.findAll({
      where: {
        Id_Usuario_Receptor_Pendiente: idUsuario,
        Estado_Cesion: "PENDIENTE_ACEPTACION",
        Est_Reserva: "Generado"
      },
      include: [
        {
          model: UsuariosModel,
          as: "usuario",
          attributes: ["Id_Usuario", "Nom_Usuario", "Ape_Usuario", "NumDoc_Usuario", "Cor_Usuario"]
        },
        {
          model: PlatosModels,
          as: "plato",
          attributes: ["Id_Plato", "Nom_Plato", "Des_Plato", "Img_Plato"]
        },
        {
          model: PlatosModels,
          as: "bebida",
          attributes: ["Id_Plato", "Nom_Plato", "Des_Plato", "Img_Plato", "Subtipo_Bebida"]
        }
      ],
      order: [["updatedAt", "DESC"]]
    });
  }

  /**
   * Metodo retrocompatible que llama a SolicitarCesionReserva
   */
  async CederReservaACompanero(idReserva, idUsuarioCedente, idUsuarioReceptor, motivo = "") {
    return await this.SolicitarCesionReserva(idReserva, idUsuarioCedente, idUsuarioReceptor, motivo);
  }

  /**
   * Libera una reserva a la Bolsa Solidaria de Bienestar al Aprendiz
   */
  async LiberarBolsaSolidaria(idReserva, idUsuarioCedente, motivo = "Liberacion a bolsa solidaria") {
    const resultado = await db.transaction(async (t) => {
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
        Est_Reserva: "Liberado"
      }, { transaction: t });

      // Encolar liberacion para sincronizacion
      if (reserva.uuid_reserva) {
        await db.query(`
          INSERT INTO sync_outbox (event_id, source_node, entidad, operacion, entity_uuid, payload, sync_status, created_at)
          VALUES (?, ?, 'RESERVA', 'UPDATE', ?, ?, 'PENDING', NOW())
        `, {
          replacements: [
            crypto.randomUUID(),
            process.env.NODE_ROLE || "LOCAL",
            reserva.uuid_reserva,
            JSON.stringify({ uuid_reserva: reserva.uuid_reserva, Est_Reserva: "Liberado", motivo: "BOLSA_SOLIDARIA" })
          ],
          transaction: t
        });
      }

      await NotificacionesService.crearNotificacion({
        Id_Usuario: idUsuarioCedente,
        Titulo: "Cupo liberado para la comunidad",
        Mensaje: `Tu cupo de ${reserva.Tip_Reserva} ha sido liberado para la Bolsa Solidaria de Bienestar. ¡Gracias por tu solidaridad!`,
        Tipo: "exito"
      });

      // Notificacion comunitaria para la campanita y ventana emergente
      try {
        await NotificacionesService.crearNotificacion({
          Rol_Destino: "Todos",
          Titulo: `¡Cupo disponible en Bolsa Solidaria! (${reserva.Tip_Reserva})`,
          Mensaje: `Se ha liberado un cupo de ${reserva.Tip_Reserva} para el ${reserva.Fec_Reserva}. ¡Reclámalo ahora en la Bolsa Solidaria!`,
          Tipo: "bolsa_solidaria"
        });
      } catch (_) {}

      return {
        exito: true,
        mensaje: "Tu reserva ha sido liberada a la Bolsa Solidaria de Bienestar al Aprendiz. Otros aprendices podran aprovecharla."
      };
    });
    notificarCambioReservas({ accion: "bolsa_actualizada", Id_Reserva: idReserva });
    dispararCicloSyncDebounced();
    return resultado;
  }

  /**
   * Obtiene los cupos disponibles de la Bolsa Solidaria que aplican para el usuario segun su rol
   * - Internos: Desayuno, Almuerzo, Cena
   * - Externos: Almuerzo unicamente
   */
  async ObtenerCuposBolsaSolidaria(idUsuario) {
    const { obtenerFechaColombia, obtenerHoraColombia } = await import('../Utils/dateUtils.js');
    const hoy = obtenerFechaColombia();
    const horaActualCol = obtenerHoraColombia();
    const [hh, mm] = horaActualCol.split(':').map(Number);
    const minutosActuales = (hh || 0) * 60 + (mm || 0);

    const usuario = await UsuariosModel.findByPk(idUsuario);
    if (!usuario) throw new Error("Usuario no encontrado");

    // Consultar roles del usuario
    const [rolesRows] = await db.query(
      `SELECT r.Nom_Rol FROM roles r
       INNER JOIN usuariosrol ur ON ur.Id_Rol = r.Id_Rol
       WHERE ur.Id_Usuario = ?`,
      { replacements: [idUsuario] }
    );
    const roles = Array.isArray(rolesRows) ? rolesRows.map(r => r.Nom_Rol).filter(Boolean) : [];
    const esInterno = roles.some(r => String(r).toLowerCase().includes("interno")) || String(usuario.CenCon_Usuario || "").toLowerCase() === "si";
    const esSancionado = usuario.San_Usuario === 'Si';

    // Obtener reservas activas que el usuario ya tenga para hoy o fechas futuras
    const reservasPropias = await ReservaModel.findAll({
      where: {
        Id_Usuario: idUsuario,
        Fec_Reserva: { [Op.gte]: hoy },
        Est_Reserva: { [Op.in]: ['Generado', 'Verificado', 'Consumido'] }
      },
      attributes: ['Fec_Reserva', 'Tip_Reserva']
    });
    const setMisReservas = new Set(reservasPropias.map(r => `${r.Fec_Reserva}_${r.Tip_Reserva}`));

    // Buscar reservas liberadas a la bolsa con sus platos
    const [reservasBolsa] = await db.query(
      `SELECT r.Id_Reserva, r.Fec_Reserva, r.Tip_Reserva, r.Id_Usuario_Cedente,
              p.Nom_Plato, p.Img_Plato, p.Des_Plato,
              b.Nom_Plato as Nom_Bebida, b.Subtipo_Bebida
       FROM reservas r
       LEFT JOIN platos p ON p.Id_Plato = r.Id_Plato
       LEFT JOIN platos b ON b.Id_Plato = r.Id_Bebida
       WHERE r.Est_Reserva = 'Liberado'
         AND r.Fec_Reserva >= ?
         AND r.motivo_cesion LIKE 'BOLSA_SOLIDARIA%'
       ORDER BY r.Fec_Reserva ASC, r.Tip_Reserva ASC`,
      { replacements: [hoy] }
    );

    const minutosCierreTurno = {
      Desayuno: 7 * 60,         // 07:00 AM
      Almuerzo: 13 * 60 + 30,   // 01:30 PM
      Cena: 19 * 60 + 30        // 07:30 PM
    };

    const cuposFiltrados = [];
    for (const r of (reservasBolsa || [])) {
      // Si es para hoy, verificar si el turno ya cerro
      if (r.Fec_Reserva === hoy) {
        const minCierre = minutosCierreTurno[r.Tip_Reserva] || (20 * 60);
        if (minutosActuales >= minCierre) continue; // Ya cerro el turno
      }

      // Regla de roles: Desayuno y Cena SOLO para Internos
      if ((r.Tip_Reserva === 'Desayuno' || r.Tip_Reserva === 'Cena') && !esInterno) {
        continue;
      }

      // Verificar si el usuario puede reclamar este cupo especifico
      const keyTurno = `${r.Fec_Reserva}_${r.Tip_Reserva}`;
      const yaTieneReserva = setMisReservas.has(keyTurno);
      const puedeReclamar = !yaTieneReserva && !esSancionado && r.Id_Usuario_Cedente !== idUsuario;

      let motivoBloqueo = null;
      if (r.Id_Usuario_Cedente === idUsuario) {
        motivoBloqueo = "Tu liberaste este cupo";
      } else if (yaTieneReserva) {
        motivoBloqueo = `Ya tienes reserva activa de ${r.Tip_Reserva} para esta fecha`;
      } else if (esSancionado) {
        motivoBloqueo = "Usuario con sancion activa";
      }

      cuposFiltrados.push({
        Id_Reserva: r.Id_Reserva,
        Fec_Reserva: r.Fec_Reserva,
        Tip_Reserva: r.Tip_Reserva,
        Plato: r.Nom_Plato || "Plato General",
        Img_Plato: r.Img_Plato || null,
        Des_Plato: r.Des_Plato || "",
        Bebida: r.Nom_Bebida || null,
        Subtipo_Bebida: r.Subtipo_Bebida || "NINGUNA",
        Puede_Reclamar: puedeReclamar,
        Motivo_Bloqueo: motivoBloqueo
      });
    }

    return {
      totalDisponibles: cuposFiltrados.filter(c => c.Puede_Reclamar).length,
      cupos: cuposFiltrados
    };
  }

  /**
   * Reclama un cupo de la Bolsa Solidaria para el usuario autenticado
   */
  async ReclamarCupoBolsaSolidaria(idReserva, idUsuarioReceptor) {
    const { obtenerFechaColombia } = await import('../Utils/dateUtils.js');
    const hoy = obtenerFechaColombia();

    const resultado = await db.transaction(async (t) => {
      const reserva = await ReservaModel.findByPk(idReserva, {
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!reserva) throw new Error("Cupo de reserva no encontrado.");
      if (reserva.Est_Reserva !== "Liberado") {
        throw new Error("Este cupo ya fue tomado por otro compañero o no se encuentra disponible.");
      }
      if (reserva.Fec_Reserva < hoy) {
        throw new Error("Este cupo corresponde a una fecha pasada.");
      }

      const usuarioReceptor = await UsuariosModel.findByPk(idUsuarioReceptor, {
        transaction: t
      });
      if (!usuarioReceptor) throw new Error("Usuario receptor no encontrado.");

      if (usuarioReceptor.San_Usuario === "Si") {
        throw new Error("No puedes reclamar cupos porque tienes una sancion activa.");
      }

      const [rolesRows] = await db.query(
        `SELECT r.Nom_Rol FROM roles r
         INNER JOIN usuariosrol ur ON ur.Id_Rol = r.Id_Rol
         WHERE ur.Id_Usuario = ?`,
        { replacements: [idUsuarioReceptor], transaction: t }
      );
      const roles = Array.isArray(rolesRows) ? rolesRows.map(r => r.Nom_Rol).filter(Boolean) : [];
      const esInterno = roles.some(r => String(r).toLowerCase().includes("interno")) || String(usuarioReceptor.CenCon_Usuario || "").toLowerCase() === "si";

      if ((reserva.Tip_Reserva === "Desayuno" || reserva.Tip_Reserva === "Cena") && !esInterno) {
        throw new Error(`El turno de ${reserva.Tip_Reserva} es exclusivo para aprendices internos.`);
      }

      // Verificar que el receptor no tenga ya reserva activa para ese turno
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
        throw new Error(`Ya tienes una reserva activa de ${reserva.Tip_Reserva} para el ${reserva.Fec_Reserva}.`);
      }

      let numFicha = "";
      if (usuarioReceptor.Id_Ficha) {
        const [fichaRows] = await db.query(
          `SELECT Num_Ficha FROM fichas WHERE Id_Ficha = ?`,
          { replacements: [usuarioReceptor.Id_Ficha], transaction: t }
        );
        numFicha = fichaRows?.[0]?.Num_Ficha || "";
      }

      // Generar nuevo QR firmado para el receptor
      const nuevoUuid = crypto.randomUUID();
      const qrFirmado = generarQrFirmado({
        uuid_reserva: nuevoUuid,
        Id_Reserva: reserva.Id_Reserva,
        NumDoc_Usuario: usuarioReceptor.NumDoc_Usuario,
        Nom_Usuario: `${usuarioReceptor.Nom_Usuario} ${usuarioReceptor.Ape_Usuario}`.trim(),
        Num_Ficha: numFicha,
        Rol: roles[0] || "Aprendiz",
        Fec_Reserva: reserva.Fec_Reserva,
        Tip_Reserva: reserva.Tip_Reserva,
        Id_Plato: reserva.Id_Plato,
        Id_Bebida: reserva.Id_Bebida || null,
        nodo_origen: process.env.NODE_ROLE || "CLOUD"
      });

      const donanteId = reserva.Id_Usuario_Cedente;

      await reserva.update({
        Id_Usuario: idUsuarioReceptor,
        Estado_Cesion: "ACEPTADA",
        Est_Reserva: "Generado",
        Qr_Reserva: qrFirmado,
        uuid_reserva: nuevoUuid,
        sync_status: "PENDING"
      }, { transaction: t });

      // Notificar al receptor
      await NotificacionesService.crearNotificacion({
        Id_Usuario: idUsuarioReceptor,
        Titulo: "Cupo obtenido de la Bolsa Solidaria",
        Mensaje: `Has tomado con éxito un cupo de ${reserva.Tip_Reserva} para el ${reserva.Fec_Reserva}. Tu código QR ya está generado en tus reservas.`,
        Tipo: "exito"
      });

      // Notificar al donante
      if (donanteId) {
        await NotificacionesService.crearNotificacion({
          Id_Usuario: donanteId,
          Titulo: "Tu cupo donado fue aprovechado",
          Mensaje: `El cupo de ${reserva.Tip_Reserva} que liberaste para el ${reserva.Fec_Reserva} ha sido tomado por un compañero de la comunidad SENA. ¡Muchas gracias!`,
          Tipo: "info"
        });
      }

      return {
        exito: true,
        mensaje: `Cupo de ${reserva.Tip_Reserva} asignado exitosamente a tu nombre. Ya puedes ver tu código QR.`
      };
    });

    notificarCambioReservas({ accion: "bolsa_reclamada", Id_Reserva: idReserva });
    dispararCicloSyncDebounced();
    return resultado;
  }

  // Historial de reservas
  async obtenerHistorial(Id_Usuario) {
    return await ReservaModel.findAll({
      where: { Id_Usuario },
      include: [
        { model: PlatosModels, as: "plato", attributes: ["Id_Plato", "Nom_Plato", "Img_Plato", "Des_Plato"] },
        { model: PlatosModels, as: "bebida", attributes: ["Id_Plato", "Nom_Plato", "Img_Plato", "Des_Plato", "Subtipo_Bebida"] }
      ],
      order: [["createdAt", "DESC"]],
      limit: 10
    });
  }

  async obtenerHistorialCompleto(Id_Usuario) {
    return await ReservaModel.findAll({
      where: { Id_Usuario },
      include: [
        { model: PlatosModels, as: "plato", attributes: ["Id_Plato", "Nom_Plato", "Img_Plato", "Des_Plato"] },
        { model: PlatosModels, as: "bebida", attributes: ["Id_Plato", "Nom_Plato", "Img_Plato", "Des_Plato", "Subtipo_Bebida"] }
      ],
      order: [["createdAt", "DESC"]]
    });
  }

  // Retorna todas las reservas con los datos del usuario, plato y bebida para reportes y panel administrativo
  async ObtenerTodas() {
    return await ReservaModel.findAll({
      include: [
        {
          model: UsuariosModel,
          as: "usuario",
          attributes: ["Id_Usuario", "Nom_Usuario", "Ape_Usuario", "NumDoc_Usuario", "Cor_Usuario", "Tel_Usuario", "CenCon_Usuario"]
        },
        {
          model: PlatosModels,
          as: "plato",
          attributes: ["Id_Plato", "Nom_Plato", "Img_Plato", "Des_Plato"]
        },
        {
          model: PlatosModels,
          as: "bebida",
          attributes: ["Id_Plato", "Nom_Plato", "Img_Plato", "Des_Plato", "Subtipo_Bebida"]
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

    await this.ValidarCancelacionPermitida(Reserva.Tip_Reserva, Reserva.Fec_Reserva);
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

    dispararCicloSyncDebounced();
    return true;
  }
}

export default new ReservasServices();