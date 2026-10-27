// Node/Services/PqrsfService.js
// Servicio integral del modulo PQRSF para Foodsys (SENA - Centro Agropecuario "La Granja")
// Implementa matriz de prioridad, calculo de SLA, radicado unico,
// termometro de interventoria, ranking de frecuencia, y exportacion dual (Excel y PDF).
// Comentado didacticamente sin tildes ni emojis para aprendices de primer semestre.

import crypto from "crypto";
import { Op, fn, col, literal } from "sequelize";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import PqrsfModel from "../Models/PqrsfModel.js";
import UsuariosModel from "../Models/UsuariosModel.js";
import PlatosModels from "../Models/PlatosModels.js";
import NotificacionesService from "./NotificacionesService.js";
import Servicio_Correo from "./Servicio_Correo.js";
import db from "../Database/db.js";
import { encolarEventoSync } from "./SyncOutboxService.js";
import { obtenerFechaColombia, obtenerFechaHoraColombia } from "../Utils/dateUtils.js";

class PqrsfService {
  /**
   * Calcula el nivel de prioridad, puntaje (1-100) y tiempo de SLA en horas segun las reglas del SENA
   */
  calcularMatrizPrioridad(tipoSolicitud, categoria, subcategoria, descripcion = "") {
    const textoCompleto = `${subcategoria} ${descripcion}`.toLowerCase();

    // 1. Felicitaciones y reconocimientos
    if (tipoSolicitud === "Felicitacion" || categoria === "RECONOCIMIENTO") {
      return { nivel: "POSITIVA", puntaje: 20, slaHoras: 72 };
    }

    // 2. Calidad de alimentacion
    if (categoria === "CALIDAD_ALIMENTACION") {
      const esCritico = /mal estado|descomposicion|cruda|crudo|higiene|inocuidad|objeto extrano|cuerpo extrano|gusano|insecto|pelos|olor fetido/i.test(textoCompleto);
      if (esCritico) {
        return { nivel: "CRITICA", puntaje: 98, slaHoras: 4 };
      }
      return { nivel: "ALTA", puntaje: 80, slaHoras: 24 };
    }

    // 3. Estado de plato y menaje
    if (categoria === "ESTADO_PLATO_MENAJE") {
      return { nivel: "ALTA", puntaje: 80, slaHoras: 24 };
    }

    // 4. Atencion y servicio
    if (categoria === "ATENCION_SERVICIO") {
      const esGrave = /groseria|agresion|insulto|maltrato|discriminacion/i.test(textoCompleto);
      if (esGrave) {
        return { nivel: "ALTA", puntaje: 85, slaHoras: 24 };
      }
      return { nivel: "MEDIA", puntaje: 65, slaHoras: 48 };
    }

    // 5. Mobiliario, mesas y sillas
    if (categoria === "MOBILIARIO_MESAS_SILLAS") {
      return { nivel: "MEDIA", puntaje: 65, slaHoras: 48 };
    }

    // 6. Plataforma de reservas
    if (categoria === "PLATAFORMA_RESERVAS") {
      return { nivel: "MEDIA", puntaje: 50, slaHoras: 48 };
    }

    // 7. Sugerencias o peticiones generales
    if (tipoSolicitud === "Sugerencia" || tipoSolicitud === "Peticion") {
      return { nivel: "BAJA", puntaje: 35, slaHoras: 72 };
    }

    // Por defecto
    return { nivel: "MEDIA", puntaje: 50, slaHoras: 48 };
  }

  /**
   * Genera un numero de radicado unico secuencial para el mes en curso (PQRS-YYYYMM-XXXX)
   */
  async generarRadicadoUnico() {
    const hoyStr = obtenerFechaColombia();
    const prefijo = `PQRS-${hoyStr.slice(0, 7).replace("-", "")}`;

    const conteo = await PqrsfModel.count({
      where: {
        Radicado: { [Op.like]: `${prefijo}-%` }
      }
    });

    const consecutivo = String(conteo + 1).padStart(4, "0");
    return `${prefijo}-${consecutivo}`;
  }

