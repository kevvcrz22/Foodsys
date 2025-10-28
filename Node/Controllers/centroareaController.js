import centroareaService from "../Services/centroareaService.js";


export const getAllcentroarea = async (req, res) => {
  try {
    const centroarea = await centroareaService.getAll();
    res.status(200).json(centroarea);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getcentroarea = async (req, res) => {
  try {
    const centroarea = await centroareaService.getById(req.params.id);
    res.status(200).json(centroarea);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createcentroarea = async (req, res) => {
  console.log(req.body)
  try {
    const centroarea = await centroareaService.create(req.body);
    res.status(201).json({ message: "centro/Area creado", centroarea });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updatecentroarea = async (req, res) => {
  try {
    await centroareaService.update(req.params.id, req.body);
    res.status(200).json({ message: "centro/Area actualizado correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deletecentroarea = async (req, res) => {
  try {
    await centroareaService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};