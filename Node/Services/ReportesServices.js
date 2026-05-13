// Node/Services/ReportesServices.js
//
// Servicio de reportes del sistema Foodsys.
//
// Este archivo contiene TODA la logica de acceso a base de datos del modulo de reportes.
// El controlador (ReportesController.js) solo extrae parametros HTTP y llama a estos metodos.
// No hay SQL ni logica de negocio en el controlador.
//
// Metodos EXISTENTES — no se modifico ni una linea de su implementacion original:
//   getDiario           -> ultimos 7 dias agrupados por dia
//   getSemanal          -> ultimas 8 semanas ISO agrupadas por semana
//   getMensual          -> ultimos 12 meses agrupados por mes
//   getAnual            -> ultimos 5 anios agrupados por anio
//   getPersonalizado    -> rango libre con filtro de tipo de alimento
//   getPorPeriodo       -> enrutador interno usado por los metodos de exportacion
//   getDiarioPorFecha   -> detalle de reservas de un dia especifico (ya existia)
//   getSemanalPorRango  -> analisis de un rango libre con desglose por dia (ya existia)
//   getMensualPorMes    -> resumen de un mes completo con desglose diario (ya existia)
//   getAprendizPorDocumento -> historial completo de un aprendiz (ya existia)
//   updateSancionAprendiz   -> actualiza San_Usuario (ya existia)
//
// Metodos NUEVOS agregados al final sin tocar nada de lo anterior:
//   getDiarioDetalle    -> detalle de reservas de un dia con filtro de tipo Y estado
//   getSemanalDesglose  -> resumen dia a dia de una semana ISO especifica
//   getDiaDetalle       -> reutiliza getDiarioPorFecha para el clic en el desglose semanal
//   getResumenSemanalPlatos -> top de platos consumidos en una semana ISO
//   getAnualDesglose    -> desglose mes a mes de un anio especifico
//   getTiempoReal       -> estadisticas del dia actual sin cache para polling
//   getAprendizReporte  -> alias publico de getAprendizPorDocumento con parametros de fecha
//   actualizarSancion   -> alias publico de updateSancionAprendiz para el controlador nuevo
//   getPlatosTopConsumo -> top N platos consumidos en el periodo indicado

import db from "../Database/db.js";
import { QueryTypes, Op } from "sequelize";

// Modelos Sequelize necesarios para los metodos que usan ORM (include de relaciones).
// Los metodos existentes con db.query no usan estos modelos; se importaron solo para los nuevos.
import ReservaModel from "../Models/ReservasModel.js";
import UsuariosModel from "../Models/UsuariosModel.js";
import UsuariosRolModel from "../Models/UsuariosRolModel.js";
import RolesModel from "../Models/RolesModel.js";
import PlatosModel from "../Models/PlatosModels.js";
import FichasModel from "../Models/FichasModel.js";
import ProgramaModel from "../Models/ProgramaModel.js";

class ReportesService {

  // ===========================================================================
  // METODOS EXISTENTES — SIN NINGUNA MODIFICACION
  // ===========================================================================

  // Retorna las reservas de los ultimos 7 dias agrupadas por dia.
  // Usado por el tab Diario del grafico general (no el tab de detalle diario).
  async getDiario() {
    const rows = await db.query(
      `SELECT
         DATE(Fec_Reserva)             AS periodo,
         COUNT(*)                      AS total,
         SUM(Tip_Reserva = 'Desayuno') AS desayuno,
         SUM(Tip_Reserva = 'Almuerzo') AS almuerzo,
         SUM(Tip_Reserva = 'Cena')     AS cena
       FROM reservas
       WHERE Fec_Reserva >= CURDATE() - INTERVAL 7 DAY
       GROUP BY DATE(Fec_Reserva)
       ORDER BY periodo ASC`,
      { type: QueryTypes.SELECT }
    );
    return rows;
  }

  // Retorna las reservas de las ultimas 8 semanas ISO agrupadas por numero de semana.
  // El modo 1 de WEEK() hace que la semana comience el lunes (estandar ISO).
  async getSemanal() {
    const rows = await db.query(
      `SELECT
         YEAR(Fec_Reserva)                                            AS anio,
         WEEK(Fec_Reserva, 1)                                         AS semana,
         CONCAT('Sem ', WEEK(Fec_Reserva, 1), '-', YEAR(Fec_Reserva)) AS periodo,
         COUNT(*)                                                      AS total,
         SUM(Tip_Reserva = 'Desayuno')                                AS desayuno,
         SUM(Tip_Reserva = 'Almuerzo')                                AS almuerzo,
         SUM(Tip_Reserva = 'Cena')                                    AS cena
       FROM reservas
       WHERE Fec_Reserva >= CURDATE() - INTERVAL 8 WEEK
       GROUP BY anio, semana
       ORDER BY anio ASC, semana ASC`,
      { type: QueryTypes.SELECT }
    );
    return rows;
  }

