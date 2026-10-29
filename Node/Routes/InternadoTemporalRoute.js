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
  actualizarRegistro,
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
router.get("/listar", getRegistros);
router.post("/importar-excel", uploadMemoria.any(), importarExcel);
router.post("/manual", registrarManual);
router.post("/crear", registrarManual);
router.put("/:id", actualizarRegistro);
router.patch("/:id/revocar", eliminarRegistro);
router.delete("/:id", eliminarRegistro);
router.post("/revisar-vencimientos", revisarVencimientos);
router.post("/revisar-vencidos", revisarVencimientos);

export default router;
