// Node/Controllers/SyncController.js
// Controlador para endpoints de sincronizacion offline-first entre La Granja y Hetzner
// Soporta push, pull, monitor de estado, puente movil de 30s y exportacion USB

import db from "../Database/db.js";
import CentrosSenaConfigModel from "../Models/CentrosSenaConfigModel.js";
import syncWorkerInstance from "../Jobs/SyncWorker.js";
import syncApplyServiceInstance from "../Services/SyncApplyService.js";

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
      const { event_id } = evt;

      // 1. Idempotencia: Verificar si ya fue procesado antes
      const [yaProcesado] = await db.query(
        "SELECT event_id FROM sync_inbox_processed WHERE event_id = ?",
        { replacements: [event_id] }
      );

      if (yaProcesado.length > 0) {
        confirmedIds.push(event_id);
        continue;
      }

      // 2. Aplicar evento universalmente (RESERVA, PLATO, MENU, PROGRAMA, FICHA, USUARIO, USUARIO_ROL, TURNO, PQRSF)
      try {
        await syncApplyServiceInstance.aplicarEvento(evt, sourceNode || "LOCAL");
      } catch (errAplicar) {
        console.warn(`[SyncController] Nota al aplicar evento ${evt.entidad}/${evt.operacion}:`, errAplicar.message);
      }

      // 3. Marcar evento como procesado
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
    // Aplicamos una ventana de seguridad de 10 minutos para proteger contra diferencias de reloj entre servidores
    const fechaDesde = desde
      ? new Date(new Date(desde).getTime() - 10 * 60 * 1000)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

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
