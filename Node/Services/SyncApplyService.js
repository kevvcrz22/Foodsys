// Node/Services/SyncApplyService.js
// Servicio unificado para aplicar eventos de sincronizacion bidireccional (Push, Pull, USB)
// Conecta y reconcilia entidades entre el Centro La Granja y el VPS Hetzner.
// Comentarios didacticos sin tildes ni emojis para aprendices de primer semestre.

import crypto from "crypto";
import db from "../Database/db.js";
import ReservaModel from "../Models/ReservasModel.js";
import PlatoModel from "../Models/PlatosModels.js";
import MenuModel from "../Models/MenusModels.js";
import ProgramaModel from "../Models/ProgramaModel.js";
import FichasModel from "../Models/FichasModel.js";
import UsuariosModel from "../Models/UsuariosModel.js";
import UsuariosRolModel from "../Models/UsuariosRolModel.js";
import RolesModel from "../Models/RolesModel.js";
import TurnosModel from "../Models/TurnosModel.js";
import PqrsfModel from "../Models/PqrsfModel.js";
import { sincronizarEstadoAprendices } from "./FichasServices.js";
import { Op } from "sequelize";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, "../uploads");

export const guardarImagenSiVieneBase64 = (nombreArchivo, base64Data) => {
  if (!nombreArchivo || !base64Data) return;
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    const destino = path.join(UPLOADS_DIR, nombreArchivo);
    if (!fs.existsSync(destino)) {
      fs.writeFileSync(destino, Buffer.from(base64Data, "base64"));
      console.log(`[SyncApplyService] Imagen guardada desde sync: ${nombreArchivo}`);
    }
  } catch (err) {
    console.warn(`[SyncApplyService] Nota al guardar imagen sync ${nombreArchivo}:`, err.message);
  }
};

export const asegurarImagenLocal = async (nombreArchivo, base64Data, cloudBaseUrl) => {
  if (!nombreArchivo) return;
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    const destino = path.join(UPLOADS_DIR, nombreArchivo);
    if (fs.existsSync(destino)) return;

    if (base64Data) {
      fs.writeFileSync(destino, Buffer.from(base64Data, "base64"));
      console.log(`[SyncApplyService] Imagen guardada desde base64: ${nombreArchivo}`);
      return;
    }

    if (cloudBaseUrl) {
      const imgUrl = `${cloudBaseUrl}/uploads/${nombreArchivo}`;
      const res = await fetch(imgUrl);
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(destino, buffer);
        console.log(`[SyncApplyService] Imagen descargada desde nube: ${nombreArchivo}`);
      }
    }
  } catch (err) {
    console.warn(`[SyncApplyService] Nota al descargar imagen ${nombreArchivo}:`, err.message);
  }
};

class SyncApplyService {
  /**
   * Punto de entrada principal para aplicar cualquier evento sincronizado
   * @param {Object} evt - Evento con { entidad, operacion, payload, event_id }
   * @param {string} sourceNode - 'LOCAL', 'CLOUD' o 'MANUAL_USB'
   */
  async aplicarEvento(evt, sourceNode = "LOCAL") {
    const { entidad, operacion, payload } = evt;
    const datos = typeof payload === "string" ? JSON.parse(payload) : payload;

    switch (entidad) {
      case "RESERVA":
        await this.aplicarReserva(operacion, datos, sourceNode);
        break;
      case "PLATO":
        await this.aplicarPlato(operacion, datos, sourceNode);
        break;
      case "MENU":
        await this.aplicarMenu(operacion, datos, sourceNode);
        break;
      case "PROGRAMA":
        await this.aplicarPrograma(operacion, datos, sourceNode);
        break;
      case "FICHA":
        await this.aplicarFicha(operacion, datos, sourceNode);
        break;
      case "USUARIO":
        await this.aplicarUsuario(operacion, datos, sourceNode);
        break;
      case "USUARIO_ROL":
        await this.aplicarUsuarioRol(operacion, datos, sourceNode);
        break;
      case "TURNO":
        await this.aplicarTurno(operacion, datos, sourceNode);
        break;
      case "PQRSF":
        await this.aplicarPqrsf(operacion, datos, sourceNode);
        break;
      default:
        console.warn(`[SyncApplyService] Entidad no implementada para sync: ${entidad}`);
    }
  }

