import FichasModel from "../Models/FichasModel.js";
import ProgramaModel from "../Models/ProgramaModel.js";
import UsuariosModel from "../Models/UsuariosModel.js";
import UsuariosRolModel from "../Models/UsuariosRolModel.js";
import { Op } from "sequelize";

const ROLES_APRENDIZ = [4, 5];

// Función reutilizable (también la usa el cron)
export async function sincronizarEstadoAprendices(Id_Ficha) {
  const ficha = await FichasModel.findByPk(Id_Ficha);
  if (!ficha) throw new Error("Ficha no encontrada");

  const fechaFin = new Date(ficha.FecFinLec_Ficha);
  const hoy = new Date();
  fechaFin.setHours(0, 0, 0, 0);
  hoy.setHours(0, 0, 0, 0);

  const lectivaCulminada = fechaFin <= hoy;

  const usuarios = await UsuariosModel.findAll({
    where: { Id_Ficha },
    include: [{
      model: UsuariosRolModel,
      as: "rolesUsuario",
      required: true,
      where: { Id_Rol: { [Op.in]: ROLES_APRENDIZ } }
    }]
  });

  const ids = usuarios.map(u => u.Id_Usuario);
  if (ids.length === 0) return { afectados: 0, estado: null };

  const nuevoEstado = lectivaCulminada ? "inactivo" : "En Formacion"; // ✅ corregido

  await UsuariosModel.update(
    { Est_Usuario: nuevoEstado },
    { where: { Id_Usuario: { [Op.in]: ids } } }
  );

  console.log(`✅ Ficha ${Id_Ficha}: ${ids.length} aprendices → "${nuevoEstado}"`);
  return { afectados: ids.length, estado: nuevoEstado };
}

class FichasServices {
  async getAll() {
    return await FichasModel.findAll({
      include: [{ model: ProgramaModel, as: "programas", attributes: ["Id_Programa", "Nom_Programa"] }]
    });
  }

  async getById(Id) {
    const ficha = await FichasModel.findByPk(Id, {
      include: [{ model: ProgramaModel, as: "programas", attributes: ["Id_Programa", "Nom_Programa"] }]
    });
    if (!ficha) throw new Error("Ficha no encontrada");
    return ficha;
  }

  async create(data) {
    return await FichasModel.create(data);
  }

  async update(Id, data) {
    const [filas] = await FichasModel.update(data, { where: { Id_Ficha: Id } });

    if (filas === 0) {
      const ficha = await FichasModel.findByPk(Id);
      if (!ficha) throw new Error("Ficha no encontrada");
      throw new Error("No hubo cambios en la ficha");
    }

    // Sincroniza estado de aprendices después de actualizar
    await sincronizarEstadoAprendices(Id);

    return true;
  }
}

export default new FichasServices();