// Node/Services/ReportesService.js
//
// Servicio de reportes del sistema FoodSys.
// Los metodos existentes (getDiario, getSemanal, getMensual, getAnual, getPersonalizado)
// no se modificaron. Se agregaron cinco metodos nuevos al final de la clase:
//
//   getDiarioPorFecha   -> reporte detallado de un dia especifico con datos del aprendiz
//   getSemanalPorRango  -> analisis de consumo en un rango de fechas libre
//   getMensualPorMes    -> resumen de un mes con desglose diario
//   getAprendizPorDocumento -> estadisticas completas de un aprendiz por numero de documento
//   updateSancionAprendiz   -> actualiza el campo San_Usuario (Si / No) de un aprendiz
//
// Los metodos nuevos usan Sequelize ORM con include para traer relaciones en una sola consulta,
// evitando el problema N+1 de hacer una peticion a la base de datos por cada fila del resultado.
// Los metodos existentes usan db.query con SQL crudo y se dejan tal cual porque funcionan.

import db from "../Database/db.js";
import { QueryTypes, Op } from "sequelize";

// Modelos necesarios para los metodos nuevos.
// Los metodos existentes no usaban modelos, solo db.query, por eso no estaban importados.
import ReservaModel    from "../Models/ReservasModel.js";
import UsuariosModel   from "../Models/UsuariosModel.js";
import UsuariosRolModel from "../Models/UsuariosRolModel.js";
import RolesModel      from "../Models/RolesModel.js";
import PlatosModel     from "../Models/PlatosModels.js";
import FichasModel     from "../Models/FichasModel.js";
import ProgramaModel   from "../Models/ProgramaModel.js";

class ReportesService {

  // =========================================================================
  // METODOS EXISTENTES - NO MODIFICADOS
  // =========================================================================

  async getDiario() {
    const rows = await db.query(
      `SELECT
         DATE(Fec_Reserva)     AS periodo,
         COUNT(*)              AS total,
         SUM(Tip_Reserva = 'Desayuno') AS desayuno,
         SUM(Tip_Reserva = 'Almuerzo') AS almuerzo,
         SUM(Tip_Reserva = 'Cena') AS cena
       FROM reservas
       WHERE Fec_Reserva >= CURDATE() - INTERVAL 7 DAY
       GROUP BY DATE(Fec_Reserva)
       ORDER BY periodo ASC`,
      { type: QueryTypes.SELECT }
    );
    return rows;
  }

  async getSemanal() {
    const rows = await db.query(
      `SELECT
         YEAR(Fec_Reserva)           AS anio,
         WEEK(Fec_Reserva, 1)        AS semana,
         CONCAT('Sem ', WEEK(Fec_Reserva, 1), '-', YEAR(Fec_Reserva)) AS periodo,
         COUNT(*)                    AS total,
         SUM(Tip_Reserva = 'Desayuno') AS desayuno,
         SUM(Tip_Reserva = 'Almuerzo') AS almuerzo,
         SUM(Tip_Reserva = 'Cena') AS cena
       FROM reservas
       WHERE Fec_Reserva >= CURDATE() - INTERVAL 8 WEEK
       GROUP BY anio, semana
       ORDER BY anio ASC, semana ASC`,
      { type: QueryTypes.SELECT }
    );
    return rows;
  }

  async getMensual() {
    const rows = await db.query(
      `SELECT
         DATE_FORMAT(Fec_Reserva, '%Y-%m')  AS periodo,
         DATE_FORMAT(Fec_Reserva, '%b %Y')  AS label,
         COUNT(*)                           AS total,
         SUM(Tip_Reserva = 'Desayuno') AS desayuno,
         SUM(Tip_Reserva = 'Almuerzo') AS almuerzo,
         SUM(Tip_Reserva = 'Cena') AS cena
       FROM reservas
       WHERE Fec_Reserva >= CURDATE() - INTERVAL 12 MONTH
       GROUP BY periodo
       ORDER BY periodo ASC`,
      { type: QueryTypes.SELECT }
    );
    return rows;
  }

