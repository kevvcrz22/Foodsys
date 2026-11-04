// Frontend/src/utils/barcodeUtils.js
// Utilidad especializada para la lectura y extraccion de documentos desde
// pistolas lectoras de codigos de barras (1D) y codigos 2D / PDF417 de cedulas colombianas.
// Codigo sin tildes ni caracteres especiales para aprendices de ADSO.

/**
 * Extrae el numero de documento limpio a partir de la cadena leida por un escaner de codigo de barras
 * @param {string} codigo Cadena cruda emitida por el lector
 * @returns {string} Numero de documento normalizado o cadena original si no se puede clasificar
 */
export function extraerDocumentoDeCodigoBarras(codigo) {
  if (!codigo || typeof codigo !== "string") return "";
  const texto = codigo.trim();

  // Si es un codigo QR de reserva o URL de Foodsys, no es codigo de barras de cedula
  if (
    texto.includes("reserva") ||
    texto.includes("checkin") ||
    texto.startsWith("FOODSYS:") ||
    texto.startsWith("ey") ||
    texto.startsWith("{")
  ) {
    return "";
  }

  // 1. Cadena puramente numerica (ej. 1023456789 o carnet SENA)
  if (/^\d{6,12}$/.test(texto)) {
    return String(parseInt(texto, 10));
  }

  // 2. Formato PDF417 de Cedula de Ciudadania Colombiana:
  // En cedulas colombianas, el numero de documento viene precedido de ceros (hasta 10 digitos)
  // antes del primer apellido.
  const matchCedula = texto.match(/\b0*(\d{7,10})\b/);
  if (matchCedula && matchCedula[1] && matchCedula[1].length >= 6) {
    return matchCedula[1];
  }

  // 3. Fallback: buscar la secuencia numerica continua mas larga entre 6 y 10 digitos
  const matches = texto.match(/\d{6,10}/g);
  if (matches && matches.length > 0) {
    const candidata = matches.find((m) => m.length >= 7 && m.length <= 10) || matches[0];
    return String(parseInt(candidata, 10));
  }

  return texto;
}
