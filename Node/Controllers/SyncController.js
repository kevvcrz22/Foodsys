// Node/Controllers/SyncController.js
// Controlador para endpoints de sincronizacion offline-first entre La Granja y Hetzner
// Soporta push, pull, monitor de estado, puente movil de 30s y exportacion USB

import db from "../Database/db.js";
import CentrosSenaConfigModel from "../Models/CentrosSenaConfigModel.js";
import ReservaModel from "../Models/ReservasModel.js";
import syncWorkerInstance from "../Jobs/SyncWorker.js";
import { Op } from "sequelize";

export const health = async (req, res) => {
  return res.status(200).json({
    status: "OK",
    nodo: process.env.NODE_ROLE || "LOCAL",
    timestamp: new Date().toISOString()
  });
};

export const push = async (req, res) => {
  try {
    const { sourceNode, events = [] } = req.body;
    const confirmedIds = [];

    for (const evt of events) {
      const { event_id, entidad, operacion, payload } = evt;
      const datos = typeof payload === "string" ? JSON.parse(payload) : payload;

      // 1. Idempotencia: Verificar si ya fue procesado antes
      const [yaProcesado] = await db.query(
        "SELECT event_id FROM sync_inbox_processed WHERE event_id = ?",
        { replacements: [event_id] }
      );

      if (yaProcesado.length > 0) {
        confirmedIds.push(event_id);
        continue;
      }

      // 2. Procesar segun la entidad
      if (entidad === "RESERVA") {
        if (operacion === "CREATE" || operacion === "UPSERT") {
          const uuidRes = datos.uuid_reserva || datos.uuid;
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
            // Regla de negocio: Si localmente ya se consumio, prevalece
            if (datos.Est_Reserva === "Consumido" || !["Consumido"].includes(existente.Est_Reserva)) {
              await existente.update({
                Est_Reserva: datos.Est_Reserva,
                Qr_Reserva: datos.Qr_Reserva || existente.Qr_Reserva,
                Id_Plato: datos.Id_Plato || existente.Id_Plato
              });
            }
          }
        } else if (operacion === "CONSUME") {
          const uuidRes = datos.uuid_reserva || datos.uuid;
          const reserva = await ReservaModel.findOne({ where: { uuid_reserva: uuidRes } });
          if (reserva) {
            await reserva.update({ Est_Reserva: "Consumido" });
          }
        } else if (operacion === "CANCEL") {
          const uuidRes = datos.uuid_reserva || datos.uuid;
          const reserva = await ReservaModel.findOne({ where: { uuid_reserva: uuidRes } });
          if (reserva && !["Consumido", "Verificado"].includes(reserva.Est_Reserva)) {
            await reserva.update({ Est_Reserva: "Cancelado" });
          }
        } else if (operacion === "TRANSFER") {
          const uuidRes = datos.uuid_reserva || datos.uuid;
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

      // Marcar evento como procesado
      await db.query(
        "INSERT INTO sync_inbox_processed (event_id, source_node, processed_at) VALUES (?, ?, NOW())",
        { replacements: [event_id, sourceNode || "LOCAL"] }
      );

      confirmedIds.push(event_id);
    }

    return res.status(200).json({ confirmedIds, totalProcesados: confirmedIds.length });
  } catch (error) {
    console.error("[SyncController] Error en push:", error);
    return res.status(500).json({ message: "Error al procesar eventos push", error: error.message });
  }
};

export const pull = async (req, res) => {
  try {
    const { desde } = req.query;
    const fechaDesde = desde ? new Date(desde) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [eventos] = await db.query(`
      SELECT event_id, source_node, entidad, operacion, entity_uuid, payload, created_at
      FROM sync_outbox
      WHERE created_at >= ?
      ORDER BY created_at ASC
      LIMIT 200
    `, { replacements: [fechaDesde] });

    return res.status(200).json({
      events: eventos,
      total: eventos.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("[SyncController] Error en pull:", error);
    return res.status(500).json({ message: "Error al obtener eventos pull", error: error.message });
  }
};

export const status = async (req, res) => {
  try {
    const [pendientesRows] = await db.query(
      "SELECT COUNT(*) AS total FROM sync_outbox WHERE sync_status = 'PENDING'"
    );
    const totalPendientes = pendientesRows[0]?.total || 0;

    const config = await CentrosSenaConfigModel.findOne({
      where: { Codigo_Centro_Sena: "9121" }
    });

    return res.status(200).json({
      nodoRol: process.env.NODE_ROLE || "LOCAL",
      estadoNodo: config?.Estado_Nodo_Local || "ONLINE",
      totalPendientes,
      ultimaSincronizacion: config?.Ultima_Sincronizacion || null,
      nombreCentro: config?.Nombre_Centro || "Centro Agropecuario La Granja",
      porcentajeCupoOffline: config?.Porcentaje_Cupo_Local_Offline || 75
    });
  } catch (error) {
    console.error("[SyncController] Error en status:", error);
    return res.status(500).json({ message: "Error al obtener estado de sincronizacion" });
  }
};

export const triggerSync = async (req, res) => {
  try {
    const resultado = await syncWorkerInstance.ejecutarCicloSincronizacion();
    return res.status(200).json({
      mensaje: "Ciclo de sincronizacion ejecutado",
      resultado
    });
  } catch (error) {
    console.error("[SyncController] Error en triggerSync:", error);
    return res.status(500).json({ message: error.message || "Error al forzar sincronizacion" });
  }
};

export const exportSyncPackage = async (req, res) => {
  try {
    const [pendientes] = await db.query(`
      SELECT event_id, source_node, entidad, operacion, entity_uuid, payload, created_at
      FROM sync_outbox
      WHERE sync_status = 'PENDING'
      ORDER BY created_at ASC
    `);

    const paquete = {
      version: "3.0",
      generadoPor: process.env.NODE_ROLE || "LOCAL",
      fechaGeneracion: new Date().toISOString(),
      centro: "9121",
      totalEventos: pendientes.length,
      eventos: pendientes
    };

    const paqueteBuffer = Buffer.from(JSON.stringify(paquete, null, 2), "utf8");
    res.setHeader("Content-Disposition", 'attachment; filename="Foodsys_Sync_Package.foodsys-sync"');
    res.setHeader("Content-Type", "application/json");
    return res.send(paqueteBuffer);
  } catch (error) {
    console.error("[SyncController] Error al exportar paquete sync:", error);
    return res.status(500).json({ message: "Error al exportar paquete de sincronizacion" });
  }
};

export const importSyncPackage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Archivo de sincronizacion requerido" });
    }

    const contenido = JSON.parse(req.file.buffer.toString("utf8"));
    const eventos = contenido.eventos || [];
    let procesados = 0;

    for (const evt of eventos) {
      const [yaProcesado] = await db.query(
        "SELECT event_id FROM sync_inbox_processed WHERE event_id = ?",
        { replacements: [evt.event_id] }
      );
      if (yaProcesado.length > 0) continue;

      await syncWorkerInstance.aplicarEventoEntrante(evt);

      await db.query(
        "INSERT INTO sync_inbox_processed (event_id, source_node, processed_at) VALUES (?, ?, NOW())",
        { replacements: [evt.event_id, evt.source_node || "MANUAL_USB"] }
      );
      procesados++;
    }

    return res.status(200).json({
      mensaje: `Paquete sincronizado exitosamente. ${procesados} operaciones aplicadas.`,
      procesados
    });
  } catch (error) {
    console.error("[SyncController] Error al importar paquete sync:", error);
    return res.status(400).json({ message: "Formato de archivo de sincronizacion invalido" });
  }
};

export default {
  health,
  push,
  pull,
  status,
  triggerSync,
  exportSyncPackage,
  importSyncPackage
};
