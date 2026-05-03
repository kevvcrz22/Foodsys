// Node/Services/ReportesService.js
import db from "../Database/db.js";
import { QueryTypes } from "sequelize";

class ReportesService {

  /* ─── DIARIO: reservas de los últimos 7 días ─── */
  async getDiario() {
    const rows = await db.query(
      `SELECT
         DATE(Fec_Reserva)     AS periodo,
         COUNT(*)              AS total,
         SUM(Tip_Reserva = 'Desayuno') AS desayunos,
         SUM(Tip_Reserva = 'Almuerzo') AS almuerzos,
         SUM(Tip_Reserva = 'Cena')     AS cenas
       FROM reservas
       WHERE Fec_Reserva >= CURDATE() - INTERVAL 7 DAY
       GROUP BY DATE(Fec_Reserva)
       ORDER BY periodo ASC`,
      { type: QueryTypes.SELECT }
    );
    return rows;
  }

  /* ─── SEMANAL: últimas 8 semanas ─── */
  async getSemanal() {
    const rows = await db.query(
      `SELECT
         YEAR(Fec_Reserva)           AS anio,
         WEEK(Fec_Reserva, 1)        AS semana,
         CONCAT('Sem ', WEEK(Fec_Reserva, 1), '-', YEAR(Fec_Reserva)) AS periodo,
         COUNT(*)                    AS total,
         SUM(Tip_Reserva = 'Desayuno')      AS desayunos,
         SUM(Tip_Reserva = 'Almuerzo')      AS almuerzos,
         SUM(Tip_Reserva = 'Cena')          AS cenas
       FROM reservas
       WHERE Fec_Reserva >= CURDATE() - INTERVAL 8 WEEK
       GROUP BY anio, semana
       ORDER BY anio ASC, semana ASC`,
      { type: QueryTypes.SELECT }
    );
    return rows;
  }

  /* ─── MENSUAL: últimos 12 meses ─── */
  async getMensual() {
    const rows = await db.query(
      `SELECT
         DATE_FORMAT(Fec_Reserva, '%Y-%m')  AS periodo,
         DATE_FORMAT(Fec_Reserva, '%b %Y')  AS label,
         COUNT(*)                           AS total,
         SUM(Tip_Reserva = 'Desayuno')             AS desayunos,
         SUM(Tip_Reserva = 'Almuerzo')             AS almuerzos,
         SUM(Tip_Reserva = 'Cena')                 AS cenas
       FROM reservas
       WHERE Fec_Reserva >= CURDATE() - INTERVAL 12 MONTH
       GROUP BY periodo
       ORDER BY periodo ASC`,
      { type: QueryTypes.SELECT }
    );
    return rows;
  }

  /* ─── ANUAL: últimos 5 años ─── */
  async getAnual() {
    const rows = await db.query(
      `SELECT
         YEAR(Fec_Reserva)       AS periodo,
         COUNT(*)                AS total,
         SUM(Tip_Reserva = 'Desayuno')  AS desayunos,
         SUM(Tip_Reserva = 'Almuerzo')  AS almuerzos,
         SUM(Tip_Reserva = 'Cena')      AS cenas
       FROM reservas
       WHERE YEAR(Fec_Reserva) >= YEAR(CURDATE()) - 4
       GROUP BY YEAR(Fec_Reserva)
       ORDER BY periodo ASC`,
      { type: QueryTypes.SELECT }
    );
    return rows;
  }

  /* ─── PERSONALIZADO: entre fechas dadas, opcionalmente por tipo de alimento ─── */
  async getPersonalizado(fechaInicio, fechaFin, tipoAlimento) {
    let whereClause = `WHERE Fec_Reserva BETWEEN :fechaInicio AND :fechaFin`;
    let replacements = { fechaInicio, fechaFin };

    if (tipoAlimento && tipoAlimento !== "Todos") {
      whereClause += ` AND Tip_Reserva = :tipoAlimento`;
      replacements.tipoAlimento = tipoAlimento;
    }

    const rows = await db.query(
      `SELECT
         DATE(Fec_Reserva)     AS periodo,
         COUNT(*)              AS total,
         SUM(Tip_Reserva = 'Desayuno') AS desayunos,
         SUM(Tip_Reserva = 'Almuerzo') AS almuerzos,
         SUM(Tip_Reserva = 'Cena')     AS cenas
       FROM reservas
       ${whereClause}
       GROUP BY DATE(Fec_Reserva)
       ORDER BY periodo ASC`,
      {
        replacements,
        type: QueryTypes.SELECT
      }
    );
    return rows;
  }

  /* ─── Helper para exportar ─── */
  async getPorPeriodo(periodo, params = {}) {
    switch (periodo) {
      case "diario":   return this.getDiario();
      case "semanal":  return this.getSemanal();
      case "anual":    return this.getAnual();
      case "personalizado": return this.getPersonalizado(params.fechaInicio, params.fechaFin, params.tipoAlimento);
      default:         return this.getMensual();
    }
  }
}

export default new ReportesService();