  // 1. Reconciliacion de Reservas con prevalencia de consumo presencial en comedor
  async aplicarReserva(operacion, datos, sourceNode) {
    const uuidRes = datos.uuid_reserva || datos.uuid;

    if (operacion === "CREATE" || operacion === "UPSERT") {
      const existente = await ReservaModel.findOne({
        where: {
          [Op.or]: [
            { uuid_reserva: uuidRes },
            {
              Id_Usuario: datos.Id_Usuario,
              Fec_Reserva: datos.Fec_Reserva,
              Tip_Reserva: datos.Tip_Reserva
            }
          ]
        }
      });

      if (!existente) {
        await ReservaModel.create({
          uuid_reserva: uuidRes,
          nodo_origen: sourceNode || "LOCAL",
          Fec_Reserva: datos.Fec_Reserva,
          Vec_Reserva: datos.Vec_Reserva,
          Est_Reserva: datos.Est_Reserva || "Generado",
          Tip_Reserva: datos.Tip_Reserva,
          Qr_Reserva: datos.Qr_Reserva,
          Id_Plato: datos.Id_Plato,
          Id_Usuario: datos.Id_Usuario,
          sync_status: "SYNCED"
        });
      } else {
        // Regla: si localmente ya se consumio o verifico, prevalece
        if (datos.Est_Reserva === "Consumido" || !["Consumido", "Verificado"].includes(existente.Est_Reserva)) {
          await existente.update({
            Est_Reserva: datos.Est_Reserva,
            Qr_Reserva: datos.Qr_Reserva || existente.Qr_Reserva,
            Id_Plato: datos.Id_Plato || existente.Id_Plato
          });
        }
      }
    } else if (operacion === "VERIFY") {
      const reserva = await ReservaModel.findOne({ where: { uuid_reserva: uuidRes } });
      if (reserva && reserva.Est_Reserva !== "Consumido") {
        await reserva.update({ Est_Reserva: "Verificado" });
      }
    } else if (operacion === "CONSUME") {
      const reserva = await ReservaModel.findOne({ where: { uuid_reserva: uuidRes } });
      if (reserva) {
        await reserva.update({ Est_Reserva: "Consumido" });
      }
    } else if (operacion === "CANCEL") {
      const reserva = await ReservaModel.findOne({ where: { uuid_reserva: uuidRes } });
      if (reserva && !["Consumido", "Verificado"].includes(reserva.Est_Reserva)) {
        await reserva.update({ Est_Reserva: "Cancelado" });
      }
    } else if (operacion === "TRANSFER") {
      const reserva = await ReservaModel.findOne({ where: { uuid_reserva: uuidRes } });
      if (reserva && !["Consumido"].includes(reserva.Est_Reserva)) {
        await reserva.update({
          Id_Usuario: datos.Id_Usuario_Nuevo,
          Id_Usuario_Cedente: datos.Id_Usuario_Cedente,
          Fec_Cesion: datos.Fec_Cesion || new Date(),
          motivo_cesion: datos.motivo_cesion,
          Qr_Reserva: datos.Qr_Reserva || reserva.Qr_Reserva
        });
      }
    }
  }

