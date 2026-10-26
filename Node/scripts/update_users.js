import db from '../Database/db.js';
import UsuariosModel from '../Models/UsuariosModel.js';
import FichasModel from '../Models/FichasModel.js';
import ProgramaModel from '../Models/ProgramaModel.js';
import RolesModel from '../Models/RolesModel.js';
import UsuariosRolModel from '../Models/UsuariosRolModel.js';
import PlatosModel from '../Models/PlatosModels.js';
import MenuModel from '../Models/MenusModels.js';
import ReservasModel from '../Models/ReservasModel.js';
import PqrsfModel from '../Models/PqrsfModel.js';

async function main() {
  await db.query("UPDATE usuarios SET Est_Usuario = 'En Formacion' WHERE NumDoc_Usuario IN (1003810633, 1031652678, 1110485406)");
  console.log("Updated test users to En Formacion");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
