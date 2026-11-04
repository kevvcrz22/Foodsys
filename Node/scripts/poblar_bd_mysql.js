// ==============================================================================
// SCRIPT DE CARGA DIRECTA A BASE DE DATOS MYSQL (FOODSYS)
// ==============================================================================
// Lee Fichas_Activas_Foodsys.xlsx y Aprendices_Activos_Foodsys.xlsx
// e inserta/sincroniza en lote:
//   1. Programas (sin duplicados)
//   2. Fichas (asociadas a su programa correspondiente con fechas calculadas)
//   3. Usuarios / Aprendices (Est_Usuario = 'En Formacion', contraseña = NumDoc)
//   4. UsuariosRol (Aprendiz Interno = 4 / Aprendiz Externo = 5 / Pasantes)
// ==============================================================================

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

import db from "../Database/db.js";
import ProgramaModel from "../Models/ProgramaModel.js";
import FichasModel from "../Models/FichasModel.js";
import UsuariosModel from "../Models/UsuariosModel.js";
import RolesModel from "../Models/RolesModel.js";
import UsuariosRolModel from "../Models/UsuariosRolModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RUTA_FICHAS = path.resolve(__dirname, "../../Fichas_Activas_Foodsys.xlsx");
const RUTA_APRENDICES = path.resolve(__dirname, "../../Aprendices_Activos_Foodsys.xlsx");

