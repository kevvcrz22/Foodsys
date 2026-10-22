// Node/Controllers/UsuariosImportController.js
// Controlador de importacion de usuarios desde Excel y descarga de plantilla
// Re-exporta la logica unificada de UsuariosControllers para consistencia total

export {
  descargarPlantilla,
  previewImport,
  importarSeleccionados
} from "./UsuariosControllers.js";

import {
  descargarPlantilla,
  previewImport,
  importarSeleccionados
} from "./UsuariosControllers.js";

export default {
  descargarPlantilla,
  previewImport,
  importarSeleccionados
};