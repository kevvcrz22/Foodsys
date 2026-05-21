// Node/Controllers/FichasController.js
// Controladores del modulo de fichas para el sistema Foodsys
// Nomenclatura: PascalCase en espanol sin tildes

import FichasServices from "../Services/FichasServices.js";
import FichasModel from "../Models/FichasModel.js";
import ProgramaModel from "../Models/ProgramaModel.js";
import XLSX from "xlsx";

/* ============================================================
   COLUMNAS_PLANTILLA_FICHA
   Coinciden exactamente con los campos del modelo FichasModel
   que el administrador debe completar. Id_Ficha se omite porque
   es autoIncrement y la BD lo asigna automaticamente.
============================================================ */
const COLUMNAS_PLANTILLA_FICHA = [
  "Num_Ficha",        // Numero identificador de la ficha
  "FecIniLec_Ficha",  // Fecha inicio fase lectiva  (formato: YYYY-MM-DD)
  "FecFinLec_Ficha",  // Fecha fin fase lectiva
  "FecIniPra_Ficha",  // Fecha inicio fase practica
  "FecFinPra_Ficha",  // Fecha fin fase practica
  "Id_Programa",      // FK hacia la tabla programas
];

// ─────────────────────────────────────────────────────────────
// CRUD BASICO — no se modifica nada de lo que ya funcionaba
// ─────────────────────────────────────────────────────────────

