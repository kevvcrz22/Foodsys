// Node/Services/SofiaPlusReconcilerService.js
// Servicio de conciliacion automatica e inteligente con reportes de SOFIA Plus.
// Procesa reportes brutos institucionales (PE-04, Base IQR, Centro de Convivencia)
// y diagnostica 5 contadores clave antes de aplicar los cambios en un solo clic:
// 1. Nuevos Ingresos
// 2. Bajas por Novedad (Cancelado, Retiro, Aplazado, Trasladado)
// 3. Paso a Etapa Productiva
// 4. Cambios de Modalidad (Interno <-> Externo) o Ficha
// 5. Fichas Nuevas Detectadas

import XLSX from "xlsx";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import db from "../Database/db.js";
import UsuariosModel from "../Models/UsuariosModel.js";
import FichasModel from "../Models/FichasModel.js";
import ProgramaModel from "../Models/ProgramaModel.js";
import RolesModel from "../Models/RolesModel.js";
import UsuariosRolModel from "../Models/UsuariosRolModel.js";
import ReservaModel from "../Models/ReservasModel.js";
import { normalizarNombrePrograma } from "./ProgramaService.js";
import { obtenerFechaColombia } from "../Utils/dateUtils.js";

// Extrae un campo de una fila de Excel probando multiples nombres posibles de columna
function extraerCampo(fila, opciones) {
  if (!fila) return "";
  for (const opc of opciones) {
    const busq = opc.trim().toUpperCase();
    for (const key of Object.keys(fila)) {
      if (key.trim().toUpperCase() === busq && fila[key] !== undefined && fila[key] !== null) {
        return String(fila[key]).trim();
      }
    }
  }
  // Coincidencia parcial si no hubo exacta
  for (const opc of opciones) {
    const busq = opc.trim().toUpperCase();
    for (const key of Object.keys(fila)) {
      if (key.trim().toUpperCase().includes(busq) && fila[key] !== undefined && fila[key] !== null) {
        return String(fila[key]).trim();
      }
    }
  }
  return "";
}

class SofiaPlusReconcilerService {
  /**
   * Diagnostica las diferencias entre el archivo de SOFIA Plus y la base de datos Foodsys
   * @param {Buffer} fileBuffer - Buffer del archivo Excel
   * @returns {Promise<object>} Diagnostico con los 5 contadores y listados detallados
   */
  async DiagnosticarCruceSofiaPlus(fileBuffer) {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Detectar fila de encabezados en el Excel (PE-04 suele tener encabezados en fila 5, indice 4)
    const matriz = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(15, matriz.length); i++) {
      const fila = matriz[i].map(c => String(c).trim().toUpperCase());
      if (
        fila.some(c => c.includes("DOCUMENTO") || c.includes("IDENTIFICACION") || c.includes("NUM. DCTO") || c.includes("CEDULA")) ||
        fila.some(c => c.includes("FICHA") || c.includes("IDENTIFICADOR_FICHA"))
      ) {
        headerRowIndex = i;
        break;
      }
    }

