// Services/NovedadesService.js
//
// Servicio de novedades y gestion de estado Especial para el sistema FoodSys.
// Este archivo es complementario a ReservasServices.js. No duplica logica:
// cuando necesita crear una reserva, delega a ReservasServices.generarReservaPass.
//
// Responsabilidades de este archivo:
//   1. Crear reservas por novedad del dia (gestionadas por el Coordinador)
//   2. Consultar el historial de novedades del dia
//   3. Generar el reporte estructurado de novedades para exportar
//   4. Asignar y revocar el estado Especial a usuarios externos
//   5. Revertir masivamente estados Especiales expirados (tarea de mantenimiento)
//   6. Importar aprendices con estado Especial desde un archivo Excel
//
// POR QUE EXISTE ESTE ARCHIVO Y NO SE MEZCLA EN ReservasServices.js:
//   ReservasServices maneja el ciclo de vida de UNA reserva.
//   NovedadesService maneja flujos de negocio del Coordinador que operan sobre
//   multiples usuarios y reservas a la vez (reportes, importaciones, estados masivos).
//   Mezclarlos haria ReservasServices dificil de leer y mantener.

import { Op } from "sequelize";
import db from '../Database/db.js';
import ReservaModel from "../Models/ReservasModel.js";
import UsuariosModel from "../Models/UsuariosModel.js";
import UsuariosRolModel from "../Models/UsuariosRolModel.js";
import RolesModel from "../Models/RolesModel.js";
import PlatosModels from "../Models/PlatosModels.js";

// ReservasServices se importa para delegar la creacion de reservas.
// Esto evita duplicar la logica de transaccion, QR, encriptacion y validaciones.
import ReservasServices from "./ReservasServices.js";

// Dependencia de terceros para leer y escribir archivos Excel.
// Instalar con: npm install xlsx
import xlsx from "xlsx";

// Duracion del estado Especial en dias.
// Se mantiene igual que en ReservasServices para que ambos archivos sean consistentes.
const DIAS_DURACION_ESPECIAL = 30;

// Roles elegibles para recibir el estado Especial.
// Los internos no necesitan este estado ya que su flujo ya omite cocina por defecto.
const ROLES_ELEGIBLES_ESPECIAL = ['Aprendiz Externo', 'Pasante Externo'];

class NovedadesService {

  // Retorna la fecha de hoy en formato YYYY-MM-DD.
  // Las novedades siempre son para el dia actual, no para dias futuros.
  ObtenerFechaHoy() {
    return new Date().toISOString().split('T')[0];
  }

  // Calcula la fecha de referencia segun la hora actual.
  // Antes de las 18:00 la referencia es el dia de hoy.
  // A partir de las 18:00 la referencia es el dia siguiente, porque
  // el servicio de cena ya esta por terminar y el coordinador ya piensa en manana.
  // Este metodo es util para la vista del historial de novedades del dia.
  Obtener_Fecha_Referencia() {
    const Ahora = new Date();
    if (Ahora.getHours() >= 18) {
      Ahora.setDate(Ahora.getDate() + 1);
    }
    const Anio = Ahora.getFullYear();
    const Mes = String(Ahora.getMonth() + 1).padStart(2, "0");
    const Dia = String(Ahora.getDate()).padStart(2, "0");
    return `${Anio}-${Mes}-${Dia}`;
  }

