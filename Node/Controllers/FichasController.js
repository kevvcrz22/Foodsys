// Node/Controllers/FichasController.js
// Controladores del modulo de fichas para el sistema Foodsys
// Comentarios didacticos para aprendices de tecnologo de primer semestre sin tildes ni emojis

import FichasServices, { sincronizarEstadoAprendices } from "../Services/FichasServices.js";
import FichasModel from "../Models/FichasModel.js";
import ProgramaModel from "../Models/ProgramaModel.js";
import { normalizarNombrePrograma } from "../Services/ProgramaService.js";
import XLSX from "xlsx";

/* ============================================================
   COLUMNAS_PLANTILLA_FICHA
   Campos oficiales para la plantilla descargable de Fichas
============================================================ */
const COLUMNAS_PLANTILLA_FICHA = [
  "Num_Ficha",        // Numero identificador de la ficha (Ej: 3404817)
  "Nom_Programa",     // Nombre del programa (o Id_Programa numerico)
  "FecIniLec_Ficha",  // Fecha inicio fase lectiva (YYYY-MM-DD)
  "FecFinLec_Ficha",  // Fecha fin fase lectiva (YYYY-MM-DD)
  "FecIniPra_Ficha",  // Fecha inicio fase practica (YYYY-MM-DD)
  "FecFinPra_Ficha",  // Fecha fin fase practica (YYYY-MM-DD)
];

// Niveles validos de Formacion Titulada del SENA
const NIVELES_TITULADA = ["TECNOLOGO", "TECNICO", "OPERARIO", "AUXILIAR", "ESPECIALIZACION"];

/**
 * Convierte un valor de fecha (string, Date o numero serial Excel) a formato YYYY-MM-DD.
 */
function formatearFechaISO(valor) {
  if (!valor) return null;
  if (valor instanceof Date && !isNaN(valor)) {
    return valor.toISOString().split("T")[0];
  }
  // Si viene como numero de serie de Excel (dias desde 1900)
  if (typeof valor === "number" && valor > 20000) {
    const date = new Date(Math.round((valor - 25569) * 86400 * 1000));
    return isNaN(date) ? null : date.toISOString().split("T")[0];
  }
  const str = String(valor).trim();
  if (!str) return null;

  // Si ya viene como YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  // Si viene como DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
    const partes = str.split("/");
    const dia = partes[0].padStart(2, "0");
    const mes = partes[1].padStart(2, "0");
    const anio = partes[2].substring(0, 4);
    return `${anio}-${mes}-${dia}`;
  }

  const d = new Date(str);
  return isNaN(d) ? null : d.toISOString().split("T")[0];
}

/**
 * Resta exactamente N meses a una fecha en formato YYYY-MM-DD
 */
function restarMesesFecha(fechaStr, meses = 6) {
  if (!fechaStr) return null;
  const d = new Date(`${fechaStr}T12:00:00`);
  if (isNaN(d)) return null;
  d.setMonth(d.getMonth() - meses);
  return d.toISOString().split("T")[0];
}

/**
 * Resta exactamente N dias a una fecha en formato YYYY-MM-DD
 */
function restarDiasFecha(fechaStr, dias = 1) {
  if (!fechaStr) return null;
  const d = new Date(`${fechaStr}T12:00:00`);
  if (isNaN(d)) return null;
  d.setDate(d.getDate() - dias);
  return d.toISOString().split("T")[0];
}

// ─────────────────────────────────────────────────────────────
// CRUD BASICO
// ─────────────────────────────────────────────────────────────

