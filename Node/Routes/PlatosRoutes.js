// Routes/PlatosRoutes.js
// Rutas del modulo de platos del sistema FoodSys
// Las rutas de escritura estan protegidas con
// authMiddleware

import express from "express";
import multer from "multer";
import authMiddleware from "../Middleware/authMiddleware.js";
import {
  getAllPlatos,
  getPlato,
  createPlato,
  updatePlato,
  deletePlato,
} from "../Controllers/PlatosControllers.js";

const router = express.Router();

// Configuracion de multer para subir imagenes de platos
const Almacenamiento = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const Subida = multer({ storage: Almacenamiento });

// Lectura publica de platos
router.get("/", getAllPlatos);
router.get("/:id", getPlato);

// Escritura protegida con auth
router.post(
  "/",
  authMiddleware,
  Subida.single("imagen"),
  createPlato
);
router.put(
  "/:id",
  authMiddleware,
  Subida.single("imagen"),
  updatePlato
);
router.delete("/:id", authMiddleware, deletePlato);

export default router;