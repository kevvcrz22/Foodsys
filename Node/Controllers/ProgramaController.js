import ProgramaService from "../services/ProgramaService.js";

export const getAllPrograma = async (req, res) => {
  try {
    const Programa = await ProgramaService.getAll();
    res.status(200).json(Programa);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPrograma = async (req, res) => {
  try {
    const Programa = await ProgramaService.getById(req.params.id);
    res.status(200).json(Programa);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createPrograma = async (req, res) => {
  try {
    const Programa = await ProgramaService.create(req.body);
    res.status(201).json({ message: "Programa creado", Programa });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePrograma = async (req, res) => {
  try {
    await ProgramaService.update(req.params.id, req.body);
    res.status(200).json({ message: "Programa actualizado correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePrograma = async (req, res) => {
  try {
    await ProgramaService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
