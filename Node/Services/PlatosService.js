// Node/Services/PlatosService.js
// Servicio de gestion de platos con sincronizacion bidireccional automatica (La Granja <-> Hetzner)
// Comentarios didacticos sin tildes ni emojis para aprendices de primer semestre.

import PlatoModel from "../Models/PlatosModels.js";
import { encolarEventoSync } from "./SyncOutboxService.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, "../uploads");

const obtenerBase64Imagen = (nombreArchivo) => {
  if (!nombreArchivo) return null;
  try {
    const ruta = path.join(UPLOADS_DIR, nombreArchivo);
    if (fs.existsSync(ruta)) {
      return fs.readFileSync(ruta).toString("base64");
    }
  } catch (err) {
    console.warn("[PlatosService] Nota al leer imagen para sync:", err.message);
  }
  return null;
};

class PlatosService {
  async getAll() {
    return await PlatoModel.findAll({ order: [['Id_Plato', 'DESC']] });
  }

  async getById(id) {
    const plato = await PlatoModel.findByPk(id);
    if (!plato) throw new Error("Plato no encontrado");
    return plato;
  }

  async create(data) {
    const plato = await PlatoModel.create(data);
    const imgBase64 = obtenerBase64Imagen(plato.Img_Plato);

    await encolarEventoSync({
      entidad: "PLATO",
      operacion: "CREATE",
      entity_uuid: plato.Id_Plato,
      payload: {
        Id_Plato: plato.Id_Plato,
        Nom_Plato: plato.Nom_Plato,
        Des_Plato: plato.Des_Plato,
        Tip_Plato: plato.Tip_Plato,
        Img_Plato: plato.Img_Plato,
        Img_Base64: imgBase64
      }
    });

    return plato;
  }

  async update(id, data) {
    const [updated] = await PlatoModel.update(data, { where: { Id_Plato: id } });
    if (updated === 0) {
      const existe = await PlatoModel.findByPk(id);
      if (!existe) throw new Error("Plato no encontrado");
      throw new Error("No hubo cambios en el plato");
    }

    const platoActualizado = await PlatoModel.findByPk(id);
    const imgBase64 = obtenerBase64Imagen(platoActualizado.Img_Plato);

    await encolarEventoSync({
      entidad: "PLATO",
      operacion: "UPDATE",
      entity_uuid: id,
      payload: {
        Id_Plato: id,
        Nom_Plato: platoActualizado.Nom_Plato,
        Des_Plato: platoActualizado.Des_Plato,
        Tip_Plato: platoActualizado.Tip_Plato,
        Img_Plato: platoActualizado.Img_Plato,
        Img_Base64: imgBase64
      }
    });

    return true;
  }

  async delete(id) {
    const plato = await PlatoModel.findByPk(id);
    const deleted = await PlatoModel.destroy({ where: { Id_Plato: id } });
    if (!deleted) throw new Error("Plato no encontrado");

    await encolarEventoSync({
      entidad: "PLATO",
      operacion: "DELETE",
      entity_uuid: id,
      payload: {
        Id_Plato: id,
        Nom_Plato: plato?.Nom_Plato || null
      }
    });

    return true;
  }
}

export default new PlatosService();