  /**
   * Registra una nueva PQRSF en la base de datos, encola para sincronizacion
   * y envia notificaciones por correo y campanita interna
   */
  async crearPqrsf(datos, archivoBuffer = null, archivoNombre = null) {
    const {
      Id_Usuario = null,
      Id_Reserva = null,
      Nombre_Reportante = null,
      Correo_Reportante = null,
      Rol_Reportante = "Aprendiz",
      Tipo_Solicitud = "Queja",
      Categoria_Estandar = "CALIDAD_ALIMENTACION",
      Subcategoria = "General",
      Persona_Servicio_Ref = null,
      Fec_Hecho = obtenerFechaColombia(),
      Tip_Comida = "Almuerzo",
      Id_Plato_Relacionado = null,
      Calificacion_Servicio = null,
      Descripcion = ""
    } = datos;

    if (!Descripcion || Descripcion.trim().length < 5) {
      throw new Error("La descripcion de la solicitud debe tener al menos 5 caracteres.");
    }

    // Calcular matriz de prioridad y SLA
    const matriz = this.calcularMatrizPrioridad(Tipo_Solicitud, Categoria_Estandar, Subcategoria, Descripcion);
    const radicado = await this.generarRadicadoUnico();
    const uuidPqrsf = crypto.randomUUID();

    // Calcular fecha limite de SLA
    const fechaLimiteSLA = new Date();
    fechaLimiteSLA.setHours(fechaLimiteSLA.getHours() + matriz.slaHoras);

    // Guardar en MySQL
    const nuevaPqrsf = await PqrsfModel.create({
      uuid_pqrsf: uuidPqrsf,
      Radicado: radicado,
      Id_Usuario,
      Id_Reserva,
      Nombre_Reportante: Nombre_Reportante || "Anonimo / No especificado",
      Correo_Reportante: Correo_Reportante || null,
      Rol_Reportante,
      Tipo_Solicitud,
      Categoria_Estandar,
      Subcategoria,
      Persona_Servicio_Ref: Persona_Servicio_Ref || null,
      Fec_Hecho,
      Tip_Comida,
      Id_Plato_Relacionado,
      Nivel_Prioridad: matriz.nivel,
      Puntaje_Prioridad: matriz.puntaje,
      Sla_Horas: matriz.slaHoras,
      Calificacion_Servicio: Calificacion_Servicio ? Number(Calificacion_Servicio) : null,
      Descripcion,
      Archivo_Evidencia: archivoNombre || null,
      Estado_Pqrsf: "Abierta",
      Fecha_Limite_SLA: fechaLimiteSLA,
      nodo_origen: process.env.NODE_ROLE || "LOCAL",
      sync_status: "PENDING"
    });

    // Encolar evento en sync_outbox
    await encolarEventoSync({
      entidad: "PQRSF",
      operacion: "CREATE",
      entity_uuid: uuidPqrsf,
      payload: nuevaPqrsf.toJSON()
    });

    // Evaluar termometro de interventoria (3 o mas quejas sobre el mismo plato/turno)
    let alertaTermometro = false;
    if (Id_Plato_Relacionado && ["Queja", "Reclamo"].includes(Tipo_Solicitud)) {
      const quejasPlatoHoy = await PqrsfModel.count({
        where: {
          Id_Plato_Relacionado,
          Fec_Hecho,
          Tip_Comida,
          Tipo_Solicitud: { [Op.in]: ["Queja", "Reclamo"] }
        }
      });

      if (quejasPlatoHoy >= 3) {
        alertaTermometro = true;
        const plato = await PlatosModels.findByPk(Id_Plato_Relacionado);
        const nomPlato = plato ? plato.Nom_Plato : "Plato en turno";

        // Notificar de inmediato al Administrador, Bienestar y Supervisor
        await NotificacionesService.crearNotificacion({
          Id_Usuario: null,
          Rol_Destino: "Administrador",
          Titulo: "ALERTA INTERVENTORIA: Multiples Quejas de Comida",
          Mensaje: `El plato "${nomPlato}" en el turno de ${Tip_Comida} ha acumulado ${quejasPlatoHoy} quejas hoy. Se requiere verificacion urgente en cocina.`,
          Tipo: "advertencia"
        });
        await NotificacionesService.crearNotificacion({
          Id_Usuario: null,
          Rol_Destino: "Bienestar",
          Titulo: "ALERTA INTERVENTORIA: Multiples Quejas de Comida",
          Mensaje: `El plato "${nomPlato}" en el turno de ${Tip_Comida} ha acumulado ${quejasPlatoHoy} quejas hoy.`,
          Tipo: "advertencia"
        });
      }
    }

    // Notificacion por correo a fierrokkevin@gmail.com
    try {
      const adjuntos = [];
      if (archivoBuffer && archivoNombre) {
        adjuntos.push({
          filename: archivoNombre,
          content: archivoBuffer
        });
      }

      await Servicio_Correo.enviarCorreo({
        to: "fierrokkevin@gmail.com",
        subject: `[PQRSF ${radicado}] ${Tipo_Solicitud.toUpperCase()} - ${Categoria_Estandar} (${matriz.nivel})`,
        text: `Se ha registrado una nueva PQRSF en Foodsys.\n\n` +
          `Radicado: ${radicado}\n` +
          `Tipo: ${Tipo_Solicitud}\n` +
          `Prioridad: ${matriz.nivel} (SLA: ${matriz.slaHoras} horas)\n` +
          `Reportante: ${Nombre_Reportante || 'Anonimo'} (${Rol_Reportante})\n` +
          `Categoria: ${Categoria_Estandar} / ${Subcategoria}\n` +
          `Comida: ${Tip_Comida} del ${Fec_Hecho}\n\n` +
          `Descripcion:\n${Descripcion}\n\n` +
          (Persona_Servicio_Ref ? `Persona del servicio referenciada: ${Persona_Servicio_Ref}\n` : '') +
          (alertaTermometro ? `\n¡ALERTA DE INTERVENTORIA ACTIVADA PARA ESTE TURNO!` : '') +
          `\nAtentamente,\nSistema Foodsys - Centro Agropecuario "La Granja"`,
        attachments: adjuntos
      });
    } catch (errCorreo) {
      console.warn("[PqrsfService] Nota al enviar correo de PQRSF:", errCorreo.message);
    }

    return {
      mensaje: "PQRSF radicada exitosamente",
      radicado,
      nivelPrioridad: matriz.nivel,
      slaHoras: matriz.slaHoras,
      fechaLimiteSLA,
      alertaTermometro,
      pqrsf: nuevaPqrsf
    };
  }

