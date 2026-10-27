// Node/Services/InternadoTemporalService.js
// Servicio de gestion para Aprendices Externos que pasan a Internado Temporal (Gestores SENA Empresa)
// Permite registro manual, importacion de Excel, aplicacion automatica de estados y reversion inteligente al vencer

import { Op } from "sequelize";
import xlsx from "xlsx";
import ExcelJS from "exceljs";
import db from "../Database/db.js";
import InternadoTemporalModel from "../Models/InternadoTemporalModel.js";
import UsuariosModel from "../Models/UsuariosModel.js";
import FichasModel from "../Models/FichasModel.js";
import NotificacionesModel from "../Models/NotificacionesModel.js";
import { obtenerFechaColombia } from "../Utils/dateUtils.js";
import "../Models/associations.js";

class InternadoTemporalService {

  /**
   * Parsea cualquier valor de fecha proveniente de Excel (numero serial, Date, string DD/MM/YYYY, YYYY-MM-DD o '202' truncado)
   */
  parsearFecha(val) {
    if (!val) return null;

    // Si ya es un objeto Date
    if (val instanceof Date) {
      if (isNaN(val.getTime())) return null;
      return val.toISOString().slice(0, 10);
    }

    // Si es numero serial de Excel
    if (typeof val === "number") {
      const fechaObj = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(fechaObj.getTime())) {
        return fechaObj.toISOString().slice(0, 10);
      }
    }

    const s = String(val).trim();
    if (!s) return null;

    // Caso de error comun en archivos de gestores: '23/10/202' -> corregir a '23/10/2026'
    let limpio = s;
    if (limpio.endsWith("/202") || limpio.endsWith("-202")) {
      limpio += "6";
    }

    // Formato DD/MM/YYYY o DD-MM-YYYY
    const ddmmyyyy = limpio.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (ddmmyyyy) {
      const dia = ddmmyyyy[1].padStart(2, "0");
      const mes = ddmmyyyy[2].padStart(2, "0");
      const anio = ddmmyyyy[3];
      return `${anio}-${mes}-${dia}`;
    }

    // Formato YYYY-MM-DD
    const yyyymmdd = limpio.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (yyyymmdd) {
      const anio = yyyymmdd[1];
      const mes = yyyymmdd[2].padStart(2, "0");
      const dia = yyyymmdd[3].padStart(2, "0");
      return `${anio}-${mes}-${dia}`;
    }

    const d = new Date(limpio);
    if (!isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }

