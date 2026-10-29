// Node/Controllers/FichasController.js
// Controladores del modulo de fichas para el sistema Foodsys
// Comentarios didacticos para aprendices de tecnologo de primer semestre sin tildes ni emojis

import FichasServices, { sincronizarEstadoAprendices } from "../Services/FichasServices.js";
import FichasModel from "../Models/FichasModel.js";
import ProgramaModel from "../Models/ProgramaModel.js";
import { normalizarNombrePrograma } from "../Services/ProgramaService.js";
import { encolarEventoSync } from "../Services/SyncOutboxService.js";
import XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
 * Suma exactamente N meses a una fecha en formato YYYY-MM-DD
 */
function sumarMesesFecha(fechaStr, meses = 6) {
  if (!fechaStr) return null;
  const d = new Date(`${fechaStr}T12:00:00`);
  if (isNaN(d)) return null;
  d.setMonth(d.getMonth() + meses);
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

/**
 * Suma exactamente N dias a una fecha en formato YYYY-MM-DD
 */
function sumarDiasFecha(fechaStr, dias = 1) {
  if (!fechaStr) return null;
  const d = new Date(`${fechaStr}T12:00:00`);
  if (isNaN(d)) return null;
  d.setDate(d.getDate() + dias);
  return d.toISOString().split("T")[0];
}

/**
 * Calcula y completa de forma obligatoria las 4 fechas del ciclo formativo SENA:
 * - FecIniLec_Ficha (Inicio Etapa Lectiva)
 * - FecFinLec_Ficha (Fin Etapa Lectiva)
 * - FecIniPra_Ficha (Inicio Etapa Productiva)
 * - FecFinPra_Ficha (Fin Etapa Productiva)
 *
 * REGLAS INSTITUCIONALES SENA:
 * 1. La etapa productiva dura exactamente 6 meses: FecIniPra = FecFinPra - 6 meses.
 * 2. La etapa lectiva culmina el día anterior al inicio de la productiva: FecFinLec = FecIniPra - 1 día.
 * 3. Si solo viene "Fin de Etapa Productiva" (FecFinPra / Terminacion de Ficha):
 *    - FecIniPra = FecFinPra - 6 meses
 *    - FecFinLec = FecIniPra - 1 día
 *    - FecIniLec = FecFinLec - mesesLectiva (18 meses para tecnólogo, 12 o 6 para técnico)
 * 4. NINGUNA FECHA PUEDE QUEDAR NULA.
 */
export function calcularFechasCompletasFicha({
  fecIniLecRaw,
  fecFinLecRaw,
  fecIniPraRaw,
  fecFinPraRaw,
  nivelFormacion = "TECNOLOGO"
}) {
  let fecIniLec = formatearFechaISO(fecIniLecRaw);
  let fecFinLec = formatearFechaISO(fecFinLecRaw);
  let fecIniPra = formatearFechaISO(fecIniPraRaw);
  let fecFinPra = formatearFechaISO(fecFinPraRaw);

  const nivel = String(nivelFormacion || "").toUpperCase();
  const esTecnico = nivel.includes("TECNICO") || nivel.includes("OPERARIO") || nivel.includes("AUXILIAR");
  const mesesLectiva = esTecnico ? 12 : 18;

  // CASO 1: Tenemos Fin de Etapa Productiva (terminación)
  if (fecFinPra) {
    if (!fecIniPra) {
      fecIniPra = restarMesesFecha(fecFinPra, 6);
    }
    if (!fecFinLec && fecIniPra) {
      fecFinLec = restarDiasFecha(fecIniPra, 1);
    }
    if (!fecIniLec && fecFinLec) {
      fecIniLec = restarMesesFecha(fecFinLec, mesesLectiva);
    }
  }

  // CASO 2: No teníamos Fin de Productiva, pero tenemos Inicio de Productiva
  if (!fecFinPra && fecIniPra) {
    fecFinPra = sumarMesesFecha(fecIniPra, 6);
    if (!fecFinLec) {
      fecFinLec = restarDiasFecha(fecIniPra, 1);
    }
    if (!fecIniLec && fecFinLec) {
      fecIniLec = restarMesesFecha(fecFinLec, mesesLectiva);
    }
  }

  // CASO 3: No teníamos fechas de productiva, pero tenemos Fin de Lectiva
  if (fecFinLec) {
    if (!fecIniPra) {
      fecIniPra = sumarDiasFecha(fecFinLec, 1);
    }
    if (!fecFinPra && fecIniPra) {
      fecFinPra = sumarMesesFecha(fecIniPra, 6);
    }
    if (!fecIniLec) {
      fecIniLec = restarMesesFecha(fecFinLec, mesesLectiva);
    }
  }

  // CASO 4: Solo tenemos Inicio de Lectiva
  if (fecIniLec) {
    if (!fecFinLec) {
      fecFinLec = sumarMesesFecha(fecIniLec, mesesLectiva);
    }
    if (!fecIniPra && fecFinLec) {
      fecIniPra = sumarDiasFecha(fecFinLec, 1);
    }
    if (!fecFinPra && fecIniPra) {
      fecFinPra = sumarMesesFecha(fecIniPra, 6);
    }
  }

  // CASO 5: Proyección de respaldo para garantizar 100% que NUNCA sea NULL
  if (!fecFinPra) {
    const anioActual = new Date().getFullYear();
    fecFinPra = `${anioActual}-12-15`;
    fecIniPra = restarMesesFecha(fecFinPra, 6);
    fecFinLec = restarDiasFecha(fecIniPra, 1);
    fecIniLec = restarMesesFecha(fecFinLec, mesesLectiva);
  }

  return {
    fecIniLec: fecIniLec || "2025-01-15",
    fecFinLec: fecFinLec || "2026-06-14",
    fecIniPra: fecIniPra || "2026-06-15",
    fecFinPra: fecFinPra || "2026-12-15"
  };
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

export const descargarPlantillaFicha = async (_req, res) => {
  try {
    const Libro = XLSX.utils.book_new();

    // Hoja 1: Plantilla Institucional Foodsys (Limpia con ejemplos)
    const filasFoodsys = [
      ["Num_Ficha", "Nom_Programa", "FecIniLec_Ficha", "FecFinLec_Ficha", "FecIniPra_Ficha", "FecFinPra_Ficha"],
      [3404817, "GESTION DE EMPRESAS AGROPECUARIAS", "2026-04-15", "2027-04-14", "2027-04-15", "2027-10-15"],
      [3409672, "PRODUCCION DE ESPECIES MENORES", "2026-02-10", "2027-02-09", "2027-02-10", "2027-08-10"]
    ];
    const Hoja1 = XLSX.utils.aoa_to_sheet(filasFoodsys);
    Hoja1["!cols"] = [
      { wch: 16 }, { wch: 38 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }
    ];
    XLSX.utils.book_append_sheet(Libro, Hoja1, "Plantilla_Fichas");

    // Consultar programas actualizados de la base de datos para la hoja de seleccion
    const programasBD = await ProgramaModel.findAll({
      order: [["Nom_Programa", "ASC"]]
    });

    const filasProgramas = [
      ["ID Programa", "Nombre Oficial del Programa", "Nivel de Formación", "Área", "Estado"]
    ];

    programasBD.forEach(p => {
      filasProgramas.push([
        p.Id_Programa,
        p.Nom_Programa,
        p.NivFor_Programa || "TECNOLOGO",
        p.Are_Programa || "AGROPECUARIA",
        p.Est_Programa || "Activo"
      ]);
    });

    const HojaProgramas = XLSX.utils.aoa_to_sheet(filasProgramas);
    HojaProgramas["!cols"] = [
      { wch: 14 }, { wch: 45 }, { wch: 22 }, { wch: 22 }, { wch: 14 }
    ];

    // Si ya existe la hoja PROGRAMAS_DISPONIBLES, reemplazarla con los datos frescos
    if (Libro.Sheets["PROGRAMAS_DISPONIBLES"]) {
      delete Libro.Sheets["PROGRAMAS_DISPONIBLES"];
      Libro.SheetNames = Libro.SheetNames.filter(n => n !== "PROGRAMAS_DISPONIBLES");
    }
    XLSX.utils.book_append_sheet(Libro, HojaProgramas, "PROGRAMAS_DISPONIBLES");

    const Buffer = XLSX.write(Libro, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", 'attachment; filename="Fichas_Foodsys_Oficial.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(Buffer);
  } catch (error) {
    console.error("[FichasController] Error al generar plantilla:", error);
    return res.status(500).json({ message: "Error al generar la plantilla de fichas." });
  }
};

/**
 * Detecta inteligentemente la hoja que contiene las fichas en el archivo Excel.
 * Soporta PE-04_1, Fichas_Activas_Foodsys, 1. Juicios_TGOs, 2. Juicios_TCOs, Base_NO MODIFICAR.
 */
function detectarHojaFichas(Workbook) {
  const prioridades = [
    "Fichas_Activas",
    "Reporte",
    "Resum_Juic",
    "J_TGOs_Comp_2026_09",
    "J_TCOs_Comp_2026_09",
    "Plantilla_Fichas",
    "Fichas",
    "Hoja1"
  ];
  const todosNombres = [
    ...prioridades.filter(n => Workbook.Sheets[n]),
    ...Workbook.SheetNames.filter(n => !prioridades.includes(n))
  ];

  for (const nombreHoja of todosNombres) {
    const ws = Workbook.Sheets[nombreHoja];
    if (!ws) continue;
    const rawMatrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

    for (let r = 0; r < Math.min(15, rawMatrix.length); r++) {
      const fila = (rawMatrix[r] || []).map(c => String(c).trim().toUpperCase());
      const hasFicha = fila.some(c =>
        c === "FICHA" ||
        c.includes("NUM_FICHA") ||
        c.includes("IDENTIFICADOR_FICHA") ||
        c.includes("NUMERO DE FICHA") ||
        c.includes("NO. DE FICHA") ||
        c === "ID_FICHA"
      );
      if (hasFicha) {
        const Filas = XLSX.utils.sheet_to_json(ws, { range: r, defval: "" });
        if (Filas.length > 0) {
          return { hoja: ws, nombreHoja, filaEncabezados: r, Filas };
        }
      }
    }
  }

  const primerNombre = Workbook.SheetNames[0];
  const ws = Workbook.Sheets[primerNombre];
  const Filas = XLSX.utils.sheet_to_json(ws, { defval: "" });
  return { hoja: ws, nombreHoja: primerNombre, filaEncabezados: 0, Filas };
}

/**
 * Previsualizacion de importacion de fichas:
 * - Detecta automaticamente la hoja y fila de encabezados para soportar PE-04, Juicios, Foodsys y Base.
 * - Filtra por defecto Formacion Titulada descartando Cursos Especiales si soloTitulada es true.
 * - Conecta o crea en memoria el programa asociado.
 * - Deduplica fichas unicas si el archivo contiene multiples registros por ficha.
 * - Calcula automaticamente FecIniPra (-6 meses) y FecFinLec (-1 dia) si vienen vacias.
 */
export const previewImportFicha = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Archivo requerido" });
    }

    const { soloTitulada = "true" } = req.query;
    const filtrarSoloTitulada = soloTitulada === "true" || soloTitulada === true;

    const Workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const { Filas, nombreHoja } = detectarHojaFichas(Workbook);

    if (!Filas || !Filas.length) {
      return res.status(400).json({ message: "No se encontraron filas de fichas en el archivo." });
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
    const fichasVistas = new Set();
    let omitidosPorTipo = 0;

    for (const Fila of Filas) {
      const Limpio = {};
      for (const Key of Object.keys(Fila)) {
        Limpio[Key.trim().toUpperCase()] = Fila[Key];
      }

      // Extraccion flexible de Num_Ficha
      const numFichaRaw =
        Limpio["NUM_FICHA"] ||
        Limpio["IDENTIFICADOR_FICHA"] ||
        Limpio["FICHA"] ||
        Limpio["NUMERO DE FICHA"] ||
        Limpio["NO. DE FICHA"] ||
        Limpio["ID_FICHA"] ||
        "";

      const numFicha = parseInt(String(numFichaRaw).replace(/\D/g, ""), 10);
      if (!numFicha || isNaN(numFicha)) continue;

      // Deduplicacion O(1) en la previsualizacion
      if (fichasVistas.has(numFicha)) continue;
      fichasVistas.add(numFicha);

      // Nivel de formacion (para filtro de Formacion Titulada)
      const nivelRaw =
        Limpio["NIVEL DE FORMACION"] ||
        Limpio["NIVEL_FORMACION"] ||
        Limpio["NIVEL FORMACION"] ||
        Limpio["NIVEL"] ||
        Limpio["NIVFOR_PROGRAMA"] ||
        "";
      const nivelNormalizado = String(nivelRaw).trim().toUpperCase();
      const nivelSinTildes = nivelNormalizado.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      if (filtrarSoloTitulada && nivelSinTildes) {
        const esTitulada = NIVELES_TITULADA.some(nt => nivelSinTildes.includes(nt));
        if (!esTitulada) {
          omitidosPorTipo++;
          continue;
        }
      }

      // Identificacion y Validacion Estricta del Programa
      const nombreProgramaRaw =
        Limpio["NOMBRE DEL PROGRAMA"] ||
        Limpio["NOMBRE_PROGRAMA_FORMACION"] ||
        Limpio["PROGRAMA DE FORMACIÓN"] ||
        Limpio["PROGRAMA DE FORMACION"] ||
        Limpio["PROGRAMA FORMACIÓN"] ||
        Limpio["PROGRAMA FORMACION"] ||
        Limpio["NOM_PROGRAMA"] ||
        Limpio["PROGRAMA"] ||
        "";

      const idProgramaRaw = Limpio["ID_PROGRAMA"] || "";
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
            // El programa no existe en la base de datos
            idProgramaAsignado = null;
            nombreProgramaFinal = nombreParaBuscar;
          }
        }
      }

      // Calculo matematico y obligatorio de las 4 fechas del ciclo formativo SENA
      const fechasCalculadas = calcularFechasCompletasFicha({
        fecIniLecRaw:
          Limpio["FECINILEC_FICHA"] ||
          Limpio["FECHA_INICIO_FICHA"] ||
          Limpio["FECHA INICIO"] ||
          Limpio["FECHA DE INICIO"],
        fecFinLecRaw:
          Limpio["FECFINLEC_FICHA"] ||
          Limpio["FECHA_FIN_LECTIVA"],
        fecIniPraRaw:
          Limpio["FECINIPRA_FICHA"] ||
          Limpio["FECHA_INICIO_PRACTICA"] ||
          Limpio["INICIO ETAPA PRODUCTIVA"] ||
          Limpio["ETAPA PRODUCTIVA"],
        fecFinPraRaw:
          Limpio["FECFINPRA_FICHA"] ||
          Limpio["FECHA_TERMINACION_FICHA"] ||
          Limpio["FECHA FIN"] ||
          Limpio["FECHA TERMINACIÓN FICHA"] ||
          Limpio["FECHA TERMINACION FICHA"] ||
          Limpio["FECHA TERMINACION"] ||
          Limpio["TERMINACION"],
        nivelFormacion: nivelNormalizado
      });

      const { fecIniLec, fecFinLec, fecIniPra, fecFinPra } = fechasCalculadas;

      const yaExisteFicha = mapaFichas.has(numFicha);
      const estadoCurso = Limpio["ESTADO_CURSO"] || Limpio["ESTADO_FICHA"] || Limpio["ESTADO FICHA"] || Limpio["ESTADO"] || "En ejecucion";
      const tieneProgramaValido = Boolean(idProgramaAsignado);
      const nombreMostrar = (nombreProgramaFinal || "SIN PROGRAMA DETECTADO").toUpperCase();

      Datos.push({
        Num_Ficha: numFicha,
        Id_Programa: idProgramaAsignado,
        Nom_Programa: nombreMostrar,
        programaValido: tieneProgramaValido,
        errorPrograma: tieneProgramaValido ? null : `El programa "${nombreMostrar}" no está registrado en el sistema. Debe crearlo primero en el módulo de Programas.`,
        Nivel_Formacion: (nivelNormalizado || "TECNOLOGO").toUpperCase(),
        FecIniLec_Ficha: fecIniLec,
        FecFinLec_Ficha: fecFinLec,
        FecIniPra_Ficha: fecIniPra,
        FecFinPra_Ficha: fecFinPra,
        Estado_Curso: estadoCurso,
        yaExiste: yaExisteFicha,
        accion: yaExisteFicha ? "Actualizar" : "Crear"
      });
    }

    const fichasValidas = Datos.filter(d => d.programaValido);
    const fichasSinPrograma = Datos.filter(d => !d.programaValido);

    return res.status(200).json({
      total: Datos.length,
      hojaDetectada: nombreHoja,
      data: Datos,
      validas: fichasValidas.length,
      invalidasSinPrograma: fichasSinPrograma.length,
      omitidosCursosEspeciales: omitidosPorTipo,
      nuevas: fichasValidas.filter(d => !d.yaExiste).length,
      aActualizar: fichasValidas.filter(d => d.yaExiste).length
    });
  } catch (error) {
    console.error("Error en previewImportFicha:", error);
    return res.status(500).json({ message: "Error al leer el archivo de fichas. Verifica el formato." });
  }
};