  /**
   * Responde o actualiza el estado de una PQRSF
   */
  async responderPqrsf(idPqrsf, idResponsable, respuesta, nuevoEstado = "Respondida") {
    const pqrsf = await PqrsfModel.findByPk(idPqrsf);
    if (!pqrsf) throw new Error("PQRSF no encontrada");

    await pqrsf.update({
      Estado_Pqrsf: nuevoEstado,
      Respuesta_Administracion: respuesta,
      Id_Responsable_Respuesta: idResponsable,
      Fecha_Respuesta: new Date()
    });

    await encolarEventoSync({
      entidad: "PQRSF",
      operacion: "UPDATE",
      entity_uuid: pqrsf.uuid_pqrsf,
      payload: {
        uuid_pqrsf: pqrsf.uuid_pqrsf,
        Radicado: pqrsf.Radicado,
        Estado_Pqrsf: nuevoEstado,
        Respuesta_Administracion: respuesta,
        Id_Responsable_Respuesta: idResponsable,
        Fecha_Respuesta: pqrsf.Fecha_Respuesta
      }
    });

    // Enviar correo de respuesta al reportante si suministro correo
    if (pqrsf.Correo_Reportante) {
      try {
        await Servicio_Correo.enviarCorreo({
          to: pqrsf.Correo_Reportante,
          subject: `Respuesta a su solicitud ${pqrsf.Radicado} - Foodsys SENA`,
          text: `Estimado(a) ${pqrsf.Nombre_Reportante},\n\n` +
            `Le informamos que su solicitud con radicado ${pqrsf.Radicado} ha sido atendida por la Administracion del Centro Agropecuario "La Granja".\n\n` +
            `Respuesta institucional:\n${respuesta}\n\n` +
            `Gracias por contribuir a la mejora continua del servicio de alimentacion.\n\n` +
            `Oficina de Bienestar al Aprendiz - Foodsys`
        });
      } catch (e) {
        console.warn("[PqrsfService] No se pudo enviar correo de respuesta al reportante:", e.message);
      }
    }

    return pqrsf;
  }

