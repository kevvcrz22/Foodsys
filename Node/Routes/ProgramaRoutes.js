// Node/Routes/ProgramaRoutes.js
// Rutas del modulo de programas del sistema FoodSys
// Rutas estaticas SIEMPRE antes de rutas con parametro dinamico (/:id)
// para que Express no interprete "plantilla-excel" o "preview-import"
// como un valor de :id.

import express        from "express";
import multer         from "multer";
import authMiddleware from "../Middleware/authMiddleware.js";
import {
  // CRUD basico — no se modifico
  getAllPrograma,
  getPrograma,
  createPrograma,
  updatePrograma,
  deletePrograma,
  // Importacion Excel en tres pasos
  descargarPlantillaPrograma,
  previewImportPrograma,
  importarProgramasSeleccionados,
} from "../Controllers/ProgramaController.js";

const Router = express.Router();

/*
  MemoryStorage: el archivo subido vive en req.file.buffer (RAM).
  No se escribe en disco; mas rapido y seguro para archivos temporales.
*/
const Upload = multer({ storage: multer.memoryStorage() });

// ─────────────────────────────────────────────────────────────
// RUTAS ESTATICAS — van primero para no ser capturadas por /:id
// ─────────────────────────────────────────────────────────────

// Lectura publica de todos los programas
Router.get("/", getAllPrograma);

/*
  Paso A: descarga la plantilla .xlsx vacia con los tres encabezados.
  Publica para que el administrador la obtenga sin necesitar token.
*/
Router.get("/plantilla-excel", descargarPlantillaPrograma);

/*
  Paso B: recibe el Excel, lo parsea en RAM y devuelve el preview.
  multer.single("file") espera un campo de formulario llamado "file".
  No persiste nada en la BD.
*/
Router.post("/preview-import", Upload.single("file"), previewImportPrograma);

/*
  Paso C: recibe el array JSON de programas aprobados y los persiste.
  authMiddleware protege la escritura real en la base de datos.
*/
Router.post("/importar-seleccionados", authMiddleware, importarProgramasSeleccionados);

// Creacion de un programa individual (formulario manual)
Router.post("/", authMiddleware, createPrograma);

// ─────────────────────────────────────────────────────────────
// RUTAS CON PARAMETRO DINAMICO — siempre al final
// ─────────────────────────────────────────────────────────────

Router.get("/:id",    getPrograma);
Router.put("/:id",    authMiddleware, updatePrograma);
Router.delete("/:id", authMiddleware, deletePrograma);

export default Router;