  // Retorna los tipos de comida disponibles para un usuario segun sus roles.
  // Esta logica es la misma que en ReservasServices.ObtenerRolesPermitidos
  // pero expresada para el contexto de novedades (el Coordinador la consulta
  // al abrir el formulario de novedad para saber que opciones mostrar).
Obtener_Tipos_Por_Rol(Roles_Usuario) {
  const EsInterno = Roles_Usuario.some(
    (R) => R === "Aprendiz Interno" || R === "Pasante Interno"
  );
  if (EsInterno) return ["Desayuno", "Almuerzo", "Cena"];

  const EsExterno = Roles_Usuario.some(
    (R) => R === "Aprendiz Externo" || R === "Pasante Externo"
  );
  // Los externos solo tienen derecho a almuerzo segun las reglas de negocio del comedor.
  // El desayuno y la cena no aplican para su tipo de vinculacion.
  if (EsExterno) return ["Almuerzo"];

  return [];
}
  // Retorna las reservas excepcionales del dia actual con los datos del aprendiz.
  // Se usa en la vista de novedades del Coordinador y en la generacion del reporte.
  async Obtener_Excepcionales_Hoy() {
    const Fecha = this.ObtenerFechaHoy();
    const Reservas = await ReservaModel.findAll({
      where: {
        Exc_Reserva: "Si",
        Fec_Reserva: Fecha,
      },
      include: [
        {
          model: UsuariosModel,
          as: 'usuario',
          attributes: ["Id_Usuario", "Nom_Usuario", "Ape_Usuario", "NumDoc_Usuario"],
        },
        {
          // Incluir el plato para mostrar que va a comer el aprendiz en la vista del coordinador
          model: PlatosModels,
          as: 'plato',
          attributes: ['Nom_Plato', 'Img_Plato']
        }
      ],
      order: [["createdAt", "DESC"]],
    });
    return Reservas;
  }

  // Valida que el aprendiz NO tenga una reserva activa o consumida para ese tipo de comida hoy.
  // La condicion de novedad existe precisamente cuando el aprendiz NO alcanzo a reservar el
  // dia anterior (no cumplio la regla de 24 horas). Si ya tiene reserva, no hay novedad.
  //
  // Tipos permitidos para novedad: solo Almuerzo y Cena.
  // El desayuno no aplica como novedad porque el servicio inicia muy temprano y no es
  // practico que el coordinador gestione excepciones a esa hora.
  async ValidarElegibilidadNovedad(Id_Usuario, Tip_Reserva, fechaHoy) {
    const TipoNormalizado = Tip_Reserva.charAt(0).toUpperCase() + Tip_Reserva.slice(1);

    const tiposPermitidosNovedad = ['Almuerzo', 'Cena'];
    if (!tiposPermitidosNovedad.includes(TipoNormalizado)) {
      throw new Error(
        `Solo se pueden crear novedades para Almuerzo o Cena del dia actual. ` +
        `El Desayuno no aplica como novedad.`
      );
    }

    // Si el aprendiz ya tiene una reserva en cualquier estado que no sea Cancelado,
    // significa que si reservo y no hay motivo para una novedad.
    const reservaExistente = await ReservaModel.findOne({
      where: {
        Id_Usuario,
        Tip_Reserva: TipoNormalizado,
        Fec_Reserva: fechaHoy,
        Est_Reserva: { [Op.notIn]: ['Cancelado', 'Vencido'] }
      }
    });

    if (reservaExistente) {
      throw new Error(
        `El aprendiz ya tiene una reserva registrada (${reservaExistente.Est_Reserva}) ` +
        `para ${TipoNormalizado} hoy. No aplica como novedad.`
      );
    }

    return TipoNormalizado;
  }

