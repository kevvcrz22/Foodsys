import ReservasAlimentoService from "../Services/ReservasAlimentoService.js";


export const getAllReservasAlimentos = async (req, res) => {
  try {
    const ReservasAlimentos = await ReservasAlimentoService.getAll();
    res.status(200).json(ReservasAlimentos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getReservasAlimentos = async (req, res) => {
  try {
    const ReservasAlimentos = await ReservasAlimentoService.getById(req.params.id);
    res.status(200).json(ReservasAlimentos);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createReservasAlimentos = async (req, res) => {
  console.log(req.body)
  try {
    const ReservasAlimentos = await ReservasAlimentoService.create(req.body);
    res.status(201).json({ message: "Reservas/Alimentos creado", centroarea });
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