  /**
   * Obtiene listado filtrado con paginacion para el panel administrativo
   */
  async listarPqrsf(filtros = {}) {
    const {
      estado,
      categoria,
      prioridad,
      tipo,
      fechaInicio,
      fechaFin,
      busqueda,
      limit = 50,
      offset = 0
    } = filtros;

    const where = {};

    if (estado && estado !== "Todos") where.Estado_Pqrsf = estado;
    if (categoria && categoria !== "Todas") where.Categoria_Estandar = categoria;
    if (prioridad && prioridad !== "Todas") where.Nivel_Prioridad = prioridad;
    if (tipo && tipo !== "Todos") where.Tipo_Solicitud = tipo;

    if (fechaInicio && fechaFin) {
      where.Fec_Hecho = { [Op.between]: [fechaInicio, fechaFin] };
    } else if (fechaInicio) {
      where.Fec_Hecho = { [Op.gte]: fechaInicio };
    }

    if (busqueda) {
      where[Op.or] = [
        { Radicado: { [Op.like]: `%${busqueda}%` } },
        { Nombre_Reportante: { [Op.like]: `%${busqueda}%` } },
        { Descripcion: { [Op.like]: `%${busqueda}%` } },
        { Subcategoria: { [Op.like]: `%${busqueda}%` } }
      ];
    }

    const { count, rows } = await PqrsfModel.findAndCountAll({
      where,
      include: [
        {
          model: UsuariosModel,
          as: "usuario",
          attributes: ["Id_Usuario", "Nom_Usuario", "Ape_Usuario", "NumDoc_Usuario"],
          required: false
        },
        {
          model: PlatosModels,
          as: "platoRelacionado",
          attributes: ["Id_Plato", "Nom_Plato", "Img_Plato"],
          required: false
        }
      ],
      order: [
        ["Puntaje_Prioridad", "DESC"],
        ["Fecha_Limite_SLA", "ASC"],
        ["createdAt", "DESC"]
      ],
      limit: Number(limit) || 50,
      offset: Number(offset) || 0
    });

    return { total: count, pqrsf: rows };
  }