async function main() {
  console.log("=".repeat(75));
  console.log(">> POBLADOR DIRECTO DE BASE DE DATOS MYSQL - FOODSYS");
  console.log("=".repeat(75));

  if (!fs.existsSync(RUTA_FICHAS)) {
    console.error(`[ERROR] No se encontro ${RUTA_FICHAS}. Ejecuta primero procesar_archivos_sena.py`);
    process.exit(1);
  }
  if (!fs.existsSync(RUTA_APRENDICES)) {
    console.error(`[ERROR] No se encontro ${RUTA_APRENDICES}. Ejecuta primero procesar_archivos_sena.py`);
    process.exit(1);
  }

  try {
    await db.authenticate();
    console.log("[OK] Conexion con la base de datos establecida exitosamente.");

    // =========================================================================
    // 1. CARGAR Y POBLAR PROGRAMAS Y FICHAS
    // =========================================================================
    console.log(`\n[1/4] Leyendo archivo de fichas: ${path.basename(RUTA_FICHAS)}...`);
    const wbFichas = XLSX.read(fs.readFileSync(RUTA_FICHAS), { type: "buffer" });
    const hojaFichas = wbFichas.Sheets[wbFichas.SheetNames[0]];
    const filasFichas = XLSX.utils.sheet_to_json(hojaFichas, { defval: "" });
    console.log(`   Total fichas en archivo: ${filasFichas.length.toLocaleString()}`);

    // Precargar programas existentes
    const programasExistentes = await ProgramaModel.findAll();
    const mapaProgramas = new Map();
    programasExistentes.forEach(p => {
      mapaProgramas.set(p.Nom_Programa.trim().toUpperCase(), p.Id_Programa);
    });

    console.log(`   Programas existentes en BD: ${mapaProgramas.size}`);

    // Identificar programas nuevos
    const programasNuevos = new Set();
    filasFichas.forEach(f => {
      const nom = String(f["Nombre del Programa"] || "").trim().toUpperCase();
      if (nom && !mapaProgramas.has(nom)) {
        programasNuevos.add(nom);
      }
    });

    if (programasNuevos.size > 0) {
      console.log(`   Creando ${programasNuevos.size} programas nuevos en BD...`);
      for (const nomProg of programasNuevos) {
        // Buscar un nivel de formacion de ejemplo para este programa
        const ejemploFicha = filasFichas.find(f => String(f["Nombre del Programa"] || "").trim().toUpperCase() === nomProg);
        const niv = ejemploFicha ? String(ejemploFicha["Nivel de Formacion"] || "TECNOLOGO").trim() : "TECNOLOGO";

        const creado = await ProgramaModel.create({
          Nom_Programa: nomProg,
          Are_Programa: "AGROPECUARIA / SERVICIOS",
          NivFor_Programa: niv,
          Est_Programa: "Activo"
        });
        mapaProgramas.set(nomProg, creado.Id_Programa);
      }
      console.log(`   [OK] Todos los programas creados y mapeados.`);
    }

    // Precargar fichas existentes
    const fichasExistentes = await FichasModel.findAll();
    const mapaFichas = new Map();
    fichasExistentes.forEach(f => {
      mapaFichas.set(Number(f.Num_Ficha), f.Id_Ficha);
    });

    console.log(`   Fichas existentes en BD: ${mapaFichas.size}`);

    let fichasCreadas = 0;
    let fichasActualizadas = 0;

    for (const f of filasFichas) {
      const numFicha = parseInt(f["Num_Ficha"], 10);
      if (!numFicha || isNaN(numFicha)) continue;

      const nomProg = String(f["Nombre del Programa"] || "").trim().toUpperCase();
      const idProg = mapaProgramas.get(nomProg) || null;

      const fecIniLec = f["FecIniLec_Ficha"] || null;
      const fecFinLec = f["FecFinLec_Ficha"] || null;
      const fecIniPra = f["FecIniPra_Ficha"] || null;
      const fecFinPra = f["FecFinPra_Ficha"] || null;

      if (mapaFichas.has(numFicha)) {
        // Actualizar fechas si estaban vacias
        const idFicha = mapaFichas.get(numFicha);
        await FichasModel.update({
          Id_Programa: idProg,
          FecIniLec_Ficha: fecIniLec,
          FecFinLec_Ficha: fecFinLec,
          FecIniPra_Ficha: fecIniPra,
          FecFinPra_Ficha: fecFinPra
        }, { where: { Id_Ficha: idFicha } });
        fichasActualizadas++;
      } else {
        const nuevaFicha = await FichasModel.create({
          Num_Ficha: numFicha,
          Id_Programa: idProg,
          FecIniLec_Ficha: fecIniLec,
          FecFinLec_Ficha: fecFinLec,
          FecIniPra_Ficha: fecIniPra,
          FecFinPra_Ficha: fecFinPra
        });
        mapaFichas.set(numFicha, nuevaFicha.Id_Ficha);
        fichasCreadas++;
      }
    }

    console.log(`   [OK] Fichas procesadas: ${fichasCreadas} creadas, ${fichasActualizadas} actualizadas.`);

    // =========================================================================
    // 2. CARGAR Y POBLAR APRENDICES Y ROLES
    // =========================================================================
    console.log(`\n[2/4] Leyendo archivo de aprendices: ${path.basename(RUTA_APRENDICES)}...`);
    const wbAprendices = XLSX.read(fs.readFileSync(RUTA_APRENDICES), { type: "buffer" });
    const hojaAprendices = wbAprendices.Sheets[wbAprendices.SheetNames[0]];
    const filasAprendices = XLSX.utils.sheet_to_json(hojaAprendices, { defval: "" });
    console.log(`   Total aprendices en archivo: ${filasAprendices.length.toLocaleString()}`);

    // Precargar roles disponibles
    const todosRoles = await RolesModel.findAll();
    const mapaRoles = new Map();
    todosRoles.forEach(r => {
      mapaRoles.set(r.Nom_Rol.trim().toLowerCase(), r.Id_Rol);
    });

    const idRolInterno = mapaRoles.get("aprendiz interno") || 4;
    const idRolExterno = mapaRoles.get("aprendiz externo") || 5;
    const idRolPasanteInt = mapaRoles.get("pasante interno") || idRolInterno;
    const idRolPasanteExt = mapaRoles.get("pasante externo") || idRolExterno;

    console.log(`   Roles mapeados: Aprendiz Interno (${idRolInterno}), Aprendiz Externo (${idRolExterno})`);

    // Precargar usuarios existentes por NumDoc_Usuario, Cor_Usuario y Tel_Usuario
    const usuariosExistentes = await UsuariosModel.findAll({
      attributes: ["Id_Usuario", "NumDoc_Usuario", "Cor_Usuario", "Tel_Usuario"]
    });
    const mapaUsuariosDoc = new Map();
    const emailsEnBD = new Set();
    const telsEnBD = new Set();

    usuariosExistentes.forEach(u => {
      if (u.NumDoc_Usuario) {
        mapaUsuariosDoc.set(String(u.NumDoc_Usuario).trim(), u.Id_Usuario);
      }
      if (u.Cor_Usuario) {
        emailsEnBD.add(String(u.Cor_Usuario).trim().toLowerCase());
      }
      if (u.Tel_Usuario) {
        telsEnBD.add(String(u.Tel_Usuario).trim());
      }
    });

    console.log(`   Usuarios ya existentes en BD: ${mapaUsuariosDoc.size}`);

    // Filtrar los que realmente son nuevos
    const aprendicesParaCrear = [];
    let omitidosYaExistian = 0;

    for (const a of filasAprendices) {
      const doc = String(a["Documento"] || "").trim();
      if (!doc) continue;

      if (mapaUsuariosDoc.has(doc)) {
        omitidosYaExistian++;
        continue;
      }
      aprendicesParaCrear.push(a);
    }

    console.log(`   Aprendices nuevos por insertar: ${aprendicesParaCrear.length.toLocaleString()}`);
    console.log(`   Aprendices ya existentes (omitidos para no alterar datos previos): ${omitidosYaExistian.toLocaleString()}`);

    // Insertar en lotes de 50 con hashing paralelo
    const BATCH_SIZE = 50;
    let creadosTotal = 0;
    const totalLotes = Math.ceil(aprendicesParaCrear.length / BATCH_SIZE);

    console.log(`\n[3/4] Insertando en base de datos en lotes de ${BATCH_SIZE}...`);

    for (let i = 0; i < aprendicesParaCrear.length; i += BATCH_SIZE) {
      const chunk = aprendicesParaCrear.slice(i, i + BATCH_SIZE);
      const loteNum = Math.floor(i / BATCH_SIZE) + 1;

      // Generar hashes de contraseña en paralelo para el lote
      const passwordsHashed = await Promise.all(
        chunk.map(item => bcrypt.hash(String(item["Documento"]).trim(), 10))
      );

      // Preparar registros de usuarios
      const usuariosParaInsertar = chunk.map((item, idx) => {
        const doc = String(item["Documento"]).trim();
        const numFicha = parseInt(item["Ficha"], 10);
        const idFichaAsociada = numFicha && mapaFichas.has(numFicha) ? mapaFichas.get(numFicha) : null;
        const esInterno = String(item["Centro de Convivencia"]).toLowerCase().trim() === "si";

        let cor = String(item["Correo Electrónico"] || item["Correo"] || "").trim().toLowerCase();
        if (!cor || emailsEnBD.has(cor)) {
          cor = `${doc}@soy.sena.edu.co`;
        }
        emailsEnBD.add(cor);

        let tel = String(item["Teléfono"] || item["Telefono"] || "").trim();
        if (!tel || telsEnBD.has(tel) || tel.length < 7) {
          tel = null;
        } else {
          telsEnBD.add(tel);
        }

        return {
          TipDoc_Usuario: String(item["Tipo de Documento"] || "CC").trim(),
          NumDoc_Usuario: doc,
          Nom_Usuario: String(item["Nombres"] || "APRENDIZ SENA").trim(),
          Ape_Usuario: String(item["Apellidos"] || "").trim(),
          Gen_Usuario: item["Género"] || item["Genero"] || null,
          Cor_Usuario: cor,
          Tel_Usuario: tel,
          CenCon_Usuario: esInterno ? "Si" : "No",
          Id_Ficha: idFichaAsociada,
          Est_Usuario: "En Formacion", // MANDATORIO
          San_Usuario: "No",
          Pol_Usuario: "No",
          password: passwordsHashed[idx],
          uuid: uuidv4(),
          createdat: new Date(),
          updatedat: new Date()
        };
      });

      // Transaccion por lote para asegurar consistencia atomica
      await db.transaction(async (t) => {
        const usuariosCreados = await UsuariosModel.bulkCreate(usuariosParaInsertar, { transaction: t });

        // Asociar roles correspondientes
        const rolesParaInsertar = usuariosCreados.map((u, idx) => {
          const itemOriginal = chunk[idx];
          const rolOriginal = String(itemOriginal["Rol"] || "").toLowerCase();
          const esInterno = String(itemOriginal["Centro de Convivencia"]).toLowerCase().trim() === "si";

          let rolId = idRolExterno;
          if (rolOriginal.includes("pasante")) {
            rolId = esInterno ? idRolPasanteInt : idRolPasanteExt;
          } else {
            rolId = esInterno ? idRolInterno : idRolExterno;
          }

          return {
            Id_Usuario: u.Id_Usuario,
            Id_Rol: rolId
          };
        });

        await UsuariosRolModel.bulkCreate(rolesParaInsertar, { transaction: t });
      });

      creadosTotal += chunk.length;
      if (loteNum % 10 === 0 || loteNum === totalLotes) {
        process.stdout.write(`   Lote ${loteNum}/${totalLotes} completado (${creadosTotal.toLocaleString()}/${aprendicesParaCrear.length.toLocaleString()})\r`);
      }
    }

    console.log(`\n\n[4/4] Finalizando y verificando metricas en base de datos...`);
    const totalUsuariosBD = await UsuariosModel.count();
    const totalFichasBD = await FichasModel.count();
    const totalProgramasBD = await ProgramaModel.count();
    const totalEnFormacionBD = await UsuariosModel.count({ where: { Est_Usuario: "En Formacion" } });
    const totalInternosBD = await UsuariosModel.count({ where: { CenCon_Usuario: "Si" } });

    console.log("=".repeat(75));
    console.log(">> POBLAMIENTO COMPLETADO CON EXITO TOTAL!");
    console.log(`   * Total Programas en BD:        ${totalProgramasBD.toLocaleString()}`);
    console.log(`   * Total Fichas en BD:           ${totalFichasBD.toLocaleString()}`);
    console.log(`   * Total Usuarios en BD:         ${totalUsuariosBD.toLocaleString()}`);
    console.log(`   * Usuarios 'En Formacion':      ${totalEnFormacionBD.toLocaleString()}`);
    console.log(`   * Usuarios Internos (Cabañas):  ${totalInternosBD.toLocaleString()}`);
    console.log("=".repeat(75));

    process.exit(0);
  } catch (error) {
    console.error("\n[ERROR CRITICO]:", error.message);
    if (error.original) {
      console.error("[SQL CODE]:", error.original.code);
      console.error("[SQL MESSAGE]:", error.original.sqlMessage);
    }
    process.exit(1);
  }
}

main();
