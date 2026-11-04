
// Node/Services/PlatosService.js
// Servicio de gestion de platos con sincronizacion bidireccional automatica (La Granja <-> Hetzner)
// Comentarios didacticos sin tildes ni emojis para aprendices de primer semestre.

import PlatoModel from "../Models/PlatosModels.js";
import { encolarEventoSync } from "./SyncOutboxService.js";
import { normalizarTexto } from "../Utils/textUtils.js";
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
    // Validacion de duplicados normalizando nombre y descripcion
    const nombreNorm = normalizarTexto(data.Nom_Plato);
    const descNorm = normalizarTexto(data.Des_Plato);
    const tipoItem = data.Tipo_Item || "PLATO";

    const existentes = await PlatoModel.findAll({ where: { Tipo_Item: tipoItem } });
    const esDuplicado = existentes.some(item =>
      normalizarTexto(item.Nom_Plato) === nombreNorm &&
      normalizarTexto(item.Des_Plato) === descNorm
    );

    if (esDuplicado) {
      throw new Error("Ya existe un registro con el mismo nombre y descripcion en la base de datos");
    }

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
        Tipo_Item: plato.Tipo_Item,
        Subtipo_Bebida: plato.Subtipo_Bebida,
        Tip_Comida_Item: plato.Tip_Comida_Item,
        Img_Plato: plato.Img_Plato,
        Img_Base64: imgBase64
      }
    });

    return plato;
  }

  async update(id, data) {
    const platoExistente = await PlatoModel.findByPk(id);
    if (!platoExistente) throw new Error("Plato no encontrado");

    // Validacion de duplicados al actualizar
    if (data.Nom_Plato) {
      const nombreNorm = normalizarTexto(data.Nom_Plato);
      const descNorm = normalizarTexto(data.Des_Plato !== undefined ? data.Des_Plato : platoExistente.Des_Plato);
      const tipoItem = data.Tipo_Item || platoExistente.Tipo_Item;

      const existentes = await PlatoModel.findAll({ where: { Tipo_Item: tipoItem } });
      const esDuplicado = existentes.some(item =>
        item.Id_Plato !== id &&
        normalizarTexto(item.Nom_Plato) === nombreNorm &&
        normalizarTexto(item.Des_Plato) === descNorm
      );

      if (esDuplicado) {
        throw new Error("Ya existe un registro con el mismo nombre y descripcion en la base de datos");
      }
    }

    const [updated] = await PlatoModel.update(data, { where: { Id_Plato: id } });
    if (updated === 0 && data.Img_Plato === platoExistente.Img_Plato) {
      // Si no hubo cambios de campos
      return true;
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
        Tipo_Item: platoActualizado.Tipo_Item,
        Subtipo_Bebida: platoActualizado.Subtipo_Bebida,
        Tip_Comida_Item: platoActualizado.Tip_Comida_Item,
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