  // 2. Reconciliacion de Platos con propagacion de imagen binaria / base64
  async aplicarPlato(operacion, datos, sourceNode) {
    const cloudBaseUrl = (process.env.CLOUD_API_URL || "https://foodsyslagranja.com/api").replace(/\/api$/, "");
    if (datos.Img_Plato) {
      if (datos.Img_Base64) {
        guardarImagenSiVieneBase64(datos.Img_Plato, datos.Img_Base64);
      } else {
        await asegurarImagenLocal(datos.Img_Plato, null, cloudBaseUrl);
      }
    }

    if (operacion === "CREATE" || operacion === "UPSERT") {
      let plato = null;
      if (datos.Id_Plato) plato = await PlatoModel.findByPk(datos.Id_Plato);
      if (!plato && datos.Nom_Plato) plato = await PlatoModel.findOne({ where: { Nom_Plato: datos.Nom_Plato } });

      if (!plato) {
        await PlatoModel.create({
          Id_Plato: datos.Id_Plato || undefined,
          Nom_Plato: datos.Nom_Plato,
          Des_Plato: datos.Des_Plato,
          Tip_Plato: datos.Tip_Plato,
          Img_Plato: datos.Img_Plato
        });
      } else {
        await plato.update({
          Nom_Plato: datos.Nom_Plato || plato.Nom_Plato,
          Des_Plato: datos.Des_Plato !== undefined ? datos.Des_Plato : plato.Des_Plato,
          Tip_Plato: datos.Tip_Plato || plato.Tip_Plato,
          Img_Plato: datos.Img_Plato || plato.Img_Plato
        });
      }
    } else if (operacion === "UPDATE") {
      let plato = datos.Id_Plato ? await PlatoModel.findByPk(datos.Id_Plato) : null;
      if (!plato && datos.Nom_Plato) plato = await PlatoModel.findOne({ where: { Nom_Plato: datos.Nom_Plato } });
      if (plato) {
        await plato.update({
          Nom_Plato: datos.Nom_Plato || plato.Nom_Plato,
          Des_Plato: datos.Des_Plato !== undefined ? datos.Des_Plato : plato.Des_Plato,
          Tip_Plato: datos.Tip_Plato || plato.Tip_Plato,
          Img_Plato: datos.Img_Plato || plato.Img_Plato
        });
      }
    } else if (operacion === "DELETE") {
      if (datos.Id_Plato) await PlatoModel.destroy({ where: { Id_Plato: datos.Id_Plato } });
      else if (datos.Nom_Plato) await PlatoModel.destroy({ where: { Nom_Plato: datos.Nom_Plato } });
    }
  }

  // 3. Reconciliacion de Menus programados
  async aplicarMenu(operacion, datos, sourceNode) {
    if (operacion === "CREATE" || operacion === "UPSERT") {
      let menu = null;
      if (datos.Id_Menu) menu = await MenuModel.findByPk(datos.Id_Menu);
      if (!menu) {
        menu = await MenuModel.findOne({
          where: {
            Fec_Menu: datos.Fec_Menu,
            Tip_Menu: datos.Tip_Menu,
            Id_Plato: datos.Id_Plato
          }
        });
      }

      if (!menu) {
        await MenuModel.create({
          Id_Menu: datos.Id_Menu || undefined,
          Fec_Menu: datos.Fec_Menu,
          Tip_Menu: datos.Tip_Menu,
          Id_Plato: datos.Id_Plato
        });
      } else {
        await menu.update({
          Fec_Menu: datos.Fec_Menu || menu.Fec_Menu,
          Tip_Menu: datos.Tip_Menu || menu.Tip_Menu,
          Id_Plato: datos.Id_Plato || menu.Id_Plato
        });
      }
    } else if (operacion === "UPDATE") {
      const menu = await MenuModel.findByPk(datos.Id_Menu);
      if (menu) {
        await menu.update({
          Fec_Menu: datos.Fec_Menu || menu.Fec_Menu,
          Tip_Menu: datos.Tip_Menu || menu.Tip_Menu,
          Id_Plato: datos.Id_Plato || menu.Id_Plato
        });
      }
    } else if (operacion === "DELETE") {
      if (datos.Id_Menu) await MenuModel.destroy({ where: { Id_Menu: datos.Id_Menu } });
    }
  }

