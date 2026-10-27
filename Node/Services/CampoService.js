// Node/Services/CampoService.js
// Servicio de negocio para el modulo "Guardar Almuerzo por Jornada de Campo (Fichas / SENA Empresa)"
// Permite a Instructores, Voceros, SENA Empresa, Bienestar, Coordinacion y Admin registrar solicitudes
// de almuerzos guardados con hora extendida para evitar inasistencias injustificadas.

import { Op } from "sequelize";
import db from "../Database/db.js";
import { v4 as uuidv4 } from "uuid";
import SolicitudesCampoModel from "../Models/SolicitudesCampoModel.js";
import ReservaModel from "../Models/ReservasModel.js";
import UsuariosModel from "../Models/UsuariosModel.js";
import FichasModel from "../Models/FichasModel.js";
import ProgramaModel from "../Models/ProgramaModel.js";
import PlatosModel from "../Models/PlatosModels.js";
import NotificacionesModel from "../Models/NotificacionesModel.js";
import { encolarEventoSync } from "./SyncOutboxService.js";
import { obtenerFechaColombia } from "../Utils/dateUtils.js";

class CampoService {

  // Obtiene la hora actual formateada HH:mm:ss en zona horaria America/Bogota
  obtenerHoraBogota() {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Bogota",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(new Date());
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. OBTENER APRENDICES DE LA FICHA CON RESERVA DE ALMUERZO
  // ─────────────────────────────────────────────────────────────────────────────
  async obtenerAprendicesFichaAlmuerzo(numFicha, fechaServicio) {
    if (!numFicha) throw new Error("Debe ingresar el numero de ficha");
    const fecha = fechaServicio || obtenerFechaColombia();

    const ficha = await FichasModel.findOne({
      where: { Num_Ficha: String(numFicha).trim() },
      include: [{ model: ProgramaModel, as: "programas", attributes: ["Nom_Programa"] }]
    });

    if (!ficha) {
      throw new Error(`La ficha #${numFicha} no fue encontrada en la base de datos.`);
    }

    // Consultar todos los aprendices activos de la ficha
    const aprendices = await UsuariosModel.findAll({
      where: {
        Id_Ficha: ficha.Id_Ficha,
        Est_Usuario: { [Op.ne]: "Inactivo" }
      },
      attributes: ["Id_Usuario", "Nom_Usuario", "Ape_Usuario", "NumDoc_Usuario", "TipDoc_Usuario", "Tel_Usuario", "Cor_Usuario", "CenCon_Usuario", "Est_Usuario"],
      order: [["Ape_Usuario", "ASC"]]
    });

    const idsAprendices = aprendices.map(a => a.Id_Usuario);

    // Consultar reservas activas de almuerzo de estos aprendices para la fecha seleccionada
    const reservasAlmuerzo = await ReservaModel.findAll({
      where: {
        Id_Usuario: { [Op.in]: idsAprendices },
        Fec_Reserva: fecha,
        Tip_Reserva: "Almuerzo",
        Est_Reserva: { [Op.in]: ["Generado", "Verificado", "Pendiente"] }
      },
      include: [
        { model: PlatosModel, as: "plato", attributes: ["Id_Plato", "Nom_Plato", "Img_Plato"] },
        { model: PlatosModel, as: "bebida", attributes: ["Id_Plato", "Nom_Plato", "Subtipo_Bebida"] }
      ]
    });

    const mapaReservas = new Map();
    reservasAlmuerzo.forEach(r => {
      mapaReservas.set(r.Id_Usuario, r);
    });

    // Clasificar aprendices
    const aprendicesConReserva = [];
    const aprendicesSinReserva = [];

    aprendices.forEach(a => {
      const res = mapaReservas.get(a.Id_Usuario);
      const item = {
        Id_Usuario: a.Id_Usuario,
        NombreCompleto: `${a.Nom_Usuario || ""} ${a.Ape_Usuario || ""}`.trim(),
        NumDoc_Usuario: a.NumDoc_Usuario,
        TipDoc_Usuario: a.TipDoc_Usuario,
        Tel_Usuario: a.Tel_Usuario || "--",
        Cor_Usuario: a.Cor_Usuario || "--",
        CenCon_Usuario: a.CenCon_Usuario,
        Est_Usuario: a.Est_Usuario || "En Formacion",
        esTurnoSenaEmpresa: a.Est_Usuario === "Turno Sena Empresa" || a.Est_Usuario === "Sena Empresa",
        tieneReserva: Boolean(res),
        Id_Reserva: res ? res.Id_Reserva : null,
        Est_Reserva: res ? res.Est_Reserva : null,
        Es_Guardado_Campo: res ? Boolean(res.Es_Guardado_Campo) : false,
        Id_Plato: res?.plato?.Id_Plato || null,
        Nom_Plato: res?.plato?.Nom_Plato || "Plato General",
        Id_Bebida: res?.bebida?.Id_Plato || null,
        Nom_Bebida: res?.bebida?.Nom_Plato || "Bebida General",
        Subtipo_Bebida: res?.bebida?.Subtipo_Bebida || "NINGUNA"
      };

      if (res) {
        aprendicesConReserva.push(item);
      } else {
        aprendicesSinReserva.push(item);
      }
    });

    return {
      ficha: {
        Id_Ficha: ficha.Id_Ficha,
        Num_Ficha: ficha.Num_Ficha,
        Nom_Programa: ficha.programas?.Nom_Programa || "Programa sin nombre asignado"
      },
      fechaServicio: fecha,
      totalAprendicesFicha: aprendices.length,
      totalConReserva: aprendicesConReserva.length,
      totalSinReserva: aprendicesSinReserva.length,
      aprendicesConReserva,
      aprendicesSinReserva
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. CREAR SOLICITUD DE ALMUERZO GUARDADO (ACTA OFICIAL)
  // ─────────────────────────────────────────────────────────────────────────────
  async crearSolicitudGuardadoCampo(datos, usuarioSolicitante) {
    const {
      Id_Ficha,
      Num_Ficha,
      Nom_Programa,
      Fec_Servicio,
      Unidad_Productiva,
      Detalle_Lugar_Practica,
      Justificacion,
      Hora_Estimada_Llegada,
      Modalidad_Guardado,
      idsReservasSeleccionadas
    } = datos;

    if (!Id_Ficha || !Num_Ficha) throw new Error("Ficha invalida");
    if (!Fec_Servicio) throw new Error("Fecha de servicio requerida");
    if (!Unidad_Productiva) throw new Error("Debe seleccionar la Unidad Productiva o SENA Empresa");
    if (!Detalle_Lugar_Practica || !Detalle_Lugar_Practica.trim()) throw new Error("Debe indicar el lugar o lote de la practica");
    if (!Justificacion || !Justificacion.trim()) throw new Error("La justificacion es obligatoria");
    if (!Array.isArray(idsReservasSeleccionadas) || idsReservasSeleccionadas.length === 0) {
      throw new Error("Debe seleccionar al menos un aprendiz con reserva de almuerzo para guardar.");
    }

    // Regla de horario limite: hasta las 11:00 AM del dia del servicio en America/Bogota
    const hoyBogota = obtenerFechaColombia();
    const horaActualBogota = this.obtenerHoraBogota();

    if (Fec_Servicio < hoyBogota) {
      throw new Error("No es posible registrar una solicitud para una fecha pasada.");
    }

    if (Fec_Servicio === hoyBogota && horaActualBogota > "11:00:00") {
      throw new Error("El horario limite para solicitar almuerzos guardados por jornada de campo es hasta las 11:00 AM del mismo dia.");
    }

    // Hora estimada maxima permitida: 15:00:00 (3:00 PM)
    const horaLimiteExtendida = Hora_Estimada_Llegada && Hora_Estimada_Llegada <= "15:00:00"
      ? Hora_Estimada_Llegada
      : "14:30:00";

    // Generar codigo de acta unico: CAMPO-YYYYMM-XXXX
    const prefijo = `CAMPO-${Fec_Servicio.replace(/-/g, "").substring(0, 6)}`;
    const conteoMes = await SolicitudesCampoModel.count({
      where: {
        Codigo_Acta: { [Op.like]: `${prefijo}-%` }
      }
    });
    const secuencia = String(conteoMes + 1).padStart(4, "0");
    const codigoActa = `${prefijo}-${secuencia}`;
    const uuidSolicitud = uuidv4();

    const t = await db.transaction();

    try {
      // 1. Crear el registro en solicitudes_guardado_campo
      const nuevaSolicitud = await SolicitudesCampoModel.create({
        uuid_solicitud: uuidSolicitud,
        Codigo_Acta: codigoActa,
        Id_Ficha,
        Num_Ficha,
        Nom_Programa: Nom_Programa || "SENA Centro Agropecuario La Granja",
        Fec_Servicio,
        Tip_Comida: "Almuerzo",
        Unidad_Productiva,
        Detalle_Lugar_Practica: Detalle_Lugar_Practica.trim(),
        Justificacion: Justificacion.trim(),
        Hora_Estimada_Llegada: horaLimiteExtendida,
        Modalidad_Guardado: Modalidad_Guardado || "GUARDAR_EN_COMEDOR",
        Total_Aprendices_Guardados: idsReservasSeleccionadas.length,
        Total_Almuerzos_Entregados: 0,
        Id_Usuario_Solicitante: usuarioSolicitante.Id_Usuario,
        Rol_Solicitante: usuarioSolicitante.Rol_Activo || "Instructor",
        Estado_Solicitud: "ACTIVA_GUARDADA"
      }, { transaction: t });

      // 2. Actualizar las reservas seleccionadas
      await ReservaModel.update({
        Es_Guardado_Campo: true,
        Id_Solicitud_Campo: nuevaSolicitud.Id_Solicitud_Campo,
        Hora_Limite_Extendida: horaLimiteExtendida,
        Justificacion_Campo: Justificacion.trim(),
        Unidad_Productiva_Campo: Unidad_Productiva
      }, {
        where: {
          Id_Reserva: { [Op.in]: idsReservasSeleccionadas }
        },
        transaction: t
      });

      // 3. Crear notificaciones internas para los aprendices
      const reservasAfectadas = await ReservaModel.findAll({
        where: { Id_Reserva: { [Op.in]: idsReservasSeleccionadas } },
        attributes: ["Id_Usuario"],
        transaction: t
      });

      for (const r of reservasAfectadas) {
        await NotificacionesModel.create({
          Id_Usuario: r.Id_Usuario,
          Titulo: "Almuerzo Guardado por Jornada de Campo",
          Mensaje: `Tu instructor/vocero ha registrado tu almuerzo para ser guardado hoy (${Unidad_Productiva}). Podras reclamarlo hasta las ${horaLimiteExtendida.substring(0, 5)}. No te preocupes, tu reserva no vencera a la 1:30 PM.`,
          Tipo: "INFO",
          Leido: 0
        }, { transaction: t });
      }

      await t.commit();

      // Encolar evento para sincronizacion con Hetzner
      await encolarEventoSync({
        entidad: "SOLICITUD_CAMPO",
        operacion: "CREATE",
        entity_uuid: uuidSolicitud,
        payload: {
          Codigo_Acta: codigoActa,
          Num_Ficha,
          Fec_Servicio,
          Unidad_Productiva,
          Total_Aprendices_Guardados: idsReservasSeleccionadas.length,
          Hora_Estimada_Llegada: horaLimiteExtendida
        }
      }).catch(() => {});

      return {
        mensaje: "Solicitud y acta de almuerzos guardados creada exitosamente.",
        solicitud: nuevaSolicitud,
        totalGuardados: idsReservasSeleccionadas.length,
        codigoActa
      };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. OBTENER LISTADO DE SOLICITUDES CON FILTROS
  // ─────────────────────────────────────────────────────────────────────────────
  async obtenerSolicitudes(filtros = {}) {
    const where = {};

    if (filtros.fecha) {
      where.Fec_Servicio = filtros.fecha;
    } else if (filtros.fechaInicio && filtros.fechaFin) {
      where.Fec_Servicio = { [Op.between]: [filtros.fechaInicio, filtros.fechaFin] };
    }

    if (filtros.unidad && filtros.unidad !== "TODAS") {
      where.Unidad_Productiva = filtros.unidad;
    }

    if (filtros.estado && filtros.estado !== "TODOS") {
      where.Estado_Solicitud = filtros.estado;
    }

    if (filtros.numFicha) {
      where.Num_Ficha = { [Op.like]: `%${filtros.numFicha}%` };
    }

    const solicitudes = await SolicitudesCampoModel.findAll({
      where,
      include: [
        {
          model: UsuariosModel,
          as: "solicitante",
          attributes: ["Id_Usuario", "Nom_Usuario", "Ape_Usuario", "NumDoc_Usuario", "Tel_Usuario"]
        }
      ],
      order: [["Fec_Servicio", "DESC"], ["createdAt", "DESC"]]
    });

    return solicitudes;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. OBTENER DETALLE NOMINAL DE UNA SOLICITUD
  // ─────────────────────────────────────────────────────────────────────────────
  async obtenerDetalleSolicitud(idSolicitud) {
    const solicitud = await SolicitudesCampoModel.findByPk(idSolicitud, {
      include: [
        {
          model: UsuariosModel,
          as: "solicitante",
          attributes: ["Id_Usuario", "Nom_Usuario", "Ape_Usuario", "NumDoc_Usuario", "Tel_Usuario", "Cor_Usuario"]
        }
      ]
    });

    if (!solicitud) throw new Error("Solicitud no encontrada");

    // Consultar las reservas vinculadas a esta solicitud
    const reservas = await ReservaModel.findAll({
      where: { Id_Solicitud_Campo: idSolicitud },
      include: [
        {
          model: UsuariosModel,
          as: "usuario",
          attributes: ["Id_Usuario", "Nom_Usuario", "Ape_Usuario", "NumDoc_Usuario", "TipDoc_Usuario", "Tel_Usuario", "Cor_Usuario", "CenCon_Usuario"]
        },
        { model: PlatosModel, as: "plato", attributes: ["Id_Plato", "Nom_Plato"] },
        { model: PlatosModel, as: "bebida", attributes: ["Id_Plato", "Nom_Plato", "Subtipo_Bebida"] }
      ],
      order: [["createdAt", "ASC"]]
    });

    const aprendices = reservas.map(r => ({
      Id_Reserva: r.Id_Reserva,
      Id_Usuario: r.usuario?.Id_Usuario,
      NombreCompleto: `${r.usuario?.Nom_Usuario || ""} ${r.usuario?.Ape_Usuario || ""}`.trim(),
      NumDoc: r.usuario?.NumDoc_Usuario || "--",
      TipDoc: r.usuario?.TipDoc_Usuario || "CC",
      CenCon_Usuario: r.usuario?.CenCon_Usuario || "No",
      Tel_Usuario: r.usuario?.Tel_Usuario || "--",
      Cor_Usuario: r.usuario?.Cor_Usuario || "--",
      Nom_Plato: r.plato?.Nom_Plato || "Plato no especificado",
      Nom_Bebida: r.bebida?.Nom_Plato || "Bebida no especificada",
      Subtipo_Bebida: r.bebida?.Subtipo_Bebida || "NINGUNA",
      Est_Reserva: r.Est_Reserva,
      Hora_Limite_Extendida: r.Hora_Limite_Extendida
    }));

    return {
      solicitud,
      aprendices
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. REGISTRAR ENTREGA DE ALMUERZO GUARDADO (INDIVIDUAL O LOTE)
  // ─────────────────────────────────────────────────────────────────────────────
  async entregarAlmuerzoGuardado(idSolicitud, idReserva = null) {
    const solicitud = await SolicitudesCampoModel.findByPk(idSolicitud);
    if (!solicitud) throw new Error("Solicitud no encontrada");

    const t = await db.transaction();

    try {
      if (idReserva) {
        // Entrega individual
        await ReservaModel.update(
          { Est_Reserva: "Consumido" },
          { where: { Id_Reserva: idReserva, Id_Solicitud_Campo: idSolicitud }, transaction: t }
        );
      } else {
        // Entrega grupal de todos los que faltan
        await ReservaModel.update(
          { Est_Reserva: "Consumido" },
          {
            where: {
              Id_Solicitud_Campo: idSolicitud,
              Est_Reserva: { [Op.ne]: "Consumido" }
            },
            transaction: t
          }
        );
      }

      // Recontar entregados reales
      const entregados = await ReservaModel.count({
        where: { Id_Solicitud_Campo: idSolicitud, Est_Reserva: "Consumido" },
        transaction: t
      });

      const total = solicitud.Total_Aprendices_Guardados;
      const nuevoEstado = entregados >= total
        ? "ENTREGADA_COMPLETA"
        : (entregados > 0 ? "ENTREGADA_PARCIAL" : "ACTIVA_GUARDADA");

      await solicitud.update({
        Total_Almuerzos_Entregados: entregados,
        Estado_Solicitud: nuevoEstado
      }, { transaction: t });

      await t.commit();

      return {
        mensaje: "Almuerzo(s) entregado(s) exitosamente.",
        entregados,
        total,
        estado: nuevoEstado
      };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. PROGRAMAR TURNOS DE ALMUERZO DE CAMPO PARA LA SEMANA (LUNES A VIERNES)
  // ─────────────────────────────────────────────────────────────────────────────
  async programarSemanaTurnoSenaEmpresa(datos, usuarioSolicitante = {}) {
    const { idFicha, idsUsuarios, fechaInicioLunes, unidadProductiva, detalleLugar, justificacion, modalidad } = datos;
    if (!idFicha || !Array.isArray(idsUsuarios) || idsUsuarios.length === 0) {
      throw new Error("Debe seleccionar la ficha y al menos un aprendiz para programar el turno semanal.");
    }

    const ficha = await FichasModel.findByPk(idFicha, {
      include: [{ model: ProgramaModel, as: "programas" }]
    });
    if (!ficha) throw new Error("Ficha no encontrada.");

    // Calcular dias de la semana (Lunes a Viernes) a partir de fechaInicioLunes
    const fechaBase = fechaInicioLunes ? new Date(fechaInicioLunes + "T12:00:00") : new Date();
    // Si no es lunes, retroceder al lunes de esa semana
    const diaSem = fechaBase.getDay(); // 0 = Domingo, 1 = Lunes
    const diffLunes = diaSem === 0 ? -6 : 1 - diaSem;
    const lunes = new Date(fechaBase);
    lunes.setDate(fechaBase.getDate() + diffLunes);

    const diasSemana = [];
    for (let i = 0; i < 5; i++) { // Lunes a Viernes
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      diasSemana.push(d.toISOString().slice(0, 10));
    }

    const t = await db.transaction();
    try {
      let totalReservasCreadas = 0;
      const solicitudesPorDia = [];

      for (const fServicio of diasSemana) {
        // 1. Obtener o crear plato generico para el almuerzo
        let platoAlm = await PlatosModel.findOne({ where: { Tip_Plato: "Almuerzo" }, transaction: t });
        if (!platoAlm) platoAlm = await PlatosModel.findOne({ transaction: t });

        const idsReservasDelDia = [];

        for (const idUsu of idsUsuarios) {
          const usuario = await UsuariosModel.findByPk(idUsu, { transaction: t });
          if (!usuario) continue;

          // Verificar si ya tiene reserva para este dia
          let resExistente = await ReservaModel.findOne({
            where: {
              Id_Usuario: idUsu,
              Fec_Reserva: fServicio,
              Tip_Reserva: "Almuerzo"
            },
            transaction: t
          });

          if (!resExistente) {
            const uuidR = uuidv4();
            resExistente = await ReservaModel.create({
              uuid_reserva: uuidR,
              nodo_origen: "LOCAL",
              Id_Usuario: idUsu,
              Fec_Reserva: fServicio,
              Vec_Reserva: `${fServicio} 14:30:00`,
              Tip_Reserva: "Almuerzo",
              Est_Reserva: "Generado",
              Qr_Reserva: `SENAGRANJA-CAMPO-${idUsu}-${fServicio}`,
              Id_Plato: platoAlm?.Id_Plato || 1,
              Tipo_Bebida: "FRIA",
              Lleva_Sopa: true,
              Es_Guardado_Campo: true,
              Hora_Limite_Extendida: "14:30:00",
              Justificacion_Campo: justificacion || "Turno SENA Empresa programado semanal",
              Unidad_Productiva_Campo: unidadProductiva || "SENA_EMPRESA_GENERAL"
            }, { transaction: t });
            totalReservasCreadas++;
          } else {
            await resExistente.update({
              Es_Guardado_Campo: true,
              Hora_Limite_Extendida: "14:30:00",
              Justificacion_Campo: justificacion || "Turno SENA Empresa programado semanal",
              Unidad_Productiva_Campo: unidadProductiva || "SENA_EMPRESA_GENERAL"
            }, { transaction: t });
          }

          idsReservasDelDia.push(resExistente.Id_Reserva);
        }

        // 2. Crear solicitud de guardado de campo para ese dia
        const conteoMes = await SolicitudesCampoModel.count({ transaction: t });
        const codigoActa = `CAMPO-${fServicio.replace(/-/g, "").slice(0, 6)}-${String(conteoMes + 1).padStart(4, "0")}`;
        const uuidSol = uuidv4();

        const nuevaSolicitud = await SolicitudesCampoModel.create({
          uuid_solicitud: uuidSol,
          Codigo_Acta: codigoActa,
          Id_Ficha: ficha.Id_Ficha,
          Num_Ficha: ficha.Num_Ficha,
          Nom_Programa: ficha.programas?.Nom_Programa || "Programa sin nombre asignado",
          Fec_Servicio: fServicio,
          Tip_Comida: "Almuerzo",
          Unidad_Productiva: unidadProductiva || "SENA_EMPRESA_GENERAL",
          Detalle_Lugar_Practica: detalleLugar || "Turno SENA Empresa Semana (Lunes a Viernes)",
          Justificacion: justificacion || "Turno semanal programado por SENA Empresa",
          Hora_Estimada_Llegada: "14:30:00",
          Modalidad_Guardado: modalidad || "GUARDAR_EN_COMEDOR",
          Total_Aprendices_Guardados: idsReservasDelDia.length,
          Total_Almuerzos_Entregados: 0,
          Id_Usuario_Solicitante: usuarioSolicitante.id || 1,
          Rol_Solicitante: usuarioSolicitante.rol || "SENA Empresa",
          Estado_Solicitud: "ACTIVA_GUARDADA"
        }, { transaction: t });

        // Asociar reservas a la solicitud creada
        await ReservaModel.update(
          { Id_Solicitud_Campo: nuevaSolicitud.Id_Solicitud_Campo },
          { where: { Id_Reserva: { [Op.in]: idsReservasDelDia } }, transaction: t }
        );

        solicitudesPorDia.push({ fecha: fServicio, codigoActa, total: idsReservasDelDia.length });
      }

      // Marcar usuarios con estado "Turno Sena Empresa" si no lo tienen
      await UsuariosModel.update(
        { Est_Usuario: "Turno Sena Empresa" },
        {
          where: {
            Id_Usuario: { [Op.in]: idsUsuarios },
            Est_Usuario: { [Op.ne]: "Instructor" }
          },
          transaction: t
        }
      );

      await t.commit();

      return {
        mensaje: "Turnos semanales de Almuerzo de Campo (Lunes a Viernes) programados exitosamente.",
        diasSemana,
        totalReservasCreadas,
        solicitudesPorDia
      };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}

export default new CampoService();
