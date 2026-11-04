// Node/Models/associations.js
// Centralizacion de asociaciones Sequelize para Foodsys
// Garantiza que las relaciones entre modelos esten siempre disponibles sin depender del orden de importacion

import UsuariosModel from "./UsuariosModel.js";
import FichasModel from "./FichasModel.js";
import ProgramaModel from "./ProgramaModel.js";
import ReservasModel from "./ReservasModel.js";
import UsuariosRolModel from "./UsuariosRolModel.js";
import RolesModel from "./RolesModel.js";
import PlatosModel from "./PlatosModels.js";
import MenuModel from "./MenusModels.js";
import TurnosModel from "./TurnosModel.js";
import NotificacionesModel from "./NotificacionesModel.js";
import PqrsfModel from "./PqrsfModel.js";
import SolicitudesCampoModel from "./SolicitudesCampoModel.js";
import InternadoTemporalModel from "./InternadoTemporalModel.js";

let asociacionesCargadas = false;

export function setupAssociations() {
  if (asociacionesCargadas) return;

  // 1. Fichas y Usuarios
  FichasModel.hasMany(UsuariosModel, { foreignKey: 'Id_Ficha', as: 'usuarios' });
  UsuariosModel.belongsTo(FichasModel, { foreignKey: 'Id_Ficha', as: 'ficha' });

  // 2. Programas y Fichas
  ProgramaModel.hasMany(FichasModel, { foreignKey: 'Id_Programa', as: 'fichas' });
  FichasModel.belongsTo(ProgramaModel, { foreignKey: 'Id_Programa', as: 'programas' });

  // 3. Usuarios y Reservas
  UsuariosModel.hasMany(ReservasModel, { foreignKey: 'Id_Usuario', as: 'reservas' });
  ReservasModel.belongsTo(UsuariosModel, { foreignKey: 'Id_Usuario', as: 'usuario' });

  // 4. Usuarios y Roles
  UsuariosModel.hasMany(UsuariosRolModel, { foreignKey: "Id_Usuario", as: "rolesUsuario" });
  UsuariosRolModel.belongsTo(UsuariosModel, { foreignKey: "Id_Usuario", as: "usuario" });
  UsuariosRolModel.belongsTo(RolesModel, { foreignKey: "Id_Rol", as: "rolUsuario" });
  RolesModel.hasMany(UsuariosRolModel, { foreignKey: "Id_Rol", as: "usuariosRol" });

  // 5. Platos y Menus
  PlatosModel.hasMany(MenuModel, { foreignKey: "Id_Plato", as: "menus" });
  MenuModel.belongsTo(PlatosModel, { foreignKey: "Id_Plato", as: "plato" });

  // 6. Reservas y Platos / Bebidas / Cesion
  ReservasModel.belongsTo(PlatosModel, { foreignKey: "Id_Plato", as: "plato" });
  PlatosModel.hasMany(ReservasModel, { foreignKey: "Id_Plato", as: "reservas" });
  ReservasModel.belongsTo(PlatosModel, { foreignKey: "Id_Bebida", as: "bebida" });
  PlatosModel.hasMany(ReservasModel, { foreignKey: "Id_Bebida", as: "reservasBebida" });
  ReservasModel.belongsTo(UsuariosModel, { foreignKey: "Id_Usuario_Cedente", as: "usuarioCedente" });
  ReservasModel.belongsTo(UsuariosModel, { foreignKey: "Id_Usuario_Receptor_Pendiente", as: "usuarioReceptor" });

  // 7. Turnos
  UsuariosModel.hasMany(TurnosModel, { foreignKey: "Id_Usuario", as: "turnos" });
  TurnosModel.belongsTo(UsuariosModel, { foreignKey: "Id_Usuario", as: "supervisor" });

  // 8. Notificaciones
  UsuariosModel.hasMany(NotificacionesModel, { foreignKey: "Id_Usuario", as: "notificaciones" });
  NotificacionesModel.belongsTo(UsuariosModel, { foreignKey: "Id_Usuario", as: "usuario" });

  // 9. PQRSF
  UsuariosModel.hasMany(PqrsfModel, { foreignKey: 'Id_Usuario', as: 'pqrsfs' });
  PqrsfModel.belongsTo(UsuariosModel, { foreignKey: 'Id_Usuario', as: 'usuario' });
  PlatosModel.hasMany(PqrsfModel, { foreignKey: 'Id_Plato_Relacionado', as: 'pqrsfs' });
  PqrsfModel.belongsTo(PlatosModel, { foreignKey: 'Id_Plato_Relacionado', as: 'plato' });
  PqrsfModel.belongsTo(PlatosModel, { foreignKey: 'Id_Plato_Relacionado', as: 'platoRelacionado' });

  // 10. Solicitudes de Almuerzo de Campo (Tab 4 Reportes y Jornada)
  SolicitudesCampoModel.hasMany(ReservasModel, { foreignKey: 'Id_Solicitud_Campo', as: 'reservasGuardadas' });
  ReservasModel.belongsTo(SolicitudesCampoModel, { foreignKey: 'Id_Solicitud_Campo', as: 'solicitudCampo' });
  SolicitudesCampoModel.belongsTo(UsuariosModel, { foreignKey: 'Id_Usuario_Solicitante', as: 'solicitante' });
  SolicitudesCampoModel.belongsTo(FichasModel, { foreignKey: 'Id_Ficha', as: 'ficha' });

  // 11. Internado Temporal SENA Empresa
  InternadoTemporalModel.belongsTo(UsuariosModel, { foreignKey: 'Id_Usuario', as: 'usuario' });
  UsuariosModel.hasMany(InternadoTemporalModel, { foreignKey: 'Id_Usuario', as: 'internadosTemporales' });

  asociacionesCargadas = true;
}

// Auto-ejecutar al importar
setupAssociations();

export default setupAssociations;