/**
 * Persiste o actualiza (upsert) las fichas aprobadas por el administrador.
 * REGLA ESTRICTA: Solo permite subir fichas cuyo programa ya exista en la base de datos.
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

    const todasFichasBD = await FichasModel.findAll();
    const mapaFichasBD = new Map();
    todasFichasBD.forEach(f => mapaFichasBD.set(Number(f.Num_Ficha), f));

    let Creados = 0;
    let Actualizados = 0;
    let Omitidos = 0;
    const Errores = [];

    // Procesamos en lotes concurrentes para alta velocidad sin bloquear la base de datos
    const CHUNK_SIZE = 25;
    for (let i = 0; i < fichas.length; i += CHUNK_SIZE) {
      const lote = fichas.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        lote.map(async (Fila) => {
          try {
            const numFicha = parseInt(Fila.Num_Ficha, 10);
            if (!numFicha || isNaN(numFicha)) {
              Omitidos++;
              Errores.push("Fila omitida: falta Num_Ficha valido.");
              return;
            }

            // Resolver Id_Programa exclusivamente contra programas existentes
            let idPrograma = Fila.Id_Programa ? parseInt(Fila.Id_Programa, 10) : null;

            if (!idPrograma || !mapaProgramasPorId.has(idPrograma)) {
              const nombreBuscar = normalizarNombrePrograma(Fila.Nom_Programa);
              if (nombreBuscar && mapaProgramasPorNombre.has(nombreBuscar)) {
                idPrograma = mapaProgramasPorNombre.get(nombreBuscar).Id_Programa;
              }
            }

            // REGLA OBLIGATORIA: Si el programa no existe en el sistema, NO DEJAR SUBIR ESTA FICHA
            if (!idPrograma || !mapaProgramasPorId.has(idPrograma)) {
              Omitidos++;
              Errores.push(`Ficha #${numFicha} rechazada: El programa "${Fila.Nom_Programa || 'No especificado'}" no existe en el sistema. Primero debe registrar el programa.`);
              return;
            }

            // Calculo matematico y obligatorio de las 4 fechas del ciclo formativo SENA
            const fechasResueltas = calcularFechasCompletasFicha({
              fecIniLecRaw: Fila.FecIniLec_Ficha,
              fecFinLecRaw: Fila.FecFinLec_Ficha,
              fecIniPraRaw: Fila.FecIniPra_Ficha,
              fecFinPraRaw: Fila.FecFinPra_Ficha,
              nivelFormacion: Fila.Nivel_Formacion || "TECNOLOGO"
            });

            const fecFinPra = fechasResueltas.fecFinPra;
            const fecIniPra = fechasResueltas.fecIniPra;
            const fecFinLec = fechasResueltas.fecFinLec;
            const fecIniLec = fechasResueltas.fecIniLec;

            // Verificamos si la ficha ya existe para hacer UPSERT
            const fichaExistente = mapaFichasBD.get(numFicha);

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

              await encolarEventoSync({
                entidad: "FICHA",
                operacion: "UPDATE",
                entity_uuid: numFicha,
                payload: {
                  Id_Ficha: fichaExistente.Id_Ficha,
                  Num_Ficha: numFicha,
                  Id_Programa: idPrograma || fichaExistente.Id_Programa,
                  FecIniLec_Ficha: fecIniLec || fichaExistente.FecIniLec_Ficha,
                  FecFinLec_Ficha: fecFinLec || fichaExistente.FecFinLec_Ficha,
                  FecIniPra_Ficha: fecIniPra || fichaExistente.FecIniPra_Ficha,
                  FecFinPra_Ficha: fecFinPra || fichaExistente.FecFinPra_Ficha
                }
              }).catch(() => {});

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

              await encolarEventoSync({
                entidad: "FICHA",
                operacion: "CREATE",
                entity_uuid: numFicha,
                payload: {
                  Id_Ficha: nuevaFicha.Id_Ficha,
                  Num_Ficha: nuevaFicha.Num_Ficha,
                  Id_Programa: nuevaFicha.Id_Programa,
                  FecIniLec_Ficha: nuevaFicha.FecIniLec_Ficha,
                  FecFinLec_Ficha: nuevaFicha.FecFinLec_Ficha,
                  FecIniPra_Ficha: nuevaFicha.FecIniPra_Ficha,
                  FecFinPra_Ficha: nuevaFicha.FecFinPra_Ficha
                }
              }).catch(() => {});

              mapaFichasBD.set(numFicha, nuevaFicha);
              Creados++;
            }
          } catch (errFila) {
            Omitidos++;
            Errores.push(`Error al procesar ficha #${Fila.Num_Ficha || '?'}: ${errFila.message}`);
          }
        })
      );
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