import ProgramaModel from "../Models/ProgramaModel.js";
import { encolarEventoSync } from "./SyncOutboxService.js";

/**
 * Normaliza el nombre de un programa de formacion del SENA:
 * - Convierte a mayusculas y elimina espacios en los extremos.
 * - Preserva la letra Ñ y elimina tildes/diacriticos.
 * - Elimina signos de puntuacion basura al inicio o final (puntos, comas, guiones).
 * - Colapsa multiples espacios internos en un solo espacio.
 *
 * @param {string} texto - Nombre original del programa
 * @returns {string} Nombre normalizado limpio
 */
export function normalizarNombrePrograma(texto) {
  if (!texto) return "";
  let limpio = String(texto).trim().toUpperCase();

  // Preservamos la letra ENIE mayuscula temporalmente antes de quitar diacriticos
  limpio = limpio.replace(/Ñ/g, "__LETRA_ENIE__");

  // Descomponemos caracteres acentuados y eliminamos marcas de tildes
  limpio = limpio.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Restauramos la letra ENIE original
  limpio = limpio.replace(/__LETRA_ENIE__/g, "Ñ");

  // Eliminamos signos de puntuacion y caracteres especiales al inicio o al final
  limpio = limpio.replace(/^[\s.,;:_\-/\\]+|[\s.,;:_\-/\\]+$/g, "");

  // Colapsamos multiples espacios internos en un solo espacio
  limpio = limpio.replace(/\s+/g, " ");

  return limpio;
}

class ProgramaService {
    // Consulta todos los programas ordenados por Id descendente
    async getAll() {
        return await ProgramaModel.findAll({
            order: [['Id_Programa', 'DESC']]
        });
    }

    // Busca un programa por su clave primaria
    async getById(id) {
        const Programa = await ProgramaModel.findByPk(id);
        if (!Programa) throw new Error("Programa no encontrado");
        return Programa;    
    }

    // Crea un nuevo programa con nombre normalizado y estado activo por defecto
    async create(data) {
        const nombreLimpio = normalizarNombrePrograma(data.Nom_Programa);
        if (!nombreLimpio) throw new Error("El nombre del programa es obligatorio");

        // Verificamos si ya existe un programa con este nombre normalizado
        const existente = await ProgramaModel.findOne({
            where: { Nom_Programa: nombreLimpio }
        });
        if (existente) {
            return existente;
        }

        const nuevoProg = await ProgramaModel.create({
            ...data,
            Nom_Programa: nombreLimpio,
            Est_Programa: data.Est_Programa || 'Activo'
        });

        await encolarEventoSync({
            entidad: "PROGRAMA",
            operacion: "CREATE",
            entity_uuid: nuevoProg.Id_Programa,
            payload: {
                Id_Programa: nuevoProg.Id_Programa,
                Nom_Programa: nuevoProg.Nom_Programa,
                NivFor_Programa: nuevoProg.NivFor_Programa,
                Are_Programa: nuevoProg.Are_Programa,
                Est_Programa: nuevoProg.Est_Programa
            }
        });

        return nuevoProg;
    }

    // Actualiza los datos de un programa existente
    async update(id, data) {
        const datosActualizar = { ...data };
        if (datosActualizar.Nom_Programa) {
            datosActualizar.Nom_Programa = normalizarNombrePrograma(datosActualizar.Nom_Programa);
        }
        const result = await ProgramaModel.update(datosActualizar, { where: { Id_Programa: id } });
        const updated = result[0];
        if (updated === 0) throw new Error("Programa no encontrado o sin cambios");

        const progAct = await ProgramaModel.findByPk(id);
        await encolarEventoSync({
            entidad: "PROGRAMA",
            operacion: "UPDATE",
            entity_uuid: id,
            payload: {
                Id_Programa: id,
                Nom_Programa: progAct.Nom_Programa,
                NivFor_Programa: progAct.NivFor_Programa,
                Are_Programa: progAct.Are_Programa,
                Est_Programa: progAct.Est_Programa
            }
        });

        return true;
    }

    // Cambia el estado de un programa entre Activo e Inactivo
    async cambiarEstado(id, nuevoEstado) {
        const programa = await ProgramaModel.findByPk(id);
        if (!programa) throw new Error("Programa no encontrado");
        const estadoFinal = nuevoEstado || (programa.Est_Programa === 'Inactivo' ? 'Activo' : 'Inactivo');
        await ProgramaModel.update({ Est_Programa: estadoFinal }, { where: { Id_Programa: id } });

        await encolarEventoSync({
            entidad: "PROGRAMA",
            operacion: "UPDATE",
            entity_uuid: id,
            payload: {
                Id_Programa: id,
                Nom_Programa: programa.Nom_Programa,
                Est_Programa: estadoFinal
            }
        });

        return { estado: estadoFinal };
    }

    // Inactiva logicamente el programa para no romper integridad referencial con fichas
    async delete(id) {
        const programa = await ProgramaModel.findByPk(id);
        if (!programa) throw new Error("Programa no encontrado");
        await ProgramaModel.update({ Est_Programa: 'Inactivo' }, { where: { Id_Programa: id } });

        await encolarEventoSync({
            entidad: "PROGRAMA",
            operacion: "UPDATE",
            entity_uuid: id,
            payload: {
                Id_Programa: id,
                Nom_Programa: programa.Nom_Programa,
                Est_Programa: 'Inactivo'
            }
        });

        return true;
    }
}

export default new ProgramaService();