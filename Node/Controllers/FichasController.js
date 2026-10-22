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

    // Hoja 2: Ejemplo estructura institucional SENA PE-04
    const filasPE04 = [
      ["CODIGO_REGIONAL", "NOMBRE_REGIONAL", "CODIGO_CENTRO", "NOMBRE_CENTRO", "IDENTIFICADOR_FICHA", "CODIGO_PROGRAMA_FORMACION", "NOMBRE_PROGRAMA_FORMACION", "NIVEL_FORMACION", "ESTADO_FICHA", "FECHA_INICIO_FICHA", "FECHA_TERMINACION_FICHA", "FECHA_INICIO_PRACTICA", "FECHA_FIN_LECTIVA"],
      [73, "REGIONAL TOLIMA", 9123, "CENTRO AGROPECUARIO LA GRANJA", 3404817, 723101, "GESTION DE EMPRESAS AGROPECUARIAS", "TECNOLOGO", "EN EJECUCION", "2026-04-15", "2027-10-15", "2027-04-15", "2027-04-14"]
    ];
    const Hoja2 = XLSX.utils.aoa_to_sheet(filasPE04);
    Hoja2["!cols"] = filasPE04[0].map(() => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(Libro, Hoja2, "Ejemplo_PE-04");

    const Buffer = XLSX.write(Libro, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", 'attachment; filename="Plantilla_Fichas_Foodsys_PE04.xlsx"');
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

    const { soloTitulada = "true" } = req.query;
    const filtrarSoloTitulada = soloTitulada === "true" || soloTitulada === true;

    const Workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const Hoja = Workbook.Sheets[Workbook.SheetNames[0]];

    const matriz = XLSX.utils.sheet_to_json(Hoja, { header: 1, defval: "" });
    if (!matriz.length) {
      return res.status(400).json({ message: "El archivo esta vacio o no tiene datos." });
    }

    // Buscamos la fila de encabezados reales
    let filaEncabezados = 0;
    for (let i = 0; i < Math.min(15, matriz.length); i++) {
      const fila = matriz[i].map(c => String(c).trim().toUpperCase());
      if (
        fila.includes("NUM_FICHA") ||
        fila.includes("IDENTIFICADOR_FICHA") ||
        fila.includes("FICHA") ||
        fila.includes("ID_FICHA") ||
        fila.includes("NUMERO DE FICHA")
      ) {
        filaEncabezados = i;
        break;
      }
    }

    const Filas = XLSX.utils.sheet_to_json(Hoja, { range: filaEncabezados, defval: "" });

    if (!Filas.length) {
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
        Limpio["ID_FICHA"] ||
        "";

      const numFicha = parseInt(String(numFichaRaw).replace(/\D/g, ""), 10);
      if (!numFicha || isNaN(numFicha)) continue;

      // Nivel de formacion (para filtro de Formacion Titulada)
      const nivelRaw =
        Limpio["NIVEL DE FORMACION"] ||
        Limpio["NIVEL_FORMACION"] ||
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

      // Identificacion del Programa
      const nombreProgramaRaw =
        Limpio["NOMBRE DEL PROGRAMA"] ||
        Limpio["NOMBRE_PROGRAMA_FORMACION"] ||
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
            // En la previsualizacion NO mutamos la base de datos para garantizar rapidez y cero bloqueos
            idProgramaAsignado = null;
            nombreProgramaFinal = nombreParaBuscar;
          }
        }
      }

      // Extraccion de Fechas
      const fecIniLec = formatearFechaISO(Limpio["FECINILEC_FICHA"] || Limpio["FECHA_INICIO_FICHA"] || Limpio["FECHA INICIO"]);
      let fecFinPra = formatearFechaISO(Limpio["FECFINPRA_FICHA"] || Limpio["FECHA_TERMINACION_FICHA"] || Limpio["FECHA FIN"]);
      let fecIniPra = formatearFechaISO(Limpio["FECINIPRA_FICHA"] || Limpio["FECHA_INICIO_PRACTICA"]);
      let fecFinLec = formatearFechaISO(Limpio["FECFINLEC_FICHA"] || Limpio["FECHA_FIN_LECTIVA"]);

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
      const estadoCurso = Limpio["ESTADO_CURSO"] || Limpio["ESTADO_FICHA"] || Limpio["ESTADO"] || "En ejecucion";

      Datos.push({
        Num_Ficha: numFicha,
        Id_Programa: idProgramaAsignado,
        Nom_Programa: nombreProgramaFinal || "Sin programa detectado",
        Nivel_Formacion: nivelNormalizado || "TECNOLOGO",
        FecIniLec_Ficha: fecIniLec,
        FecFinLec_Ficha: fecFinLec,
        FecIniPra_Ficha: fecIniPra,
        FecFinPra_Ficha: fecFinPra,
        Estado_Curso: estadoCurso,
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
    return res.status(500).json({ message: "Error al leer el archivo de fichas. Verifica el formato." });
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

            // Resolver Id_Programa
            let idPrograma = Fila.Id_Programa ? parseInt(Fila.Id_Programa, 10) : null;

            if (!idPrograma || !mapaProgramasPorId.has(idPrograma)) {
              const nombreBuscar = normalizarNombrePrograma(Fila.Nom_Programa);
              if (nombreBuscar && mapaProgramasPorNombre.has(nombreBuscar)) {
                idPrograma = mapaProgramasPorNombre.get(nombreBuscar).Id_Programa;
              } else if (nombreBuscar) {
                // Crear programa de forma segura capturando posibles carreras concurrentes
                try {
                  const nuevoProg = await ProgramaModel.create({
                    Nom_Programa: nombreBuscar,
                    Are_Programa: Fila.Are_Programa || Fila.NOMBRE_NUEVO_SECTOR || "FORMACION",
                    NivFor_Programa: Fila.NivFor_Programa || Fila.Nivel_Formacion || "TECNOLOGO",
                    Est_Programa: "Activo"
                  });
                  idPrograma = nuevoProg.Id_Programa;
                  mapaProgramasPorId.set(nuevoProg.Id_Programa, nuevoProg);
                  mapaProgramasPorNombre.set(nombreBuscar, nuevoProg);
                } catch (errProg) {
                  const existenteP = await ProgramaModel.findOne({ where: { Nom_Programa: nombreBuscar } });
                  if (existenteP) {
                    idPrograma = existenteP.Id_Programa;
                    mapaProgramasPorId.set(existenteP.Id_Programa, existenteP);
                    mapaProgramasPorNombre.set(nombreBuscar, existenteP);
                  }
                }
              }
            }

            // Fallback de seguridad: si la fila no traia programa o no se resolvio, asociar a PROGRAMA GENERAL
            if (!idPrograma) {
              let progGeneral = mapaProgramasPorNombre.get("PROGRAMA GENERAL") || mapaProgramasPorNombre.get("GENERAL");
              if (!progGeneral) {
                try {
                  progGeneral = await ProgramaModel.create({
                    Nom_Programa: "PROGRAMA GENERAL",
                    Are_Programa: "GENERAL",
                    NivFor_Programa: "TECNOLOGO",
                    Est_Programa: "Activo"
                  });
                } catch {
                  progGeneral = await ProgramaModel.findOne({ where: { Nom_Programa: "PROGRAMA GENERAL" } });
                }
                if (progGeneral) {
                  mapaProgramasPorId.set(progGeneral.Id_Programa, progGeneral);
                  mapaProgramasPorNombre.set("PROGRAMA GENERAL", progGeneral);
                }
              }
              if (progGeneral) {
                idPrograma = progGeneral.Id_Programa;
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