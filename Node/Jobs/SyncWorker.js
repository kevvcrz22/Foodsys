// Node/Jobs/SyncWorker.js
// Demonio / Worker de sincronizacion bidireccional automatica estilo OneDrive
// Conecta el Nodo Local de La Granja con el VPS en Hetzner cuando hay internet.
// Si no hay conexion, opera en silencio sin lanzar excepciones ni bloquear la LAN.
// Comentarios didacticos sin tildes ni emojis para aprendices de primer semestre.

import db from "../Database/db.js";
import ReservaModel from "../Models/ReservasModel.js";
import CentrosSenaConfigModel from "../Models/CentrosSenaConfigModel.js";
import PlatoModel from "../Models/PlatosModels.js";
import MenuModel from "../Models/MenusModels.js";
import { Op } from "sequelize";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, "../uploads");

const asegurarImagenLocal = async (nombreArchivo, base64Data, cloudBaseUrl) => {
  if (!nombreArchivo) return;
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    const destino = path.join(UPLOADS_DIR, nombreArchivo);
    if (fs.existsSync(destino)) return;

    if (base64Data) {
      fs.writeFileSync(destino, Buffer.from(base64Data, "base64"));
      console.log(`[SyncWorker] Imagen guardada desde base64: ${nombreArchivo}`);
      return;
    }

    if (cloudBaseUrl) {
      const imgUrl = `${cloudBaseUrl}/uploads/${nombreArchivo}`;
      const res = await fetch(imgUrl);
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(destino, buffer);
        console.log(`[SyncWorker] Imagen descargada desde nube: ${nombreArchivo}`);
      }
    }
  } catch (err) {
    console.warn(`[SyncWorker] Nota al descargar imagen ${nombreArchivo}:`, err.message);
  }
};

class SyncWorker {
  constructor() {
    this.estaEjecutando = false;
    this.intervalo = null;
  }

  /**
   * Inicia el demonio de sincronizacion periodica
   * @param {number} intervaloMs - Tiempo entre intentos (por defecto 20 segundos = 20000ms)
   */
  iniciar(intervaloMs = 20000) {
    if (this.intervalo) return;

    console.log(`[SyncWorker] Iniciado demonio de sincronizacion cada ${intervaloMs / 1000}s`);

    // Ejecutar una pasada inicial despues de 5 segundos de arrancar
    setTimeout(() => {
      this.ejecutarCicloSincronizacion().catch(e => {
        console.warn("[SyncWorker] Primer ciclo no pudo conectar a la nube (Modo local activo)");
      });
    }, 5000);

    this.intervalo = setInterval(() => {
      this.ejecutarCicloSincronizacion().catch(e => {
        // En modo contingencia offline, silenciar errores para no saturar los logs
      });
    }, intervaloMs);
  }

