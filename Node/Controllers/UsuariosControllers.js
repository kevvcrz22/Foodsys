// Node/Controllers/UsuariosControllers.js  (reemplaza el existente)
import UsuariosService from "../Services/UsuariosService.js";
import CsvService      from "../Services/CsvService.js";

export const RegisterUsuarios = async (req, res) => {
  try {
    await UsuariosService.register(req.body);
    res.status(201).json({ message: "Usuario registrado con éxito" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const Login = async (req, res) => {
  try {
    const { usuario, roles, token } = await UsuariosService.Login(req.body);
    res.status(200).json({ message: "Usuario logueado exitosamente", usuario, roles, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

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
}

export const updateUsuarios = async (req, res) => {
  try {
    await UsuariosService.update(req.params.Id, req.body);
    res.status(200).json({ message: "Usuario Actualizado Correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export const deleteUsuarios = async (req, res) => {
  try {
    await UsuariosService.delete(req.params.Id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
export const aceptarPolitica = async (req, res) => {
  try {
    await UsuariosService.aceptarPolitica(req.params.Id);
    res.status(200).json({ message: "Política aceptada correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
/* ✅ NUEVO: Importar aprendices desde CSV */
export const importarCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se recibió ningún archivo CSV" });
    }
    const resultado = await CsvService.importarDesdeCSV(req.file.path);
    res.status(200).json({
      message: `Importación completada. Creados: ${resultado.creados}, Omitidos: ${resultado.omitidos}`,
      ...resultado,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};