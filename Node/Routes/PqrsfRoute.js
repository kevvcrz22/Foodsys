// Node/Routes/PqrsfRoute.js
// Rutas de API para el modulo de PQRSF

import Express from "express";
import multer from "multer";
import {
  crearPqrsf,
  responderPqrsf,
  listarPqrsf,
  obtenerRanking,
  exportarExcel,
  exportarPdf
} from "../Controllers/PqrsfController.js";
import authMiddleware from "../Middleware/authMiddleware.js";

const router = Express.Router();
const uploadMemoria = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB maximo
});

// Ruta publica para radicar PQRSF (aprendices, pasantes, comunidad)
router.post("/", uploadMemoria.single("evidencia"), crearPqrsf);

// Rutas administrativas protegidas
router.get("/", authMiddleware, listarPqrsf);
router.get("/ranking", authMiddleware, obtenerRanking);
router.get("/exportar/excel", authMiddleware, exportarExcel);
router.get("/exportar/pdf", authMiddleware, exportarPdf);
router.put("/:id/responder", authMiddleware, responderPqrsf);

export default router;
