import MenuService from "../Services/MenusService.js";

export const getAllMenus = async (req, res) => {
  try {
    const Menus = await MenuService.getAll();
    res.status(200).json(Menus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMenu = async (req, res) => {
  try {
    const Menu = await MenuService.getById(req.params.id);
    res.status(200).json(Menu);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createMenu = async (req, res) => {
  try {
    const Menu = await MenuService.create(req.body);
    res.status(201).json({ message: "Menu creado correctamente", Menu });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateMenu = async (req, res) => {
  try {
    await MenuService.update(parseInt(req.params.id), req.body);
    res.status(200).json({ message: "Menu actualizado correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteMenu = async (req, res) => {
  try {
    await MenuService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};