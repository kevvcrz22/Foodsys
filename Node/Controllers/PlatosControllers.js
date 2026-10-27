import PlatosService from "../Services/PlatosService.js";
import { optimizarArchivoUpload, optimizarImagenesExistentes } from "../Utils/imageOptimizer.js";

export const getAllPlatos = async (req, res) => {
  try {
    const platos = await PlatosService.getAll();
    res.status(200).json(platos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPlato = async (req, res) => {
  try {
    const plato = await PlatosService.getById(req.params.id);
    res.status(200).json(plato);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createPlato = async (req, res) => {
  try {
    let nombreArchivo = null;
    if (req.file) {
      nombreArchivo = await optimizarArchivoUpload(req.file.filename);
    }

    const data = {
      Nom_Plato: req.body.Nom_Plato,
      Des_Plato: req.body.Des_Plato,
      Tip_Plato: req.body.Tip_Plato || req.body.Tip_Comida_Item || "Todas",
      Tipo_Item: req.body.Tipo_Item || "PLATO",
      Subtipo_Bebida: req.body.Subtipo_Bebida || "NINGUNA",
      Tip_Comida_Item: req.body.Tip_Comida_Item || req.body.Tip_Plato || "Todas",
      Img_Plato: nombreArchivo
    };
    const plato = await PlatosService.create(data);
    res.status(201).json({ message: "Plato o bebida registrado correctamente", plato });
  } catch (error) {
    console.error("ERROR CREATE PLATO:", error);
    res.status(400).json({ message: error.message });
  }
};

export const updatePlato = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const platoExistente = await PlatosService.getById(id);

    let nombreArchivo = platoExistente.Img_Plato;
    if (req.file) {
      nombreArchivo = await optimizarArchivoUpload(req.file.filename);
    }

    const data = {
      Nom_Plato: req.body.Nom_Plato,
      Des_Plato: req.body.Des_Plato,
      Tip_Plato: req.body.Tip_Plato || req.body.Tip_Comida_Item || platoExistente.Tip_Plato,
      Tipo_Item: req.body.Tipo_Item || platoExistente.Tipo_Item || "PLATO",
      Subtipo_Bebida: req.body.Subtipo_Bebida || platoExistente.Subtipo_Bebida || "NINGUNA",
      Tip_Comida_Item: req.body.Tip_Comida_Item || req.body.Tip_Plato || platoExistente.Tip_Comida_Item || "Todas",
      Img_Plato: nombreArchivo
    };
    await PlatosService.update(id, data);
    res.json({ message: "Plato o bebida actualizado correctamente" });
  } catch (error) {
    console.error("ERROR UPDATE PLATO:", error);
    res.status(400).json({ message: error.message });
  }
};

export const deletePlato = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await PlatosService.delete(id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const optimizarImagenes = async (req, res) => {
  try {
    const resultado = await optimizarImagenesExistentes();
    res.json({
      message: "Optimizacion de imagenes completada exitosamente",
      ...resultado
    });
  } catch (error) {
    console.error("ERROR OPTIMIZAR IMAGENES:", error);
    res.status(500).json({ message: error.message });
  }
};