  /**
   * Genera el ranking ("banking") de causas mas frecuentes de quejas y reclamos
   */
  async obtenerRankingFrecuencia(fechaInicio = null, fechaFin = null) {
    const where = {};
    if (fechaInicio && fechaFin) {
      where.Fec_Hecho = { [Op.between]: [fechaInicio, fechaFin] };
    }

    // 1. Top causas frecuentes agrupadas por categoria y subcategoria
    const topCausas = await PqrsfModel.findAll({
      attributes: [
        "Categoria_Estandar",
        "Subcategoria",
        "Tipo_Solicitud",
        [fn("COUNT", col("Id_Pqrsf")), "totalReportes"],
        [fn("AVG", col("Puntaje_Prioridad")), "prioridadPromedio"],
        [fn("AVG", col("Calificacion_Servicio")), "calificacionPromedio"]
      ],
      where,
      group: ["Categoria_Estandar", "Subcategoria", "Tipo_Solicitud"],
      order: [[literal("totalReportes"), "DESC"]],
      limit: 10,
      raw: true
    });

    // 2. Resumen por categoria estandar
    const resumenCategorias = await PqrsfModel.findAll({
      attributes: [
        "Categoria_Estandar",
        [fn("COUNT", col("Id_Pqrsf")), "total"],
        [fn("SUM", literal("CASE WHEN Estado_Pqrsf IN ('Abierta', 'En Revision') THEN 1 ELSE 0 END")), "pendientes"],
        [fn("SUM", literal("CASE WHEN Estado_Pqrsf IN ('Respondida', 'Cerrada') THEN 1 ELSE 0 END")), "resueltas"]
      ],
      where,
      group: ["Categoria_Estandar"],
      raw: true
    });

    // 3. Platos con mas reportes negativos
    const platosNegativos = await PqrsfModel.findAll({
      attributes: [
        "Id_Plato_Relacionado",
        [fn("COUNT", col("Id_Pqrsf")), "totalQuejas"],
        [fn("AVG", col("Calificacion_Servicio")), "promedioEstrellas"]
      ],
      where: {
        ...where,
        Id_Plato_Relacionado: { [Op.ne]: null },
        Tipo_Solicitud: { [Op.in]: ["Queja", "Reclamo"] }
      },
      include: [
        {
          model: PlatosModels,
          as: "platoRelacionado",
          attributes: ["Nom_Plato"]
        }
      ],
      group: ["Id_Plato_Relacionado", "platoRelacionado.Id_Plato", "platoRelacionado.Nom_Plato"],
      order: [[literal("totalQuejas"), "DESC"]],
      limit: 5,
      raw: true,
      nest: true
    });

    // 4. Totales generales
    const totalPqrsf = await PqrsfModel.count({ where });
    const totalPendientes = await PqrsfModel.count({
      where: { ...where, Estado_Pqrsf: { [Op.in]: ["Abierta", "En Revision"] } }
    });
    const totalCriticas = await PqrsfModel.count({
      where: { ...where, Nivel_Prioridad: "CRITICA", Estado_Pqrsf: { [Op.in]: ["Abierta", "En Revision"] } }
    });

    return {
      totalPqrsf,
      totalPendientes,
      totalCriticas,
      totales: {
        total: totalPqrsf,
        pendientes: totalPendientes,
        criticasPendientes: totalCriticas
      },
      topCausasFrecuentes: topCausas.map(t => {
        const total = Number(t.totalReportes) || 0;
        const porcentaje = totalPqrsf > 0 ? Number(((total / totalPqrsf) * 100).toFixed(1)) : 0;
        const impacto = Math.round(Number(t.prioridadPromedio || 50));
        const cat = t.Categoria_Estandar || "General";
        const sub = t.Subcategoria || "General";
        return {
          categoria: cat,
          Categoria_Estandar: cat,
          subcategoria: sub,
          Subcategoria: sub,
          tipo: t.Tipo_Solicitud,
          Tipo_Solicitud: t.Tipo_Solicitud,
          total: total,
          totalReportes: total,
          porcentaje: porcentaje,
          prioridadPromedio: impacto,
          impactoPromedio: impacto,
          impacto_promedio: impacto,
          calificacionPromedio: t.calificacionPromedio ? Number(Number(t.calificacionPromedio).toFixed(1)) : null
        };
      }),
      resumenCategorias: resumenCategorias.map(r => {
        const cat = r.Categoria_Estandar || "General";
        return {
          categoria: cat,
          Categoria_Estandar: cat,
          total: Number(r.total) || 0,
          pendientes: Number(r.pendientes || 0),
          resueltas: Number(r.resueltas || 0)
        };
      }),
      platosConMasQuejas: platosNegativos.map(p => ({
        idPlato: p.Id_Plato_Relacionado,
        nombrePlato: p.platoRelacionado?.Nom_Plato || "Plato no identificado",
        totalQuejas: Number(p.totalQuejas),
        promedioEstrellas: p.promedioEstrellas ? Number(Number(p.promedioEstrellas).toFixed(1)) : null
      }))
    };
  }

  /**
   * Genera el libro Excel con 2 hojas: Ranking de frecuencia y Detalle nominal
   */
  async generarExcelPqrsf(filtros = {}) {
    const ranking = await this.obtenerRankingFrecuencia(filtros.fechaInicio, filtros.fechaFin);
    const detalle = await this.listarPqrsf({ ...filtros, limit: 10000, offset: 0 });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Foodsys - Centro Agropecuario La Granja";
    workbook.created = new Date();

    // ─────────────────────────────────────────────────────────────
    // HOJA 1: RANKING DE FRECUENCIA ("BANKING")
    // ─────────────────────────────────────────────────────────────
    const hoja1 = workbook.addWorksheet("1. Ranking Frecuencia PQRSF");
    hoja1.views = [{ showGridLines: true }];

    // Encabezado institucional
    hoja1.mergeCells("A1:E1");
    hoja1.getCell("A1").value = 'CENTRO AGROPECUARIO "LA GRANJA" - EL ESPINAL TOLIMA';
    hoja1.getCell("A1").font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
    hoja1.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A58CA" } };
    hoja1.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
    hoja1.getRow(1).height = 28;

    hoja1.mergeCells("A2:E2");
    hoja1.getCell("A2").value = `RANKING DE FRECUENCIA DE PQRSF - FECHA EMISION: ${obtenerFechaHoraColombia()}`;
    hoja1.getCell("A2").font = { bold: true, size: 11, color: { argb: "FF333333" } };
    hoja1.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };
    hoja1.getRow(2).height = 20;