  // 4. Reconciliacion de Programas Formativos
  async aplicarPrograma(operacion, datos, sourceNode) {
    if (operacion === "CREATE" || operacion === "UPSERT") {
      let prog = null;
      if (datos.Id_Programa) prog = await ProgramaModel.findByPk(datos.Id_Programa);
      if (!prog && datos.Nom_Programa) prog = await ProgramaModel.findOne({ where: { Nom_Programa: datos.Nom_Programa } });

      if (!prog) {
        await ProgramaModel.create({
          Id_Programa: datos.Id_Programa || undefined,
          Nom_Programa: datos.Nom_Programa,
          NivFor_Programa: datos.NivFor_Programa || null,
          Are_Programa: datos.Are_Programa || null,
          Est_Programa: datos.Est_Programa || "Activo"
        });
      } else {
        await prog.update({
          Nom_Programa: datos.Nom_Programa || prog.Nom_Programa,
          NivFor_Programa: datos.NivFor_Programa !== undefined ? datos.NivFor_Programa : prog.NivFor_Programa,
          Are_Programa: datos.Are_Programa !== undefined ? datos.Are_Programa : prog.Are_Programa,
          Est_Programa: datos.Est_Programa || prog.Est_Programa
        });
      }
    } else if (operacion === "UPDATE") {
      let prog = datos.Id_Programa ? await ProgramaModel.findByPk(datos.Id_Programa) : null;
      if (!prog && datos.Nom_Programa) prog = await ProgramaModel.findOne({ where: { Nom_Programa: datos.Nom_Programa } });
      if (prog) {
        await prog.update({
          Nom_Programa: datos.Nom_Programa || prog.Nom_Programa,
          NivFor_Programa: datos.NivFor_Programa !== undefined ? datos.NivFor_Programa : prog.NivFor_Programa,
          Are_Programa: datos.Are_Programa !== undefined ? datos.Are_Programa : prog.Are_Programa,
          Est_Programa: datos.Est_Programa || prog.Est_Programa
        });
      }
    } else if (operacion === "DELETE") {
      let prog = datos.Id_Programa ? await ProgramaModel.findByPk(datos.Id_Programa) : null;
      if (!prog && datos.Nom_Programa) prog = await ProgramaModel.findOne({ where: { Nom_Programa: datos.Nom_Programa } });
      if (prog) {
        await prog.update({ Est_Programa: "Inactivo" });
      }
    }
  }

  // 5. Reconciliacion de Fichas de Formacion
  async aplicarFicha(operacion, datos, sourceNode) {
    if (operacion === "CREATE" || operacion === "UPSERT") {
      let ficha = null;
      if (datos.Num_Ficha) ficha = await FichasModel.findOne({ where: { Num_Ficha: datos.Num_Ficha } });
      if (!ficha && datos.Id_Ficha) ficha = await FichasModel.findByPk(datos.Id_Ficha);

      if (!ficha) {
        ficha = await FichasModel.create({
          Id_Ficha: datos.Id_Ficha || undefined,
          Num_Ficha: datos.Num_Ficha,
          FecIniLec_Ficha: datos.FecIniLec_Ficha,
          FecFinLec_Ficha: datos.FecFinLec_Ficha,
          FecIniPra_Ficha: datos.FecIniPra_Ficha,
          FecFinPra_Ficha: datos.FecFinPra_Ficha,
          Id_Programa: datos.Id_Programa
        });
      } else {
        await ficha.update({
          Num_Ficha: datos.Num_Ficha || ficha.Num_Ficha,
          FecIniLec_Ficha: datos.FecIniLec_Ficha || ficha.FecIniLec_Ficha,
          FecFinLec_Ficha: datos.FecFinLec_Ficha || ficha.FecFinLec_Ficha,
          FecIniPra_Ficha: datos.FecIniPra_Ficha || ficha.FecIniPra_Ficha,
          FecFinPra_Ficha: datos.FecFinPra_Ficha || ficha.FecFinPra_Ficha,
          Id_Programa: datos.Id_Programa || ficha.Id_Programa
        });
      }

      try {
        await sincronizarEstadoAprendices(ficha.Id_Ficha);
      } catch (e) {}
    } else if (operacion === "UPDATE") {
      let ficha = datos.Num_Ficha ? await FichasModel.findOne({ where: { Num_Ficha: datos.Num_Ficha } }) : null;
      if (!ficha && datos.Id_Ficha) ficha = await FichasModel.findByPk(datos.Id_Ficha);
      if (ficha) {
        await ficha.update({
          Num_Ficha: datos.Num_Ficha || ficha.Num_Ficha,
          FecIniLec_Ficha: datos.FecIniLec_Ficha || ficha.FecIniLec_Ficha,
          FecFinLec_Ficha: datos.FecFinLec_Ficha || ficha.FecFinLec_Ficha,
          FecIniPra_Ficha: datos.FecIniPra_Ficha || ficha.FecIniPra_Ficha,
          FecFinPra_Ficha: datos.FecFinPra_Ficha || ficha.FecFinPra_Ficha,
          Id_Programa: datos.Id_Programa || ficha.Id_Programa
        });
        try {
          await sincronizarEstadoAprendices(ficha.Id_Ficha);
        } catch (e) {}
      }
    } else if (operacion === "DELETE") {
      if (datos.Id_Ficha) await FichasModel.destroy({ where: { Id_Ficha: datos.Id_Ficha } });
      else if (datos.Num_Ficha) await FichasModel.destroy({ where: { Num_Ficha: datos.Num_Ficha } });
    }
  }

