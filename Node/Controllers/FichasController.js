import FichasServices from "../Services/FichasServices.js";

// Obtener todas las fichas
export const getAllFichas = async (req, res) => {
  try {
    const Fichas = await FichasServices.getAll();
    res.status(200).json(Fichas); // Retorna la lista en JSON
  } catch (error) {
    res.status(500).json({ message: error.message }); // Error interno del servidor
  }
};

// Obtener una ficha especifica por ID
export const getFichas = async (req, res) => {
  try {
    const Fichas = await FichasServices.getById(req.params.id);
    res.status(200).json(Fichas);
  } catch (error) {
    res.status(404).json({ message: error.message }); // No encontrada
  }
};

// Crear una nueva ficha
export const createFichas = async (req, res) => {
  try {
    const Fichas = await FichasServices.create(req.body);
    res.status(201).json({ message: "Ficha Creada", Fichas }); // 201 => recurso creado
  } catch (error) {
    res.status(400).json({ message: error.message }); // Error del cliente (datos invalidos)
  }
};

// Actualizar una ficha existente
export const updateFichas = async (req, res) => {
  try {
    // parseInt convierte el id de la URL a numero entero
    await FichasServices.update(parseInt(req.params.id), req.body);
    res.status(200).json({ message: "Ficha Actualizada Correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar una ficha
export const deleteFichas = async (req, res) => {
  try {
    await FichasServices.delete(req.params.id);
    res.status(204).send(); // 204 => peticion exitosa sin contenido en la respuesta
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};