  /**
   * Detiene el demonio
   */
  detener() {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = null;
    }
  }

  /**
   * Ejecuta un ciclo completo de sincronizacion (Health Check -> Push -> Pull)
   */
  async ejecutarCicloSincronizacion() {
    if (this.estaEjecutando) {
      return { ejecutado: false, razon: "Ya hay un ciclo de sincronizacion en curso" };
    }

    const cloudUrl = process.env.CLOUD_API_URL || "https://foodsyslagranja.com/api";
    const nodeRole = process.env.NODE_ROLE || "LOCAL";

    // Si este nodo es la nube (Hetzner), no empuja a si mismo
    if (nodeRole === "CLOUD") {
      return { ejecutado: false, razon: "Nodo configurado como CLOUD (receptor pasivo)" };
    }

    this.estaEjecutando = true;

    try {
      // 1. Health check rapido con AbortController de 3 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const healthRes = await fetch(`${cloudUrl}/Sync/health`, {
        signal: controller.signal
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (!healthRes || !healthRes.ok) {
        // No hay conexion a internet en La Granja
        await CentrosSenaConfigModel.update(
          { Estado_Nodo_Local: "OFFLINE_CONTINGENCIA" },
          { where: { Codigo_Centro_Sena: "9121" } }
        ).catch(() => {});

        return {
          ejecutado: false,
          conexion: false,
          mensaje: "Sin conexion con el servidor en la nube. Operando en modo local contingencia."
        };
      }

      // Conectado con la nube
      await CentrosSenaConfigModel.update(
        { Estado_Nodo_Local: "ONLINE" },
        { where: { Codigo_Centro_Sena: "9121" } }
      ).catch(() => {});

      // 2. PUSH: Enviar eventos locales pendientes a Hetzner en lotes de 150
      const [pendientes] = await db.query(`
        SELECT event_id, source_node, entidad, operacion, entity_uuid, payload, attempts, created_at
        FROM sync_outbox
        WHERE sync_status = 'PENDING'
        ORDER BY created_at ASC
        LIMIT 150
      `);

      let totalPushed = 0;
      if (pendientes.length > 0) {
        const pushRes = await fetch(`${cloudUrl}/Sync/push`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceNode: "LOCAL",
            events: pendientes
          })
        });

        if (pushRes.ok) {
          const pushData = await pushRes.json();
          const confirmedIds = pushData.confirmedIds || [];

          if (confirmedIds.length > 0) {
            await db.query(`
              UPDATE sync_outbox
              SET sync_status = 'SYNCED', synced_at = NOW()
              WHERE event_id IN (?)
            `, { replacements: [confirmedIds] });
            totalPushed = confirmedIds.length;
          }
        }
      }

      // 3. PULL: Descargar eventos creados en Hetzner mientras La Granja estuvo desconectada
      const configCentro = await CentrosSenaConfigModel.findOne({
        where: { Codigo_Centro_Sena: "9121" }
      });
      const ultimaSync = configCentro?.Ultima_Sincronizacion
        ? new Date(configCentro.Ultima_Sincronizacion).toISOString()
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const pullRes = await fetch(`${cloudUrl}/Sync/pull?desde=${encodeURIComponent(ultimaSync)}`);
      let totalPulled = 0;

      if (pullRes.ok) {
        const pullData = await pullRes.json();
        const incomingEvents = pullData.events || [];

        for (const evt of incomingEvents) {
          // Validar idempotencia con sync_inbox_processed
          const [existeInbox] = await db.query(
            "SELECT event_id FROM sync_inbox_processed WHERE event_id = ?",
            { replacements: [evt.event_id] }
          );
          if (existeInbox.length > 0) continue;

          await this.aplicarEventoEntrante(evt);

          await db.query(`
            INSERT INTO sync_inbox_processed (event_id, source_node, processed_at)
            VALUES (?, ?, NOW())
          `, { replacements: [evt.event_id, evt.source_node || "CLOUD"] });

          totalPulled++;
        }

        // Actualizar marca de tiempo de ultima sincronizacion exitosa
        await CentrosSenaConfigModel.update(
          { Ultima_Sincronizacion: new Date() },
          { where: { Codigo_Centro_Sena: "9121" } }
        );
      }

      return {
        ejecutado: true,
        conexion: true,
        totalPushed,
        totalPulled,
        timestamp: new Date()
      };
    } finally {
      this.estaEjecutando = false;
    }
  }

  /**
   * Aplica un evento proveniente del servidor de Hetzner al servidor local
   * con la regla de negocio de que el consumo en comedor local siempre prevalece
   */
  async aplicarEventoEntrante(evt) {
    const { entidad, operacion, payload } = evt;
    const datos = typeof payload === "string" ? JSON.parse(payload) : payload;

    if (entidad === "RESERVA") {
      if (operacion === "CREATE" || operacion === "UPSERT") {
        // Si no existe, crear; si ya existe, actualizar respetando consumo
        const reservaExistente = await ReservaModel.findOne({
          where: {
            [Op.or]: [
              { uuid_reserva: datos.uuid_reserva || datos.uuid },
              {
                Id_Usuario: datos.Id_Usuario,
                Fec_Reserva: datos.Fec_Reserva,
                Tip_Reserva: datos.Tip_Reserva
              }
            ]
          }
        });

        if (!reservaExistente) {
          await ReservaModel.create({
            uuid_reserva: datos.uuid_reserva || datos.uuid,
            nodo_origen: "CLOUD",
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
          // REGLA SUPREMA: Si localmente ya fue consumida o verificada, NO se sobreescribe
          if (!["Consumido", "Verificado"].includes(reservaExistente.Est_Reserva)) {
            await reservaExistente.update({
              Est_Reserva: datos.Est_Reserva,
              Qr_Reserva: datos.Qr_Reserva || reservaExistente.Qr_Reserva,
              Id_Plato: datos.Id_Plato || reservaExistente.Id_Plato
            });
          }
        }
      } else if (operacion === "CANCEL") {
        const reserva = await ReservaModel.findOne({
          where: { uuid_reserva: datos.uuid_reserva }
        });
        if (reserva && !["Consumido", "Verificado"].includes(reserva.Est_Reserva)) {
          await reserva.update({ Est_Reserva: "Cancelado" });
        }
      } else if (operacion === "TRANSFER") {
        const reserva = await ReservaModel.findOne({
          where: { uuid_reserva: datos.uuid_reserva }
        });
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
    } else if (entidad === "PLATO") {
      const cloudBaseUrl = (process.env.CLOUD_API_URL || "https://foodsyslagranja.com/api").replace(/\/api$/, "");
      if (datos.Img_Plato) {
        await asegurarImagenLocal(datos.Img_Plato, datos.Img_Base64, cloudBaseUrl);
      }

      if (operacion === "CREATE" || operacion === "UPSERT") {
        let plato = null;
        if (datos.Id_Plato) {
          plato = await PlatoModel.findByPk(datos.Id_Plato);
        }
        if (!plato && datos.Nom_Plato) {
          plato = await PlatoModel.findOne({ where: { Nom_Plato: datos.Nom_Plato } });
        }

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
        if (!plato && datos.Nom_Plato) {
          plato = await PlatoModel.findOne({ where: { Nom_Plato: datos.Nom_Plato } });
        }
        if (plato) {
          await plato.update({
            Nom_Plato: datos.Nom_Plato || plato.Nom_Plato,
            Des_Plato: datos.Des_Plato !== undefined ? datos.Des_Plato : plato.Des_Plato,
            Tip_Plato: datos.Tip_Plato || plato.Tip_Plato,
            Img_Plato: datos.Img_Plato || plato.Img_Plato
          });
        }
      } else if (operacion === "DELETE") {
        if (datos.Id_Plato) {
          await PlatoModel.destroy({ where: { Id_Plato: datos.Id_Plato } });
        } else if (datos.Nom_Plato) {
          await PlatoModel.destroy({ where: { Nom_Plato: datos.Nom_Plato } });
        }
      }
    } else if (entidad === "MENU") {
      if (operacion === "CREATE" || operacion === "UPSERT") {
        let menu = null;
        if (datos.Id_Menu) {
          menu = await MenuModel.findByPk(datos.Id_Menu);
        }
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
        if (datos.Id_Menu) {
          await MenuModel.destroy({ where: { Id_Menu: datos.Id_Menu } });
        }
      }
    }
  }
}

const syncWorkerInstance = new SyncWorker();
export { syncWorkerInstance, SyncWorker };
export default syncWorkerInstance;
