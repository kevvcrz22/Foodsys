import express from "express";
import multer from "multer";

import { 
  getAllPlatos, 
  getPlato, 
  createPlato, 
  updatePlato, 
  deletePlato 
} from "../Controllers/PlatosControllers.js";

const router = express.Router();

// 🔥 CONFIGURACIÓN MULTER
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// 🔥 RUTAS
router.get('/', getAllPlatos);
router.get('/:id', getPlato);

// 👇 AQUÍ ESTÁ LA CLAVE
router.post('/', upload.single("imagen"), createPlato);
router.put('/:id', upload.single("imagen"), updatePlato);

router.delete('/:id', deletePlato);

export default router;