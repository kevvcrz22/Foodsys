// Node/Routes/InternadoTemporalRoute.js
// Rutas de API para el modulo de Internado Temporal SENA Empresa

import Express from "express";
import multer from "multer";
import authMiddleware from "../Middleware/authMiddleware.js";
import {
  getRegistros,
  importarExcel,
  descargarPlantilla,
  registrarManual,
  eliminarRegistro,
  revisarVencimientos
} from "../Controllers/InternadoTemporalController.js";

const router = Express.Router();
const uploadMemoria = multer({ storage: multer.memoryStorage() });

// Descarga publica de plantilla oficial institucional
router.get("/plantilla", descargarPlantilla);

// Rutas protegidas por autenticacion
router.use(authMiddleware);

router.get("/", getRegistros);
router.post("/importar-excel", uploadMemoria.single("file"), importarExcel);
router.post("/manual", registrarManual);
router.delete("/:id", eliminarRegistro);
router.post("/revisar-vencimientos", revisarVencimientos);

export default router;