/*
  getAllFichas
  Devuelve todas las fichas con el nombre del programa relacionado.
  El servicio usa include de Sequelize para hacer el JOIN automaticamente.
*/
export const getAllFichas = async (req, res) => {
  try {
    const Fichas = await FichasServices.getAll();
    res.status(200).json(Fichas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
  getFichas
  Busca una ficha especifica por su Id_Ficha.
  404 si no se encontro en la base de datos.
*/
export const getFichas = async (req, res) => {
  try {
    const Fichas = await FichasServices.getById(req.params.id);
    res.status(200).json(Fichas);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

/*
  createFichas
  Crea una ficha nueva con los datos del body.
  201 indica que se genero un nuevo recurso en la BD.
*/
export const createFichas = async (req, res) => {
  try {
    const Fichas = await FichasServices.create(req.body);
    res.status(201).json({ message: "Ficha Creada", Fichas });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/*
  updateFichas
  parseInt convierte el id de la URL a entero antes de enviarlo al servicio.
  El servicio valida que exista y que haya al menos un campo diferente.
*/
export const updateFichas = async (req, res) => {
  try {
    await FichasServices.update(parseInt(req.params.id), req.body);
    res.status(200).json({ message: "Ficha Actualizada Correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/*
  deleteFichas
  204 No Content es la respuesta estandar para eliminaciones exitosas.
  No se envia cuerpo porque el recurso ya no existe.
*/
export const deleteFichas = async (req, res) => {
  try {
    await FichasServices.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// IMPORTACION EXCEL — flujo de tres pasos
//
// Paso A — descargarPlantillaFicha      : descarga el .xlsx vacio
// Paso B — previewImportFicha           : lee el archivo y devuelve
//                                         los datos sin persistir
// Paso C — importarFichasSeleccionadas  : persiste las filas aprobadas
// ─────────────────────────────────────────────────────────────

/*
  descargarPlantillaFicha  (Paso A)
  Genera un libro Excel con una sola hoja llamada "Fichas" y los
  encabezados definidos en COLUMNAS_PLANTILLA_FICHA.
  Las fechas deben ingresarse en formato YYYY-MM-DD para que
  Sequelize las interprete correctamente como DataTypes.DATE.
*/
export const descargarPlantillaFicha = (_req, res) => {
  try {
    const Libro = XLSX.utils.book_new();
    const Hoja = XLSX.utils.aoa_to_sheet([COLUMNAS_PLANTILLA_FICHA]);
    Hoja["!cols"] = COLUMNAS_PLANTILLA_FICHA.map(() => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(Libro, Hoja, "Fichas");

    const Buffer = XLSX.write(Libro, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", 'attachment; filename="plantilla_fichas.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(Buffer);
  } catch (error) {
    res.status(500).json({ message: "Error al generar la plantilla de fichas." });
  }
};

/*
  previewImportFicha  (Paso B)
  Paso 1: multer (memoryStorage) entrega el archivo en req.file.buffer.
          Nunca se escribe en disco.
  Paso 2: XLSX.read parsea el buffer en memoria.
  Paso 3: sheet_to_json convierte cada fila en objeto JS usando los
          encabezados como claves. defval:"" evita undefined en celdas vacias.
  Paso 4: Se limpian espacios en los nombres de columna.
  Paso 5: Se devuelve el total de filas y el array para la preview.
          Nada se escribe en la base de datos en este paso.
*/
export const previewImportFicha = async (req, res) => {
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

    // Limpiar espacios al inicio/fin de cada nombre de columna
    const Datos = Filas.map((Fila) =>
      Object.fromEntries(Object.entries(Fila).map(([K, V]) => [K.trim(), V]))
    );

    return res.status(200).json({ total: Datos.length, data: Datos });
  } catch (error) {
    return res.status(500).json({ message: "Error al leer el archivo. Verifica que uses la plantilla oficial." });
  }
};

/*
  importarFichasSeleccionadas  (Paso C)
  Recibe el array de fichas que el administrador aprobo en la preview.
  Por cada fila:
    Paso 1: Validar que Num_Ficha e Id_Programa esten presentes
            (son los dos campos minimos para una ficha valida).
    Paso 2: Verificar que el Id_Programa exista en la tabla programas;
            no se pueden crear fichas huerfanas sin programa.
    Paso 3: Verificar duplicado por Num_Ficha para evitar fichas repetidas.
    Paso 4: Crear el registro con todos los campos del modelo.
  Responde con creados, omitidos y el detalle de cada error para
  que el administrador sepa exactamente que filas fallaron y por que.
*/
export const importarFichasSeleccionadas = async (req, res) => {
  try {
    const { fichas } = req.body;

    if (!fichas?.length) {
      return res.status(400).json({ message: "No hay datos seleccionados" });
    }

    let Creados = 0;
    let Omitidos = 0;
    const Errores = [];

    for (const Fila of fichas) {
      // Paso 1: campos minimos obligatorios
      if (!Fila.Num_Ficha || !Fila.Id_Programa) {
        Omitidos++;
        Errores.push(`Fila omitida: falta Num_Ficha o Id_Programa (ficha: "${Fila.Num_Ficha || "?"}")`);
        continue;
      }

      // Paso 2: verificar que el programa referenciado exista en la BD
      const ProgramaExiste = await ProgramaModel.findByPk(parseInt(Fila.Id_Programa));
      if (!ProgramaExiste) {
        Omitidos++;
        Errores.push(`Programa Id ${Fila.Id_Programa} no existe (ficha: ${Fila.Num_Ficha}).`);
        continue;
      }

      // Paso 3: duplicado por numero de ficha
      const ExisteFicha = await FichasModel.findOne({
        where: { Num_Ficha: parseInt(Fila.Num_Ficha) }
      });
      if (ExisteFicha) {
        Omitidos++;
        Errores.push(`Ficha ${Fila.Num_Ficha} ya existe en el sistema.`);
        continue;
      }

      // Paso 4: persistir la nueva ficha con todos los campos del modelo
      await FichasModel.create({
        Num_Ficha: parseInt(Fila.Num_Ficha),
        FecIniLec_Ficha: Fila.FecIniLec_Ficha || null,
        FecFinLec_Ficha: Fila.FecFinLec_Ficha || null,
        FecIniPra_Ficha: Fila.FecIniPra_Ficha || null,
        FecFinPra_Ficha: Fila.FecFinPra_Ficha || null,
        Id_Programa: parseInt(Fila.Id_Programa),
      });

      Creados++;
    }

    res.json({ creados: Creados, omitidos: Omitidos, errores: Errores });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};