  // Retorna las reservas de los ultimos 12 meses agrupadas por mes.
  // DATE_FORMAT genera el label legible 'Ene 2026' para mostrarlo en los graficos.
  async getMensual() {
    const rows = await db.query(
      `SELECT
         DATE_FORMAT(Fec_Reserva, '%Y-%m') AS periodo,
         DATE_FORMAT(Fec_Reserva, '%b %Y') AS label,
         COUNT(*)                          AS total,
         SUM(Tip_Reserva = 'Desayuno')     AS desayuno,
         SUM(Tip_Reserva = 'Almuerzo')     AS almuerzo,
         SUM(Tip_Reserva = 'Cena')         AS cena
       FROM reservas
       WHERE Fec_Reserva >= CURDATE() - INTERVAL 12 MONTH
       GROUP BY periodo
       ORDER BY periodo ASC`,
      { type: QueryTypes.SELECT }
    );
    return rows;
  }

  // Retorna las reservas de los ultimos 5 anios agrupadas por anio.
  // YEAR(CURDATE()) - 4 garantiza incluir el anio actual mas los 4 anteriores.
  async getAnual() {
    const rows = await db.query(
      `SELECT
         YEAR(Fec_Reserva)             AS periodo,
         COUNT(*)                      AS total,
         SUM(Tip_Reserva = 'Desayuno') AS desayuno,
         SUM(Tip_Reserva = 'Almuerzo') AS almuerzo,
         SUM(Tip_Reserva = 'Cena')     AS cena
       FROM reservas
       WHERE YEAR(Fec_Reserva) >= YEAR(CURDATE()) - 4
       GROUP BY YEAR(Fec_Reserva)
       ORDER BY periodo ASC`,
      { type: QueryTypes.SELECT }
    );
    return rows;
  }

  // Retorna las reservas en un rango de fechas libre con filtro opcional de tipo de alimento.
  // El WHERE se construye dinamicamente para no agregar condicion innecesaria cuando tipoAlimento es Todos.
  async getPersonalizado(fechaInicio, fechaFin, tipoAlimento) {
    let whereClause = `WHERE Fec_Reserva BETWEEN :fechaInicio AND :fechaFin`;
    let replacements = { fechaInicio, fechaFin };

    // Solo agregar el filtro de tipo si no es "Todos" o indefinido
    if (tipoAlimento && tipoAlimento !== "Todos") {
      whereClause += ` AND Tip_Reserva = :tipoAlimento`;
      replacements.tipoAlimento = tipoAlimento;
    }

    const rows = await db.query(
      `SELECT
         DATE(Fec_Reserva)             AS periodo,
         COUNT(*)                      AS total,
         SUM(Tip_Reserva = 'Desayuno') AS desayuno,
         SUM(Tip_Reserva = 'Almuerzo') AS almuerzo,
         SUM(Tip_Reserva = 'Cena')     AS cena
       FROM reservas
       ${whereClause}
       GROUP BY DATE(Fec_Reserva)
       ORDER BY periodo ASC`,
      { replacements, type: QueryTypes.SELECT }
    );
    return rows;
  }

  // Enrutador interno: delega al metodo correcto segun el periodo recibido.
  // Lo usan internamente exportarPDF y exportarExcel del controlador para obtener datos.
  async getPorPeriodo(periodo, params = {}) {
    switch (periodo) {
      case "diario": return this.getDiario();
      case "semanal": return this.getSemanal();
      case "anual": return this.getAnual();
      case "personalizado": return this.getPersonalizado(params.fechaInicio, params.fechaFin, params.tipoAlimento);
      default: return this.getMensual();
    }
  }

