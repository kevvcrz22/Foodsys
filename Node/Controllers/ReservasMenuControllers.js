import ReservasMenuService from "../Services/ReservasMenuService.js";

export const getAllReservasMenu = async (req, res) => {
  try {
    const ReservasMenu = await ReservasMenuService.getAll();
    res.status(200).json(ReservasMenu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getReservaMenu = async (req, res) => {
  try {
    const ReservaMenu = await ReservasMenuService.getById(req.params.id);
    res.status(200).json(ReservaMenu);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createReservaMenu = async (req, res) => {
  try {
    const ReservaMenu = await ReservasMenuService.create(req.body);
    res.status(201).json({ message: "ReservaMenu creado correctamente", ReservaMenu });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateReservaMenu = async (req, res) => {
  try {
    await ReservasMenuService.update(req.params.id, req.body);
    res.status(200).json({ message: "ReservaMenu actualizado correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteReservaMenu = async (req, res) => {
  try {
    await ReservasMenuService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};