  async getAnual() {
    const rows = await db.query(
      `SELECT
         YEAR(Fec_Reserva)       AS periodo,
         COUNT(*)                AS total,
         SUM(Tip_Reserva = 'Desayuno') AS desayuno,
         SUM(Tip_Reserva = 'Almuerzo') AS almuerzo,
         SUM(Tip_Reserva = 'Cena') AS cena
       FROM reservas
       WHERE YEAR(Fec_Reserva) >= YEAR(CURDATE()) - 4
       GROUP BY YEAR(Fec_Reserva)
       ORDER BY periodo ASC`,
      { type: QueryTypes.SELECT }
    );
    return rows;
  }

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
         SUM(Tip_Reserva = 'Desayuno') AS desayuno,
         SUM(Tip_Reserva = 'Almuerzo') AS almuerzo,
         SUM(Tip_Reserva = 'Cena') AS cena
       FROM reservas
       ${whereClause}
       GROUP BY DATE(Fec_Reserva)
       ORDER BY periodo ASC`,
      { replacements, type: QueryTypes.SELECT }
    );
    return rows;
  }

  async getPorPeriodo(periodo, params = {}) {
    switch (periodo) {
      case "diario":        return this.getDiario();
      case "semanal":       return this.getSemanal();
      case "anual":         return this.getAnual();
      case "personalizado": return this.getPersonalizado(params.fechaInicio, params.fechaFin, params.tipoAlimento);
      default:              return this.getMensual();
    }
  }

  // =========================================================================
  // METODOS NUEVOS - AGREGADOS SIN MODIFICAR LOS ANTERIORES
  // =========================================================================

  // Retorna el detalle completo de todas las reservas de una fecha especifica.
  // El Coordinador lo usa en el tab Diario para ver quien comio ese dia,
  // que plato eligio y como contactarlo.
  //
  // Parametros:
  //   Fecha - string en formato YYYY-MM-DD
  //   Tipo  - 'Desayuno' | 'Almuerzo' | 'Cena' | null (null = todos los tipos)
  //
  // Retorna un objeto con:
  //   resumen     -> totales por tipo y por estado
  //   reservas    -> array de reservas con datos del aprendiz, plato, roles y ficha
  //   excepcionales -> reservas con Exc_Reserva = 'Si' separadas para destacarlas
  async getDiarioPorFecha(Fecha, Tipo = null) {
    // Construir el filtro dinamicamente para no repetir codigo
    const Condicion = { Fec_Reserva: Fecha };
    if (Tipo && Tipo !== "Todos") Condicion.Tip_Reserva = Tipo;

    const Reservas = await ReservaModel.findAll({
      where: Condicion,
      include: [
        {
          model: UsuariosModel,
          as: "usuario",
          // Solo los campos necesarios para el reporte, no la contrasena ni el token
          attributes: [
            "Id_Usuario", "Nom_Usuario", "Ape_Usuario",
            "NumDoc_Usuario", "TipDoc_Usuario",
            "Cor_Usuario", "Tel_Usuario",
            "Est_Usuario", "San_Usuario"
          ],
          include: [
            {
              // La ficha permite mostrar el numero de ficha y el programa del aprendiz
              model: FichasModel,
              as: "ficha",
              attributes: ["Num_Ficha"],
              include: [{
                model: ProgramaModel,
                as: "programas",
                attributes: ["Nom_Programa"]
              }]
            },
            {
              // Los roles se necesitan para identificar Aprendiz Externo con estado Especial
              model: UsuariosRolModel,
              as: "rolesUsuario",
              include: [{
                model: RolesModel,
                as: "rolUsuario",
                attributes: ["Nom_Rol"]
              }]
            }
          ]
        },
        {
          model: PlatosModel,
          as: "plato",
          attributes: ["Nom_Plato", "Img_Plato", "Tip_Plato"]
        }
      ],
      order: [["Tip_Reserva", "ASC"], ["createdAt", "ASC"]]
    });

    // Construir el resumen de contadores para las tarjetas del reporte
    const Resumen = {
      fecha: Fecha,
      tipo: Tipo || "Todos",
      total: Reservas.length,
      porTipo: {},
      porEstado: {},
      totalEspeciales: 0,
      totalExcepcionales: 0
    };

    Reservas.forEach((R) => {
      Resumen.porTipo[R.Tip_Reserva] = (Resumen.porTipo[R.Tip_Reserva] || 0) + 1;
      Resumen.porEstado[R.Est_Reserva] = (Resumen.porEstado[R.Est_Reserva] || 0) + 1;
      if (R.Exc_Reserva === "Si") Resumen.totalExcepcionales++;
      // Contar usuarios con estado Especial para el indicador visual
      if (R.usuario?.Est_Usuario === "Especial") Resumen.totalEspeciales++;
    });

    return { resumen: Resumen, reservas: Reservas };
  }

  // Retorna el analisis de consumo en un rango de fechas libre seleccionado por el Coordinador.
  // Calcula el plato mas consumido, el desglose por dia y los totales globales del periodo.
  //
  // Parametros:
  //   FechaInicio - string YYYY-MM-DD del primer dia del rango
  //   FechaFin    - string YYYY-MM-DD del ultimo dia del rango (inclusive)
  //   Tipo        - filtro opcional por tipo de comida
  async getSemanalPorRango(FechaInicio, FechaFin, Tipo = null) {
    const Condicion = {
      Fec_Reserva: { [Op.between]: [FechaInicio, FechaFin] }
    };
    if (Tipo && Tipo !== "Todos") Condicion.Tip_Reserva = Tipo;

    const Reservas = await ReservaModel.findAll({
      where: Condicion,
      include: [
        {
          model: UsuariosModel,
          as: "usuario",
          attributes: ["Nom_Usuario", "Ape_Usuario", "NumDoc_Usuario", "Est_Usuario"]
        },
        {
          model: PlatosModel,
          as: "plato",
          attributes: ["Nom_Plato"]
        }
      ],
      order: [["Fec_Reserva", "ASC"], ["Tip_Reserva", "ASC"]]
    });

    // Agrupar por dia para la tabla de consumo diario
    const PorDia = {};
    const ConteoPlatos = {};

    Reservas.forEach((R) => {
      // Clave del dia como string para el agrupamiento
      const Dia = String(R.Fec_Reserva);
      if (!PorDia[Dia]) {
        PorDia[Dia] = { fecha: Dia, total: 0, porTipo: {}, porEstado: {} };
      }
      PorDia[Dia].total++;
      PorDia[Dia].porTipo[R.Tip_Reserva] = (PorDia[Dia].porTipo[R.Tip_Reserva] || 0) + 1;
      PorDia[Dia].porEstado[R.Est_Reserva] = (PorDia[Dia].porEstado[R.Est_Reserva] || 0) + 1;

      // Acumular conteo de platos para determinar el mas popular del periodo
      const NombrePlato = R.plato?.Nom_Plato || "Sin datos";
      ConteoPlatos[NombrePlato] = (ConteoPlatos[NombrePlato] || 0) + 1;
    });

    // Ordenar platos de mayor a menor consumo para encontrar el primero
    const PlatosOrdenados = Object.entries(ConteoPlatos)
      .sort(([, A], [, B]) => B - A)
      .map(([Nombre, Cantidad]) => ({ nombre: Nombre, cantidad: Cantidad }));

    // Resumen global del periodo
    const Resumen = {
      fechaInicio: FechaInicio,
      fechaFin: FechaFin,
      tipo: Tipo || "Todos",
      total: Reservas.length,
      porTipo: {},
      porEstado: {},
      platoMasConsumido: PlatosOrdenados[0] || null,
      rankingPlatos: PlatosOrdenados.slice(0, 5)
    };

    Reservas.forEach((R) => {
      Resumen.porTipo[R.Tip_Reserva] = (Resumen.porTipo[R.Tip_Reserva] || 0) + 1;
      Resumen.porEstado[R.Est_Reserva] = (Resumen.porEstado[R.Est_Reserva] || 0) + 1;
    });

    return {
      resumen: Resumen,
      consumoPorDia: Object.values(PorDia)
    };
  }

  // Retorna el resumen de reservas de un mes completo agrupado por dia.
  // El Coordinador selecciona el mes y opcionalmente el tipo de comida.
  //
  // Parametros:
  //   Anio - numero del anio (ejemplo: 2026)
  //   Mes  - numero del mes entre 1 y 12
  //   Tipo - filtro opcional por tipo de comida
  async getMensualPorMes(Anio, Mes, Tipo = null) {
    // Calcular el primer y ultimo dia del mes para usar entre ellos como rango
    const Primer_Dia = `${Anio}-${String(Mes).padStart(2, "0")}-01`;
    const Fecha_Temp = new Date(Anio, Mes, 0); // Dia 0 del mes siguiente = ultimo del mes actual
    const Ultimo_Dia = `${Anio}-${String(Mes).padStart(2, "0")}-${String(Fecha_Temp.getDate()).padStart(2, "0")}`;

    const Condicion = {
      Fec_Reserva: { [Op.between]: [Primer_Dia, Ultimo_Dia] }
    };
    if (Tipo && Tipo !== "Todos") Condicion.Tip_Reserva = Tipo;

    const Reservas = await ReservaModel.findAll({
      where: Condicion,
      include: [
        {
          model: UsuariosModel,
          as: "usuario",
          attributes: ["Nom_Usuario", "Ape_Usuario", "NumDoc_Usuario"]
        },
        {
          model: PlatosModel,
          as: "plato",
          attributes: ["Nom_Plato"]
        }
      ],
      order: [["Fec_Reserva", "ASC"]]
    });

    // Mismo patron de agrupamiento que getSemanalPorRango
    const PorDia = {};
    const ConteoPlatos = {};

    Reservas.forEach((R) => {
      const Dia = String(R.Fec_Reserva);
      if (!PorDia[Dia]) {
        PorDia[Dia] = { fecha: Dia, total: 0, porTipo: {}, porEstado: {} };
      }
      PorDia[Dia].total++;
      PorDia[Dia].porTipo[R.Tip_Reserva] = (PorDia[Dia].porTipo[R.Tip_Reserva] || 0) + 1;
      PorDia[Dia].porEstado[R.Est_Reserva] = (PorDia[Dia].porEstado[R.Est_Reserva] || 0) + 1;

      const NombrePlato = R.plato?.Nom_Plato || "Sin datos";
      ConteoPlatos[NombrePlato] = (ConteoPlatos[NombrePlato] || 0) + 1;
    });

    const PlatosOrdenados = Object.entries(ConteoPlatos)
      .sort(([, A], [, B]) => B - A)
      .map(([Nombre, Cantidad]) => ({ nombre: Nombre, cantidad: Cantidad }));

    const Resumen = {
      anio: Anio,
      mes: Mes,
      primerDia: Primer_Dia,
      ultimoDia: Ultimo_Dia,
      tipo: Tipo || "Todos",
      total: Reservas.length,
      porTipo: {},
      porEstado: {},
      diasConActividad: Object.keys(PorDia).length,
      platoMasConsumido: PlatosOrdenados[0] || null,
      rankingPlatos: PlatosOrdenados.slice(0, 5)
    };

    Reservas.forEach((R) => {
      Resumen.porTipo[R.Tip_Reserva] = (Resumen.porTipo[R.Tip_Reserva] || 0) + 1;
      Resumen.porEstado[R.Est_Reserva] = (Resumen.porEstado[R.Est_Reserva] || 0) + 1;
    });

    return {
      resumen: Resumen,
      consumoPorDia: Object.values(PorDia)
    };
  }

  // Busca un aprendiz por numero de documento y retorna sus datos completos
  // junto con el historial de reservas y estadisticas de asistencia.
  // Se usa en el buscador individual del modulo de reportes.
  //
  // Parametros:
  //   NumDoc       - numero de documento del aprendiz (sin puntos ni guiones)
  //   FechaConsulta - opcional, filtra las reservas a una fecha especifica
  //
  // Retorna:
  //   usuario      -> datos del aprendiz con ficha, programa y roles
  //   estadisticas -> totales de reservas, consumidas, canceladas, inasistencias
  //   reservas     -> historial completo o del dia seleccionado
  async getAprendizPorDocumento(NumDoc, FechaConsulta = null) {
    // Buscar el usuario con toda la informacion de relaciones en una sola consulta
    const Usuario = await UsuariosModel.findOne({
      where: { NumDoc_Usuario: NumDoc },
      include: [
        {
          model: FichasModel,
          as: "ficha",
          attributes: ["Id_Ficha", "Num_Ficha", "FecIniLec_Ficha", "FecFinLec_Ficha"],
          include: [{
            model: ProgramaModel,
            as: "programas",
            attributes: ["Nom_Programa", "NivFor_Programa", "Are_Programa"]
          }]
        },
        {
          model: UsuariosRolModel,
          as: "rolesUsuario",
          include: [{
            model: RolesModel,
            as: "rolUsuario",
            attributes: ["Nom_Rol"]
          }]
        }
      ]
    });

    if (!Usuario) {
      throw new Error("No se encontro un aprendiz con ese numero de documento");
    }

    // Filtrar reservas por fecha si se proporciona, o traer el historial completo
    const Condicion_Reservas = { Id_Usuario: Usuario.Id_Usuario };
    if (FechaConsulta) Condicion_Reservas.Fec_Reserva = FechaConsulta;

    const Reservas = await ReservaModel.findAll({
      where: Condicion_Reservas,
      include: [{
        model: PlatosModel,
        as: "plato",
        attributes: ["Nom_Plato", "Tip_Plato"]
      }],
      order: [["Fec_Reserva", "DESC"], ["createdAt", "DESC"]]
    });

    // Calcular dias distintos en los que el aprendiz asistio (reservas Consumidas)
    const DiasConsumidos = [
      ...new Set(
        Reservas
          .filter((R) => R.Est_Reserva === "Consumido")
          .map((R) => String(R.Fec_Reserva))
      )
    ];

    // Inasistencia = reservo pero el QR venció sin consumirse, o sigue en Generado
    // despues de que pasó la hora del servicio. En ambos casos el estado es Vencido.
    const Estadisticas = {
      totalReservas: Reservas.length,
      consumidas: Reservas.filter((R) => R.Est_Reserva === "Consumido").length,
      canceladas: Reservas.filter((R) => R.Est_Reserva === "Cancelado").length,
      vencidas: Reservas.filter((R) => R.Est_Reserva === "Vencido").length,
      excepcionales: Reservas.filter((R) => R.Exc_Reserva === "Si").length,
      diasAsistidos: DiasConsumidos.length,
      diasAsistidosDetalle: DiasConsumidos,
      esEspecial: Usuario.Est_Usuario === "Especial",
      estaSancionado: Usuario.San_Usuario === "Si",
      porTipo: {}
    };

    Reservas.forEach((R) => {
      Estadisticas.porTipo[R.Tip_Reserva] = (Estadisticas.porTipo[R.Tip_Reserva] || 0) + 1;
    });

    return {
      usuario: Usuario,
      estadisticas: Estadisticas,
      reservas: Reservas
    };
  }

  // Actualiza el campo San_Usuario del aprendiz.
  // Solo el Coordinador puede ejecutar esta accion desde el buscador individual de reportes.
  //
  // Parametros:
  //   Id_Usuario  - ID primario del usuario en la tabla usuarios
  //   San_Usuario - 'Si' para sancionar, 'No' para quitar la sancion
  async updateSancionAprendiz(Id_Usuario, San_Usuario) {
    const Valores_Validos = ["Si", "No"];
    if (!Valores_Validos.includes(San_Usuario)) {
      throw new Error("El valor de sancion debe ser 'Si' o 'No'");
    }

    const Usuario = await UsuariosModel.findByPk(Id_Usuario);
    if (!Usuario) throw new Error("Usuario no encontrado");

    await Usuario.update({ San_Usuario });

    return {
      Id_Usuario,
      Nom_Usuario: `${Usuario.Nom_Usuario} ${Usuario.Ape_Usuario}`,
      San_Usuario,
      mensaje: San_Usuario === "Si"
        ? "El aprendiz ha sido sancionado. No podra realizar nuevas reservas."
        : "La sancion del aprendiz ha sido removida."
    };
  }
}

export default new ReportesService();