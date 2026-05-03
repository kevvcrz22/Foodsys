import ProgramaService from "../Services/ProgramaService.js";

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
    const id = parseInt(req.params.id); // ← entero
    const Programa = await ProgramaService.getById(id);
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
    const id = parseInt(req.params.id); // ← entero
    await ProgramaService.update(id, req.body);
    res.status(200).json({ message: "Programa actualizado correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePrograma = async (req, res) => {
  try {
    const id = parseInt(req.params.id); // ← entero
    await ProgramaService.delete(id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};