  // 6. Reconciliacion de Usuarios (Aprendices, Funcionarios, Administradores)
  async aplicarUsuario(operacion, datos, sourceNode) {
    if (operacion === "CREATE" || operacion === "UPSERT") {
      let usuario = null;
      if (datos.NumDoc_Usuario) usuario = await UsuariosModel.findOne({ where: { NumDoc_Usuario: datos.NumDoc_Usuario } });
      if (!usuario && datos.Id_Usuario) usuario = await UsuariosModel.findByPk(datos.Id_Usuario);
      if (!usuario && datos.uuid) usuario = await UsuariosModel.findOne({ where: { uuid: datos.uuid } });

      const camposValidos = {};
      const props = [
        "TipDoc_Usuario", "NumDoc_Usuario", "Nom_Usuario", "Ape_Usuario",
        "Gen_Usuario", "Cor_Usuario", "Tel_Usuario", "CenCon_Usuario",
        "Est_Usuario", "Pol_Usuario", "San_Usuario", "Fec_Desancion",
        "Id_Ficha", "password", "uuid"
      ];
      for (const p of props) {
        if (datos[p] !== undefined && datos[p] !== null) {
          camposValidos[p] = datos[p];
        }
      }

      if (!usuario) {
        if (datos.Id_Usuario) camposValidos.Id_Usuario = datos.Id_Usuario;
        usuario = await UsuariosModel.create(camposValidos);
      } else {
        await usuario.update(camposValidos);
      }

      if (Array.isArray(datos.roles) && usuario) {
        await this.sincronizarRolesUsuario(usuario.Id_Usuario, datos.roles);
      }
    } else if (operacion === "UPDATE") {
      let usuario = null;
      if (datos.NumDoc_Usuario) usuario = await UsuariosModel.findOne({ where: { NumDoc_Usuario: datos.NumDoc_Usuario } });
      if (!usuario && datos.Id_Usuario) usuario = await UsuariosModel.findByPk(datos.Id_Usuario);
      if (usuario) {
        const camposValidos = {};
        const props = [
          "TipDoc_Usuario", "Nom_Usuario", "Ape_Usuario",
          "Gen_Usuario", "Cor_Usuario", "Tel_Usuario", "CenCon_Usuario",
          "Est_Usuario", "Pol_Usuario", "San_Usuario", "Fec_Desancion",
          "Id_Ficha", "password"
        ];
        for (const p of props) {
          if (datos[p] !== undefined && datos[p] !== null) {
            camposValidos[p] = datos[p];
          }
        }
        await usuario.update(camposValidos);
        if (Array.isArray(datos.roles)) {
          await this.sincronizarRolesUsuario(usuario.Id_Usuario, datos.roles);
        }
      }
    } else if (operacion === "DELETE") {
      let usuario = null;
      if (datos.NumDoc_Usuario) usuario = await UsuariosModel.findOne({ where: { NumDoc_Usuario: datos.NumDoc_Usuario } });
      if (!usuario && datos.Id_Usuario) usuario = await UsuariosModel.findByPk(datos.Id_Usuario);
      if (usuario) {
        await UsuariosRolModel.destroy({ where: { Id_Usuario: usuario.Id_Usuario } });
        await usuario.destroy();
      }
    }
  }

