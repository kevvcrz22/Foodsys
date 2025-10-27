import contratoService from "../services/contratoService.js";


export const getAllcontrato = async (req, res) => {
  try {
    const contrato = await contratoService.getAll();
    res.status(200).json(contrato);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getcontrato = async (req, res) => {
  try {
    const contrato = await contratoService.getById(req.params.id);
    res.status(200).json(contrato);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createcontrato = async (req, res) => {
  try {
    const contrato = await contratoService.create(req.body);
    res.status(201).json({ message: "contrato creado", contrato });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updatecontrato = async (req, res) => {
  try {
    await contratoService.update(req.params.id, req.body);
    res.status(200).json({ message: "contrato actualizado correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deletecontrato = async (req, res) => {
  try {
    await contratoService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
