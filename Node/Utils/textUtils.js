// Node/Utils/textUtils.js
// Utilidades para normalizar texto y prevenir registros duplicados
// Comentarios didacticos sin tildes ni emojis para aprendices de primer semestre.

export const normalizarTexto = (texto) => {
  if (!texto) return "";
  return texto
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
};
