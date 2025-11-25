import UsuariosService from "../Services/UsuariosService.js";

export const getAllUsuarios = async (req, res) => {
  try {
    const Usuarios = await UsuariosService.getAll();
    res.status(200).json(Usuarios);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUsuarios = async (req, res) => {
  try {
    const Usuarios = await UsuariosService.getById(req.params.Id);
    res.status(200).json(Usuarios);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createUsuarios = async (req, res) => {
  try {
    const Usuarios = await UsuariosService.create(req.body);
    res.status(201).json({ message: "Usuario Creado", Usuarios });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateUsuarios = async (req, res) => {
  try {
    await UsuariosService.update(req.params.Id, req.body);
    res.status(200).json({ message: "Usuario Actualizado Correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const deleteUsuarios = async (req, res) => {
  try {
    await UsuariosService.delete(req.params.Id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
