Usuariosimportcontroller.js
// Backend/src/Controllers/UsuariosImportController.js

import XLSX from "xlsx";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import FichasModel from "../Models/FichasModel.js";
import UsuariosModel from "../Models/UsuariosModel.js";
import { sincronizarEstadoAprendices } from "../Services/FichasServices.js";
import UsuariosRolModelA from "../Models/UsuariosRolModel.js";

/* ============================================================
   NORMALIZAR ESTADO
============================================================ */
const normalizarEstado = (estado) => {
  if (!estado) return "En Formacion";

  const val = String(estado).toLowerCase().trim();

  if (["si", "activo", "en formacion", "formacion"].includes(val)) {
    return "En Formacion";
  }

  if (["no", "inactivo"].includes(val)) {
    return "Inactivo";
  }

  return "En Formacion";
};

/* ============================================================
   PLANTILLA EXCEL
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
  "Est_Usuario",
  "Pol_Usuario",
  "San_Usuario",
  "Id_Ficha",
];

/* ============================================================
   DESCARGAR PLANTILLA
============================================================ */
export const descargarPlantilla = (req, res) => {
  try {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([COLUMNAS_PLANTILLA]);

    ws["!cols"] = COLUMNAS_PLANTILLA.map(() => ({ wch: 22 }));

    XLSX.utils.book_append_sheet(wb, ws, "Aprendices");

    const buffer = XLSX.write(wb, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="plantilla_aprendices.xlsx"'
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al generar la plantilla." });
  }
};

/* ============================================================
   PREVIEW IMPORT EXCEL
============================================================ */
export const previewImport = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se recibió archivo." });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const filas = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!filas.length) {
      return res.status(400).json({ message: "Archivo vacío." });
    }

    const datos = filas.map((fila) => {
      const normalizado = {};
      for (const key of Object.keys(fila)) {
        normalizado[key.trim()] = fila[key];
      }
      return normalizado;
    });

    return res.json({ data: datos, total: datos.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Error al leer archivo.",
    });
  }
};

/* ============================================================
   IMPORTAR SELECCIONADOS
============================================================ */
export const importarSeleccionados = async (req, res) => {
  const { usuarios } = req.body;

  if (!Array.isArray(usuarios) || usuarios.length === 0) {
    return res.status(400).json({ message: "No se enviaron usuarios." });
  }

  let creados = 0;
  let omitidos = 0;
  const errores = [];

  for (const u of usuarios) {
    try {
      // Validación básica
      if (!u.NumDoc_Usuario || !u.Cor_Usuario) {
        omitidos++;
        errores.push(
          `Fila con doc ${u.NumDoc_Usuario || "?"}: datos incompletos`
        );
        continue;
      }

      // Buscar ficha por número
      const ficha = await FichasModel.findOne({
        where: { Num_Ficha: u.Id_Ficha },
      });

      if (!ficha) {
        omitidos++;
        errores.push(`Ficha ${u.Id_Ficha} no existe.`);
        continue;
      }

      // Verificar duplicado documento
      const existe = await UsuariosModel.findOne({
        where: { NumDoc_Usuario: u.NumDoc_Usuario },
      });

      if (existe) {
        omitidos++;
        errores.push(`Documento ${u.NumDoc_Usuario} ya existe.`);
        continue;
      }

      // Verificar correo
      const existeCorreo = await UsuariosModel.findOne({
        where: { Cor_Usuario: u.Cor_Usuario },
      });

      if (existeCorreo) {
        omitidos++;
        errores.push(`Correo ${u.Cor_Usuario} ya existe.`);
        continue;
      }

      // Crear usuario
      const passwordHash = await bcrypt.hash(
        String(u.NumDoc_Usuario),
        10
      );

     const usuarioCreado = await UsuariosModel.create({
        TipDoc_Usuario: u.TipDoc_Usuario,
        NumDoc_Usuario: u.NumDoc_Usuario,
        Nom_Usuario: u.Nom_Usuario,
        Ape_Usuario: u.Ape_Usuario,
        Gen_Usuario: u.Gen_Usuario,
        Cor_Usuario: u.Cor_Usuario,
        Tel_Usuario: u.Tel_Usuario,
        CenCon_Usuario: u.CenCon_Usuario,
        Est_Usuario: normalizarEstado(u.Est_Usuario),
        Pol_Usuario: u.Pol_Usuario,
        San_Usuario: u.San_Usuario,
        Id_Ficha: ficha.Id_Ficha,
        password: passwordHash,
        uuid: uuidv4(),
        });

        //Asignar rol al usuario importado
        await UsuariosRolModel.create({
        Id_Usuario: usuarioCreado.Id_Usuario,
        Id_Rol: 4 // o 5 según tu sistema (Aprendiz Interno/Externo)
        });

      // 🔥 IMPORTANTE: sincronizar estado de la ficha
      await sincronizarEstadoAprendices(ficha.Id_Ficha);

      creados++;
    } catch (err) {
      omitidos++;
      errores.push(
        `Error en doc ${u.NumDoc_Usuario || "?"}: ${err.message}`
      );
    }
  }

  return res.json({
    creados,
    omitidos,
    errores,
  });
};