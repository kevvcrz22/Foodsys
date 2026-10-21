// Node/Services/FichasServices.js
// Servicio de gestion de fichas y sincronizacion con aprendices
// Comentarios didacticos para aprendices de tecnologo de primer semestre sin tildes ni emojis

import FichasModel from "../Models/FichasModel.js";
import ProgramaModel from "../Models/ProgramaModel.js";
import UsuariosModel from "../Models/UsuariosModel.js";
import UsuariosRolModel from "../Models/UsuariosRolModel.js";
import ReservaModel from "../Models/ReservasModel.js";
import { Op } from "sequelize";

// Roles de aprendices y pasantes que dependen de la etapa lectiva de la ficha
const ROLES_APRENDIZ_Y_PASANTE = [4, 5]; // Aprendiz Interno (4), Aprendiz Externo (5)

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD en la zona horaria oficial de Colombia (America/Bogota).
 * Esto evita el desajuste de UTC donde a las 7:00 PM ya cambia de dia en el servidor.
 */
export function obtenerFechaHoyBogota() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
}

/**
 * Sincroniza el estado de los aprendices asociados a una ficha especifica:
 * - Si la fecha de fin de etapa lectiva (FecFinLec_Ficha) es menor que hoy en Bogota,
 *   los aprendices pasan a estado 'Inactivo' y sus reservas futuras abiertas se cancelan.
 * - Si aun esta vigente, se mantienen en 'En Formacion'.
 *
 * @param {number} Id_Ficha - Clave primaria de la ficha
 * @returns {Promise<object>} Cantidad de usuarios afectados y estado asignado
 */
export async function sincronizarEstadoAprendices(Id_Ficha) {
  const ficha = await FichasModel.findByPk(Id_Ficha);
  if (!ficha) throw new Error("Ficha no encontrada");

  const hoyStr = obtenerFechaHoyBogota();
  const fechaFinStr = ficha.FecFinLec_Ficha
    ? String(ficha.FecFinLec_Ficha).split("T")[0]
    : null;

  // Si no tiene fecha de fin lectiva definida, se asume vigente
  const lectivaCulminada = fechaFinStr ? fechaFinStr < hoyStr : false;

  const usuarios = await UsuariosModel.findAll({
    where: { Id_Ficha },
    include: [{
      model: UsuariosRolModel,
      as: "rolesUsuario",
      required: false
    }]
  });

  const ids = usuarios.map(u => u.Id_Usuario);
  if (ids.length === 0) return { afectados: 0, estado: null };

  const nuevoEstado = lectivaCulminada ? "Inactivo" : "En Formacion";

  // Actualizamos el estado de los usuarios de la ficha
  await UsuariosModel.update(
    { Est_Usuario: nuevoEstado },
    { where: { Id_Usuario: { [Op.in]: ids } } }
  );

  // Si la ficha ya culmino etapa lectiva, cancelamos todas sus reservas futuras o abiertas pendientes
  if (lectivaCulminada) {
    const reservasCanceladas = await ReservaModel.update(
      { Est_Reserva: "Cancelado" },
      {
        where: {
          Id_Usuario: { [Op.in]: ids },
          Fec_Reserva: { [Op.gte]: hoyStr },
          Est_Reserva: { [Op.in]: ["Generado", "Verificado"] }
        }
      }
    );
    if (reservasCanceladas[0] > 0) {
      console.log(`[FichasServices] Se cancelaron ${reservasCanceladas[0]} reservas futuras por vencimiento de ficha #${ficha.Num_Ficha}`);
    }
  }

  return { afectados: ids.length, estado: nuevoEstado };
}

/**
 * Tarea de mantenimiento masivo:
 * Revisa todas las fichas cuya fecha de fin de etapa lectiva haya expirado
 * e inactiva automaticamente a sus aprendices cancelando sus reservas.
 */
