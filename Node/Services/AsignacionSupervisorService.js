// Node/Services/AsignacionSupervisorService.js
// Servicio para la asignacion temporal del rol de Supervisor (por Bienestar y Coordinador)
// Maneja la asignacion por rango de fechas, activacion automatica y destitucion/reversion automatica al expirar.

import { Op } from "sequelize";
import db from "../Database/db.js";
import AsignacionSupervisorModel from "../Models/AsignacionSupervisorModel.js";
import UsuariosModel from "../Models/UsuariosModel.js";
import RolesModel from "../Models/RolesModel.js";
import UsuariosRolModel from "../Models/UsuariosRolModel.js";
import NotificacionesModel from "../Models/NotificacionesModel.js";
import { obtenerFechaColombia } from "../Utils/dateUtils.js";

class AsignacionSupervisorService {

  /**
   * Obtiene el Id_Rol correspondiente al rol 'Supervisor'
   */
  async obtenerIdRolSupervisor(transaction = null) {
    const rol = await RolesModel.findOne({
      where: { Nom_Rol: "Supervisor" },
      transaction
    });
    if (!rol) throw new Error("El rol 'Supervisor' no se encuentra configurado en la base de datos.");
    return rol.Id_Rol;
  }

  /**
   * Obtiene la lista de asignaciones de supervisor registradas
   */
  async obtenerAsignaciones(filtros = {}) {
    // Revisar vencimientos antes de consultar para garantizar estado fresco
    await this.revisarYRevertirVencidos();

    const where = {};
    if (filtros.estado && filtros.estado !== "TODOS") {
      where.Estado_Periodo = filtros.estado;
    }

    if (filtros.busqueda) {
      const b = `%${filtros.busqueda.trim()}%`;
      where[Op.or] = [
        { Nom_Usuario: { [Op.like]: b } },
        { Ape_Usuario: { [Op.like]: b } },
        { NumDoc_Usuario: { [Op.like]: b } }
      ];
    }

    return await AsignacionSupervisorModel.findAll({
      where,
      order: [["created_at", "DESC"]]
    });
  }

  /**
   * Asigna el rol de Supervisor a un usuario por un tiempo determinado
   */
  async crearAsignacion(datos, usuarioSolicitante = {}) {
    const { NumDoc_Usuario, Fecha_Inicio, Fecha_Fin, Observaciones } = datos;

    if (!NumDoc_Usuario) throw new Error("El numero de documento es obligatorio.");
    if (!Fecha_Inicio || !Fecha_Fin) throw new Error("Las fechas de inicio y fin son obligatorias.");
    if (Fecha_Fin < Fecha_Inicio) throw new Error("La fecha de fin no puede ser anterior a la fecha de inicio.");

    const hoy = obtenerFechaColombia();

    return await db.transaction(async (t) => {
      const usuario = await UsuariosModel.findOne({
        where: { NumDoc_Usuario: String(NumDoc_Usuario).trim() },
        transaction: t
      });

      if (!usuario) {
        throw new Error(`No se encontro ningun usuario registrado con el documento ${NumDoc_Usuario}.`);
      }

      const idRolSupervisor = await this.obtenerIdRolSupervisor(t);

      // Determinar estado segun la fecha actual en Colombia
      let estadoPeriodo = "PROGRAMADO";
      if (hoy >= Fecha_Inicio && hoy <= Fecha_Fin) {
        estadoPeriodo = "ACTIVO";
      } else if (hoy > Fecha_Fin) {
        estadoPeriodo = "VENCIDO";
      }

      // Si el turno esta activo hoy, asignar de inmediato el rol de Supervisor en UsuariosRol
      if (estadoPeriodo === "ACTIVO") {
        const tieneRol = await UsuariosRolModel.findOne({
          where: { Id_Usuario: usuario.Id_Usuario, Id_Rol: idRolSupervisor },
          transaction: t
        });

        if (!tieneRol) {
          await UsuariosRolModel.create({
            Id_Usuario: usuario.Id_Usuario,
            Id_Rol: idRolSupervisor
          }, { transaction: t });
        }
      }

      const nuevaAsignacion = await AsignacionSupervisorModel.create({
        Id_Usuario: usuario.Id_Usuario,
        NumDoc_Usuario: usuario.NumDoc_Usuario,
        Nom_Usuario: usuario.Nom_Usuario,
        Ape_Usuario: usuario.Ape_Usuario,
        Fecha_Inicio,
        Fecha_Fin,
        Estado_Periodo: estadoPeriodo,
        Observaciones: Observaciones || null,
        Id_Usuario_Asigno: usuarioSolicitante.id || null,
        Rol_Usuario_Asigno: usuarioSolicitante.rol || "Bienestar"
      }, { transaction: t });

      // Notificacion
      try {
        await NotificacionesModel.create({
          Id_Usuario: usuario.Id_Usuario,
          Rol_Destino: null,
          Titulo: "Asignacion de Rol de Supervisor",
          Mensaje: `Has sido asignado como Supervisor del comedor desde el ${Fecha_Inicio} hasta el ${Fecha_Fin}.`,
          Tipo: "info"
        }, { transaction: t });
      } catch (_) {}

      return nuevaAsignacion;
    });
  }

