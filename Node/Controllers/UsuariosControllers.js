// Node/Controllers/UsuariosControllers.js
// Controladores del modulo de usuarios para el sistema FoodSys
// Cada funcion recibe la peticion HTTP, delega al servicio y responde con JSON

import UsuariosService from "../Services/UsuariosService.js";
import CsvService from "../Services/CsvService.js";
import UsuariosModel from "../Models/UsuariosModel.js";
import bcrypt from "bcrypt";

// Registra un nuevo usuario validando que no exista previamente por documento
export const RegisterUsuarios = async (req, res) => {
  try {
    await UsuariosService.register(req.body);
    res.status(201).json({ message: "Usuario registrado con exito" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Autentica al usuario y devuelve sus datos, roles y el token JWT firmado
export const Login = async (req, res) => {
  try {
    const { usuario, roles, token } = await UsuariosService.Login(req.body);
    res
      .status(200)
      .json({ message: "Usuario logueado exitosamente", usuario, roles, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Devuelve todos los usuarios registrados en el sistema
export const getAllUsuarios = async (req, res) => {
  try {
    const Usuarios = await UsuariosService.getAll();
    res.status(200).json(Usuarios);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Devuelve un usuario especifico buscado por su ID primario
export const getUsuarios = async (req, res) => {
  try {
    const Usuario = await UsuariosService.getById(req.params.Id);
    res.status(200).json(Usuario);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// Actualiza los datos generales de un usuario identificado por su ID
export const updateUsuarios = async (req, res) => {
  try {
    await UsuariosService.update(req.params.Id, req.body);
    res.status(200).json({ message: "Usuario actualizado correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Elimina un usuario del sistema de forma permanente
export const deleteUsuarios = async (req, res) => {
  try {
    await UsuariosService.delete(req.params.Id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Registra la aceptacion de la politica de privacidad por parte del usuario
export const aceptarPolitica = async (req, res) => {
  try {
    await UsuariosService.aceptarPolitica(req.params.Id);
    res.status(200).json({ message: "Politica aceptada correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Importa usuarios en masa desde un archivo CSV subido por el administrador
export const importarCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "No se recibio ningun archivo CSV" });
    }
    const Resultado = await CsvService.importarDesdeCSV(req.file.path);
    res.status(200).json({
      message: `Importacion completada. Creados: ${Resultado.creados}, Omitidos: ${Resultado.omitidos}`,
      ...Resultado,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Devuelve solo los usuarios con rol de Aprendiz Interno o Aprendiz Externo
export const getAprendices = async (req, res) => {
  try {
    const Aprendices = await UsuariosService.getAprendices();
    res.status(200).json(Aprendices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Paso 1 del flujo de cambio de contrasena:
// Recibe la contrasena actual del usuario, la compara con el hash en la base de datos
// y responde si es valida antes de proceder al cambio real
export const validarPasswordActual = async (req, res) => {
  try {
    const { Id } = req.params;
    const { currentPassword } = req.body;

    // El campo currentPassword es obligatorio para este endpoint
    if (!currentPassword) {
      return res
        .status(400)
        .json({ message: "La contrasena actual es requerida" });
    }

    // Busca el usuario por su clave primaria
    const Usuario = await UsuariosModel.findByPk(Id);
    if (!Usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Compara la contrasena ingresada con el hash almacenado usando bcrypt
    const EsValida = await bcrypt.compare(currentPassword, Usuario.password);
    if (!EsValida) {
      return res
        .status(401)
        .json({ message: "La contrasena actual es incorrecta" });
    }

    res.status(200).json({ valid: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Paso 2 del flujo de cambio de contrasena:
// Valida nuevamente la contrasena actual, luego encripta y guarda la nueva
// Se realiza la verificacion doble para evitar cambios no autorizados
export const cambiarPassword = async (req, res) => {
  try {
    const { Id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Ambos campos son obligatorios para ejecutar el cambio
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "La contrasena actual y la nueva son requeridas",
      });
    }

    // Valida longitud minima de la nueva contrasena
    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "La nueva contrasena debe tener al menos 8 caracteres",
      });
    }

    // Busca el usuario para obtener el hash actual almacenado
    const Usuario = await UsuariosModel.findByPk(Id);
    if (!Usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Verifica la contrasena actual antes de permitir el cambio
    const EsValida = await bcrypt.compare(currentPassword, Usuario.password);
    if (!EsValida) {
      return res
        .status(401)
        .json({ message: "La contrasena actual es incorrecta" });
    }

    // Encripta la nueva contrasena con bcrypt antes de guardarla
    const NuevoHash = await bcrypt.hash(newPassword, 10);

    // Actualiza solo el campo password en la base de datos
    const Resultado = await UsuariosModel.update(
      { password: NuevoHash },
      { where: { Id_Usuario: Id } }
    );

    if (Resultado[0] === 0) {
      throw new Error("No se pudo actualizar la contrasena en la base de datos");
    }

    res.status(200).json({ message: "Contrasena actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};