  // 7. Reconciliacion de Roles asignados
  async aplicarUsuarioRol(operacion, datos, sourceNode) {
    let usuario = null;
    if (datos.NumDoc_Usuario) usuario = await UsuariosModel.findOne({ where: { NumDoc_Usuario: datos.NumDoc_Usuario } });
    if (!usuario && datos.Id_Usuario) usuario = await UsuariosModel.findByPk(datos.Id_Usuario);
    if (usuario && Array.isArray(datos.roles)) {
      await this.sincronizarRolesUsuario(usuario.Id_Usuario, datos.roles);
    }
  }

  async sincronizarRolesUsuario(idUsuario, nombresRoles) {
    if (!idUsuario || !Array.isArray(nombresRoles)) return;
    await UsuariosRolModel.destroy({ where: { Id_Usuario: idUsuario } });
    for (const nombreRol of nombresRoles) {
      const rol = await RolesModel.findOne({ where: { Nom_Rol: nombreRol } });
      if (rol) {
        await UsuariosRolModel.create({
          Id_Usuario: idUsuario,
          Id_Rol: rol.Id_Rol
        });
      }
    }
  }

  // 8. Reconciliacion de Turnos de Supervision
  async aplicarTurno(operacion, datos, sourceNode) {
    let idSup = datos.Id_Usuario;
    if (!idSup && datos.NumDoc_Supervisor) {
      const sup = await UsuariosModel.findOne({ where: { NumDoc_Usuario: datos.NumDoc_Supervisor } });
      if (sup) idSup = sup.Id_Usuario;
    }

    if (operacion === "INICIAR" || operacion === "CREATE") {
      if (idSup) {
        let turno = null;
        if (datos.Id_Turno) turno = await TurnosModel.findByPk(datos.Id_Turno);
        if (!turno) {
          turno = await TurnosModel.findOne({
            where: { Id_Usuario: idSup, Estado: "Activo" }
          });
        }
        if (!turno) {
          await TurnosModel.create({
            Id_Turno: datos.Id_Turno || undefined,
            Id_Usuario: idSup,
            Fecha_Inicio: datos.Fecha_Inicio || new Date(),
            Estado: "Activo",
            Total_Consumos_Registrados: datos.Total_Consumos_Registrados || 0,
            Observaciones: datos.Observaciones || null
          });
        } else {
          await turno.update({
            Estado: "Activo",
            Total_Consumos_Registrados: datos.Total_Consumos_Registrados || turno.Total_Consumos_Registrados,
            Observaciones: datos.Observaciones !== undefined ? datos.Observaciones : turno.Observaciones
          });
        }
      }
    } else if (operacion === "FINALIZAR" || operacion === "UPDATE") {
      let turno = null;
      if (datos.Id_Turno) turno = await TurnosModel.findByPk(datos.Id_Turno);
      if (!turno && idSup) {
        turno = await TurnosModel.findOne({
          where: { Id_Usuario: idSup, Estado: "Activo" },
          order: [["Id_Turno", "DESC"]]
        });
      }
      if (turno) {
        await turno.update({
          Fecha_Fin: datos.Fecha_Fin || new Date(),
          Estado: "Finalizado",
          Total_Consumos_Registrados: datos.Total_Consumos_Registrados !== undefined ? datos.Total_Consumos_Registrados : turno.Total_Consumos_Registrados,
          Observaciones: datos.Observaciones !== undefined ? datos.Observaciones : turno.Observaciones
        });
      }
    }
  }

