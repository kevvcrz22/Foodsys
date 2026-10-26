// Node/Jobs/SyncWorker.js
// Demonio / Worker de sincronizacion bidireccional automatica estilo OneDrive
// Conecta el Nodo Local de La Granja con el VPS en Hetzner cuando hay internet.
// Si no hay conexion, opera en silencio sin lanzar excepciones ni bloquear la LAN.
// Comentarios didacticos sin tildes ni emojis para aprendices de primer semestre.

import db from "../Database/db.js";
import CentrosSenaConfigModel from "../Models/CentrosSenaConfigModel.js";
import syncApplyServiceInstance from "../Services/SyncApplyService.js";

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
      this.ejecutarCicloSincronizacion().catch(() => {
        console.warn("[SyncWorker] Primer ciclo no pudo conectar a la nube (Modo local activo)");
      });
    }, 5000);

    this.intervalo = setInterval(() => {
      this.ejecutarCicloSincronizacion().catch(() => {
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
   * con drenado completo de colas pendientes
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
      // 1. Health check rapido con AbortController de 3.5 segundos
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

      // 2. PUSH: Enviar eventos locales pendientes a Hetzner drenando toda la cola
      let totalPushed = 0;
      let pendientesBatch = [];

      do {
        const [pendientes] = await db.query(`
          SELECT event_id, source_node, entidad, operacion, entity_uuid, payload, attempts, created_at
          FROM sync_outbox
          WHERE sync_status = 'PENDING'
          ORDER BY created_at ASC
          LIMIT 200
        `);
        pendientesBatch = pendientes;

        if (pendientesBatch.length > 0) {
          const pushRes = await fetch(`${cloudUrl}/Sync/push`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceNode: "LOCAL",
              events: pendientesBatch
            })
          }).catch(err => {
            console.warn("[SyncWorker] Error de red en push:", err.message);
            return null;
          });

          if (pushRes && pushRes.ok) {
            const pushData = await pushRes.json();
            const confirmedIds = pushData.confirmedIds || [];

            if (confirmedIds.length > 0) {
              await db.query(`
                UPDATE sync_outbox
                SET sync_status = 'SYNCED', synced_at = NOW()
                WHERE event_id IN (?)
              `, { replacements: [confirmedIds] });
              totalPushed += confirmedIds.length;
            } else {
              break;
            }
          } else {
            break; // Detener drenado si el endpoint no responde ok
          }
        }
      } while (pendientesBatch.length >= 200);

      // 3. PULL: Descargar eventos creados en Hetzner mientras La Granja estuvo desconectada
      const configCentro = await CentrosSenaConfigModel.findOne({
        where: { Codigo_Centro_Sena: "9121" }
      });
      let ultimaSync = configCentro?.Ultima_Sincronizacion
        ? new Date(configCentro.Ultima_Sincronizacion).toISOString()
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      let totalPulled = 0;
      let hayMasPull = true;

      while (hayMasPull) {
        const pullRes = await fetch(`${cloudUrl}/Sync/pull?desde=${encodeURIComponent(ultimaSync)}`).catch(err => {
          console.warn("[SyncWorker] Error de red en pull:", err.message);
          return null;
        });

        if (!pullRes || !pullRes.ok) break;

        const pullData = await pullRes.json();
        const incomingEvents = pullData.events || [];
        if (incomingEvents.length === 0) break;

        for (const evt of incomingEvents) {
          // Validar idempotencia con sync_inbox_processed
          const [existeInbox] = await db.query(
            "SELECT event_id FROM sync_inbox_processed WHERE event_id = ?",
            { replacements: [evt.event_id] }
          );
          if (existeInbox.length > 0) continue;

          try {
            await this.aplicarEventoEntrante(evt);
          } catch (errApp) {
            console.warn(`[SyncWorker] Error aplicando evento pull ${evt.entidad}/${evt.operacion}:`, errApp.message);
          }

          await db.query(`
            INSERT INTO sync_inbox_processed (event_id, source_node, processed_at)
            VALUES (?, ?, NOW())
          `, { replacements: [evt.event_id, evt.source_node || "CLOUD"] });

          totalPulled++;
          if (evt.created_at) {
            ultimaSync = new Date(evt.created_at).toISOString();
          }
        }

        if (incomingEvents.length < 200) {
          hayMasPull = false;
        }
      }

      // Actualizar marca de tiempo de ultima sincronizacion exitosa
      await CentrosSenaConfigModel.update(
        { Ultima_Sincronizacion: new Date() },
        { where: { Codigo_Centro_Sena: "9121" } }
      ).catch(() => {});

      if (totalPushed > 0 || totalPulled > 0) {
        console.log(`[SyncWorker] Ciclo completado: ${totalPushed} enviados, ${totalPulled} recibidos.`);
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
   * Aplica un evento entrante utilizando el servicio unificado SyncApplyService
   */
  async aplicarEventoEntrante(evt) {
    await syncApplyServiceInstance.aplicarEvento(evt, evt.source_node || "CLOUD");
  }
}

const syncWorkerInstance = new SyncWorker();
export { syncWorkerInstance, SyncWorker };
export default syncWorkerInstance;
