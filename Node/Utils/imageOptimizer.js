// Node/Utils/imageOptimizer.js
// Servicio de optimizacion y compresion inteligente de imagenes con Sharp
// Comentarios didacticos sin tildes ni emojis para aprendices de primer semestre.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PlatoModel from "../Models/PlatosModels.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, "../uploads");

let sharpModule = null;
const obtenerSharp = async () => {
  if (sharpModule !== null) return sharpModule;
  try {
    const mod = await import("sharp");
    sharpModule = mod.default || mod;
    return sharpModule;
  } catch {
    sharpModule = false;
    return false;
  }
};

export const optimizarBufferImagen = async (buffer) => {
  if (!buffer) return null;
  const sharp = await obtenerSharp();
  if (!sharp) return buffer;
  return await sharp(buffer)
    .resize(600, 600, {
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({ quality: 78 })
    .toBuffer();
};

export const optimizarArchivoUpload = async (nombreArchivo) => {
  if (!nombreArchivo) return null;
  const sharp = await obtenerSharp();
  if (!sharp) return nombreArchivo;
  const rutaOriginal = path.join(UPLOADS_DIR, nombreArchivo);
  if (!fs.existsSync(rutaOriginal)) return nombreArchivo;

  try {
    const ext = path.extname(nombreArchivo);
    const nombreSinExt = path.basename(nombreArchivo, ext);
    const nuevoNombreWebp = `${nombreSinExt}.webp`;
    const rutaDestinoWebp = path.join(UPLOADS_DIR, nuevoNombreWebp);

    const buffer = fs.readFileSync(rutaOriginal);
    const webpBuffer = await optimizarBufferImagen(buffer);

    fs.writeFileSync(rutaDestinoWebp, webpBuffer);

    // Si cambio de extension y el archivo anterior no es el mismo, eliminar el anterior
    if (rutaOriginal !== rutaDestinoWebp && fs.existsSync(rutaOriginal)) {
      try {
        fs.unlinkSync(rutaOriginal);
      } catch (e) {
        // Ignorar fallo al desvincular archivo temporal
      }
    }

    return nuevoNombreWebp;
  } catch (error) {
    console.warn("[imageOptimizer] Advertencia al optimizar archivo:", error.message);
    return nombreArchivo;
  }
};

export const optimizarImagenesExistentes = async () => {
  const sharp = await obtenerSharp();
  if (!sharp) {
    return { totalProcesados: 0, totalOptimizados: 0, bytesAhorradosKB: 0 };
  }

  let totalProcesados = 0;
  let totalOptimizados = 0;
  let bytesAhorrados = 0;

  try {
    const platos = await PlatoModel.findAll();
    for (const plato of platos) {
      if (!plato.Img_Plato) continue;
      totalProcesados++;

      const rutaArchivo = path.join(UPLOADS_DIR, plato.Img_Plato);
      if (!fs.existsSync(rutaArchivo)) continue;

      const stats = fs.statSync(rutaArchivo);
      const tamanoOriginal = stats.size;

      // Si ya es webp y pesa menos de 65 KB, no requiere recompresion
      if (plato.Img_Plato.endsWith(".webp") && tamanoOriginal <= 65000) {
        continue;
      }

      try {
        const nuevoNombre = await optimizarArchivoUpload(plato.Img_Plato);
        const rutaNueva = path.join(UPLOADS_DIR, nuevoNombre);
        if (fs.existsSync(rutaNueva)) {
          const statsNuevo = fs.statSync(rutaNueva);
          const tamanoNuevo = statsNuevo.size;
          if (tamanoNuevo < tamanoOriginal) {
            bytesAhorrados += (tamanoOriginal - tamanoNuevo);
          }
        }

        if (nuevoNombre !== plato.Img_Plato) {
          await PlatoModel.update(
            { Img_Plato: nuevoNombre },
            { where: { Id_Plato: plato.Id_Plato } }
          );
        }
        totalOptimizados++;
      } catch (errPlato) {
        console.warn(`[imageOptimizer] Error con plato ${plato.Id_Plato}:`, errPlato.message);
      }
    }
  } catch (error) {
    console.error("[imageOptimizer] Error general optimizando imagenes:", error);
  }

  return {
    totalProcesados,
    totalOptimizados,
    bytesAhorradosKB: Math.round(bytesAhorrados / 1024)
  };
};