  // 9. Reconciliacion de PQRSF con SLA y trazabilidad
  async aplicarPqrsf(operacion, datos, sourceNode) {
    let pqrsf = null;
    if (datos.uuid_pqrsf) pqrsf = await PqrsfModel.findOne({ where: { uuid_pqrsf: datos.uuid_pqrsf } });
    if (!pqrsf && datos.Radicado) pqrsf = await PqrsfModel.findOne({ where: { Radicado: datos.Radicado } });

    if (operacion === "CREATE" || operacion === "UPSERT") {
      if (!pqrsf) {
        await PqrsfModel.create({
          uuid_pqrsf: datos.uuid_pqrsf || crypto.randomUUID(),
          Radicado: datos.Radicado,
          Id_Usuario: datos.Id_Usuario || null,
          Id_Reserva: datos.Id_Reserva || null,
          Nombre_Reportante: datos.Nombre_Reportante,
          Correo_Reportante: datos.Correo_Reportante,
          Rol_Reportante: datos.Rol_Reportante || "Aprendiz",
          Tipo_Solicitud: datos.Tipo_Solicitud,
          Categoria_Estandar: datos.Categoria_Estandar,
          Subcategoria: datos.Subcategoria,
          Persona_Servicio_Ref: datos.Persona_Servicio_Ref,
          Fec_Hecho: datos.Fec_Hecho,
          Tip_Comida: datos.Tip_Comida,
          Id_Plato_Relacionado: datos.Id_Plato_Relacionado,
          Nivel_Prioridad: datos.Nivel_Prioridad,
          Puntaje_Prioridad: datos.Puntaje_Prioridad,
          Sla_Horas: datos.Sla_Horas,
          Calificacion_Servicio: datos.Calificacion_Servicio,
          Descripcion: datos.Descripcion,
          Archivo_Evidencia: datos.Archivo_Evidencia,
          Estado_Pqrsf: datos.Estado_Pqrsf || "Abierta",
          Respuesta_Administracion: datos.Respuesta_Administracion || null,
          Id_Responsable_Respuesta: datos.Id_Responsable_Respuesta || null,
          Fecha_Respuesta: datos.Fecha_Respuesta || null,
          Fecha_Limite_SLA: datos.Fecha_Limite_SLA || new Date(),
          nodo_origen: sourceNode || "LOCAL",
          sync_status: "SYNCED"
        });
      } else {
        await pqrsf.update({
          Estado_Pqrsf: datos.Estado_Pqrsf || pqrsf.Estado_Pqrsf,
          Respuesta_Administracion: datos.Respuesta_Administracion !== undefined ? datos.Respuesta_Administracion : pqrsf.Respuesta_Administracion,
          Id_Responsable_Respuesta: datos.Id_Responsable_Respuesta || pqrsf.Id_Responsable_Respuesta,
          Fecha_Respuesta: datos.Fecha_Respuesta || pqrsf.Fecha_Respuesta
        });
      }
    } else if (operacion === "UPDATE" || operacion === "RESPONDER") {
      if (pqrsf) {
        await pqrsf.update({
          Estado_Pqrsf: datos.Estado_Pqrsf || pqrsf.Estado_Pqrsf,
          Respuesta_Administracion: datos.Respuesta_Administracion !== undefined ? datos.Respuesta_Administracion : pqrsf.Respuesta_Administracion,
          Id_Responsable_Respuesta: datos.Id_Responsable_Respuesta || pqrsf.Id_Responsable_Respuesta,
          Fecha_Respuesta: datos.Fecha_Respuesta || pqrsf.Fecha_Respuesta
        });
      }
    }
  }
}

const syncApplyServiceInstance = new SyncApplyService();
export { syncApplyServiceInstance, SyncApplyService };
export default syncApplyServiceInstance;
