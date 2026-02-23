import UsuariosRolService from "../Services/UsuariosRolServices.js";

export const getAllUsuariosRol = async (req, res) => {
  try {
    const UsuariosRol = await UsuariosRolService.getAll();
    res.status(200).json(UsuariosRol);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUsuariosRol = async (req, res) => {
  try {
    const UsuariosRol = await UsuariosRolService.getById(req.params.id);
    res.status(200).json(UsuariosRol);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createUsuariosRol = async (req, res) => {
  try {
    const UsuariosRol = await UsuariosRolService.create(req.body);
    res.status(201).json({ message: "UsuarioRol creado", UsuariosRol});
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateUsuariosRol = async (req, res) => {
  try {
    await UsuariosRolService.update(req.params.id, req.body);
    res.status(200).json({ message: "UsuarioRol actualizado correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteUsuariosRol = async (req, res) => {
  try {
    await UsuariosRolService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
