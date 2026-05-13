// Node/Controllers/ProgramaController.js
// Controladores del modulo de programas para el sistema Foodsys
// Nomenclatura: PascalCase en espanol sin tildes

import ProgramaService from "../Services/ProgramaService.js";
import ProgramaModel from "../Models/ProgramaModel.js";
import XLSX from "xlsx";

/* ============================================================
   COLUMNAS_PLANTILLA_PROGRAMA
   Las tres columnas que el administrador debe llenar en el Excel.
   Los nombres son exactamente los que el administrador reconoce
   en el sistema; el controlador se encarga de mapearlos a los
   campos internos del modelo antes de persistir.
============================================================ */
const COLUMNAS_PLANTILLA_PROGRAMA = [
  "Id Programa",        // Solo referencia visual; se ignora al crear (autoIncrement)
  "Nombre del Programa", // Mapeado a Nom_Programa
  "Nombre del Area",     // Mapeado a Are_Programa (sin tilde para evitar problemas de encoding)
];

// ─────────────────────────────────────────────────────────────
// CRUD BASICO — no se modifica nada de lo que ya funcionaba
// ─────────────────────────────────────────────────────────────

/*
  getAllPrograma
  Consulta sin filtros; devuelve todos los programas ordenados
  por Id descendente (los mas recientes primero).
*/
export const getAllPrograma = async (req, res) => {
  try {
    const Programa = await ProgramaService.getAll();
    res.status(200).json(Programa);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
  getPrograma
  Paso 1: Se convierte el parametro de la URL a entero con parseInt.
  Paso 2: El servicio busca por PK y lanza error si no existe.
  Paso 3: 404 si no se encontro; 200 con el objeto si se encontro.
*/
export const getPrograma = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const Programa = await ProgramaService.getById(id);
    res.status(200).json(Programa);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

/*
  createPrograma
  El body debe traer al menos Nom_Programa y Are_Programa.
  El servicio delega la insercion a Sequelize.
  201 indica que se creo un nuevo recurso en la BD.
*/
export const createPrograma = async (req, res) => {
  try {
    const Programa = await ProgramaService.create(req.body);
    res.status(201).json({ message: "Programa creado", Programa });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/*
  updatePrograma
  parseInt garantiza que el Id sea un numero antes de enviarlo al servicio.
  El servicio valida que el registro exista y que haya al menos un cambio real.
*/
export const updatePrograma = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await ProgramaService.update(id, req.body);
    res.status(200).json({ message: "Programa actualizado correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/*
  deletePrograma
  204 No Content es la respuesta estandar para eliminaciones exitosas;
  no se envia cuerpo porque el recurso ya no existe.
*/
export const deletePrograma = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await ProgramaService.delete(id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// IMPORTACION EXCEL — flujo de tres pasos
//
// Paso A — descargarPlantillaPrograma  : descarga el .xlsx vacio
// Paso B — previewImportPrograma       : lee el archivo y devuelve
//                                        datos sin persistir
// Paso C — importarProgramasSeleccionados: persiste los aprobados
// ─────────────────────────────────────────────────────────────

/*
  descargarPlantillaPrograma  (Paso A)
  Genera un libro Excel con una sola hoja llamada "Programas"
  y los tres encabezados definidos en COLUMNAS_PLANTILLA_PROGRAMA.
  El administrador llena este archivo y lo sube en el Paso B.
  No requiere autenticacion para que pueda descargarse libremente.
*/
export const descargarPlantillaPrograma = (_req, res) => {
  try {
    const Libro = XLSX.utils.book_new();
    const Hoja = XLSX.utils.aoa_to_sheet([COLUMNAS_PLANTILLA_PROGRAMA]);
    Hoja["!cols"] = COLUMNAS_PLANTILLA_PROGRAMA.map(() => ({ wch: 26 }));
    XLSX.utils.book_append_sheet(Libro, Hoja, "Programas");

    const Buffer = XLSX.write(Libro, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", 'attachment; filename="plantilla_programas.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(Buffer);
  } catch (error) {
    res.status(500).json({ message: "Error al generar la plantilla de programas." });
  }
};

/*
  previewImportPrograma  (Paso B)
  Paso 1: multer (memoryStorage) entrega el archivo en req.file.buffer.
          El archivo nunca toca el disco; se procesa completamente en RAM.
  Paso 2: XLSX.read parsea el buffer y convierte la primera hoja a JSON.
  Paso 3: Se limpian espacios en los nombres de columna para evitar
          errores silenciosos por espacios invisibles en los encabezados.
  Paso 4: Se mapean los nombres del Excel a los campos del modelo:
          "Nombre del Programa" -> Nom_Programa
          "Nombre del Area"     -> Are_Programa
  Paso 5: Se devuelve el conteo y el array para la tabla de preview.
          Nada se escribe en la base de datos en este paso.
*/
export const previewImportPrograma = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Archivo requerido" });
    }

    const Workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const Hoja = Workbook.Sheets[Workbook.SheetNames[0]];
    const Filas = XLSX.utils.sheet_to_json(Hoja, { defval: "" });

    if (!Filas.length) {
      return res.status(400).json({ message: "El archivo esta vacio o no tiene datos." });
    }

    // Limpiar espacios y mapear columnas Excel a campos del modelo
    const Datos = Filas.map((Fila) => {
      const Limpio = {};
      for (const Key of Object.keys(Fila)) {
        Limpio[Key.trim()] = Fila[Key];
      }
      return {
        Nom_Programa: Limpio["Nombre del Programa"] ?? "",
        Are_Programa: Limpio["Nombre del Área"] ?? "",
      };
    });

    return res.status(200).json({ total: Datos.length, data: Datos });
  } catch (error) {
    return res.status(500).json({ message: "Error al leer el archivo. Verifica que uses la plantilla oficial." });
  }
};

/*
  importarProgramasSeleccionados  (Paso C)
  Recibe el array de programas aprobados por el administrador.
  Por cada fila:
    Paso 1: Validar que Nom_Programa no este vacio (campo obligatorio).
    Paso 2: Buscar duplicado por Nom_Programa para evitar repetidos.
    Paso 3: Crear el registro con los datos validados.
  Responde con creados, omitidos y el detalle de cada error.
*/
export const importarProgramasSeleccionados = async (req, res) => {
  try {
    const { programas } = req.body;

    if (!programas?.length) {
      return res.status(400).json({ message: "No hay datos seleccionados" });
    }

    let Creados = 0;
    let Omitidos = 0;
    const Errores = [];

    for (const Fila of programas) {
      // Paso 1: campo minimo obligatorio
      if (!Fila.Nom_Programa) {
        Omitidos++;
        Errores.push(`Fila omitida: falta Nombre del Programa.`);
        continue;
      }

      // Paso 2: duplicado por nombre de programa
      const Existe = await ProgramaModel.findOne({
        where: { Nom_Programa: String(Fila.Nom_Programa).trim() }
      });
      if (Existe) {
        Omitidos++;
        Errores.push(`Programa "${Fila.Nom_Programa}" ya existe en el sistema.`);
        continue;
      }

      // Paso 3: persistir el nuevo programa
      await ProgramaModel.create({
        Nom_Programa: String(Fila.Nom_Programa).trim(),
        Are_Programa: Fila.Are_Programa ? String(Fila.Are_Programa).trim() : null,
      });

      Creados++;
    }

    res.json({ creados: Creados, omitidos: Omitidos, errores: Errores });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};