export async function sincronizarTodasLasFichasVencidas() {
  const hoyStr = obtenerFechaHoyBogota();
  const fichasVencidas = await FichasModel.findAll({
    where: {
      FecFinLec_Ficha: {
        [Op.ne]: null,
        [Op.lt]: hoyStr
      }
    }
  });

  let totalAfectados = 0;
  for (const f of fichasVencidas) {
    try {
      const res = await sincronizarEstadoAprendices(f.Id_Ficha);
      totalAfectados += res.afectados || 0;
    } catch (e) {
      console.warn(`[FichasServices] Error sincronizando ficha #${f.Num_Ficha}:`, e.message);
    }
  }

  return { fichasProcesadas: fichasVencidas.length, usuariosAfectados: totalAfectados };
}

class FichasServices {
  // Lista todas las fichas con su programa asociado
  async getAll() {
    return await FichasModel.findAll({
      include: [{
        model: ProgramaModel,
        as: "programas",
        attributes: ["Id_Programa", "Nom_Programa", "NivFor_Programa", "Are_Programa"]
      }],
      order: [["Id_Ficha", "DESC"]]
    });
  }

  // Obtiene una ficha por ID incluyendo el programa
  async getById(Id) {
    const ficha = await FichasModel.findByPk(Id, {
      include: [{
        model: ProgramaModel,
        as: "programas",
        attributes: ["Id_Programa", "Nom_Programa", "NivFor_Programa", "Are_Programa"]
      }]
    });
    if (!ficha) throw new Error("Ficha no encontrada");
    return ficha;
  }

  // Crea una ficha y aplica el calculo de fechas si vienen vacias
  async create(data) {
    const datosProcesados = { ...data };

    // Regla de calculo matematico:
    // Si FecFinPra_Ficha existe pero FecIniPra_Ficha esta vacio -> restar exactamente 6 meses
    if (datosProcesados.FecFinPra_Ficha && !datosProcesados.FecIniPra_Ficha) {
      const d = new Date(datosProcesados.FecFinPra_Ficha);
      if (!isNaN(d)) {
        d.setMonth(d.getMonth() - 6);
        datosProcesados.FecIniPra_Ficha = d.toISOString().split("T")[0];
      }
    }

    // Si FecFinLec_Ficha esta vacio y tenemos FecIniPra_Ficha -> restar 1 dia
    if (!datosProcesados.FecFinLec_Ficha && datosProcesados.FecIniPra_Ficha) {
      const d = new Date(datosProcesados.FecIniPra_Ficha);
      if (!isNaN(d)) {
        d.setDate(d.getDate() - 1);
        datosProcesados.FecFinLec_Ficha = d.toISOString().split("T")[0];
      }
    }

    const nuevaFicha = await FichasModel.create(datosProcesados);
    await sincronizarEstadoAprendices(nuevaFicha.Id_Ficha);
    return nuevaFicha;
  }

  // Actualiza una ficha existente y sincroniza el estado de sus aprendices
  async update(Id, data) {
    const datosProcesados = { ...data };

    if (datosProcesados.FecFinPra_Ficha && !datosProcesados.FecIniPra_Ficha) {
      const d = new Date(datosProcesados.FecFinPra_Ficha);
      if (!isNaN(d)) {
        d.setMonth(d.getMonth() - 6);
        datosProcesados.FecIniPra_Ficha = d.toISOString().split("T")[0];
      }
    }

    if (!datosProcesados.FecFinLec_Ficha && datosProcesados.FecIniPra_Ficha) {
      const d = new Date(datosProcesados.FecIniPra_Ficha);
      if (!isNaN(d)) {
        d.setDate(d.getDate() - 1);
        datosProcesados.FecFinLec_Ficha = d.toISOString().split("T")[0];
      }
    }

    const [filas] = await FichasModel.update(datosProcesados, { where: { Id_Ficha: Id } });

    if (filas === 0) {
      const ficha = await FichasModel.findByPk(Id);
      if (!ficha) throw new Error("Ficha no encontrada");
    }

    // Sincroniza estado de aprendices despues de actualizar
    await sincronizarEstadoAprendices(Id);

    return true;
  }

  async delete(Id) {
    const ficha = await FichasModel.findByPk(Id);
    if (!ficha) throw new Error("Ficha no encontrada");
    await FichasModel.destroy({ where: { Id_Ficha: Id } });
    return true;
  }
}

export default new FichasServices();