    // Tabla 1: Top causas mas frecuentes
    hoja1.addRow([]);
    hoja1.addRow(["TOP PROBLEMÁTICAS MÁS RECURRENTES EN EL SERVICIO"]);
    hoja1.getCell("A4").font = { bold: true, size: 11, color: { argb: "FF0A58CA" } };

    const filaEncabezados1 = hoja1.addRow(["Categoría", "Subcategoría / Causa", "Tipo", "Total Casos", "Impacto Promedio (1-100)"]);
    filaEncabezados1.eachCell(c => {
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF198754" } };
      c.alignment = { horizontal: "center" };
    });

    ranking.topCausasFrecuentes.forEach(c => {
      hoja1.addRow([c.categoria, c.subcategoria, c.tipo, c.totalReportes, c.prioridadPromedio]);
    });

    // Tabla 2: Resumen por categorias principales
    hoja1.addRow([]);
    hoja1.addRow(["RESUMEN DE ESTADO POR CATEGORÍA"]);
    hoja1.lastRow.font = { bold: true, size: 11, color: { argb: "FF0A58CA" } };

    const filaEncabezados2 = hoja1.addRow(["Categoría Estándar", "Total Registros", "Pendientes (Abiertas/Revisión)", "Resueltas"]);
    filaEncabezados2.eachCell(c => {
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D6EFD" } };
      c.alignment = { horizontal: "center" };
    });

    ranking.resumenCategorias.forEach(r => {
      hoja1.addRow([r.categoria, r.total, r.pendientes, r.resueltas]);
    });

    // Autoajustar anchos hoja 1
    hoja1.columns.forEach(col => {
      let maxLen = 12;
      col.eachCell({ includeEmpty: false }, cell => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.min(maxLen + 3, 40);
    });

    // ─────────────────────────────────────────────────────────────
    // HOJA 2: DETALLE NOMINAL DE PQRSF
    // ─────────────────────────────────────────────────────────────
    const hoja2 = workbook.addWorksheet("2. Detalle Nominal PQRSF");
    hoja2.views = [{ showGridLines: true }];

    const encabezadosDetalle = [
      "Radicado", "Fecha Hecho", "Prioridad", "Puntaje", "SLA (Horas)",
      "Tipo", "Categoría", "Subcategoría", "Comida", "Persona Ref.",
      "Reportante", "Rol", "Estado", "Descripción", "Respuesta Administración"
    ];

    const filaEncNominal = hoja2.addRow(encabezadosDetalle);
    filaEncNominal.eachCell(c => {
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF212529" } };
      c.alignment = { horizontal: "center" };
    });

    detalle.pqrsf.forEach(p => {
      hoja2.addRow([
        p.Radicado,
        p.Fec_Hecho,
        p.Nivel_Prioridad,
        p.Puntaje_Prioridad,
        p.Sla_Horas,
        p.Tipo_Solicitud,
        p.Categoria_Estandar,
        p.Subcategoria,
        p.Tip_Comida,
        p.Persona_Servicio_Ref || "N/A",
        p.Nombre_Reportante || "Anónimo",
        p.Rol_Reportante || "Aprendiz",
        p.Estado_Pqrsf,
        p.Descripcion,
        p.Respuesta_Administracion || "Pendiente de respuesta"
      ]);
    });

    hoja2.columns.forEach(col => {
      let maxLen = 10;
      col.eachCell({ includeEmpty: false }, cell => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.min(maxLen + 3, 50);
    });

    return await workbook.xlsx.writeBuffer();
  }

  /**
   * Genera el Acta Ejecutiva e Informe de Interventoria en PDF
   */
  async generarPdfPqrsf(filtros = {}) {
    const ranking = await this.obtenerRankingFrecuencia(filtros.fechaInicio, filtros.fechaFin);
    const detalle = await this.listarPqrsf({ ...filtros, limit: 100, offset: 0 });

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: "LETTER" });
        const chunks = [];