    const filas = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex, defval: "" });
    if (!filas.length) {
      throw new Error("El archivo no contiene filas legibles de datos.");
    }

    // 1. Precargar datos de la BD en memoria
    const usuariosBD = await UsuariosModel.findAll({
      attributes: ["Id_Usuario", "NumDoc_Usuario", "Nom_Usuario", "Ape_Usuario", "Est_Usuario", "CenCon_Usuario", "Id_Ficha", "Cor_Usuario", "Tel_Usuario"],
      include: [
        {
          model: UsuariosRolModel,
          as: "rolesUsuario",
          include: [{ model: RolesModel, as: "rolUsuario", attributes: ["Nom_Rol"] }]
        },
        {
          model: FichasModel,
          as: "ficha",
          attributes: ["Id_Ficha", "Num_Ficha", "FecFinLec_Ficha"]
        }
      ]
    });

    const fichasBD = await FichasModel.findAll({
      include: [{ model: ProgramaModel, as: "programas", attributes: ["Nom_Programa"] }]
    });

    const programasBD = await ProgramaModel.findAll();

    const mapaUsuariosDoc = new Map(usuariosBD.map(u => [String(u.NumDoc_Usuario).trim(), u]));
    const mapaFichas = new Map();
    fichasBD.forEach(f => {
      mapaFichas.set(String(f.Num_Ficha).trim(), f);
      mapaFichas.set(String(f.Id_Ficha).trim(), f);
    });

    const mapaProgramas = new Map();
    programasBD.forEach(p => {
      mapaProgramas.set(normalizarNombrePrograma(p.Nom_Programa), p);
    });

    // 2. Colecciones del diagnostico
    const nuevosIngresos = [];
    const bajasPorNovedad = [];
    const pasoEtapaProductiva = [];
    const cambiosModalidadFicha = [];
    const fichasNuevasMap = new Map();

    const docsVistosEnExcel = new Set();
    const hoyStr = obtenerFechaColombia();

    for (const fila of filas) {
      const docRaw = extraerCampo(fila, [
        "NUM. DCTO.", "NUM. DCTO", "NUMERO DCTO", "DOCUMENTO", "NUMDOC_USUARIO",
        "NUM_DOC", "NUMERO DE IDENTIFICACION", "NUMERO DE IDENTIFICACIÓN", "CEDULA", "IDENTIFICACION"
      ]).replace(/\D/g, "");

      if (!docRaw) continue;
      if (docsVistosEnExcel.has(docRaw)) continue;
      docsVistosEnExcel.add(docRaw);

      const nombres = extraerCampo(fila, ["NOM_USUARIO", "NOMBRES", "NOMBRE", "SIMBRES"]).toUpperCase();
      const apellidos = extraerCampo(fila, ["APE_USUARIO", "APELLIDOS", "APELLIDO"]).toUpperCase();
      const estadoExcel = extraerCampo(fila, ["ESTADO", "ESTADO APRENDIZ", "ESTADO DEL APRENDIZ", "EST_USUARIO"]).toUpperCase();
      const fichaRaw = extraerCampo(fila, ["NUM_FICHA", "FICHA", "NO. DE FICHA", "NUMERO DE FICHA", "IDENTIFICADOR_FICHA"]).replace(/\D/g, "");
      const progRaw = extraerCampo(fila, ["PROGRAMA", "NOMBRE DEL PROGRAMA", "NOMBRE_PROGRAMA_FORMACION", "NOM_PROGRAMA"]);
      const progNorm = normalizarNombrePrograma(progRaw);

      const cenConRaw = extraerCampo(fila, ["CENTRO DE CONVIVENCIA", "CENCON_USUARIO", "ALOJAMIENTO Y/O CABAÑA", "CABAÑA", "ALOJAMIENTO"]).toLowerCase();
      const esInterno = /si|sí|cabaña|alojamiento|interno|1|true/i.test(cenConRaw) && !/no|ninguno/i.test(cenConRaw);
      const cenConVal = esInterno ? "Si" : "No";

      // Detectar si la ficha es nueva
      if (fichaRaw && !mapaFichas.has(fichaRaw) && !fichasNuevasMap.has(fichaRaw)) {
        fichasNuevasMap.set(fichaRaw, {
          Num_Ficha: fichaRaw,
          Nom_Programa: progNorm || "PROGRAMA DETECTADO SOFIA PLUS",
          NivFor_Programa: "TECNOLOGO"
        });
      }

      const usuarioExiste = mapaUsuariosDoc.get(docRaw);

      // Evaluar estados de retiro o baja en SOFIA Plus
      const esBaja = /CANCELADO|RETIRO|TRASLADADO|APLAZADO/i.test(estadoExcel);
      const esProductiva = /PRODUCTIVA|CERTIFICADO/i.test(estadoExcel);

      if (usuarioExiste) {
        // Caso A: Aprendiz activo en Foodsys pero con baja en SOFIA Plus
        if (esBaja && usuarioExiste.Est_Usuario === "En Formacion") {
          bajasPorNovedad.push({
            Id_Usuario: usuarioExiste.Id_Usuario,
            NumDoc_Usuario: docRaw,
            Nombre: `${usuarioExiste.Nom_Usuario} ${usuarioExiste.Ape_Usuario}`.trim(),
            EstadoActual: usuarioExiste.Est_Usuario,
            NovedadDetectada: estadoExcel || "CANCELADO / RETIRO",
            Num_Ficha: usuarioExiste.ficha?.Num_Ficha || fichaRaw
          });
          continue;
        }

        // Caso B: Paso a etapa productiva
        if (esProductiva && usuarioExiste.Est_Usuario === "En Formacion") {
          pasoEtapaProductiva.push({
            Id_Usuario: usuarioExiste.Id_Usuario,
            NumDoc_Usuario: docRaw,
            Nombre: `${usuarioExiste.Nom_Usuario} ${usuarioExiste.Ape_Usuario}`.trim(),
            EstadoActual: usuarioExiste.Est_Usuario,
            NuevoEstado: "Inactivo",
            Motivo: "Paso a Etapa Productiva / Certificado"
          });
          continue;
        }

        // Caso C: Cambios de modalidad (Interno <-> Externo) o cambio de Ficha
        const modalidadActual = (usuarioExiste.CenCon_Usuario || "No").trim().toLowerCase();
        const nuevaModalidad = cenConVal.trim().toLowerCase();
        const cambioModalidad = modalidadActual !== nuevaModalidad;

        const fichaActualStr = usuarioExiste.ficha?.Num_Ficha ? String(usuarioExiste.ficha.Num_Ficha).trim() : "";
        const cambioFicha = fichaRaw && fichaActualStr && fichaRaw !== fichaActualStr;

        if (cambioModalidad || cambioFicha) {
          cambiosModalidadFicha.push({
            Id_Usuario: usuarioExiste.Id_Usuario,
            NumDoc_Usuario: docRaw,
            Nombre: `${usuarioExiste.Nom_Usuario} ${usuarioExiste.Ape_Usuario}`.trim(),
            ModalidadActual: usuarioExiste.CenCon_Usuario,
            NuevaModalidad: cenConVal,
            FichaActual: fichaActualStr,
            NuevaFicha: fichaRaw,
            cambioModalidad,
            cambioFicha
          });
        }
      } else {
        // Caso D: Nuevo ingreso no registrado en Foodsys
        if (!esBaja && !esProductiva) {
          nuevosIngresos.push({
            NumDoc_Usuario: docRaw,
            Nom_Usuario: nombres || "APRENDIZ SOFIA PLUS",
            Ape_Usuario: apellidos || "",
            TipDoc_Usuario: "CC",
            CenCon_Usuario: cenConVal,
            Num_Ficha: fichaRaw,
            Nom_Programa: progNorm || (mapaFichas.get(fichaRaw)?.programas?.Nom_Programa) || "PROGRAMA NO REGISTRADO",
            Rol_Sugerido: esInterno ? "Aprendiz Interno" : "Aprendiz Externo",
            Est_Usuario: "En Formacion"
          });
        }
      }
    }

    const fichasNuevas = Array.from(fichasNuevasMap.values());

    return {
      resumen: {
        totalFilasAnalizadas: filas.length,
        nuevosIngresos: nuevosIngresos.length,
        bajasPorNovedad: bajasPorNovedad.length,
        pasoEtapaProductiva: pasoEtapaProductiva.length,
        cambiosModalidadFicha: cambiosModalidadFicha.length,
        fichasNuevasDetectadas: fichasNuevas.length
      },
      detalles: {
        nuevosIngresos,
        bajasPorNovedad,
        pasoEtapaProductiva,
        cambiosModalidadFicha,
        fichasNuevas
      }
    };
  }

  /**
   * Aplica la conciliacion confirmada de SOFIA Plus en una transaccion atomica
   * @param {object} diagnostico - Objeto retornado previamente por DiagnosticarCruceSofiaPlus
   * @returns {Promise<object>} Resultado consolidado con las operaciones ejecutadas
   */
  async AplicarConciliacionSofiaPlus(diagnostico) {
    if (!diagnostico?.detalles) {
      throw new Error("Estructura de diagnostico invalida para aplicar conciliacion.");
    }

    const { nuevosIngresos = [], bajasPorNovedad = [], pasoEtapaProductiva = [], cambiosModalidadFicha = [], fichasNuevas = [] } = diagnostico.detalles;

    return await db.transaction(async (t) => {
      // 1. Crear fichas y programas nuevos
      const mapaRoles = new Map();
      const rolesBD = await RolesModel.findAll({ transaction: t });
      rolesBD.forEach(r => mapaRoles.set(r.Nom_Rol.trim().toLowerCase(), r.Id_Rol));

      for (const fn of fichasNuevas) {
        let prog = await ProgramaModel.findOne({
          where: { Nom_Programa: normalizarNombrePrograma(fn.Nom_Programa) },
          transaction: t
        });
        if (!prog) {
          prog = await ProgramaModel.create({
            Nom_Programa: normalizarNombrePrograma(fn.Nom_Programa) || `PROGRAMA FICHA ${fn.Num_Ficha}`,
            NivFor_Programa: fn.NivFor_Programa || "TECNOLOGO",
            Est_Programa: "Activo"
          }, { transaction: t });
        }

        const fichaExistente = await FichasModel.findOne({
          where: { Num_Ficha: fn.Num_Ficha },
          transaction: t
        });
        if (!fichaExistente) {
          await FichasModel.create({
            Num_Ficha: fn.Num_Ficha,
            Id_Programa: prog.Id_Programa,
            FecIniLec_Ficha: obtenerFechaColombia(),
            FecFinLec_Ficha: "2028-12-31",
            FecIniPra_Ficha: "2029-01-01",
            FecFinPra_Ficha: "2029-06-30"
          }, { transaction: t });
        }
      }

      // Recargar mapa de fichas actualizado
      const todasFichas = await FichasModel.findAll({ transaction: t });
      const mapaFichas = new Map(todasFichas.map(f => [String(f.Num_Ficha).trim(), f]));

      // 2. Procesar bajas por novedad (Inactivar y cancelar reservas)
      const idsBajas = bajasPorNovedad.map(b => b.Id_Usuario);
      if (idsBajas.length > 0) {
        await UsuariosModel.update(
          { Est_Usuario: "Inactivo" },
          { where: { Id_Usuario: { [Op.in]: idsBajas } }, transaction: t }
        );

        // Cancelar reservas futuras
        const hoyStr = obtenerFechaColombia();
        await ReservaModel.update(
          { Est_Reserva: "Cancelado" },
          {
            where: {
              Id_Usuario: { [Op.in]: idsBajas },
              Fec_Reserva: { [Op.gte]: hoyStr },
              Est_Reserva: { [Op.in]: ["Generado", "Verificado"] }
            },
            transaction: t
          }
        );
      }

      // 3. Procesar paso a etapa productiva (Inactivar)
      const idsProductiva = pasoEtapaProductiva.map(p => p.Id_Usuario);
      if (idsProductiva.length > 0) {
        await UsuariosModel.update(
          { Est_Usuario: "Inactivo" },
          { where: { Id_Usuario: { [Op.in]: idsProductiva } }, transaction: t }
        );
        const hoyStr = obtenerFechaColombia();
        await ReservaModel.update(
          { Est_Reserva: "Cancelado" },
          {
            where: {
              Id_Usuario: { [Op.in]: idsProductiva },
              Fec_Reserva: { [Op.gte]: hoyStr },
              Est_Reserva: { [Op.in]: ["Generado", "Verificado"] }
            },
            transaction: t
          }
        );
      }

      // 4. Procesar cambios de modalidad o ficha
      for (const c of cambiosModalidadFicha) {
        const updateData = {};
        if (c.cambioModalidad) updateData.CenCon_Usuario = c.NuevaModalidad;
        if (c.cambioFicha && mapaFichas.has(String(c.NuevaFicha).trim())) {
          updateData.Id_Ficha = mapaFichas.get(String(c.NuevaFicha).trim()).Id_Ficha;
        }

        if (Object.keys(updateData).length > 0) {
          await UsuariosModel.update(updateData, {
            where: { Id_Usuario: c.Id_Usuario },
            transaction: t
          });
        }

        // Actualizar rol si cambio modalidad
        if (c.cambioModalidad) {
          const esInterno = c.NuevaModalidad === "Si";
          const nombreNuevoRol = esInterno ? "aprendiz interno" : "aprendiz externo";
          const idRolNuevo = mapaRoles.get(nombreNuevoRol);
          if (idRolNuevo) {
            await UsuariosRolModel.destroy({
              where: { Id_Usuario: c.Id_Usuario },
              transaction: t
            });
            await UsuariosRolModel.create({
              Id_Usuario: c.Id_Usuario,
              Id_Rol: idRolNuevo
            }, { transaction: t });
          }
        }
      }

      // 5. Crear nuevos ingresos
      let creadosCount = 0;
      for (const ni of nuevosIngresos) {
        const fichaObj = mapaFichas.get(String(ni.Num_Ficha).trim());
        const idFichaFinal = fichaObj ? fichaObj.Id_Ficha : null;

        const hashPwd = await bcrypt.hash(String(ni.NumDoc_Usuario).trim(), 8);
        const usuarioNuevo = await UsuariosModel.create({
          TipDoc_Usuario: ni.TipDoc_Usuario || "CC",
          NumDoc_Usuario: ni.NumDoc_Usuario,
          Nom_Usuario: ni.Nom_Usuario,
          Ape_Usuario: ni.Ape_Usuario || "",
          Gen_Usuario: "No especificado",
          CenCon_Usuario: ni.CenCon_Usuario || "No",
          Id_Ficha: idFichaFinal,
          Est_Usuario: "En Formacion",
          San_Usuario: "No",
          Pol_Usuario: "No",
          password: hashPwd,
          uuid: uuidv4()
        }, { transaction: t });

        const rolNombre = String(ni.Rol_Sugerido || "Aprendiz Externo").trim().toLowerCase();
        const idRol = mapaRoles.get(rolNombre) || mapaRoles.get("aprendiz externo");
        if (idRol) {
          await UsuariosRolModel.create({
            Id_Usuario: usuarioNuevo.Id_Usuario,
            Id_Rol: idRol
          }, { transaction: t });
        }
        creadosCount++;
      }

      return {
        exito: true,
        mensaje: "Conciliacion SOFIA Plus ejecutada correctamente.",
        bajasProcesadas: idsBajas.length,
        productivasProcesadas: idsProductiva.length,
        cambiosModalidadAplicados: cambiosModalidadFicha.length,
        nuevosIngresosCreados: creadosCount,
        fichasNuevasCreadas: fichasNuevas.length
      };
    });
  }
}

export default new SofiaPlusReconcilerService();
