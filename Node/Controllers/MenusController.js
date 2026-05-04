import MenusService from "../Services/MenusService.js";

export const getAllMenu = async (req, res) => {
  try {
    const Menuss = await MenusService.getAll();
    res.status(200).json(Menuss);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMenu = async (req, res) => {
  try {
    const id = parseInt(req.params.id); // ← entero
    const Menus = await MenusService.getById(id);
    res.status(200).json(Menus);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createMenu = async (req, res) => {
  try {
    const Menus = await MenusService.create(req.body);
    res.status(201).json({ message: "Menú creado correctamente", Menus });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateMenu = async (req, res) => {
  try {
    const id = parseInt(req.params.id); // ← entero
    await MenusService.update(id, req.body);
    res.status(200).json({ message: "Menú actualizado correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteMenu = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await MenusService.delete(id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Retorna los platos disponibles en el menu segun fecha y tipo de comida.
// Lo consume el formulario de nueva reserva del aprendiz.
// Query params requeridos: fecha (YYYY-MM-DD) y tipo (Desayuno|Almuerzo|Cena)
export const getMenuDisponibles = async (req, res) => {
  try {
    const { fecha, tipo } = req.query;
    if (!fecha || !tipo) {
      return res.status(400).json({
        message: "Los parametros 'fecha' y 'tipo' son requeridos",
      });
    }
    // Normaliza el tipo: primera letra mayuscula para coincidir con el enum
    const Tipo_Normalizado =
      tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
    const Menus = await MenusService.getByFechaYTipo(fecha, Tipo_Normalizado);
    res.status(200).json(Menus);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};