  // Crea una reserva por novedad para el dia actual.
  // Este metodo solo debe ser invocado por controladores protegidos con el rol Coordinador.
  //
  // Flujo:
  //   1. Validar que el tipo sea Almuerzo o Cena y que el aprendiz no tenga reserva hoy
  //   2. Obtener los roles del aprendiz desde la DB para validar permisos
  //   3. Delegar la creacion a ReservasServices.generarReservaPass con esNovedad = true
  //
  // La reserva queda en el historial del aprendiz automaticamente porque se crea
  // con el Id_Usuario del aprendiz, no del coordinador. El historial filtra por Id_Usuario.
  async CrearNovedad(Id_UsuarioAprendiz, Id_UsuarioCoordinador, Tip_Reserva, platoElegido, Jus_Reserva) {
    const fechaHoy = this.ObtenerFechaHoy();

    // Paso 1: validar elegibilidad antes de cualquier otra operacion
    const TipoNormalizado = await this.ValidarElegibilidadNovedad(
      Id_UsuarioAprendiz, Tip_Reserva, fechaHoy
    );

    // Paso 2: obtener el aprendiz con sus roles desde la base de datos.
    // No se usa el token del coordinador porque los roles que importan son los del aprendiz.
    const aprendiz = await UsuariosModel.findByPk(Id_UsuarioAprendiz, {
      include: [{
        model: UsuariosRolModel,
        as: 'rolesUsuario',
        include: [{ model: RolesModel, as: 'rolUsuario' }]
      }]
    });

    if (!aprendiz) throw new Error("El aprendiz indicado no existe en el sistema");

    const rolesAprendiz = aprendiz.rolesUsuario
      ?.map(ur => ur.rolUsuario?.Nom_Rol)
      .filter(Boolean) || [];

    if (rolesAprendiz.length === 0) {
      throw new Error("El aprendiz no tiene roles asignados en el sistema");
    }

    // Validar que el tipo de comida sea permitido para el rol del aprendiz
    const tiposPermitidos = ReservasServices.ObtenerRolesPermitidos(rolesAprendiz);
    if (!tiposPermitidos.includes(TipoNormalizado)) {
      throw new Error(
        `El tipo de comida "${TipoNormalizado}" no esta permitido para el rol del aprendiz. ` +
        `Tipos permitidos: ${tiposPermitidos.join(', ')}`
      );
    }

    // Paso 3: delegar la creacion de la reserva a ReservasServices.
    // Se pasa esNovedad = true para que omita la validacion de 24 horas.
    // La Justificacion queda registrada en el campo Jus_Reserva de la reserva.
    const resultado = await ReservasServices.generarReservaPass(
      Id_UsuarioAprendiz,
      rolesAprendiz,
      TipoNormalizado,
      platoElegido,
      fechaHoy,
      true,
      Jus_Reserva || `Novedad creada por coordinador (ID: ${Id_UsuarioCoordinador})`
    );

    return resultado;
  }

  // Genera el reporte estructurado de novedades del dia.
  // Retorna un objeto JSON con resumen de totales y el detalle de cada novedad,
  // listo para ser convertido a PDF o Excel por el frontend o por un endpoint adicional.
  async GenerarReporteDelDia() {
    const fechaHoy = this.ObtenerFechaHoy();

    const novedades = await ReservaModel.findAll({
      where: {
        Exc_Reserva: "Si",
        Fec_Reserva: fechaHoy,
      },
      include: [
        {
          model: UsuariosModel,
          as: 'usuario',
          attributes: ["Id_Usuario", "Nom_Usuario", "Ape_Usuario", "NumDoc_Usuario"],
        },
        {
          model: PlatosModels,
          as: 'plato',
          attributes: ['Nom_Plato']
        }
      ],
      order: [["Tip_Reserva", "ASC"], ["createdAt", "ASC"]],
    });

    // Construir el objeto de reporte con contadores y detalle plano.
    // El detalle plano es lo que el frontend puede convertir directamente a filas de tabla o Excel.
    const reporte = {
      fecha: fechaHoy,
      generadoEn: new Date().toISOString(),
      total: novedades.length,
      porTipo: {},
      porEstado: {},
      detalle: []
    };

    novedades.forEach(r => {
      // Acumular totales por tipo de comida
      reporte.porTipo[r.Tip_Reserva] = (reporte.porTipo[r.Tip_Reserva] || 0) + 1;
      // Acumular totales por estado de la reserva
      reporte.porEstado[r.Est_Reserva] = (reporte.porEstado[r.Est_Reserva] || 0) + 1;

      // Agregar fila de detalle con todos los datos necesarios para el reporte
      reporte.detalle.push({
        Id_Reserva: r.Id_Reserva,
        Aprendiz: r.usuario
          ? `${r.usuario.Nom_Usuario} ${r.usuario.Ape_Usuario}`
          : 'Sin datos',
        Documento: r.usuario?.NumDoc_Usuario || 'Sin datos',
        Tipo: r.Tip_Reserva,
        Plato: r.plato?.Nom_Plato || 'Sin datos',
        Estado: r.Est_Reserva,
        Jus_Reserva: r.Jus_Reserva || 'Sin justificacion',
        HoraCreacion: r.createdAt
      });
    });

    return reporte;
  }

