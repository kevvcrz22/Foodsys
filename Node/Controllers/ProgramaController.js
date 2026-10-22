// Node/Controllers/ProgramaController.js
// Controladores del modulo de programas para el sistema Foodsys
// Nomenclatura: PascalCase en espanol sin tildes

import ProgramaService, { normalizarNombrePrograma } from "../Services/ProgramaService.js";
import ProgramaModel from "../Models/ProgramaModel.js";
import XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ============================================================
   COLUMNAS_PLANTILLA_PROGRAMA
   Las columnas que el administrador reconoce en la plantilla oficial.
============================================================ */
const COLUMNAS_PLANTILLA_PROGRAMA = [
  "Id Programa",          // Solo referencia visual (autoIncrement)
  "Nombre del Programa",   // Mapeado a Nom_Programa
  "Nombre del Area",       // Mapeado a Are_Programa
  "Nivel de Formacion",    // Mapeado a NivFor_Programa
];

// ─────────────────────────────────────────────────────────────
// CRUD BASICO — preservando metodos existentes
// ─────────────────────────────────────────────────────────────

export const getAllPrograma = async (req, res) => {
  try {
    const Programa = await ProgramaService.getAll();
    res.status(200).json(Programa);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPrograma = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const Programa = await ProgramaService.getById(id);
    res.status(200).json(Programa);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createPrograma = async (req, res) => {
  try {
    const Programa = await ProgramaService.create(req.body);
    res.status(201).json({ message: "Programa creado", Programa });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePrograma = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await ProgramaService.update(id, req.body);
    res.status(200).json({ message: "Programa actualizado correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const cambiarEstadoPrograma = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { estado } = req.body || {};
    const resultado = await ProgramaService.cambiarEstado(id, estado);
    res.status(200).json({
      message: `Programa ${resultado.estado === 'Activo' ? 'activado' : 'inactivado'} correctamente`,
      estado: resultado.estado
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePrograma = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await ProgramaService.delete(id);
    res.status(200).json({ message: "Programa inactivado correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// IMPORTACION EXCEL — soporte para plantilla oficial y PE-04
// ─────────────────────────────────────────────────────────────

export const descargarPlantillaPrograma = (_req, res) => {
  try {
    const templatePath = path.resolve(__dirname, "../Templates/Programas_Foodsys_Oficial.xlsx");
    if (fs.existsSync(templatePath)) {
      return res.download(templatePath, "Programas_Foodsys_Oficial.xlsx");
    }

    const Libro = XLSX.utils.book_new();
    const Hoja = XLSX.utils.aoa_to_sheet([COLUMNAS_PLANTILLA_PROGRAMA]);
    Hoja["!cols"] = COLUMNAS_PLANTILLA_PROGRAMA.map(() => ({ wch: 26 }));
    XLSX.utils.book_append_sheet(Libro, Hoja, "Programas");

    const Buffer = XLSX.write(Libro, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", 'attachment; filename="Programas_Foodsys_Oficial.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(Buffer);
  } catch (error) {
    return res.status(500).json({ message: "Error al generar la plantilla de programas." });
  }
};

/**
 * Previsualizacion de importacion de programas:
 * - Detecta columnas de la plantilla propia de Foodsys y del reporte institucional PE-04.
 * - Normaliza los nombres de programas usando normalizarNombrePrograma.
 * - Deduplica registros dentro del archivo y contra la base de datos usando Map en memoria.
 */
export const previewImportPrograma = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Archivo requerido" });
    }

    const Workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const Hoja = Workbook.Sheets[Workbook.SheetNames[0]];

    // Convertimos la hoja a filas raw como matriz de arrays para detectar encabezados si es PE-04
    const matriz = XLSX.utils.sheet_to_json(Hoja, { header: 1, defval: "" });
    if (!matriz.length) {
      return res.status(400).json({ message: "El archivo esta vacio o no tiene datos." });
    }

    // Buscamos en que fila estan los encabezados reales (PE-04 suele tener encabezados en la fila 5, indice 4)
    let filaEncabezados = 0;
    for (let i = 0; i < Math.min(15, matriz.length); i++) {
      const fila = matriz[i].map(c => String(c).trim().toUpperCase());
      if (
        fila.includes("NOMBRE DEL PROGRAMA") ||
        fila.includes("NOM_PROGRAMA") ||
        fila.includes("NOMBRE_PROGRAMA_FORMACION") ||
        fila.includes("PROGRAMA") ||
        fila.includes("IDENTIFICADOR_FICHA") ||
        fila.includes("NUM_FICHA")
      ) {
        filaEncabezados = i;
        break;
      }
    }

    const Filas = XLSX.utils.sheet_to_json(Hoja, { range: filaEncabezados, defval: "" });

    if (!Filas.length) {
      return res.status(400).json({ message: "No se encontraron filas de datos en el archivo." });
    }

    // Consultamos los programas existentes en la base de datos para comparar
    const existentesEnBD = await ProgramaModel.findAll({
      attributes: ["Id_Programa", "Nom_Programa", "Are_Programa", "NivFor_Programa"]
    });
    const mapaBD = new Map();
    existentesEnBD.forEach(p => {
      mapaBD.set(normalizarNombrePrograma(p.Nom_Programa), p);
    });

    // Diccionario en memoria para deduplicar filas dentro del mismo Excel
    const mapaExcel = new Map();

    for (const Fila of Filas) {
      const Limpio = {};
      for (const Key of Object.keys(Fila)) {
        Limpio[Key.trim().toUpperCase()] = Fila[Key];
      }

      // Extraccion flexible de columnas
      const nombreRaw =
        Limpio["NOMBRE DEL PROGRAMA"] ||
        Limpio["NOM_PROGRAMA"] ||
        Limpio["NOMBRE_PROGRAMA_FORMACION"] ||
        Limpio["PROGRAMA DE FORMACION"] ||
        Limpio["PROGRAMA"] ||
        "";

      const nombreNormalizado = normalizarNombrePrograma(nombreRaw);
      if (!nombreNormalizado) continue;

      const areaRaw =
        Limpio["NOMBRE DEL AREA"] ||
        Limpio["NOMBRE DEL ÁREA"] ||
        Limpio["ARE_PROGRAMA"] ||
        Limpio["NOMBRE_NUEVO_SECTOR"] ||
        Limpio["NOMBRE_SECTOR_PROGRAMA"] ||
        Limpio["SECTOR"] ||
        "";

      const nivelRaw =
        Limpio["NIVEL DE FORMACION"] ||
        Limpio["NIVEL DE FORMACIÓN"] ||
        Limpio["NIVEL_FORMACION"] ||
        Limpio["NIVFOR_PROGRAMA"] ||
        Limpio["NIVEL"] ||
        "";

      // Si ya vimos este programa normalizado en este mismo Excel, lo enriquecemos si faltaba area o nivel
      if (mapaExcel.has(nombreNormalizado)) {
        const existente = mapaExcel.get(nombreNormalizado);
        if (!existente.Are_Programa && areaRaw) existente.Are_Programa = String(areaRaw).trim();
        if (!existente.NivFor_Programa && nivelRaw) existente.NivFor_Programa = String(nivelRaw).trim();
        continue;
      }

      const yaExisteEnBD = mapaBD.has(nombreNormalizado);

      mapaExcel.set(nombreNormalizado, {
        Nom_Programa: nombreNormalizado,
        Are_Programa: areaRaw ? String(areaRaw).trim() : (yaExisteEnBD ? mapaBD.get(nombreNormalizado).Are_Programa : ""),
        NivFor_Programa: nivelRaw ? String(nivelRaw).trim() : (yaExisteEnBD ? mapaBD.get(nombreNormalizado).NivFor_Programa : ""),
        yaExisteEnBD,
        Id_Programa_Existente: yaExisteEnBD ? mapaBD.get(nombreNormalizado).Id_Programa : null
      });
    }

    const Datos = Array.from(mapaExcel.values());

    return res.status(200).json({
      total: Datos.length,
      data: Datos,
      nuevos: Datos.filter(d => !d.yaExisteEnBD).length,
      repetidosEnBD: Datos.filter(d => d.yaExisteEnBD).length
    });
  } catch (error) {
    console.error("Error en previewImportPrograma:", error);
    return res.status(500).json({ message: "Error al leer el archivo. Verifica el formato del Excel." });
  }
};

/**
 * Persiste los programas aprobados por el administrador:
 * - Evita duplicados comparando en memoria mediante Map.
 * - Si ya existe, actualiza su area y nivel si venian vacios.
 * - Si es nuevo, lo crea con estado Activo.
 */
export const importarProgramasSeleccionados = async (req, res) => {
  try {
    const { programas } = req.body;

    if (!Array.isArray(programas) || !programas.length) {
      return res.status(400).json({ message: "No hay datos seleccionados para importar" });
    }

    // Precargamos todos los programas existentes en memoria para maxima velocidad
    const todosEnBD = await ProgramaModel.findAll();
    const mapaExistentes = new Map();
    todosEnBD.forEach(p => {
      mapaExistentes.set(normalizarNombrePrograma(p.Nom_Programa), p);
    });

    let Creados = 0;
    let Omitidos = 0;
    const Errores = [];

    for (const Fila of programas) {
      const nombreLimpio = normalizarNombrePrograma(Fila.Nom_Programa);

      if (!nombreLimpio) {
        Omitidos++;
        Errores.push("Fila omitida: falta Nombre del Programa.");
        continue;
      }

      // Verificamos si ya existe en la base de datos o ya fue creado en esta misma peticion
      if (mapaExistentes.has(nombreLimpio)) {
        const existente = mapaExistentes.get(nombreLimpio);
        // Si el existente no tenia area o nivel y ahora si vienen, los actualizamos
        const cambios = {};
        if (!existente.Are_Programa && Fila.Are_Programa) cambios.Are_Programa = String(Fila.Are_Programa).trim();
        if (!existente.NivFor_Programa && Fila.NivFor_Programa) cambios.NivFor_Programa = String(Fila.NivFor_Programa).trim();

        if (Object.keys(cambios).length > 0) {
          await ProgramaModel.update(cambios, { where: { Id_Programa: existente.Id_Programa } });
        }

        Omitidos++;
        continue;
      }

      // Crear nuevo programa con nombre normalizado
      const nuevo = await ProgramaModel.create({
        Nom_Programa: nombreLimpio,
        Are_Programa: Fila.Are_Programa ? String(Fila.Are_Programa).trim() : null,
        NivFor_Programa: Fila.NivFor_Programa ? String(Fila.NivFor_Programa).trim() : null,
        Est_Programa: "Activo"
      });

      // Lo guardamos en el Map para evitar duplicados en filas posteriores
      mapaExistentes.set(nombreLimpio, nuevo);
      Creados++;
    }

    return res.status(200).json({ creados: Creados, omitidos: Omitidos, errores: Errores });
  } catch (error) {
    console.error("Error en importarProgramasSeleccionados:", error);
    return res.status(500).json({ message: "Error interno al importar los programas seleccionados." });
  }
};