  /**
   * Revoca manualmente una asignacion y retira el rol de supervisor
   */
  async revocarAsignacion(idAsignacion) {
    return await db.transaction(async (t) => {
      const asignacion = await AsignacionSupervisorModel.findByPk(idAsignacion, { transaction: t });
      if (!asignacion) throw new Error("Asignacion no encontrada.");

      await asignacion.update({ Estado_Periodo: "CANCELADO" }, { transaction: t });

      // Verificar si tiene otras asignaciones activas
      const hoy = obtenerFechaColombia();
      const otraActiva = await AsignacionSupervisorModel.findOne({
        where: {
          Id_Usuario: asignacion.Id_Usuario,
          Estado_Periodo: "ACTIVO",
          Id_Asignacion: { [Op.ne]: idAsignacion }
        },
        transaction: t
      });

      // Si no tiene otra asignacion activa, retirar el rol Supervisor de UsuariosRol
      if (!otraActiva) {
        const idRolSupervisor = await this.obtenerIdRolSupervisor(t);
        await UsuariosRolModel.destroy({
          where: {
            Id_Usuario: asignacion.Id_Usuario,
            Id_Rol: idRolSupervisor
          },
          transaction: t
        });
      }

      return { exito: true, mensaje: "Asignacion de supervisor revocada exitosamente." };
    });
  }

  /**
   * Destitucion y activacion automatica de supervisores segun la fecha actual.
   * Se ejecuta diariamente a las 00:05 y al consultar la lista.
   */
  async revisarYRevertirVencidos() {
    const hoy = obtenerFechaColombia();
    let activados = 0;
    let revertidos = 0;

    try {
      // 1. Activar los que entraron en vigencia hoy
      const paraActivar = await AsignacionSupervisorModel.findAll({
        where: {
          Estado_Periodo: "PROGRAMADO",
          Fecha_Inicio: { [Op.lte]: hoy },
          Fecha_Fin: { [Op.gte]: hoy }
        }
      });

      if (paraActivar.length > 0) {
        const idRolSupervisor = await this.obtenerIdRolSupervisor();
        for (const asig of paraActivar) {
          await asig.update({ Estado_Periodo: "ACTIVO" });
          const tieneRol = await UsuariosRolModel.findOne({
            where: { Id_Usuario: asig.Id_Usuario, Id_Rol: idRolSupervisor }
          });
          if (!tieneRol) {
            await UsuariosRolModel.create({
              Id_Usuario: asig.Id_Usuario,
              Id_Rol: idRolSupervisor
            });
          }
          activados++;
        }
      }

      // 2. Destituir automaticamente los que ya vencieron (Fecha_Fin < hoy)
      const vencidos = await AsignacionSupervisorModel.findAll({
        where: {
          Estado_Periodo: { [Op.in]: ["ACTIVO", "PROGRAMADO"] },
          Fecha_Fin: { [Op.lt]: hoy }
        }
      });

      if (vencidos.length > 0) {
        const idRolSupervisor = await this.obtenerIdRolSupervisor();
        for (const asig of vencidos) {
          await asig.update({ Estado_Periodo: "VENCIDO" });

          // Verificar si no tiene otra asignacion activa vigente
          const otraVigente = await AsignacionSupervisorModel.findOne({
            where: {
              Id_Usuario: asig.Id_Usuario,
              Estado_Periodo: "ACTIVO",
              Fecha_Fin: { [Op.gte]: hoy }
            }
          });

          if (!otraVigente) {
            await UsuariosRolModel.destroy({
              where: {
                Id_Usuario: asig.Id_Usuario,
                Id_Rol: idRolSupervisor
              }
            });
            revertidos++;
          }
        }
      }

      return { activados, revertidos };
    } catch (err) {
      console.error("[AsignacionSupervisorService] Error en revision automatica:", err.message);
      return { activados: 0, revertidos: 0, error: err.message };
    }
  }
}

export default new AsignacionSupervisorService();

