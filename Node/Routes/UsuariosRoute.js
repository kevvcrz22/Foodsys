// Node/Routes/UsuariosRoutes.js

import express        from "express";
import multer         from "multer";
import { check }      from "express-validator";
import authMiddleware from "../Middleware/authMiddleware.js";

import {
  RegisterUsuarios,
  Login,
  getAllUsuarios,
  getUsuarios,
  updateUsuarios,
  deleteUsuarios,
  aceptarPolitica,
  getAprendices,
  importarCSV,
  validarPasswordActual,
  cambiarPassword,
  descargarPlantilla,
  previewImport,
  importarSeleccionados,
  ActualizarSancion,
  GetSancionados,
} from '../Controllers/UsuariosControllers.js';

const Router = express.Router();

/*
  MemoryStorage: el archivo llega en req.file.buffer (RAM).
  Nunca se escribe en disco; mas rapido y seguro para archivos temporales.
*/
const Upload = multer({ storage: multer.memoryStorage() });

// ─────────────────────────────────────────────────────────────
// RUTAS ESTATICAS Y ESPECIFICAS
// DEBEN ir ANTES de cualquier ruta con parametro dinamico (/:Id)
// porque Express las evalua en orden y /:Id capturaria todo lo
// que venga despues si estuviera primero.
// ─────────────────────────────────────────────────────────────

// Registro con validaciones minimas
Router.post(
  "/",
  [
    check("TipDoc_Usuario", "Tipo de documento obligatorio").notEmpty(),
    check("NumDoc_Usuario", "Numero de documento obligatorio").notEmpty(),
    check("password", "Minimo 8 caracteres").isLength({ min: 8 }),
  ],
  RegisterUsuarios
);

// Inicio de sesion
Router.post("/login", Login);

// Listado de aprendices
Router.get('/aprendices', authMiddleware, getAprendices);

// Listado de usuarios sancionados (San_Usuario = 'Si')
// Acceso: Coordinador, Bienestar, Administrador
Router.get('/sancionados', authMiddleware, GetSancionados);

// Importacion legacy CSV
Router.post('/importar-csv', authMiddleware, importarCSV);

// ─────────────────────────────────────────────────────────────
// IMPORTACION EXCEL — flujo de tres pasos
// Estas rutas estaticas tambien deben ir antes de /:Id
// ─────────────────────────────────────────────────────────────

/*
  Paso A: descarga la plantilla .xlsx vacia con los encabezados.
  Sin auth porque el admin puede necesitarla antes de autenticarse.
*/
Router.get("/plantilla-excel", descargarPlantilla);

/*
  Paso B: recibe el archivo Excel en RAM (memoryStorage) y devuelve
  un preview con las filas parseadas. No persiste nada en la BD.
*/
Router.post("/preview-import", Upload.single("file"), previewImport);

/*
  Paso C: recibe el array de usuarios aprobados y los persiste.
  La logica de validacion y deduplicacion vive en el controlador.
*/
Router.post("/importar-seleccionados", importarSeleccionados);

// ─────────────────────────────────────────────────────────────
// RUTAS CON PARAMETRO DINAMICO /:Id
// Van SIEMPRE al final para no interceptar las rutas estaticas
// ─────────────────────────────────────────────────────────────

// Consulta publica de todos los usuarios o uno por Id
Router.get("/",    getAllUsuarios);
Router.get("/:Id", getUsuarios);

// Aceptacion de politica de privacidad
Router.patch("/:Id/politica", aceptarPolitica);

// Actualizacion y eliminacion (requieren token)
Router.put(   "/:Id", authMiddleware, updateUsuarios);
Router.delete("/:Id", authMiddleware, deleteUsuarios);

// Cambio de contrasena en dos pasos (requieren token)
Router.post('/:Id/validar-password', authMiddleware, validarPasswordActual);
Router.put( '/:Id/password',         authMiddleware, cambiarPassword);

// Gestion de sanciones: Coordinador, Bienestar y Admin pueden cambiar San_Usuario
// PATCH /:Id/sancion -> { San_Usuario: "Si" | "No" }
Router.patch('/:Id/sancion', authMiddleware, ActualizarSancion);

export default Router;