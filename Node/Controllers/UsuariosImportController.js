// Node/Controllers/UsuariosImportController.js
// Controlador de importacion de usuarios desde Excel y descarga de plantilla
// Codigo comentado didacticamente sin tildes ni emojis para aprendices de primer semestre

import XLSX from "xlsx";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import FichasModel from "../Models/FichasModel.js";
import UsuariosModel from "../Models/UsuariosModel.js";
import UsuariosRolModel from "../Models/UsuariosRolModel.js";
import RolesModel from "../Models/RolesModel.js";
import ProgramaModel from "../Models/ProgramaModel.js";
import { sincronizarEstadoAprendices } from "../Services/FichasServices.js";

/* ============================================================
   NORMALIZAR ESTADO DE USUARIO
   Verifica el texto ingresado y retorna 'En Formacion' o 'Inactivo'
============================================================ */
const normalizarEstado = (estado) => {
  if (!estado) return "En Formacion";
  const val = String(estado).toLowerCase().trim();
  if (["si", "activo", "en formacion", "formacion", "true", "1"].includes(val)) {
    return "En Formacion";
  }
  if (["no", "inactivo", "false", "0"].includes(val)) {
    return "Inactivo";
  }
  return "En Formacion";
};

/* ============================================================
   COLUMNAS OFICIALES DE LA PLANTILLA
============================================================ */
const COLUMNAS_PLANTILLA = [
  "TipDoc_Usuario",
  "NumDoc_Usuario",
  "Nom_Usuario",
  "Ape_Usuario",
  "Gen_Usuario",
  "Cor_Usuario",
  "Tel_Usuario",
  "CenCon_Usuario",
  "Num_Ficha",
  "Est_Usuario",
  "Pol_Usuario",
  "San_Usuario"
];

/* ============================================================
   DESCARGAR PLANTILLA EXCEL
============================================================ */
export const descargarPlantilla = (req, res) => {
  try {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([COLUMNAS_PLANTILLA]);
    ws["!cols"] = COLUMNAS_PLANTILLA.map(() => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(wb, ws, "Aprendices");

    const buffer = XLSX.write(wb, {
      type: "buffer",
      bookType: "xlsx"
    });

    res.setHeader("Content-Disposition", 'attachment; filename="plantilla_aprendices.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (err) {
    console.error("Error al descargar plantilla:", err);
    res.status(500).json({ message: "Error al generar la plantilla." });
  }
};

/* ============================================================
   PREVIEW IMPORT EXCEL
   Lee el archivo en RAM y cruza con las fichas y programas en memoria
============================================================ */
export const previewImport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se recibio ningun archivo." });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const filas = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!filas.length) {
      return res.status(400).json({ message: "El archivo esta vacio o no contiene filas con datos." });
    }

    // Precargar todas las fichas en memoria para no hacer cientos de consultas a la BD
    const todasLasFichas = await FichasModel.findAll({
      include: [{ model: ProgramaModel, as: "programas", attributes: ["Nom_Programa"] }]
    });

    const mapaFichasPorNumero = new Map();
    for (const f of todasLasFichas) {
      mapaFichasPorNumero.set(String(f.Num_Ficha).trim(), f);
      mapaFichasPorNumero.set(String(f.Id_Ficha).trim(), f);
    }

    const hoyBogota = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

    const datosNormalizados = filas.map((fila) => {
      const normalizado = {};
      for (const key of Object.keys(fila)) {
        normalizado[key.trim()] = fila[key];
      }

      // Detectar numero de ficha ya sea por Num_Ficha o Id_Ficha
      const numFichaRaw = String(normalizado.Num_Ficha || normalizado.Id_Ficha || "").trim();
      const fichaEncontrada = mapaFichasPorNumero.get(numFichaRaw);

      normalizado.Num_Ficha = fichaEncontrada ? fichaEncontrada.Num_Ficha : numFichaRaw;
      normalizado.Id_Ficha = fichaEncontrada ? fichaEncontrada.Id_Ficha : null;
      normalizado.Nom_Programa = fichaEncontrada?.programas?.Nom_Programa || "Por asociar";

      // Validar si la ficha esta vencida
      if (fichaEncontrada?.FecFinLec_Ficha && fichaEncontrada.FecFinLec_Ficha < hoyBogota) {
        normalizado.Est_Usuario = "Inactivo";
        normalizado.Estado_Ficha = "Lectiva Vencida";
      } else {
        normalizado.Est_Usuario = normalizarEstado(normalizado.Est_Usuario);
        normalizado.Estado_Ficha = "Activa";
      }

      // Asignar rol segun CenCon_Usuario
      const cenCon = String(normalizado.CenCon_Usuario || "").toLowerCase().trim();
      const esInterno = ["si", "sí", "1", "true"].includes(cenCon);
      normalizado.Rol_Asignado = esInterno ? "Aprendiz Interno" : "Aprendiz Externo";

      return normalizado;
    });

    return res.json({ data: datosNormalizados, total: datosNormalizados.length });
  } catch (err) {
    console.error("Error en preview de usuarios:", err);
    return res.status(500).json({ message: "Error al leer el archivo Excel." });
  }
};

