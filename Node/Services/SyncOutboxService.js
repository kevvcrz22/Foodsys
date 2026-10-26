// Node/Services/SyncOutboxService.js
// Servicio para encolar eventos de sincronizacion bidireccional en la tabla sync_outbox
// Comentarios didacticos sin tildes ni emojis para aprendices de primer semestre.

import crypto from "crypto";
import db from "../Database/db.js";

/**
 * Encola un evento en la tabla sync_outbox para ser sincronizado entre La Granja y Hetzner
 * @param {Object} param0
 * @param {string} param0.entidad - Entidad afectada (PLATO, MENU, RESERVA, PQRSF, etc.)
 * @param {string} param0.operacion - Operacion efectuada (CREATE, UPDATE, DELETE, etc.)
 * @param {string|number} param0.entity_uuid - Identificador o UUID unico de la entidad
 * @param {Object|string} param0.payload - Datos completos de la entidad para replicar
 */
export const encolarEventoSync = async ({ entidad, operacion, entity_uuid, payload }) => {
  try {
    const event_id = crypto.randomUUID();
    const source_node = process.env.NODE_ROLE || "LOCAL";
    const payloadStr = typeof payload === "string" ? payload : JSON.stringify(payload);

    await db.query(`
      INSERT INTO sync_outbox (event_id, source_node, entidad, operacion, entity_uuid, payload, sync_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING', NOW())
    `, {
      replacements: [
        event_id,
        source_node,
        entidad,
        operacion,
        entity_uuid ? String(entity_uuid) : crypto.randomUUID(),
        payloadStr
      ]
    });

    console.log(`[SyncOutbox] Evento encolado: ${entidad} -> ${operacion} (ID: ${entity_uuid})`);
  } catch (error) {
    console.warn(`[SyncOutbox] Nota al encolar evento ${entidad}/${operacion}:`, error.message);
  }
};

export default { encolarEventoSync };