  // Asigna el estado Especial a una lista de IDs de usuarios.
  // Valida que cada usuario exista y tenga un rol externo antes de actualizar.
  // Retorna un resumen con los usuarios exitosos y los rechazados con su motivo.
  //
  // Este metodo solo debe ser invocado por el Coordinador.
  // El estado Especial tiene duracion de 30 dias calculados desde updatedAt.
  async ActualizarEstadoEspecial(idsUsuarios) {
    if (!Array.isArray(idsUsuarios) || idsUsuarios.length === 0) {
      throw new Error("Se debe proporcionar al menos un ID de usuario");
    }

    const resultados = { actualizados: [], rechazados: [] };

    for (const Id_Usuario of idsUsuarios) {
      try {
        // Obtener usuario con sus roles en una sola consulta para evitar N+1 queries
        const usuario = await UsuariosModel.findByPk(Id_Usuario, {
          include: [{
            model: UsuariosRolModel,
            as: 'rolesUsuario',
            include: [{ model: RolesModel, as: 'rolUsuario' }]
          }]
        });

        if (!usuario) {
          resultados.rechazados.push({
            Id_Usuario,
            motivo: 'Usuario no encontrado en el sistema'
          });
          continue;
        }

        const nombresRoles = usuario.rolesUsuario
          ?.map(ur => ur.rolUsuario?.Nom_Rol)
          .filter(Boolean) || [];

        const esElegible = nombresRoles.some(r => ROLES_ELEGIBLES_ESPECIAL.includes(r));

        if (!esElegible) {
          resultados.rechazados.push({
            Id_Usuario,
            nombre: `${usuario.Nom_Usuario} ${usuario.Ape_Usuario}`,
            motivo: `El estado Especial solo aplica para: ${ROLES_ELEGIBLES_ESPECIAL.join(', ')}`
          });
          continue;
        }

        if (usuario.Est_Usuario === 'Especial') {
          resultados.rechazados.push({
            Id_Usuario,
            nombre: `${usuario.Nom_Usuario} ${usuario.Ape_Usuario}`,
            motivo: 'El usuario ya tiene estado Especial activo'
          });
          continue;
        }

        // Actualizar el estado. El campo updatedAt se actualiza automaticamente por Sequelize
        // y sirve como referencia para el vencimiento de 30 dias en VerificarExpiracionEspecial.
        await usuario.update({ Est_Usuario: 'Especial' });

        resultados.actualizados.push({
          Id_Usuario,
          nombre: `${usuario.Nom_Usuario} ${usuario.Ape_Usuario}`,
          documento: usuario.NumDoc_Usuario,
          venceEn: new Date(Date.now() + DIAS_DURACION_ESPECIAL * 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0]
        });

      } catch (error) {
        resultados.rechazados.push({
          Id_Usuario,
          motivo: `Error interno: ${error.message}`
        });
      }
    }

    return resultados;
  }

  // Revierte a "En Formacion" todos los usuarios externos cuyo estado Especial
  // haya superado los 30 dias desde la ultima actualizacion del registro (updatedAt).
  //
  // Cuando llamar este metodo:
  //   - Al iniciar el servidor (en app.js, una sola vez al arranque)
  //   - Desde un endpoint de mantenimiento protegido con rol Coordinador
  //   - Opcionalmente con setInterval cada 24 horas si el servidor corre continuamente
  //
  // Retorna el conteo de usuarios revertidos para poder loguearlo o mostrarlo al Coordinador.
  async RevertirEspecialesExpirados() {
    const ahora = new Date();
    const fechaLimite = new Date(ahora.getTime() - DIAS_DURACION_ESPECIAL * 24 * 60 * 60 * 1000);

    const usuariosExpirados = await UsuariosModel.findAll({
      where: {
        Est_Usuario: 'Especial',
        updatedAt: { [Op.lte]: fechaLimite }
      },
      attributes: ['Id_Usuario', 'Nom_Usuario', 'Ape_Usuario']
    });

    if (usuariosExpirados.length === 0) {
      return { revertidos: 0, usuarios: [] };
    }

    const ids = usuariosExpirados.map(u => u.Id_Usuario);

    // Actualizar en un solo query en lugar de un loop para mejor rendimiento
    await UsuariosModel.update(
      { Est_Usuario: 'En Formacion' },
      { where: { Id_Usuario: { [Op.in]: ids } } }
    );

    return {
      revertidos: usuariosExpirados.length,
      usuarios: usuariosExpirados.map(u => ({
        Id_Usuario: u.Id_Usuario,
        nombre: `${u.Nom_Usuario} ${u.Ape_Usuario}`
      }))
    };
  }

