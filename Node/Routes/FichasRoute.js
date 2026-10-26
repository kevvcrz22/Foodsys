// Routes/FichasRoute.js
// Rutas del modulo de fichas del sistema Foodsys
// Comentarios didacticos para aprendices de primer semestre sin tildes ni emojis

import express from "express";
import multer from "multer";
import authMiddleware from "../Middleware/authMiddleware.js";
import {
  getAllFichas,
  getFichas,
  createFichas,
  updateFichas,
  deleteFichas,
  descargarPlantillaFicha,
  previewImportFicha,
  importarFichasSeleccionadas
} from "../Controllers/FichasController.js";

const router = express.Router();

// Configuracion de multer en memoria (RAM) para procesar archivos Excel sin tocar disco
const Upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // limite de 50 MB suficiente para archivos PE-04 masivos
});

// Lectura de fichas y descarga de plantilla oficial
router.get("/", getAllFichas);
router.get("/plantilla-excel", descargarPlantillaFicha);
router.get("/descargar-plantilla", descargarPlantillaFicha);
router.get("/plantilla", descargarPlantillaFicha);

// Rutas de importacion masiva de fichas (deben ir ANTES de /:id para no ser interpretadas como parametro)
router.post("/preview-import", Upload.single("file"), previewImportFicha);
router.post("/importar-seleccionadas", authMiddleware, importarFichasSeleccionadas);

// Lectura de una ficha especifica por su clave primaria
router.get("/:id", getFichas);

// Escritura y modificacion protegida con autenticacion
router.post("/", authMiddleware, createFichas);
router.put("/:id", authMiddleware, updateFichas);
router.delete("/:id", authMiddleware, deleteFichas);

export default router;