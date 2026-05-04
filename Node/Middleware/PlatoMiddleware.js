// Node/Middleware/PlatoMiddleware.js
// Middleware especializado para la gestion de platos
import Verificar_Vista from "./VistaMiddleware.js";

// Se asocia con la vista 'Menu' ya que quienes gestionan el menu gestionan los platos
const PlatoMiddleware = Verificar_Vista("Menu");

export default PlatoMiddleware;
