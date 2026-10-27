// Services/CocinaService.js
//
// Servicio exclusivo para el rol Cocina.
// Responsabilidades:
//   - Calcular las cantidades de platos requeridas por turno y fecha.
//   - Generar el reporte pre-turno (8 horas antes del inicio) con totales.
//   - Generar el reporte del turno actual (durante el servicio).
//   - Notificar cuando se agrega una reserva excepcional (Exc_Reserva = 'Si').
//
// POR QUE EXISTE ESTE ARCHIVO:
//   ReservasServices maneja el ciclo de vida de UNA reserva.
//   CocinaService agrega datos de MUCHAS reservas para que el personal
//   de cocina sepa exactamente cuantos y que platos debe preparar.

import { Op } from 'sequelize';
import ReservaModel from '../Models/ReservasModel.js';
import UsuariosModel from '../Models/UsuariosModel.js';
import PlatosModels from '../Models/PlatosModels.js';
import MenusModel from '../Models/MenusModels.js';
import FichasModel from '../Models/FichasModel.js';
import ProgramaModel from '../Models/ProgramaModel.js';
import SolicitudesCampoModel from '../Models/SolicitudesCampoModel.js';

class CocinaService {

  // Retorna la fecha de hoy en formato YYYY-MM-DD en America/Bogota
  ObtenerFechaHoy() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ResumenPorFecha
  // Retorna el resumen completo de reservas para una fecha dada:
  //   - Total por tipo de comida (Desayuno, Almuerzo, Cena)
  //   - Total por plato (cuantos eligieron cada opcion)
  //   - Lista nominal de aprendices que solicitaron cada plato (para Bienestar y Cocina)
  //   - Totales por estado (Generado, Verificado, Consumido, Cancelado, Vencido)
  //   - Lista de reservas excepcionales del dia (Exc_Reserva = 'Si')
  //   - Lista detallada de reservas para cada turno
  // ─────────────────────────────────────────────────────────────────────────────
  async ResumenPorFecha(fecha) {
    const reservas = await ReservaModel.findAll({
      where: { Fec_Reserva: fecha },
      include: [
        {
          model: UsuariosModel,
          as: 'usuario',
          attributes: ['Id_Usuario', 'Nom_Usuario', 'Ape_Usuario', 'NumDoc_Usuario', 'Est_Usuario'],
          include: [
            {
              model: FichasModel,
              as: 'ficha',
              attributes: ['Num_Ficha'],
              include: [{ model: ProgramaModel, as: 'programas', attributes: ['Nom_Programa'] }]
            }
          ]
        },
        {
          model: PlatosModels,
          as: 'plato',
          attributes: ['Id_Plato', 'Nom_Plato', 'Img_Plato', 'Des_Plato']
        },
        {
          model: PlatosModels,
          as: 'bebida',
          attributes: ['Id_Plato', 'Nom_Plato', 'Img_Plato', 'Des_Plato', 'Subtipo_Bebida']
        }
      ],
      order: [['Tip_Reserva', 'ASC'], ['createdAt', 'ASC']]
    });

    // Contadores por tipo de comida
    const porTipo = { Desayuno: 0, Almuerzo: 0, Cena: 0 };

    // Contadores por estado
    const porEstado = { Generado: 0, Verificado: 0, Consumido: 0, Cancelado: 0, Vencido: 0 };

    // Contadores por plato con lista nominal de aprendices
    const porPlato = {};

    // Contadores por bebida con lista nominal de aprendices
    const porBebida = {};

    // Reservas excepcionales del dia
    const excepcionales = [];

    // Detalle completo de cada turno
    const detallePorTipo = { Desayuno: [], Almuerzo: [], Cena: [] };

    reservas.forEach(r => {
      // Solo contar reservas activas/pendientes para planificacion de produccion
      const estadoActivo = ['Generado', 'Verificado', 'Consumido'].includes(r.Est_Reserva);

      if (estadoActivo && porTipo[r.Tip_Reserva] !== undefined) {
        porTipo[r.Tip_Reserva]++;
      }

      // Conteo por estado (todos los estados)
      if (porEstado[r.Est_Reserva] !== undefined) {
        porEstado[r.Est_Reserva]++;
      }

      // Conteo por plato (solo activos para saber cuantos preparar)
      if (estadoActivo && r.plato) {
        const nomPlato = r.plato.Nom_Plato;
        if (!porPlato[nomPlato]) {
          porPlato[nomPlato] = {
            total: 0,
            Id_Plato: r.plato.Id_Plato,
            Nom_Plato: nomPlato,
            Des_Plato: r.plato.Des_Plato,
            Img_Plato: r.plato.Img_Plato,
            tipo: r.Tip_Reserva,
            aprendices: []
          };
        }
        porPlato[nomPlato].total++;

        if (r.usuario) {
          porPlato[nomPlato].aprendices.push({
            Id_Usuario: r.usuario.Id_Usuario,
            NombreCompleto: `${r.usuario.Nom_Usuario || ''} ${r.usuario.Ape_Usuario || ''}`.trim(),
            NumDoc: r.usuario.NumDoc_Usuario || '--',
            Num_Ficha: r.usuario.ficha?.Num_Ficha || 'Sin ficha',
            Programa: r.usuario.ficha?.programas?.Nom_Programa || 'Sin programa',
            Estado: r.Est_Reserva
          });
        }
      }

      // Conteo por bebida (solo activos para saber cuantas bebidas servir)
      if (estadoActivo && r.bebida) {
        const nomBebida = r.bebida.Nom_Plato;
        if (!porBebida[nomBebida]) {
          porBebida[nomBebida] = {
            total: 0,
            Id_Plato: r.bebida.Id_Plato,
            Nom_Plato: nomBebida,
            Subtipo_Bebida: r.bebida.Subtipo_Bebida || 'NINGUNA',
            tipo: r.Tip_Reserva,
            aprendices: []
          };
        }
        porBebida[nomBebida].total++;

        if (r.usuario) {
          porBebida[nomBebida].aprendices.push({
            Id_Usuario: r.usuario.Id_Usuario,
            NombreCompleto: `${r.usuario.Nom_Usuario || ''} ${r.usuario.Ape_Usuario || ''}`.trim(),
            NumDoc: r.usuario.NumDoc_Usuario || '--',
            Num_Ficha: r.usuario.ficha?.Num_Ficha || 'Sin ficha',
            Programa: r.usuario.ficha?.programas?.Nom_Programa || 'Sin programa',
            Estado: r.Est_Reserva
          });
        }
      }

      // Reservas excepcionales del dia
      if (r.Exc_Reserva === 'Si') {
        excepcionales.push({
          Id_Reserva: r.Id_Reserva,
          Aprendiz: r.usuario
            ? `${r.usuario.Nom_Usuario} ${r.usuario.Ape_Usuario}`.trim()
            : 'Sin datos',
          Documento: r.usuario?.NumDoc_Usuario || '--',
          Tipo: r.Tip_Reserva,
          Plato: r.plato?.Nom_Plato || 'Sin datos',
          Bebida: r.bebida?.Nom_Plato || 'Sin datos',
          Estado: r.Est_Reserva,
          Jus_Reserva: r.Jus_Reserva || 'Sin justificacion',
          HoraCreacion: r.createdAt
        });
      }

      // Detalle por turno (solo activos)
      if (estadoActivo && detallePorTipo[r.Tip_Reserva]) {
        detallePorTipo[r.Tip_Reserva].push({
          Id_Reserva: r.Id_Reserva,
          Aprendiz: r.usuario
            ? `${r.usuario.Nom_Usuario} ${r.usuario.Ape_Usuario}`.trim()
            : 'Sin datos',
          Documento: r.usuario?.NumDoc_Usuario || '--',
          Estado: r.Est_Reserva,
          Plato: r.plato?.Nom_Plato || 'Sin datos',
          Bebida: r.bebida?.Nom_Plato || 'Sin datos',
          EsExcepcional: r.Exc_Reserva === 'Si'
        });
      }
    });

    // Consultar solicitudes de almuerzos guardados por jornada de campo para esa fecha
    const solicitudesCampo = await SolicitudesCampoModel.findAll({
      where: { Fec_Servicio: fecha },
      include: [
        {
          model: UsuariosModel,
          as: 'solicitante',
          attributes: ['Nom_Usuario', 'Ape_Usuario', 'Tel_Usuario']
        }
      ],
      order: [['Hora_Estimada_Llegada', 'ASC']]
    }).catch(() => []);

    return {
      fecha,
      generadoEn: new Date().toISOString(),
      totalesPorTipo: porTipo,
      totalesPorEstado: porEstado,
      cantidadesPorPlato: Object.values(porPlato).sort((a, b) => b.total - a.total),
      cantidadesPorBebida: Object.values(porBebida).sort((a, b) => b.total - a.total),
      almuerzosGuardadosCampo: solicitudesCampo,
      excepcionales,
      detallePorTipo,
      totalReservasActivas: porTipo.Desayuno + porTipo.Almuerzo + porTipo.Cena
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ReportePrevioTurno
  // Reporte que se muestra 8 horas antes del inicio de cada turno.
  // Incluye SOLO las reservas activas (Generado) para ese tipo y fecha.
  // El personal de cocina lo usa para saber cuanto producir.
  // ─────────────────────────────────────────────────────────────────────────────
  async ReportePrevioTurno(tipo, fecha) {
    const tiposValidos = ['Desayuno', 'Almuerzo', 'Cena'];
    if (!tiposValidos.includes(tipo)) {
      throw new Error(`Tipo de comida invalido: ${tipo}`);
    }

    const reservas = await ReservaModel.findAll({
      where: {
        Fec_Reserva: fecha,
        Tip_Reserva: tipo,
        Est_Reserva: { [Op.in]: ['Generado', 'Verificado'] }
      },
      include: [
        {
          model: PlatosModels,
          as: 'plato',
          attributes: ['Id_Plato', 'Nom_Plato', 'Img_Plato']
        }
      ],
      order: [['Id_Plato', 'ASC']]
    });

    // Conteo de platos requeridos
    const cantidades = {};
    reservas.forEach(r => {
      const nom = r.plato?.Nom_Plato || 'Sin especificar';
      if (!cantidades[nom]) {
        cantidades[nom] = {
          Nom_Plato: nom,
          Img_Plato: r.plato?.Img_Plato || null,
          cantidad: 0
        };
      }
      cantidades[nom].cantidad++;
    });

    // Calcular la hora limite de reservas para este turno (8 horas antes del inicio)
    const inicioTurno = { Desayuno: 6, Almuerzo: 11, Cena: 18 };
    const horaInicio = inicioTurno[tipo];
    const horaLimiteReservas = horaInicio - 8; // 8 horas antes

    return {
      tipo,
      fecha,
      generadoEn: new Date().toISOString(),
      totalReservas: reservas.length,
      horaInicioTurno: `${String(horaInicio).padStart(2, '0')}:00`,
      horaLimiteReservas: `${String(horaLimiteReservas < 0 ? horaLimiteReservas + 24 : horaLimiteReservas).padStart(2, '0')}:00`,
      mensaje: `Tienes ${reservas.length} reservas para ${tipo} del ${fecha}. Prepara los platos indicados a continuacion.`,
      cantidadesPorPlato: Object.values(cantidades).sort((a, b) => b.cantidad - a.cantidad),
      // Tambien incluir excepcionales del turno para alertar al personal
      excepcionales: reservas.filter(r => r.Exc_Reserva === 'Si').length
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ReservasExcepcionalesHoy
  // Retorna las reservas con Exc_Reserva = 'Si' del dia de hoy.
  // Se usa para la notificacion en tiempo real cuando el Coordinador
  // agrega una novedad: Cocina debe saber que hay un plato adicional.
  // ─────────────────────────────────────────────────────────────────────────────
  async ReservasExcepcionalesHoy() {
    const hoy = this.ObtenerFechaHoy();
    const reservas = await ReservaModel.findAll({
      where: {
        Fec_Reserva: hoy,
        Exc_Reserva: 'Si'
      },
      include: [
        {
          model: UsuariosModel,
          as: 'usuario',
          attributes: ['Nom_Usuario', 'Ape_Usuario', 'NumDoc_Usuario']
        },
        {
          model: PlatosModels,
          as: 'plato',
          attributes: ['Nom_Plato', 'Img_Plato']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return {
      fecha: hoy,
      total: reservas.length,
      reservas: reservas.map(r => ({
        Id_Reserva: r.Id_Reserva,
        Aprendiz: r.usuario
          ? `${r.usuario.Nom_Usuario} ${r.usuario.Ape_Usuario}`.trim()
          : 'Sin datos',
        Documento: r.usuario?.NumDoc_Usuario || '--',
        Tipo: r.Tip_Reserva,
        Plato: r.plato?.Nom_Plato || 'Sin datos',
        Img_Plato: r.plato?.Img_Plato || null,
        Estado: r.Est_Reserva,
        Jus_Reserva: r.Jus_Reserva || 'Sin justificacion',
        HoraCreacion: r.createdAt
      }))
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ResumenTurnoActual
  // Retorna el estado actual de un turno especifico:
  //   - Cuantas reservas ya fueron consumidas
  //   - Cuantas siguen pendientes (Generado / Verificado)
  //   - Cuantas fueron canceladas o vencidas
  // Util para el balance en tiempo real durante el servicio.
  // ─────────────────────────────────────────────────────────────────────────────
  async ResumenTurnoActual(tipo) {
    const hoy = this.ObtenerFechaHoy();
    const estados = ['Generado', 'Verificado', 'Consumido', 'Cancelado', 'Vencido'];
    const conteos = {};

    for (const est of estados) {
      conteos[est] = await ReservaModel.count({
        where: { Fec_Reserva: hoy, Tip_Reserva: tipo, Est_Reserva: est }
      });
    }

    // Platos consumidos en este turno con cantidades
    const reservasConsumidas = await ReservaModel.findAll({
      where: { Fec_Reserva: hoy, Tip_Reserva: tipo, Est_Reserva: 'Consumido' },
      include: [{ model: PlatosModels, as: 'plato', attributes: ['Nom_Plato'] }]
    });

    const platosConsumidos = {};
    reservasConsumidas.forEach(r => {
      const nom = r.plato?.Nom_Plato || 'Sin datos';
      platosConsumidos[nom] = (platosConsumidos[nom] || 0) + 1;
    });

    return {
      tipo,
      fecha: hoy,
      conteos,
      // Cuantos ya comieron y de que plato
      platosConsumidos: Object.entries(platosConsumidos).map(([plato, cantidad]) => ({ plato, cantidad })),
      total: Object.values(conteos).reduce((a, b) => a + b, 0)
    };
  }
}

export default new CocinaService();