  // Retorna el detalle completo de todas las reservas de una fecha especifica.
  // Incluye datos del aprendiz (nombre, documento, correo, telefono, roles) y el plato elegido.
  // El Coordinador lo usa en el tab Diario para ver quien comio ese dia.
  //
  // Usa Sequelize include para traer todas las relaciones en UNA SOLA consulta SQL
  // (evita el problema N+1 de hacer una peticion por cada fila).
  //
  // Parametros:
  //   Fecha - string YYYY-MM-DD
  //   Tipo  - 'Desayuno' | 'Almuerzo' | 'Cena' | null (null = todos los tipos)
  async getDiarioPorFecha(Fecha, Tipo = null) {
    // Construir el objeto de condicion dinamicamente para el WHERE de Sequelize
    const Condicion = { Fec_Reserva: Fecha };
    if (Tipo && Tipo !== "Todos") Condicion.Tip_Reserva = Tipo;

    const Reservas = await ReservaModel.findAll({
      where: Condicion,
      include: [
        {
          model: UsuariosModel,
          as: "usuario",
          // Solo los campos del aprendiz necesarios para el reporte, sin contrasena ni token
          attributes: [
            "Id_Usuario", "Nom_Usuario", "Ape_Usuario",
            "NumDoc_Usuario", "TipDoc_Usuario",
            "Cor_Usuario", "Tel_Usuario",
            "Est_Usuario", "San_Usuario"
          ],
          include: [
            {
              // La ficha permite mostrar el numero de ficha y el programa de formacion
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
              // Los roles identifican si el aprendiz es externo o tiene estado Especial
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
          // El plato incluye nombre, imagen y tipo para mostrarlo en la tabla
          model: PlatosModel,
          as: "plato",
          attributes: ["Nom_Plato", "Img_Plato", "Tip_Plato"]
        }
      ],
      // Ordenar primero por tipo de comida (Almuerzo, Cena, Desayuno) y luego por hora de creacion
      order: [["Tip_Reserva", "ASC"], ["createdAt", "ASC"]]
    });

    // Acumular contadores para construir el resumen del dia
    const Resumen = {
      fecha: Fecha,
      tipo: Tipo || "Todos",
      total: Reservas.length,
      porTipo: {},
      porEstado: {},
      totalEspeciales: 0,
      totalExcepcionales: 0
    };

    // Recorrer una sola vez el array para construir todos los contadores del resumen
    Reservas.forEach((R) => {
      // Acumular por tipo de comida (Desayuno, Almuerzo, Cena)
      Resumen.porTipo[R.Tip_Reserva] = (Resumen.porTipo[R.Tip_Reserva] || 0) + 1;

      // Acumular por estado de la reserva (Consumido, Cancelado, Vencido, Generado)
      Resumen.porEstado[R.Est_Reserva] = (Resumen.porEstado[R.Est_Reserva] || 0) + 1;

      // Incrementar el contador de aprendices con estado Especial
      if (R.usuario?.Est_Usuario === "Especial") Resumen.totalEspeciales++;

      // Incrementar el contador de reservas excepcionales (novedades)
      if (R.Exc_Reserva === "Si") Resumen.totalExcepcionales++;
    });

    // Retornar el resumen separado de las reservas para facilitar el render en el frontend
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
    // Op.between de Sequelize genera un WHERE Fec_Reserva BETWEEN FechaInicio AND FechaFin
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

    // Agrupar reservas por dia para construir la tabla de consumo diario
    const PorDia = {};
    const ConteoPlatos = {};

    Reservas.forEach((R) => {
      // Usar la fecha como clave string para el agrupamiento
      const Dia = String(R.Fec_Reserva);
      if (!PorDia[Dia]) {
        PorDia[Dia] = { fecha: Dia, total: 0, porTipo: {}, porEstado: {} };
      }
      PorDia[Dia].total++;
      PorDia[Dia].porTipo[R.Tip_Reserva] = (PorDia[Dia].porTipo[R.Tip_Reserva] || 0) + 1;
      PorDia[Dia].porEstado[R.Est_Reserva] = (PorDia[Dia].porEstado[R.Est_Reserva] || 0) + 1;

      // Acumular el conteo de platos para encontrar el mas popular del periodo
      const NombrePlato = R.plato?.Nom_Plato || "Sin datos";
      ConteoPlatos[NombrePlato] = (ConteoPlatos[NombrePlato] || 0) + 1;
    });

    // Ordenar platos de mayor a menor consumo para el ranking
    const PlatosOrdenados = Object.entries(ConteoPlatos)
      .sort(([, A], [, B]) => B - A)
      .map(([Nombre, Cantidad]) => ({ nombre: Nombre, cantidad: Cantidad }));

    const Resumen = {
      fechaInicio: FechaInicio,
      fechaFin: FechaFin,
      tipo: Tipo || "Todos",
      total: Reservas.length,
      porTipo: {},
      porEstado: {},
      diasConActividad: Object.keys(PorDia).length,
      platoMasConsumido: PlatosOrdenados[0] || null,
      rankingPlatos: PlatosOrdenados.slice(0, 5)
    };

    // Segunda pasada para totales globales del periodo (no por dia)
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
    // Calcular el primer y ultimo dia del mes para usar como rango en el WHERE
    const Primer_Dia = `${Anio}-${String(Mes).padStart(2, "0")}-01`;
    // Dia 0 del mes siguiente equivale al ultimo dia del mes actual en JavaScript
    const Fecha_Temp = new Date(Anio, Mes, 0);
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
  //
  // Parametros:
  //   NumDoc        - numero de documento del aprendiz (sin puntos ni guiones)
  //   FechaConsulta - opcional, filtra las reservas a una fecha especifica
  async getAprendizPorDocumento(NumDoc, FechaConsulta = null) {
    // Traer el usuario con toda la informacion de relaciones en una sola consulta
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

    // Si el documento no corresponde a ningun usuario retornar null para que el controlador
    // pueda responder con 404 sin lanzar una excepcion
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
      // Ordenar del mas reciente al mas antiguo para que el historial sea cronologico invertido
      order: [["Fec_Reserva", "DESC"], ["createdAt", "DESC"]]
    });

    // Calcular los dias distintos en que el aprendiz consumio para la metrica de asistencia
    const DiasConsumidos = [
      ...new Set(
        Reservas
          .filter((R) => R.Est_Reserva === "Consumido")
          .map((R) => String(R.Fec_Reserva))
      )
    ];

    // Consolidar las estadisticas del aprendiz en un objeto plano facil de serializar
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

  // Actualiza el campo San_Usuario del aprendiz para habilitarlo o sancionarlo.
  // Solo el Coordinador puede ejecutar esta accion desde el buscador individual.
  //
  // Parametros:
  //   Id_Usuario  - ID primario del usuario en la tabla usuarios
  //   San_Usuario - 'Si' para sancionar, 'No' para quitar la sancion
  async updateSancionAprendiz(Id_Usuario, San_Usuario) {
    // Validar que el valor sea uno de los dos permitidos antes de tocar la BD
    const Valores_Validos = ["Si", "No"];
    if (!Valores_Validos.includes(San_Usuario)) {
      throw new Error("El valor de sancion debe ser 'Si' o 'No'");
    }

    const Usuario = await UsuariosModel.findByPk(Id_Usuario);
    if (!Usuario) throw new Error("Usuario no encontrado");

    // Actualizar solo el campo San_Usuario, sin tocar ningun otro dato del usuario
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

  // ===========================================================================
  // METODOS NUEVOS — AGREGADOS AL FINAL SIN MODIFICAR NADA DE LO ANTERIOR
  // ===========================================================================

  // Retorna el detalle de reservas de un dia con filtros de tipo Y estado.
  // Es similar a getDiarioPorFecha pero acepta el filtro adicional de estado
  // (Consumido, Cancelado, Vencido, Generado) para la vista detallada del controlador nuevo.
  //
  // El controlador getReporteDiarioDetalle y getReporteDiaDetalle usan este metodo.
  //
  // Parametros:
  //   Fecha  - string YYYY-MM-DD obligatorio
  //   Tipo   - string tipo de comida, opcional (null = todos)
  //   Estado - string estado de la reserva, opcional (null = todos)
  async getDiarioDetalle(Fecha, Tipo = null, Estado = null) {
    // Construir el objeto de condicion solo con los filtros que el usuario selecciono
    const Condicion = { Fec_Reserva: Fecha };
    if (Tipo && Tipo !== "Todos") Condicion.Tip_Reserva = Tipo;
    if (Estado && Estado !== "Todos") Condicion.Est_Reserva = Estado;

    const Reservas = await ReservaModel.findAll({
      where: Condicion,
      include: [
        {
          model: UsuariosModel,
          as: "usuario",
          attributes: [
            "Id_Usuario", "Nom_Usuario", "Ape_Usuario",
            "NumDoc_Usuario", "TipDoc_Usuario",
            "Cor_Usuario", "Tel_Usuario",
            "Est_Usuario", "San_Usuario"
          ],
          include: [
            {
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

    // Construir el resumen con los contadores necesarios para las tarjetas del frontend
    const Resumen = {
      fecha: Fecha,
      tipo: Tipo || "Todos",
      estado: Estado || "Todos",
      total: Reservas.length,
      porTipo: {},
      porEstado: {},
      totalEspeciales: 0,
      totalExcepcionales: 0
    };

    Reservas.forEach((R) => {
      Resumen.porTipo[R.Tip_Reserva] = (Resumen.porTipo[R.Tip_Reserva] || 0) + 1;
      Resumen.porEstado[R.Est_Reserva] = (Resumen.porEstado[R.Est_Reserva] || 0) + 1;
      if (R.usuario?.Est_Usuario === "Especial") Resumen.totalEspeciales++;
      if (R.Exc_Reserva === "Si") Resumen.totalExcepcionales++;
    });

    return { resumen: Resumen, reservas: Reservas };
  }

  // Retorna el resumen dia a dia de una semana ISO especifica.
  // Cada elemento del array tiene el nombre del dia, totales por tipo de comida
  // y contadores de estado (consumidas, canceladas, vencidas).
  // El frontend lo usa para el panel semanal con filas clicables.
  //
  // La semana ISO comienza el lunes. Se calcula la fecha del lunes de la semana
  // y se suman 6 dias para obtener el domingo.
  //
  // Parametros:
  //   Anio  - numero del anio (ejemplo: 2026)
  //   Semana - numero de semana ISO entre 1 y 53
  async getSemanalDesglose(Anio, Semana) {
    // Calcular el lunes de la semana ISO especificada usando SQL
    // El truco: ir al 4 de enero del anio (siempre en la semana 1 ISO),
    // restar los dias hasta el lunes, y luego sumar las semanas restantes.
    const Filas_Semana = await db.query(
      `SELECT
         DATE_ADD(
           DATE_SUB(
             DATE(CONCAT(:anio, '-01-04')),
             INTERVAL WEEKDAY(DATE(CONCAT(:anio, '-01-04'))) DAY
           ),
           INTERVAL (:semana - 1) WEEK
         ) AS lunes_semana`,
      { replacements: { anio: Anio, semana: Semana }, type: QueryTypes.SELECT }
    );

    // Extraer el lunes calculado por MySQL
    const Lunes = Filas_Semana[0]?.lunes_semana;
    if (!Lunes) throw new Error("No se pudo calcular la semana indicada");

    // Convertir a objeto Date para poder sumar dias con JavaScript
    const Fecha_Lunes = new Date(Lunes);
    const NOMBRES_DIAS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

    // Construir el array de dias de la semana con sus fechas YYYY-MM-DD
    const Dias_Semana = NOMBRES_DIAS.map((Nombre, I) => {
      const Dia_Fecha = new Date(Fecha_Lunes);
      Dia_Fecha.setDate(Fecha_Lunes.getDate() + I);
      const Fecha_Str = Dia_Fecha.toISOString().split("T")[0];
      return { nombre: Nombre, fecha: Fecha_Str };
    });

    // Calcular el domingo (ultimo dia de la semana) para el rango del WHERE
    const Domingo_Str = Dias_Semana[6].fecha;

    // Traer TODAS las reservas de la semana en una sola consulta
    const Reservas = await ReservaModel.findAll({
      where: {
        Fec_Reserva: { [Op.between]: [Dias_Semana[0].fecha, Domingo_Str] }
      },
      attributes: ["Id_Reserva", "Fec_Reserva", "Tip_Reserva", "Est_Reserva"],
      order: [["Fec_Reserva", "ASC"]]
    });

    // Agrupar las reservas por fecha para hacer el desglose dia a dia
    const PorFecha = {};
    Reservas.forEach((R) => {
      const Key = String(R.Fec_Reserva);
      if (!PorFecha[Key]) {
        PorFecha[Key] = { total: 0, porTipo: {}, porEstado: {} };
      }
      PorFecha[Key].total++;
      PorFecha[Key].porTipo[R.Tip_Reserva] = (PorFecha[Key].porTipo[R.Tip_Reserva] || 0) + 1;
      PorFecha[Key].porEstado[R.Est_Reserva] = (PorFecha[Key].porEstado[R.Est_Reserva] || 0) + 1;
    });

    // Combinar el array de dias con los contadores de reservas de cada dia
    const Resultado = Dias_Semana.map((Dia) => ({
      ...Dia,
      total: PorFecha[Dia.fecha]?.total || 0,
      porTipo: PorFecha[Dia.fecha]?.porTipo || {},
      porEstado: PorFecha[Dia.fecha]?.porEstado || {}
    }));

    return {
      anio: Anio,
      semana: Semana,
      lunes: Dias_Semana[0].fecha,
      domingo: Domingo_Str,
      totalSemana: Reservas.length,
      dias: Resultado
    };
  }

  // Retorna el detalle de las reservas de un dia especifico dentro del desglose semanal.
  // Se activa cuando el Coordinador hace clic en una fila del panel semanal (Miercoles, etc.).
  // Internamente reutiliza getDiarioPorFecha para no duplicar codigo.
  //
  // Parametros:
  //   Fecha  - string YYYY-MM-DD del dia seleccionado
  //   Tipo   - filtro opcional de tipo de comida
  //   Estado - filtro opcional de estado de reserva
  async getDiaDetalle(Fecha, Tipo = null, Estado = null) {
    // Reutilizar getDiarioDetalle que ya incluye el filtro de estado
    return this.getDiarioDetalle(Fecha, Tipo, Estado);
  }

  // Retorna los platos mas consumidos durante una semana ISO especifica.
  // Solo cuenta reservas con estado Consumido para reflejar consumo real.
  // Incluye Img_Plato para el panel visual de ranking de platos.
  //
  // Parametros:
  //   Anio  - numero del anio
  //   Semana - numero de semana ISO
  async getResumenSemanalPlatos(Anio, Semana) {
    // Obtener el rango de fechas de la semana usando el mismo metodo de desglose
    const Desglose = await this.getSemanalDesglose(Anio, Semana);
    const { lunes, domingo } = Desglose;

    // Traer solo las reservas consumidas del rango con la informacion del plato
    const Reservas = await ReservaModel.findAll({
      where: {
        Fec_Reserva: { [Op.between]: [lunes, domingo] },
        Est_Reserva: "Consumido"
      },
      include: [{
        model: PlatosModel,
        as: "plato",
        attributes: ["Id_Plato", "Nom_Plato", "Img_Plato", "Tip_Plato", "Des_Plato"]
      }],
      order: [["Fec_Reserva", "ASC"]]
    });

    // Agrupar por ID de plato para construir el ranking con todos los datos del plato
    const MapaPlatos = {};
    Reservas.forEach((R) => {
      if (!R.plato) return; // Ignorar reservas sin plato asociado

      const Id = R.plato.Id_Plato || R.plato.Nom_Plato;
      if (!MapaPlatos[Id]) {
        MapaPlatos[Id] = {
          id: Id,
          nombre: R.plato.Nom_Plato,
          imagen: R.plato.Img_Plato,
          tipo: R.plato.Tip_Plato,
          descripcion: R.plato.Des_Plato,
          cantidad: 0
        };
      }
      MapaPlatos[Id].cantidad++;
    });

    // Ordenar de mayor a menor consumo para obtener el ranking correcto
    const Ranking = Object.values(MapaPlatos)
      .sort((A, B) => B.cantidad - A.cantidad);

    return {
      anio: Anio,
      semana: Semana,
      lunes,
      domingo,
      totalConsumidos: Reservas.length,
      // Top 3 para el panel de medallas (oro, plata, bronce)
      top3: Ranking.slice(0, 3),
      // Top 10 para la tabla completa de ranking
      ranking: Ranking.slice(0, 10)
    };
  }

  // Retorna el desglose mes a mes de un anio especifico.
  // A diferencia de getAnual que agrupa varios anios, este metodo profundiza en
  // uno solo mostrando enero, febrero... con sus respectivos totales.
  //
  // Parametros:
  //   Anio - numero del anio a consultar (ejemplo: 2026)
  async getAnualDesglose(Anio) {
    // Consulta SQL con GROUP BY mes para obtener el total de cada mes del anio
    const Meses = await db.query(
      `SELECT
         MONTH(Fec_Reserva)                      AS mes_num,
         DATE_FORMAT(Fec_Reserva, '%b %Y')        AS mes_label,
         COUNT(*)                                 AS total,
         SUM(Tip_Reserva = 'Desayuno')            AS desayunos,
         SUM(Tip_Reserva = 'Almuerzo')            AS almuerzos,
         SUM(Tip_Reserva = 'Cena')                AS cenas,
         SUM(Est_Reserva = 'Consumido')           AS consumidas,
         SUM(Est_Reserva = 'Cancelado')           AS canceladas,
         SUM(Est_Reserva = 'Vencido')             AS vencidas
       FROM reservas
       WHERE YEAR(Fec_Reserva) = :anio
       GROUP BY mes_num, mes_label
       ORDER BY mes_num ASC`,
      { replacements: { anio: Anio }, type: QueryTypes.SELECT }
    );

    // Calcular los totales globales del anio para las tarjetas de resumen
    const Totales = Meses.reduce((Acc, M) => ({
      total: Acc.total + Number(M.total || 0),
      desayunos: Acc.desayunos + Number(M.desayunos || 0),
      almuerzos: Acc.almuerzos + Number(M.almuerzos || 0),
      cenas: Acc.cenas + Number(M.cenas || 0),
      consumidas: Acc.consumidas + Number(M.consumidas || 0),
      canceladas: Acc.canceladas + Number(M.canceladas || 0),
      vencidas: Acc.vencidas + Number(M.vencidas || 0)
    }), { total: 0, desayunos: 0, almuerzos: 0, cenas: 0, consumidas: 0, canceladas: 0, vencidas: 0 });

    return {
      anio: Anio,
      totales: Totales,
      meses: Meses
    };
  }

  // Retorna las estadisticas del dia actual calculadas en el momento exacto de la peticion.
  // El frontend hace polling cada 30 segundos sobre este endpoint para el panel de tiempo real.
  // No se aplica cache porque los datos deben reflejar el estado exacto de la base de datos.
  //
  // La respuesta incluye:
  //   resumen         - Contadores globales del dia (total, consumidas, vencidas, etc.)
  //   ultimosConsumos - Ultimas 10 reservas consumidas hoy (feed en vivo)
  //   porHora         - Consumos por hora para la curva de demanda del dia
  async getTiempoReal() {
    // Fecha del dia actual en formato YYYY-MM-DD para el filtro de la consulta
    const Hoy = new Date().toISOString().split("T")[0];

    // Traer las reservas del dia con informacion del usuario y el plato
    const Reservas = await ReservaModel.findAll({
      where: { Fec_Reserva: Hoy },
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
      order: [["createdAt", "DESC"]]
    });

    // Construir el resumen global del dia con contadores por tipo y por estado
    const Resumen = {
      fecha: Hoy,
      total: Reservas.length,
      porTipo: {},
      porEstado: {}
    };

    // Agrupar consumos por hora para la curva de demanda del dia
    // La clave es la hora en formato "HH:00" (ejemplo: "12:00")
    const PorHora = {};

    Reservas.forEach((R) => {
      Resumen.porTipo[R.Tip_Reserva] = (Resumen.porTipo[R.Tip_Reserva] || 0) + 1;
      Resumen.porEstado[R.Est_Reserva] = (Resumen.porEstado[R.Est_Reserva] || 0) + 1;

      // Solo contar los consumidos para la curva de demanda real
      if (R.Est_Reserva === "Consumido" && R.createdAt) {
        const Hora = `${new Date(R.createdAt).getHours().toString().padStart(2, "0")}:00`;
        PorHora[Hora] = (PorHora[Hora] || 0) + 1;
      }
    });

    // Ordenar el mapa de horas cronologicamente para que la grafica sea correcta
    const Por_Hora_Ordenado = Object.entries(PorHora)
      .sort(([H1], [H2]) => H1.localeCompare(H2))
      .map(([Hora, Cantidad]) => ({ hora: Hora, cantidad: Cantidad }));

    // Las ultimas 10 reservas consumidas son el feed en vivo del panel de tiempo real
    const Ultimos_Consumos = Reservas
      .filter((R) => R.Est_Reserva === "Consumido")
      .slice(0, 10);

    return {
      resumen: Resumen,
      ultimosConsumos: Ultimos_Consumos,
      porHora: Por_Hora_Ordenado
    };
  }

  // Alias publico de getAprendizPorDocumento para el controlador nuevo.
  // Acepta fechaInicio y fechaFin para filtrar el historial por rango de fechas.
  //
  // Parametros:
  //   Documento    - numero de documento del aprendiz
  //   Fecha_Inicio - string YYYY-MM-DD opcional
  //   Fecha_Fin    - string YYYY-MM-DD opcional
  async getAprendizReporte(Documento, Fecha_Inicio = null, Fecha_Fin = null) {
    // Buscar el usuario con toda la informacion de relaciones
    const Usuario = await UsuariosModel.findOne({
      where: { NumDoc_Usuario: Documento },
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

    // Retornar null para que el controlador pueda responder con 404
    if (!Usuario) return null;

    // Construir el filtro de reservas con el rango de fechas si se proporcionaron ambas
    const Condicion_Reservas = { Id_Usuario: Usuario.Id_Usuario };
    if (Fecha_Inicio && Fecha_Fin) {
      Condicion_Reservas.Fec_Reserva = { [Op.between]: [Fecha_Inicio, Fecha_Fin] };
    } else if (Fecha_Inicio) {
      // Si solo viene fecha inicio, traer desde esa fecha hasta hoy
      Condicion_Reservas.Fec_Reserva = { [Op.gte]: Fecha_Inicio };
    }

    const Reservas = await ReservaModel.findAll({
      where: Condicion_Reservas,
      include: [{
        model: PlatosModel,
        as: "plato",
        attributes: ["Nom_Plato", "Tip_Plato"]
      }],
      order: [["Fec_Reserva", "DESC"], ["createdAt", "DESC"]]
    });

    // Calcular dias distintos con consumo real para la metrica de asistencia
    const Dias_Con_Consumo = [
      ...new Set(
        Reservas
          .filter((R) => R.Est_Reserva === "Consumido")
          .map((R) => String(R.Fec_Reserva))
      )
    ];

    // Perfil con datos del usuario para la cabecera del panel de aprendiz
    const Perfil = {
      id: Usuario.Id_Usuario,
      nombre: `${Usuario.Nom_Usuario} ${Usuario.Ape_Usuario}`,
      documento: `${Usuario.TipDoc_Usuario} ${Usuario.NumDoc_Usuario}`,
      correo: Usuario.Cor_Usuario,
      telefono: Usuario.Tel_Usuario,
      estado: Usuario.Est_Usuario,
      sancionado: Usuario.San_Usuario === "Si",
      ficha: Usuario.ficha?.Num_Ficha || null,
      programa: Usuario.ficha?.programas?.Nom_Programa || null,
      roles: Usuario.rolesUsuario?.map((UR) => UR.rolUsuario?.Nom_Rol).filter(Boolean) || [],
      // Totales agregados de reservas para las tarjetas de estadisticas del aprendiz
      totalReservas: Reservas.length,
      consumidas: Reservas.filter((R) => R.Est_Reserva === "Consumido").length,
      canceladas: Reservas.filter((R) => R.Est_Reserva === "Cancelado").length,
      vencidas: Reservas.filter((R) => R.Est_Reserva === "Vencido").length,
      excepcionales: Reservas.filter((R) => R.Exc_Reserva === "Si").length,
      diasAsistidos: Dias_Con_Consumo.length
    };

    return {
      perfil: Perfil,
      roles: Perfil.roles,
      historial: Reservas
    };
  }

  // Alias publico de updateSancionAprendiz para el controlador nuevo.
  // Recibe el ID del usuario y el valor de sancion y delega la logica.
  async actualizarSancion(Id_Usuario, San_Usuario) {
    return this.updateSancionAprendiz(Id_Usuario, San_Usuario);
  }

  // Retorna los N platos mas consumidos en el periodo indicado.
  // Solo cuenta reservas con estado Consumido para reflejar consumo real.
  // El frontend lo usa para el ranking visual de platos en los reportes.
  //
  // Parametros:
  //   Periodo - "diario" | "semanal" | "mensual" | "anual" (default: mensual)
  //   N       - cantidad de platos a retornar (max 20, default 5)
  async getPlatosTopConsumo(Periodo = "mensual", N = 5) {
    // Calcular el rango de fechas segun el periodo indicado
    // MySQL permite calcular esto directamente en la clausula WHERE
    const Rangos_SQL = {
      diario: `DATE(Fec_Reserva) = CURDATE()`,
      semanal: `Fec_Reserva >= CURDATE() - INTERVAL 7 DAY`,
      mensual: `Fec_Reserva >= CURDATE() - INTERVAL 30 DAY`,
      anual: `YEAR(Fec_Reserva) = YEAR(CURDATE())`
    };

    // Si el periodo no es valido usar el mensual como fallback seguro
    const Filtro_Fecha = Rangos_SQL[Periodo] || Rangos_SQL.mensual;

    // Limitar N a un maximo de 20 para evitar respuestas excesivamente grandes
    const Limite = Math.min(parseInt(N) || 5, 20);

    // Consulta SQL que cuenta cuantas veces se consumio cada plato y trae sus datos
    const Resultado = await db.query(
      `SELECT
         p.Id_Plato,
         p.Nom_Plato,
         p.Img_Plato,
         p.Tip_Plato,
         p.Des_Plato,
         COUNT(r.Id_Reserva) AS veces_consumido
       FROM reservas r
       INNER JOIN platos p ON r.Id_Plato = p.Id_Plato
       WHERE r.Est_Reserva = 'Consumido'
         AND ${Filtro_Fecha}
       GROUP BY p.Id_Plato, p.Nom_Plato, p.Img_Plato, p.Tip_Plato, p.Des_Plato
       ORDER BY veces_consumido DESC
       LIMIT :limite`,
      { replacements: { limite: Limite }, type: QueryTypes.SELECT }
    );

    return {
      periodo: Periodo,
      limite: Limite,
      platos: Resultado
    };
  }

}

export default new ReportesService();