/* ============================================================
   IMPORTAR SELECCIONADOS
   Inserta los usuarios y crea sus roles en la base de datos
============================================================ */
export const importarSeleccionados = async (req, res) => {
  const { usuarios } = req.body;

  if (!Array.isArray(usuarios) || usuarios.length === 0) {
    return res.status(400).json({ message: "No se enviaron usuarios para importar." });
  }

  try {
    // Precargar roles en memoria para obtener sus IDs reales sin asumir numeros fijos
    const rolesDisponibles = await RolesModel.findAll();
    const mapaRoles = new Map();
    for (const r of rolesDisponibles) {
      mapaRoles.set(r.Nom_Rol.trim().toLowerCase(), r.Id_Rol);
    }

    // Precargar fichas en memoria
    const fichasExistentes = await FichasModel.findAll();
    const mapaFichas = new Map();
    for (const f of fichasExistentes) {
      mapaFichas.set(String(f.Num_Ficha).trim(), f);
      mapaFichas.set(String(f.Id_Ficha).trim(), f);
    }

    const hoyBogota = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

    let creados = 0;
    let omitidos = 0;
    const errores = [];

    for (const u of usuarios) {
      try {
        if (!u.NumDoc_Usuario || !u.Nom_Usuario) {
          omitidos++;
          errores.push(`Fila con doc ${u.NumDoc_Usuario || "?"}: faltan campos obligatorios`);
          continue;
        }

        const numDocStr = String(u.NumDoc_Usuario).trim();

        // Verificar si el documento ya existe
        const existeDoc = await UsuariosModel.findOne({ where: { NumDoc_Usuario: numDocStr } });
        if (existeDoc) {
          omitidos++;
          errores.push(`Documento ${numDocStr} ya existe en el sistema.`);
          continue;
        }

        // Verificar correo si viene diligenciado
        if (u.Cor_Usuario && String(u.Cor_Usuario).trim()) {
          const corStr = String(u.Cor_Usuario).trim();
          const existeCor = await UsuariosModel.findOne({ where: { Cor_Usuario: corStr } });
          if (existeCor) {
            omitidos++;
            errores.push(`Correo ${corStr} ya esta registrado (doc: ${numDocStr}).`);
            continue;
          }
        }

        // Resolver ficha por numero o ID
        let idFichaFinal = null;
        let fichaAsociada = null;
        const numFichaBuscada = String(u.Num_Ficha || u.Id_Ficha || "").trim();

        if (numFichaBuscada) {
          fichaAsociada = mapaFichas.get(numFichaBuscada);
          if (!fichaAsociada && /^\d+$/.test(numFichaBuscada)) {
            // Si no existe pero es un numero valido, crear la ficha con datos basicos para no rechazar al aprendiz
            fichaAsociada = await FichasModel.create({
              Num_Ficha: numFichaBuscada,
              Est_Ficha: "Activo"
            });
            mapaFichas.set(numFichaBuscada, fichaAsociada);
          }
          if (fichaAsociada) {
            idFichaFinal = fichaAsociada.Id_Ficha;
          }
        }

        // Verificar si la etapa lectiva de la ficha vencio
        let estadoUsuario = normalizarEstado(u.Est_Usuario);
        if (fichaAsociada?.FecFinLec_Ficha && fichaAsociada.FecFinLec_Ficha < hoyBogota) {
          estadoUsuario = "Inactivo";
        }

        // Determinar rol segun CenCon_Usuario
        const cenConStr = String(u.CenCon_Usuario || "").toLowerCase().trim();
        const esInterno = ["si", "sí", "1", "true"].includes(cenConStr);
        const esPasante = String(u.Rol_Asignado || u.Tip_Usuario || "").toLowerCase().includes("pasante");

        let nombreRolAsignar = "Aprendiz Externo";
        if (esPasante) {
          nombreRolAsignar = esInterno ? "Pasante Interno" : "Pasante Externo";
        } else {
          nombreRolAsignar = esInterno ? "Aprendiz Interno" : "Aprendiz Externo";
        }

        const idRolFinal = mapaRoles.get(nombreRolAsignar.toLowerCase());

        const passwordHash = await bcrypt.hash(numDocStr, 10);

        const nuevoUsuario = await UsuariosModel.create({
          TipDoc_Usuario: u.TipDoc_Usuario || "CC",
          NumDoc_Usuario: numDocStr,
          Nom_Usuario: String(u.Nom_Usuario).trim(),
          Ape_Usuario: u.Ape_Usuario ? String(u.Ape_Usuario).trim() : null,
          Gen_Usuario: u.Gen_Usuario || null,
          Cor_Usuario: u.Cor_Usuario ? String(u.Cor_Usuario).trim() : null,
          Tel_Usuario: u.Tel_Usuario ? String(u.Tel_Usuario).trim() : null,
          CenCon_Usuario: esInterno ? "Si" : "No",
          Est_Usuario: estadoUsuario,
          Pol_Usuario: u.Pol_Usuario || "No",
          San_Usuario: u.San_Usuario || "No",
          Id_Ficha: idFichaFinal,
          password: passwordHash,
          uuid: uuidv4()
        });

        // Crear la asignacion de rol
        if (idRolFinal) {
          await UsuariosRolModel.create({
            Id_Usuario: nuevoUsuario.Id_Usuario,
            Id_Rol: idRolFinal
          });
        }

        if (idFichaFinal && estadoUsuario === "Inactivo") {
          await sincronizarEstadoAprendices(idFichaFinal);
        }

        creados++;
      } catch (errFila) {
        omitidos++;
        errores.push(`Error en doc ${u.NumDoc_Usuario || "?"}: ${errFila.message}`);
      }
    }

    return res.json({ creados, omitidos, errores });
  } catch (errGeneral) {
    console.error("Error al importar seleccionados:", errGeneral);
    return res.status(500).json({ message: "Error interno al importar usuarios." });
  }
};

export default {
  descargarPlantilla,
  previewImport,
  importarSeleccionados
};