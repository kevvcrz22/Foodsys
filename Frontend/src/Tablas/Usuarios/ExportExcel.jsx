// Frontend/src/Tablas/Usuarios/ExportExcel.js
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/**
 * Exporta la lista de usuarios a un archivo Excel (.xlsx)
 * @param {Array} usuarios - Array de objetos usuario desde la API
 */
export const exportarUsuariosExcel = (usuarios) => {
  if (!usuarios || usuarios.length === 0) {
    alert("No hay datos para exportar.");
    return;
  }

  // Mapear solo los campos requeridos con nombres de columna legibles
  const datos = usuarios.map((u) => ({
    "ID Usuario":           u.Id_Usuario        ?? "",
    "Tipo Documento":       u.TipDoc_Usuario     ?? "",
    "N° Documento":         u.NumDoc_Usuario     ?? "",
    "Nombres":              u.Nom_Usuario        ?? "",
    "Apellidos":            u.Ape_Usuario        ?? "",
    "Género":               u.Gen_Usuario        ?? "",
    "Correo":               u.Cor_Usuario        ?? "",
    "Teléfono":             u.Tel_Usuario        ?? "",
    "Centro de Convivencia":u.CenCon_Usuario     ?? "",
    "Estado":               u.Est_Usuario        ?? "",
    "Sanción":              u.San_Usuario        ?? "",
    "Fecha Creación":       u.CreateData
                              ? new Date(u.CreateData).toLocaleDateString("es-CO")
                              : "",
    "Última Actualización": u.UpdateData
                              ? new Date(u.UpdateData).toLocaleDateString("es-CO")
                              : "",
  }));

  // Crear hoja de cálculo
  const hoja = XLSX.utils.json_to_sheet(datos);

  // Ancho de columnas automático basado en el contenido
  const anchos = Object.keys(datos[0] || {}).map((key) => ({
    wch: Math.max(
      key.length,
      ...datos.map((row) => String(row[key] ?? "").length)
    ) + 2,
  }));
  hoja["!cols"] = anchos;

  // Crear libro y agregar hoja
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Usuarios");

  // Generar buffer y descargar
  const excelBuffer = XLSX.write(libro, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const fecha = new Date().toISOString().split("T")[0];
  saveAs(blob, `Usuarios_Foodsys_${fecha}.xlsx`);
};