import PlatosService from "../Services/PlatosService.js";

export const getAllPlatos = async (req, res) => {
  try {
    const Platos = await PlatosService.getAll();
    res.status(200).json(Platos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPlato = async (req, res) => {
  try {
    const Plato = await PlatosService.getById(req.params.id);
    res.status(200).json(Plato);
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

    console.log("📦 DATA A INSERTAR:", data); // 👈 AGREGA ESTO

    const Plato = await PlatosService.create(data);
    res.status(201).json({ message: "Plato creado correctamente", Plato });
  } catch (error) {
    console.error("❌ ERROR COMPLETO:", error); // 👈 Y ESTO
    res.status(500).json({ message: error.message });
  }
};

export const updatePlato = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Usar el servicio, no el modelo directo
    const plato = await PlatosService.getById(id);

    const data = {
      Nom_Plato: req.body.Nom_Plato,
      Des_Plato: req.body.Des_Plato,
      Tip_Plato: req.body.Tip_Plato,
      // ✅ Solo reemplaza imagen si se envía una nueva
      Img_Plato: req.file ? req.file.filename : plato.Img_Plato
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
    await PlatosService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};