        doc.on("data", chunk => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", err => reject(err));

        // Encabezado institucional
        doc.rect(40, 40, 532, 50).fill("#0a58ca");
        doc.fillColor("#ffffff").fontSize(13).text('CENTRO AGROPECUARIO "LA GRANJA" - SENA ESPINAL', 40, 48, { align: "center" });
        doc.fontSize(10).text("ACTA EJECUTIVA E INFORME DE INTERVENTORIA DE PQRSF", 40, 66, { align: "center" });

        doc.moveDown(2);
        doc.fillColor("#333333").fontSize(9);
        doc.text(`Fecha de generacion: ${obtenerFechaHoraColombia()}`, 40, 100);
        doc.text(`Total solicitudes en el periodo: ${ranking.totales.total} | Casos pendientes: ${ranking.totales.pendientes} | Casos criticos urgentes: ${ranking.totales.criticasPendientes}`, 40, 114);

        // Seccion 1: Top causas frecuentes
        doc.moveDown(1.5);
        doc.fillColor("#0a58ca").fontSize(11).text("1. TOP PROBLEMÁTICAS Y CAUSAS MÁS FRECUENTES (RANKING)", 40, 135);
        doc.strokeColor("#cccccc").lineWidth(1).moveTo(40, 150).lineTo(572, 150).stroke();

        let y = 160;
        doc.fillColor("#000000").fontSize(8);
        doc.text("Categoria", 40, y, { bold: true });
        doc.text("Subcategoria", 170, y, { bold: true });
        doc.text("Tipo", 340, y, { bold: true });
        doc.text("Total", 430, y, { bold: true });
        doc.text("Prioridad", 490, y, { bold: true });

        y += 14;
        doc.strokeColor("#eeeeee").moveTo(40, y).lineTo(572, y).stroke();
        y += 6;

        ranking.topCausasFrecuentes.slice(0, 5).forEach(c => {
          doc.fillColor("#444444").fontSize(8);
          doc.text(c.categoria, 40, y, { width: 125 });
          doc.text(c.subcategoria, 170, y, { width: 165 });
          doc.text(c.tipo, 340, y);
          doc.text(String(c.totalReportes), 430, y);
          doc.text(`${c.prioridadPromedio} pts`, 490, y);
          y += 18;
        });

        // Seccion 2: Platos con mas reportes
        y += 10;
        doc.fillColor("#0a58ca").fontSize(11).text("2. PLATOS CON MAYOR NÚMERO DE QUEJAS (EVALUACIÓN DE COCINA)", 40, y);
        y += 15;
        doc.strokeColor("#cccccc").lineWidth(1).moveTo(40, y).lineTo(572, y).stroke();
        y += 10;

        ranking.platosConMasQuejas.forEach(p => {
          doc.fillColor("#333333").fontSize(8);
          doc.text(`• ${p.nombrePlato}: ${p.totalQuejas} quejas registradas (Calificacion promedio: ${p.promedioEstrellas || 'N/A'} estrellas)`, 45, y);
          y += 14;
        });

        // Seccion 3: Casos prioritarios recientes
        y += 15;
        doc.fillColor("#0a58ca").fontSize(11).text("3. CASOS DE ALTA PRIORIDAD RECIENTES PENDIENTES DE ATENCIÓN", 40, y);
        y += 15;
        doc.strokeColor("#cccccc").lineWidth(1).moveTo(40, y).lineTo(572, y).stroke();
        y += 10;

        const criticos = detalle.pqrsf.filter(p => ["CRITICA", "ALTA"].includes(p.Nivel_Prioridad)).slice(0, 4);
        criticos.forEach(p => {
          doc.fillColor("#b02a37").fontSize(8).text(`[${p.Nivel_Prioridad}] Radicado: ${p.Radicado} (${p.Tipo_Solicitud}) - ${p.Fec_Hecho}`, 45, y);
          y += 12;
          doc.fillColor("#444444").fontSize(8).text(`Motivo: ${p.Subcategoria}. ${p.Descripcion.slice(0, 140)}...`, 55, y);
          y += 16;
        });

        // Espacio para firmas institucionales
        y = Math.max(y + 30, 640);
        doc.strokeColor("#666666").lineWidth(1).moveTo(60, y).lineTo(230, y).stroke();
        doc.strokeColor("#666666").lineWidth(1).moveTo(360, y).lineTo(530, y).stroke();
        doc.fillColor("#333333").fontSize(9);
        doc.text("Coordinacion de Bienestar al Aprendiz", 60, y + 6, { align: "center", width: 170 });
        doc.text("Interventoria Contrato de Alimentacion", 360, y + 6, { align: "center", width: 170 });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

export default new PqrsfService();