  // Procesa un archivo Excel para actualizar masivamente el estado Especial de aprendices.
  //
  // Formato esperado del Excel:
  //   El archivo debe tener una hoja con alguna de estas columnas (no ambas a la vez):
  //     - "Id_Usuario"      : ID primario del usuario en la base de datos
  //     - "NumDoc_Usuario"  : Numero de documento de identidad del aprendiz
  //
  // El archivo llega como Buffer desde el middleware multer.
  // El endpoint que llama este metodo debe configurar multer con storage: memoryStorage()
  // para que el archivo quede disponible como req.file.buffer.
  //
  // Dependencia requerida: npm install xlsx
  async ImportarEspecialesDesdeExcel(bufferArchivo) {
    if (!bufferArchivo) {
      throw new Error("No se recibio ningun archivo para procesar");
    }

    // Parsear el archivo Excel desde el Buffer de memoria
    let workbook;
    try {
      workbook = xlsx.read(bufferArchivo, { type: 'buffer' });
    } catch (e) {
      throw new Error("El archivo no es un Excel valido o esta corrupto");
    }

    const nombreHoja = workbook.SheetNames[0];
    if (!nombreHoja) {
      throw new Error("El archivo Excel no tiene hojas de calculo");
    }

    const hoja = workbook.Sheets[nombreHoja];
    const filas = xlsx.utils.sheet_to_json(hoja, { defval: null });

    if (!filas || filas.length === 0) {
      throw new Error("El archivo Excel esta vacio o no tiene datos en la primera hoja");
    }

// ✅ POR ESTO:
const primeraFila = filas[0];
const columnas = Object.keys(primeraFila);

const ALIAS_ID  = ['Id_Usuario', 'ID Usuario', 'id_usuario'];
const ALIAS_DOC = ['NumDoc_Usuario', 'N° Documento', 'Num Documento',
                   'NumDocumento', 'num_doc', 'Documento'];

const colId  = columnas.find(c => ALIAS_ID.includes(c));
const colDoc = columnas.find(c => ALIAS_DOC.includes(c));

const usaId  = Boolean(colId);
const usaDoc = Boolean(colDoc);

if (!usaId && !usaDoc) {
  throw new Error(
    "El Excel debe tener una columna 'Id_Usuario' o 'N° Documento' (u otro nombre reconocido). " +
    `Columnas encontradas: ${columnas.join(', ')}`
  );
}

    let idsUsuarios = [];

if (usaId) {
  // ✅ Usa colId en vez del nombre hardcodeado
  idsUsuarios = filas
    .map(f => parseInt(f[colId]))
    .filter(id => !isNaN(id) && id > 0);

} else {
  // ✅ Usa colDoc en vez del nombre hardcodeado
  const documentos = filas
    .map(f => f[colDoc] ? String(f[colDoc]).trim() : null)
    .filter(Boolean);

  if (documentos.length === 0) {
    throw new Error(`La columna "${colDoc}" existe pero no tiene valores válidos`);
  }

  const usuariosEncontrados = await UsuariosModel.findAll({
    where: { NumDoc_Usuario: { [Op.in]: documentos } },
    attributes: ['Id_Usuario', 'NumDoc_Usuario']
  });

      idsUsuarios = usuariosEncontrados.map(u => u.Id_Usuario);

      if (idsUsuarios.length < documentos.length) {
        // No es un error fatal, pero el resultado incluira cuantos no se encontraron
        console.warn(
          `[NovedadesService] Se buscaron ${documentos.length} documentos pero solo ` +
          `se encontraron ${idsUsuarios.length} usuarios en la base de datos.`
        );
      }
    }

    if (idsUsuarios.length === 0) {
      throw new Error(
        "No se encontraron usuarios validos en el archivo. " +
        "Verifique que los datos coincidan con los registros de la base de datos."
      );
    }

    // Delegar la actualizacion con todas las validaciones de rol incluidas
    return await this.ActualizarEstadoEspecial(idsUsuarios);
  }
}

export default new NovedadesService();