export const getAllFichas = async (req, res) => {
  try {
    const Fichas = await FichasServices.getAll();
    res.status(200).json(Fichas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFichas = async (req, res) => {
  try {
    const Fichas = await FichasServices.getById(req.params.id);
    res.status(200).json(Fichas);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createFichas = async (req, res) => {
  try {
    const Fichas = await FichasServices.create(req.body);
    res.status(201).json({ message: "Ficha Creada", Fichas });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateFichas = async (req, res) => {
  try {
    await FichasServices.update(parseInt(req.params.id), req.body);
    res.status(200).json({ message: "Ficha Actualizada Correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteFichas = async (req, res) => {
  try {
    await FichasServices.delete(req.params.id);
    res.status(200).json({ message: "Ficha eliminada correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// IMPORTACION EXCEL CON MEMORIA Y CALCULO AUTOMATICO DE FECHAS
// ─────────────────────────────────────────────────────────────

export const descargarPlantillaFicha = (_req, res) => {
  try {
    const Libro = XLSX.utils.book_new();
    const Hoja = XLSX.utils.aoa_to_sheet([COLUMNAS_PLANTILLA_FICHA]);
    Hoja["!cols"] = COLUMNAS_PLANTILLA_FICHA.map(() => ({ wch: 24 }));
    XLSX.utils.book_append_sheet(Libro, Hoja, "Fichas");

    const Buffer = XLSX.write(Libro, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", 'attachment; filename="plantilla_fichas.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(Buffer);
  } catch (error) {
    res.status(500).json({ message: "Error al generar la plantilla de fichas." });
  }
};

/**
 * Previsualizacion de importacion de fichas:
 * - Detecta automaticamente la fila de encabezados para soportar archivos PE-04.
 * - Filtra por defecto Formacion Titulada descartando miles de Cursos Especiales.
 * - Conecta o crea en memoria el programa asociado.
 * - Calcula automaticamente FecIniPra (-6 meses) y FecFinLec (-1 dia) si vienen vacias.
 */
export const previewImportFicha = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Archivo requerido" });
    }

    const soloTituladaVal = req.query?.soloTitulada ?? req.body?.soloTitulada ?? "true";
    const filtrarSoloTitulada = String(soloTituladaVal).toLowerCase() === "true";

    const Workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    if (!Workbook.SheetNames || Workbook.SheetNames.length === 0) {
      return res.status(400).json({ message: "El archivo no contiene hojas de calculo." });
    }

    const Hoja = Workbook.Sheets[Workbook.SheetNames[0]];
    const matriz = XLSX.utils.sheet_to_json(Hoja, { header: 1, defval: "" });
    if (!matriz || !matriz.length) {
      return res.status(400).json({ message: "El archivo esta vacio o no tiene datos." });
    }

    // Buscamos la fila de encabezados reales en las primeras 25 lineas (PE-04 suele tener metadatos arriba)
    let filaEncabezados = -1;
    for (let i = 0; i < Math.min(25, matriz.length); i++) {
      if (!Array.isArray(matriz[i])) continue;
      const fila = matriz[i].map(c => String(c).trim().toUpperCase());
      const coincide = fila.some(c =>
        c.includes("FICHA") ||
        c.includes("IDENTIFICADOR") ||
        c.includes("NUM_FICHA") ||
        c.includes("ID_FICHA") ||
        c.includes("CODIGO")
      );
      if (coincide) {
        filaEncabezados = i;
        break;
      }
    }

    if (filaEncabezados === -1) {
      filaEncabezados = 0;
    }

    const Filas = XLSX.utils.sheet_to_json(Hoja, { range: filaEncabezados, defval: "" });

    if (!Filas || !Filas.length) {
      return res.status(400).json({ message: "No se encontraron filas de datos en el archivo de fichas." });
    }

    // Precargamos todos los programas existentes en memoria
    const todosProgramas = await ProgramaModel.findAll();
    const mapaProgramasPorId = new Map();
    const mapaProgramasPorNombre = new Map();

    todosProgramas.forEach(p => {
      mapaProgramasPorId.set(p.Id_Programa, p);
      mapaProgramasPorNombre.set(normalizarNombrePrograma(p.Nom_Programa), p);
    });

    // Precargamos fichas existentes para saber si es creacion o actualizacion
    const todasFichas = await FichasModel.findAll({ attributes: ["Num_Ficha", "Id_Ficha"] });
    const mapaFichas = new Map();
    todasFichas.forEach(f => mapaFichas.set(Number(f.Num_Ficha), f));

    const Datos = [];
    let omitidosPorTipo = 0;

    for (const Fila of Filas) {
      if (!Fila || typeof Fila !== "object") continue;

      const Limpio = {};
      for (const Key of Object.keys(Fila)) {
        Limpio[Key.trim().toUpperCase()] = Fila[Key];
      }

      // Extraccion flexible de Num_Ficha
      let numFichaRaw =
        Limpio["NUM_FICHA"] ||
        Limpio["IDENTIFICADOR_FICHA"] ||
        Limpio["FICHA"] ||
        Limpio["NUMERO DE FICHA"] ||
        Limpio["ID_FICHA"] ||
        Limpio["CODIGO DE FICHA"] ||
        "";

      if (!numFichaRaw) {
        for (const k of Object.keys(Limpio)) {
          if (k.includes("FICHA") || k.includes("IDENTIFICADOR")) {
            numFichaRaw = Limpio[k];
            if (numFichaRaw) break;
          }
        }
      }

      const numFicha = parseInt(String(numFichaRaw).replace(/\D/g, ""), 10);
      if (!numFicha || isNaN(numFicha)) continue;

      // Nivel de formacion (para filtro de Formacion Titulada)
      let nivelRaw =
        Limpio["NIVEL DE FORMACION"] ||
        Limpio["NIVEL_FORMACION"] ||
        Limpio["NIVFOR_PROGRAMA"] ||
        "";

      if (!nivelRaw) {
        for (const k of Object.keys(Limpio)) {
          if (k.includes("NIVEL")) {
            nivelRaw = Limpio[k];
            if (nivelRaw) break;
          }
        }
      }

      const nivelNormalizado = String(nivelRaw).trim().toUpperCase();

      if (filtrarSoloTitulada && nivelNormalizado) {
        const esTitulada = NIVELES_TITULADA.some(nt => nivelNormalizado.includes(nt));
        if (!esTitulada) {
          omitidosPorTipo++;
          continue;
        }
      }

      // Identificacion del Programa
      let nombreProgramaRaw =
        Limpio["NOMBRE DEL PROGRAMA"] ||
        Limpio["NOMBRE_PROGRAMA_FORMACION"] ||
        Limpio["NOM_PROGRAMA"] ||
        Limpio["PROGRAMA"] ||
        Limpio["PROGRAMA DE FORMACION"] ||
        "";

      if (!nombreProgramaRaw) {
        for (const k of Object.keys(Limpio)) {
          if (k.includes("PROGRAMA") && !k.includes("NIVEL") && !k.includes("ID") && !k.includes("CODIGO")) {
            nombreProgramaRaw = Limpio[k];
            if (nombreProgramaRaw) break;
          }
        }
      }

      const idProgramaRaw = Limpio["ID_PROGRAMA"] || Limpio["CODIGO_PROGRAMA"] || "";
      let idProgramaAsignado = null;
      let nombreProgramaFinal = "";

      // Si viene un ID numerico directo y existe en BD
      if (idProgramaRaw && !isNaN(parseInt(idProgramaRaw, 10)) && mapaProgramasPorId.has(parseInt(idProgramaRaw, 10))) {
        idProgramaAsignado = parseInt(idProgramaRaw, 10);
        nombreProgramaFinal = mapaProgramasPorId.get(idProgramaAsignado).Nom_Programa;
      } else {
        // Buscamos por nombre normalizado
        const nombreParaBuscar = normalizarNombrePrograma(nombreProgramaRaw || idProgramaRaw);
        if (nombreParaBuscar) {
          if (mapaProgramasPorNombre.has(nombreParaBuscar)) {
            const progExistente = mapaProgramasPorNombre.get(nombreParaBuscar);
            idProgramaAsignado = progExistente.Id_Programa;
            nombreProgramaFinal = progExistente.Nom_Programa;
          } else {
            // En PREVISUALIZACION no escribimos en la BD para evitar fallos y contaminacion
            idProgramaAsignado = null;
            nombreProgramaFinal = nombreParaBuscar;
          }
        }
      }

      // Extraccion de Fechas
      let fecIniLec = formatearFechaISO(Limpio["FECINILEC_FICHA"] || Limpio["FECHA_INICIO_FICHA"] || Limpio["FECHA INICIO"] || Limpio["FECHA_INICIO_LECTIVA"]);
      let fecFinPra = formatearFechaISO(Limpio["FECFINPRA_FICHA"] || Limpio["FECHA_TERMINACION_FICHA"] || Limpio["FECHA FIN"] || Limpio["FECHA_FIN_PRACTICA"]);
      let fecIniPra = formatearFechaISO(Limpio["FECINIPRA_FICHA"] || Limpio["FECHA_INICIO_PRACTICA"]);
      let fecFinLec = formatearFechaISO(Limpio["FECFINLEC_FICHA"] || Limpio["FECHA_FIN_LECTIVA"]);

      if (!fecIniLec) {
        for (const k of Object.keys(Limpio)) {
          if (k.includes("INICIO") && (k.includes("LECTIV") || k.includes("LEC") || k.includes("FICHA"))) {
            fecIniLec = formatearFechaISO(Limpio[k]);
            if (fecIniLec) break;
          }
        }
      }
      if (!fecFinPra) {
        for (const k of Object.keys(Limpio)) {
          if (k.includes("TERMINACION") || (k.includes("FIN") && (k.includes("PRACTIC") || k.includes("PRA") || k.includes("FICHA")))) {
            fecFinPra = formatearFechaISO(Limpio[k]);
            if (fecFinPra) break;
          }
        }
      }
      if (!fecIniPra) {
        for (const k of Object.keys(Limpio)) {
          if (k.includes("INICIO") && (k.includes("PRACTIC") || k.includes("PRA"))) {
            fecIniPra = formatearFechaISO(Limpio[k]);
            if (fecIniPra) break;
          }
        }
      }
      if (!fecFinLec) {
        for (const k of Object.keys(Limpio)) {
          if (k.includes("FIN") && (k.includes("LECTIV") || k.includes("LEC"))) {
            fecFinLec = formatearFechaISO(Limpio[k]);
            if (fecFinLec) break;
          }
        }
      }

      // Regla de calculo matematico automatico:
      // Si FecFinPra tiene fecha valida pero FecIniPra esta vacio -> restar exactamente 6 meses
      if (fecFinPra && !fecIniPra) {
        fecIniPra = restarMesesFecha(fecFinPra, 6);
      }

      // Si FecFinLec esta vacio y ya tenemos FecIniPra -> restar 1 dia
      if (!fecFinLec && fecIniPra) {
        fecFinLec = restarDiasFecha(fecIniPra, 1);
      }

      const yaExisteFicha = mapaFichas.has(numFicha);

      Datos.push({
        Num_Ficha: numFicha,
        Id_Programa: idProgramaAsignado,
        Nom_Programa: nombreProgramaFinal || "Sin programa detectado",
        FecIniLec_Ficha: fecIniLec,
        FecFinLec_Ficha: fecFinLec,
        FecIniPra_Ficha: fecIniPra,
        FecFinPra_Ficha: fecFinPra,
        yaExiste: yaExisteFicha,
        accion: yaExisteFicha ? "Actualizar" : "Crear"
      });
    }

    return res.status(200).json({
      total: Datos.length,
      data: Datos,
      omitidosCursosEspeciales: omitidosPorTipo,
      nuevas: Datos.filter(d => !d.yaExiste).length,
      aActualizar: Datos.filter(d => d.yaExiste).length
    });
  } catch (error) {
    console.error("Error en previewImportFicha:", error);
    return res.status(500).json({ message: "Error al leer el archivo de fichas: " + (error.message || "Verifica el formato.") });
  }
};

/**
 * Persiste o actualiza (upsert) las fichas aprobadas por el administrador.
 * Conecta programas automaticamente y sincroniza el estado de los aprendices.
 */
export const importarFichasSeleccionadas = async (req, res) => {
  try {
    const { fichas } = req.body;

    if (!Array.isArray(fichas) || !fichas.length) {
      return res.status(400).json({ message: "No hay datos de fichas seleccionados" });
    }

    // Precargamos programas y fichas en memoria
    const todosProgramas = await ProgramaModel.findAll();
    const mapaProgramasPorId = new Map();
    const mapaProgramasPorNombre = new Map();

    todosProgramas.forEach(p => {
      mapaProgramasPorId.set(p.Id_Programa, p);
      mapaProgramasPorNombre.set(normalizarNombrePrograma(p.Nom_Programa), p);
    });

    let Creados = 0;
    let Actualizados = 0;
    let Omitidos = 0;
    const Errores = [];

    for (const Fila of fichas) {
      try {
        const numFicha = parseInt(Fila.Num_Ficha, 10);
        if (!numFicha || isNaN(numFicha)) {
          Omitidos++;
          Errores.push("Fila omitida: falta Num_Ficha valido.");
          continue;
        }

        // Resolver Id_Programa
        let idPrograma = Fila.Id_Programa ? parseInt(Fila.Id_Programa, 10) : null;

        if (!idPrograma || !mapaProgramasPorId.has(idPrograma)) {
          const nombreBuscar = normalizarNombrePrograma(Fila.Nom_Programa);
          if (nombreBuscar && mapaProgramasPorNombre.has(nombreBuscar)) {
            idPrograma = mapaProgramasPorNombre.get(nombreBuscar).Id_Programa;
          } else if (nombreBuscar) {
            // Crear programa al vuelo si no existe
            try {
              const nuevoProg = await ProgramaModel.create({
                Nom_Programa: nombreBuscar,
                Est_Programa: "Activo"
              });
              idPrograma = nuevoProg.Id_Programa;
              mapaProgramasPorId.set(nuevoProg.Id_Programa, nuevoProg);
              mapaProgramasPorNombre.set(nombreBuscar, nuevoProg);
            } catch (errP) {
              console.warn("Aviso al crear programa automatico:", errP.message);
            }
          }
        }

        let fecFinPra = Fila.FecFinPra_Ficha || null;
        let fecIniPra = Fila.FecIniPra_Ficha || null;
        let fecFinLec = Fila.FecFinLec_Ficha || null;
        const fecIniLec = Fila.FecIniLec_Ficha || null;

        // Calculo de 6 meses y -1 dia
        if (fecFinPra && !fecIniPra) {
          fecIniPra = restarMesesFecha(fecFinPra, 6);
        }
        if (!fecFinLec && fecIniPra) {
          fecFinLec = restarDiasFecha(fecIniPra, 1);
        }

        // Verificamos si la ficha ya existe para hacer UPSERT
        const fichaExistente = await FichasModel.findOne({ where: { Num_Ficha: numFicha } });

        if (fichaExistente) {
          await FichasModel.update(
            {
              Id_Programa: idPrograma || fichaExistente.Id_Programa,
              FecIniLec_Ficha: fecIniLec || fichaExistente.FecIniLec_Ficha,
              FecFinLec_Ficha: fecFinLec || fichaExistente.FecFinLec_Ficha,
              FecIniPra_Ficha: fecIniPra || fichaExistente.FecIniPra_Ficha,
              FecFinPra_Ficha: fecFinPra || fichaExistente.FecFinPra_Ficha,
            },
            { where: { Id_Ficha: fichaExistente.Id_Ficha } }
          );

          await sincronizarEstadoAprendices(fichaExistente.Id_Ficha);
          Actualizados++;
        } else {
          const nuevaFicha = await FichasModel.create({
            Num_Ficha: numFicha,
            Id_Programa: idPrograma,
            FecIniLec_Ficha: fecIniLec,
            FecFinLec_Ficha: fecFinLec,
            FecIniPra_Ficha: fecIniPra,
            FecFinPra_Ficha: fecFinPra,
          });

          await sincronizarEstadoAprendices(nuevaFicha.Id_Ficha);
          Creados++;
        }
      } catch (errFila) {
        Omitidos++;
        Errores.push(`Error en ficha ${Fila.Num_Ficha}: ${errFila.message}`);
      }
    }

    return res.status(200).json({
      creados: Creados,
      actualizados: Actualizados,
      omitidos: Omitidos,
      errores: Errores,
      mensaje: `Proceso completado: ${Creados} fichas creadas, ${Actualizados} actualizadas.`
    });
  } catch (error) {
    console.error("Error en importarFichasSeleccionadas:", error);
    return res.status(500).json({ message: "Error interno al importar las fichas seleccionadas." });
  }
};