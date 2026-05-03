import MenusService from "../Services/MenusService.js";

export const getAllMenu = async (req, res) => {
  try {
    const Menuss = await MenusService.getAll();
    res.status(200).json(Menuss);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMenuByFecha = async (req, res) => {
  try {
    const fecha = req.params.fecha;
    const Menus = await MenusService.getByFecha(fecha);
    res.status(200).json(Menus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMenu = async (req, res) => {
  try {
    const id = parseInt(req.params.id); // ← entero
    const Menus = await MenusService.getById(id);
    res.status(200).json(Menus);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createMenu = async (req, res) => {
  try {
    const Menus = await MenusService.create(req.body);
    res.status(201).json({ message: "Menú creado correctamente", Menus });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateMenu = async (req, res) => {
  try {
    const id = parseInt(req.params.id); // ← entero
    await MenusService.update(id, req.body);
    res.status(200).json({ message: "Menú actualizado correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteMenu = async (req, res) => {
  try {
    const id = parseInt(req.params.id); // ← entero
    await MenusService.delete(id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};