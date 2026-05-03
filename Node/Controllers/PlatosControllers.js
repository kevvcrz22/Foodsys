import PlatosService from "../Services/PlatosService.js";

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
    const data = {
      Nom_Plato: req.body.Nom_Plato,
      Des_Plato: req.body.Des_Plato,
      Tip_Plato: req.body.Tip_Plato,
      Img_Plato: req.file ? req.file.filename : null
    };
    const plato = await PlatosService.create(data);
    res.status(201).json({ message: "Plato creado correctamente", plato });
  } catch (error) {
    console.error("❌ ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updatePlato = async (req, res) => {
  try {
    const id = parseInt(req.params.id); // ← entero
    const platoExistente = await PlatosService.getById(id);
    const data = {
      Nom_Plato: req.body.Nom_Plato,
      Des_Plato: req.body.Des_Plato,
      Tip_Plato: req.body.Tip_Plato,
      Img_Plato: req.file ? req.file.filename : platoExistente.Img_Plato
    };
    await PlatosService.update(id, data);
    res.json({ message: "Plato actualizado correctamente" });
  } catch (error) {
    console.error("ERROR UPDATE:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deletePlato = async (req, res) => {
  try {
    const id = parseInt(req.params.id); // ← entero
    await PlatosService.delete(id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};