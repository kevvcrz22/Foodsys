// Node/Services/CsvService.js
import csv       from "csv-parser";
import fs        from "fs";
import bcrypt    from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import UsuariosModel from "../Models/UsuariosModel.js";

class CsvService {

  /**
   * Procesa el archivo CSV subido por multer y registra los aprendices.
   * Columnas esperadas en el CSV (case-insensitive):
   *   TipDoc_Usuario, NumDoc_Usuario, Nom_Usuario, Ape_Usuario,
   *   Gen_Usuario, Cor_Usuario, Tel_Usuario, CenCon_Usuario,
   *   Est_Usuario, San_Usuario, Id_Ficha
   *
   * @param {string} filePath  - ruta del archivo temporal
   * @returns {Promise<{creados: number, omitidos: number, errores: string[]}>}
   */
  async importarDesdeCSV(filePath) {
    const filas    = await this._leerCSV(filePath);
    let   creados  = 0;
    let   omitidos = 0;
    const errores  = [];

    for (const fila of filas) {
      const {
        TipDoc_Usuario,
        NumDoc_Usuario,
        Nom_Usuario,
        Ape_Usuario,
        Gen_Usuario   = "",
        Cor_Usuario   = "",
        Tel_Usuario   = "",
        CenCon_Usuario = "",
        Est_Usuario   = "En Formacion",
        San_Usuario   = "No",
        Id_Ficha      = null,
      } = fila;

      /* Validar campos obligatorios */
      if (!TipDoc_Usuario || !NumDoc_Usuario || !Nom_Usuario || !Ape_Usuario) {
        omitidos++;
        errores.push(`Fila omitida — faltan datos: ${JSON.stringify(fila)}`);
        continue;
      }

      /* Evitar duplicados */
      const existe = await UsuariosModel.findOne({
        where: { TipDoc_Usuario, NumDoc_Usuario },
      });
      if (existe) {
        omitidos++;
        errores.push(`Ya existe: ${NumDoc_Usuario} (${TipDoc_Usuario})`);
        continue;
      }

      /* Contraseña inicial = número de documento */
      const hashedPwd = await bcrypt.hash(String(NumDoc_Usuario), 10);

      await UsuariosModel.create({
        TipDoc_Usuario,
        NumDoc_Usuario: String(NumDoc_Usuario),
        Nom_Usuario,
        Ape_Usuario,
        Gen_Usuario,
        Cor_Usuario,
        Tel_Usuario,
        CenCon_Usuario,
        Est_Usuario,
        San_Usuario,
        Id_Ficha:  Id_Ficha || null,
        password:  hashedPwd,
        uuid:      uuidv4(),
        CreateData: new Date(),
        UpdateData: new Date(),
      });
      creados++;
    }

    /* Eliminar archivo temporal */
    try { fs.unlinkSync(filePath); } catch (_) { /* ignorar */ }

    return { creados, omitidos, errores };
  }

  /* ── Lee el CSV y devuelve array de objetos ── */
  _leerCSV(filePath) {
    return new Promise((resolve, reject) => {
      const resultados = [];
      fs.createReadStream(filePath)
        .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
        .on("data", (row) => resultados.push(row))
        .on("end",  ()    => resolve(resultados))
        .on("error", reject);
    });
  }
}

export default new CsvService();