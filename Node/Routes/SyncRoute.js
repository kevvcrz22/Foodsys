// Node/Routes/SyncRoute.js
// Rutas de API para sincronizacion offline-first

import Express from "express";
import multer from "multer";
import {
  health,
  push,
  pull,
  status,
  triggerSync,
  exportSyncPackage,
  importSyncPackage
} from "../Controllers/SyncController.js";
import authMiddleware from "../Middleware/authMiddleware.js";

const router = Express.Router();
const uploadMemoria = multer({ storage: multer.memoryStorage() });

// Endpoints entre servidores (nodo local <-> nube)
router.get("/health", health);
router.post("/push", push);
router.get("/pull", pull);

// Endpoints de administracion y contingencia (soporta rutas directas y con /package)
router.get("/status", authMiddleware, status);
router.post("/trigger", authMiddleware, triggerSync);

router.get("/export-package", authMiddleware, exportSyncPackage);
router.get("/package/export", authMiddleware, exportSyncPackage);

router.post("/import-package", authMiddleware, uploadMemoria.any(), importSyncPackage);
router.post("/package/import", authMiddleware, uploadMemoria.any(), importSyncPackage);

export default router;