    return null;
  }

  /**
   * Procesa e importa un archivo Excel con aprendices externos que pasan a internarse temporalmente.
   * Soporta tanto el formato oficial de Gestores SENA Empresa como la plantilla Foodsys.
   */
  async importarExcelSenaEmpresa(buffer, usuarioSolicitante = {}) {
    const parser = xlsx.default || xlsx;
    const wb = parser.read(buffer, { type: "buffer" });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows = parser.utils.sheet_to_json(ws, { header: 1 });

    if (!rows || rows.length < 2) {
      throw new Error("El archivo Excel esta vacio o no contiene filas de datos.");
    }

    // Localizar la fila de encabezados
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const rowStr = (rows[i] || []).map(c => String(c).toUpperCase()).join(" ");
      if (rowStr.includes("DOCUMENTO") || rowStr.includes("NOMBRES") || rowStr.includes("FICHA")) {
        headerRowIdx = i;
        break;
      }
    }

    const headers = (rows[headerRowIdx] || []).map(h => String(h || "").trim().toUpperCase());
    const dataRows = rows.slice(headerRowIdx + 1);

    // Mapear indices de columnas fijas de forma precisa
    const colDoc = headers.findIndex(h => 
      (h.includes("NUMERO") && h.includes("DOCUMENTO")) ||
      h.includes("NUM_DOC") ||
      h.includes("CEDULA") ||
      (h.includes("DOCUMENTO") && !h.includes("TIPO"))
    );
    const colTipoDoc = headers.findIndex(h => h.includes("TIPO") && h.includes("DOCUMENTO"));
    const colNom = headers.findIndex(h => h.includes("NOMBRE"));
    const colApe = headers.findIndex(h => h.includes("APELLIDO"));
    const colFicha = headers.findIndex(h => h.includes("FICHA"));
    const colUnidad = headers.findIndex(h => h.includes("UNDAD") || h.includes("UNIDAD"));

    if (colDoc === -1) {
      throw new Error("No se encontro la columna de 'NUMERO DE DOCUMENTO' en el archivo Excel.");
    }

    // Identificar pares de fechas de ingreso y salida
    const paresFechas = [];
    for (let c = 0; c < headers.length; c++) {
      const h = headers[c];
      if (h.includes("INGRESO") || h.includes("INICIO")) {
        // Buscar la columna de salida siguiente
        for (let next = c + 1; next < Math.min(c + 4, headers.length); next++) {
          const hn = headers[next];
          if (hn.includes("SALIDA") || hn.includes("FIN")) {
            paresFechas.push({ colIngreso: c, colSalida: next });
            c = next; // Avanzar
            break;
          }
        }
      }
    }

    // Si no encontro por encabezado, buscar columnas estandar de gestores (columnas 8-17)
    if (paresFechas.length === 0) {
      for (let c = 6; c < headers.length - 1; c += 2) {
        paresFechas.push({ colIngreso: c, colSalida: c + 1 });
      }
    }

    const hoy = obtenerFechaColombia();
    const resultados = {
      totalFilas: dataRows.length,
      creadosOActualizados: 0,
      activadosHoy: 0,
      programadosFuturo: 0,
      vencidosPasados: 0,
      noEncontradosEnBd: [],
      errores: [],
      detalles: []
    };

    // Procesar cada fila del Excel
    for (let rIdx = 0; rIdx < dataRows.length; rIdx++) {
      const row = dataRows[rIdx];
      if (!row || row.length === 0) continue;

      const docRaw = row[colDoc];
      if (!docRaw) continue;

      const numDocStr = String(docRaw).replace(/\D/g, "");
      if (!numDocStr) continue;

      const numDoc = BigInt(numDocStr);
      const nombres = (colNom !== -1 ? String(row[colNom] || "") : "").trim();
      const apellidos = (colApe !== -1 ? String(row[colApe] || "") : "").trim();
      const ficha = (colFicha !== -1 ? String(row[colFicha] || "") : "").replace(/\D/g, "");
      const unidad = (colUnidad !== -1 ? String(row[colUnidad] || "") : "SENA Empresa").trim() || "SENA Empresa";

      // Extraer todas las ventanas de fechas validas para este aprendiz
      const ventanas = [];
      for (const par of paresFechas) {
        const valIngreso = row[par.colIngreso];
        const valSalida = row[par.colSalida];

        const fInicio = this.parsearFecha(valIngreso);
        const fFin = this.parsearFecha(valSalida);

        if (fInicio && fFin) {
          ventanas.push({ fInicio, fFin });
        }
      }

      if (ventanas.length === 0) {
        continue; // No tiene turnos o fechas asignadas
      }

      // Buscar usuario en base de datos
      const usuario = await UsuariosModel.findOne({
        where: { NumDoc_Usuario: numDoc }
      });

      if (!usuario) {
        resultados.noEncontradosEnBd.push({
          numDoc: numDoc.toString(),
          nombre: `${nombres} ${apellidos}`.trim() || "Desconocido",
          ficha: ficha || "--",
          motivo: "El número de documento no existe en la base de datos de usuarios de Foodsys."
        });
        continue;
      }

      // Procesar cada ventana de internado temporal para este usuario
      let tieneTurnoActivoHoy = false;

      for (const ventana of ventanas) {
        const { fInicio, fFin } = ventana;
        if (fFin < fInicio) continue; // Rango invalido

        let estadoPeriodo = "PROGRAMADO";
        if (hoy >= fInicio && hoy <= fFin) {
          estadoPeriodo = "ACTIVO";
          tieneTurnoActivoHoy = true;
          resultados.activadosHoy++;
        } else if (hoy > fFin) {
          estadoPeriodo = "VENCIDO";
          resultados.vencidosPasados++;
        } else {
          estadoPeriodo = "PROGRAMADO";
          resultados.programadosFuturo++;
        }

        // Buscar si ya existe este registro para evitar duplicados exactos
        const existente = await InternadoTemporalModel.findOne({
          where: {
            Id_Usuario: usuario.Id_Usuario,
            Fecha_Inicio: fInicio,
            Fecha_Fin: fFin
          }
        });

        if (existente) {
          await existente.update({
            Unidad_Productiva: unidad,
            Estado_Periodo: estadoPeriodo,
            Num_Ficha: ficha || usuario.Id_Ficha || existente.Num_Ficha,
            Observaciones: "Actualizado via Excel SENA Empresa",
            Id_Usuario_Registro: usuarioSolicitante.id || null,
            Rol_Usuario_Registro: usuarioSolicitante.rol || "SENA Empresa"
          });
        } else {
          await InternadoTemporalModel.create({
            Id_Usuario: usuario.Id_Usuario,
            NumDoc_Usuario: usuario.NumDoc_Usuario,
            Nom_Usuario: usuario.Nom_Usuario || nombres,
            Ape_Usuario: usuario.Ape_Usuario || apellidos,
            Num_Ficha: ficha || usuario.Id_Ficha || null,
            Unidad_Productiva: unidad,
            Fecha_Inicio: fInicio,
            Fecha_Fin: fFin,
            Rol_Original: "Aprendiz Externo",
            Estado_Original_CenCon: usuario.CenCon_Usuario || "No",
            Estado_Periodo: estadoPeriodo,
            Observaciones: "Cargado via Excel SENA Empresa",
            Id_Usuario_Registro: usuarioSolicitante.id || null,
            Rol_Usuario_Registro: usuarioSolicitante.rol || "SENA Empresa",
            Origen_Registro: "EXCEL"
          });
        }

        resultados.creadosOActualizados++;
      }

      // Si el aprendiz esta en turno hoy, actualizar inmediatamente sus estados
      if (tieneTurnoActivoHoy) {
        await usuario.update({
          CenCon_Usuario: "Si",
          Est_Usuario: "Turno Sena Empresa"
        });

        // Notificar al aprendiz
        try {
          await NotificacionesModel.create({
            Id_Usuario: usuario.Id_Usuario,
            Titulo: "¡Habilitado en Internado Temporal SENA Empresa!",
            Mensaje: `Has sido asignado a internado temporal (${unidad}). Puedes reservar desayuno, almuerzo y cena según horarios oficiales.`,
            Tipo: "exito",
            Leido: false,
            Fecha_Creacion: new Date()
          });
        } catch (_) {}
      }

      resultados.detalles.push({
        numDoc: usuario.NumDoc_Usuario.toString(),
        nombre: `${usuario.Nom_Usuario} ${usuario.Ape_Usuario}`,
        unidad,
        turnosCargados: ventanas.length,
        activoHoy: tieneTurnoActivoHoy
      });
    }

    return resultados;
  }

  /**
   * Tarea de mantenimiento: Revisa registros y revierte aprendices cuyo tiempo de internado ha vencido.
   * Se ejecuta al arrancar el servidor y periodicamente (cron diario).
   */
  async revisarYRevertirVencidos() {
    const hoy = obtenerFechaColombia();
    let activados = 0;
    let revertidos = 0;

    // 1. Activar los que inician hoy
    const porActivar = await InternadoTemporalModel.findAll({
      where: {
        Estado_Periodo: "PROGRAMADO",
        Fecha_Inicio: { [Op.lte]: hoy },
        Fecha_Fin: { [Op.gte]: hoy }
      }
    });

    for (const reg of porActivar) {
      await reg.update({ Estado_Periodo: "ACTIVO" });
      await UsuariosModel.update(
        { CenCon_Usuario: "Si", Est_Usuario: "Turno Sena Empresa" },
        { where: { Id_Usuario: reg.Id_Usuario } }
      );
      activados++;
    }

    // 2. Vencer los que expiraron
    const expirados = await InternadoTemporalModel.findAll({
      where: {
        Estado_Periodo: "ACTIVO",
        Fecha_Fin: { [Op.lt]: hoy }
      }
    });

    for (const exp of expirados) {
      await exp.update({ Estado_Periodo: "VENCIDO" });

      // Comprobar si el usuario tiene otro periodo que este ACTIVO hoy
      const otroPeriodoActivo = await InternadoTemporalModel.findOne({
        where: {
          Id_Usuario: exp.Id_Usuario,
          Estado_Periodo: "ACTIVO",
          Fecha_Inicio: { [Op.lte]: hoy },
          Fecha_Fin: { [Op.gte]: hoy }
        }
      });

      // Si no tiene otro periodo activo, revertir a su estado original (Externo)
      if (!otroPeriodoActivo) {
        await UsuariosModel.update(
          {
            CenCon_Usuario: "No",
            Est_Usuario: "En Formacion"
          },
          { where: { Id_Usuario: exp.Id_Usuario } }
        );

        // Notificar al aprendiz que finalizo su turno de internado
        try {
          await NotificacionesModel.create({
            Id_Usuario: exp.Id_Usuario,
            Titulo: "Finalización de Internado Temporal SENA Empresa",
            Mensaje: `Tu periodo temporal en el internado (${exp.Unidad_Productiva}) ha concluido. Tu estado ha sido restablecido a Aprendiz Externo.`,
            Tipo: "info",
            Leido: false,
            Fecha_Creacion: new Date()
          });
        } catch (_) {}

        revertidos++;
      }
    }

    return { activados, revertidos };
  }

  /**
   * Consulta el listado de registros con filtros
   */
  async obtenerRegistros(filtros = {}) {
    const { estado, busqueda, unidad } = filtros;
    const where = {};

    if (estado && estado !== "TODOS") {
      where.Estado_Periodo = estado;
    }

    if (unidad && unidad !== "TODAS") {
      where.Unidad_Productiva = unidad;
    }

    if (busqueda && String(busqueda).trim()) {
      const q = `%${String(busqueda).trim()}%`;
      where[Op.or] = [
        { Nom_Usuario: { [Op.like]: q } },
        { Ape_Usuario: { [Op.like]: q } },
        { NumDoc_Usuario: { [Op.like]: q } },
        { Num_Ficha: { [Op.like]: q } },
        { Unidad_Productiva: { [Op.like]: q } }
      ];
    }

    const registros = await InternadoTemporalModel.findAll({
      where,
      include: [
        {
          model: UsuariosModel,
          as: "usuario",
          attributes: ["Id_Usuario", "Nom_Usuario", "Ape_Usuario", "TipDoc_Usuario", "NumDoc_Usuario", "Cor_Usuario", "Tel_Usuario", "CenCon_Usuario", "Est_Usuario"]
        }
      ],
      order: [["Fecha_Inicio", "DESC"], ["createdAt", "DESC"]]
    });

    const hoy = obtenerFechaColombia();

    return registros.map(r => {
      const plain = r.toJSON();
      const diasRestantes = Math.ceil((new Date(r.Fecha_Fin) - new Date(hoy)) / (1000 * 60 * 60 * 24));
      return {
        ...plain,
        diasRestantes: r.Estado_Periodo === "ACTIVO" ? Math.max(0, diasRestantes) : null
      };
    });
  }

  /**
   * Registro manual de un aprendiz externo a internado temporal
   */
  async crearRegistroManual(datos, usuarioSolicitante = {}) {
    const { numDoc, fechaInicio, fechaFin, unidadProductiva, observaciones } = datos;

    if (!numDoc || !fechaInicio || !fechaFin) {
      throw new Error("El documento, fecha de inicio y fecha de fin son obligatorios.");
    }

    if (fechaFin < fechaInicio) {
      throw new Error("La fecha de fin no puede ser anterior a la fecha de inicio.");
    }

    const usuario = await UsuariosModel.findOne({
      where: { NumDoc_Usuario: numDoc }
    });

    if (!usuario) {
      throw new Error(`El usuario con documento ${numDoc} no existe en el sistema.`);
    }

    const hoy = obtenerFechaColombia();
    let estadoPeriodo = "PROGRAMADO";
    if (hoy >= fechaInicio && hoy <= fechaFin) {
      estadoPeriodo = "ACTIVO";
    } else if (hoy > fechaFin) {
      estadoPeriodo = "VENCIDO";
    }

    const registro = await InternadoTemporalModel.create({
      Id_Usuario: usuario.Id_Usuario,
      NumDoc_Usuario: usuario.NumDoc_Usuario,
      Nom_Usuario: usuario.Nom_Usuario,
      Ape_Usuario: usuario.Ape_Usuario,
      Num_Ficha: usuario.Id_Ficha || null,
      Unidad_Productiva: unidadProductiva || "SENA Empresa",
      Fecha_Inicio: fechaInicio,
      Fecha_Fin: fechaFin,
      Rol_Original: "Aprendiz Externo",
      Estado_Original_CenCon: usuario.CenCon_Usuario || "No",
      Estado_Periodo: estadoPeriodo,
      Observaciones: observaciones || "Registro manual",
      Id_Usuario_Registro: usuarioSolicitante.id || null,
      Rol_Usuario_Registro: usuarioSolicitante.rol || "SENA Empresa",
      Origen_Registro: "MANUAL"
    });

    if (estadoPeriodo === "ACTIVO") {
      await usuario.update({
        CenCon_Usuario: "Si",
        Est_Usuario: "Turno Sena Empresa"
      });
    }

    return registro;
  }

  /**
   * Elimina o cancela un registro de internado temporal y revierte de ser necesario
   */
  async eliminarRegistro(idRegistro) {
    const registro = await InternadoTemporalModel.findByPk(idRegistro);
    if (!registro) {
      throw new Error("Registro de internado temporal no encontrado.");
    }

    const idUsuario = registro.Id_Usuario;
    await registro.destroy();

    // Comprobar si el usuario debe revertirse a Externo
    const hoy = obtenerFechaColombia();
    const activoRestante = await InternadoTemporalModel.findOne({
      where: {
        Id_Usuario: idUsuario,
        Estado_Periodo: "ACTIVO",
        Fecha_Inicio: { [Op.lte]: hoy },
        Fecha_Fin: { [Op.gte]: hoy }
      }
    });

    if (!activoRestante) {
      await UsuariosModel.update(
        { CenCon_Usuario: "No", Est_Usuario: "En Formacion" },
        { where: { Id_Usuario: idUsuario } }
      );
    }

    return { mensaje: "Registro eliminado correctamente y estados verificados." };
  }

  /**
   * Genera el archivo Excel oficial para descarga de plantilla institucional de Gestores SENA Empresa
   */
  async generarPlantillaOficial() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Foodsys - SENA La Granja";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Gestores SENA Empresa");

    // Titulo institucional
    sheet.mergeCells("A1:J1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "CENTRO AGROPECUARIO LA GRANJA - REGISTRO DE GESTORES E INTERNADO TEMPORAL SENA EMPRESA";
    titleCell.font = { name: "Arial", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(1).height = 30;

    // Subtitulo / Instrucciones
    sheet.mergeCells("A2:J2");
    const subCell = sheet.getCell("A2");
    subCell.value = "Ingrese el documento, nombres, apellidos, ficha, unidad productiva y las fechas del turno. El sistema actualizara automaticamente su estado de internado.";
    subCell.font = { name: "Arial", size: 9, italic: true, color: { argb: "FF374151" } };
    subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
    subCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(2).height = 20;

    // Encabezados
    const headers = [
      "TIPO DE DOCUMENTO",
      "NUMERO DE DOCUMENTO",
      "NOMBRES",
      "APELLIDOS",
      "FICHA",
      "UNDAD",
      "FECHA DE INGRESO (TURNO 1)",
      "FECHA DE SALIDA (TURNO 1)",
      "FECHA DE INGRESO (TURNO 2)",
      "FECHA DE SALIDA (TURNO 2)"
    ];

    const headerRow = sheet.getRow(3);
    headerRow.values = headers;
    headerRow.height = 25;

    headers.forEach((_, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" }
      };
    });

    // Filas de ejemplo instructivas
    const ejemplos = [
      ["CC", 1109381233, "Jeffrey Sebastian", "Moncaleano Meneses", 3285042, "Gestor de apicultura", "2026-10-23", "2026-11-05", "2026-11-19", "2026-12-04"],
      ["CC", 1105305044, "Edgar Felipe", "Culma Olaya", 3285042, "Gestor de ganaderia", "2026-10-23", "2026-11-05", "2026-11-19", "2026-12-04"],
      ["CC", 1144724182, "Daniel Eduardo", "Rojas Martinez", 3285042, "Gestor de ganaderia", "2026-10-09", "2026-10-22", "2026-10-23", "2026-11-05"],
      ["CC", 1109264900, "Danilson", "Sanchez Portela", 3285042, "Gestor de Ganaderia", "2026-11-06", "2026-11-19", "2026-12-04", "2026-12-16"],
      ["CC", 1070601503, "Javier Andres", "Betancourt Oliveros", 3285042, "Gestor de ovinos", "2026-10-09", "2026-10-22", "2026-11-06", "2026-11-19"]
    ];

    ejemplos.forEach((rowValues) => {
      const r = sheet.addRow(rowValues);
      r.height = 20;
      r.eachCell((cell) => {
        cell.font = { name: "Arial", size: 9 };
        cell.alignment = { vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } }
        };
      });
    });

    sheet.columns = [
      { width: 16 }, // Tipo doc
      { width: 22 }, // Num doc
      { width: 25 }, // Nombres
      { width: 25 }, // Apellidos
      { width: 14 }, // Ficha
      { width: 30 }, // Unidad
      { width: 20 }, // Ingreso 1
      { width: 20 }, // Salida 1
      { width: 20 }, // Ingreso 2
      { width: 20 }, // Salida 2
    ];

    return await workbook.xlsx.writeBuffer();
  }
}

const internadoTemporalServiceInstance = new InternadoTemporalService();
export default internadoTemporalServiceInstance;
