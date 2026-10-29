// Frontend/src/Tablas/Reservas/GenerarTicketQR.jsx
// Generador de Ticket de Reserva estilo comprobante/factura compacto en alta resolucion (Canvas 2x Retina).
// Incluye marca de agua institucional de Foodsys, sello RESERVADO, QR centrado de baja densidad (lectura < 2.5s),
// y detalles perifericos completos: Aprendiz/Usuario, Ficha/Programa, Comida, Fecha, Vencimiento, Plato, Bebida y Sopa/Caldo.

import toast from "react-hot-toast";

const CargarImagen = (url) =>
  new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });

const DividirLineas = (ctx, texto, anchoMax) => {
  if (!texto) return ["—"];
  const palabras = String(texto).trim().split(/\s+/);
  const lineas = [];
  let actual = "";

  for (const palabra of palabras) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (ctx.measureText(prueba).width > anchoMax && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);
  return lineas.length > 0 ? lineas : ["—"];
};

const GenerarImagenQR = async (texto, tamano) => {
  try {
    const QRCode = (await import("qrcode")).default;
    // Extraer solo el payload util si venia con envoltura URL
    let payloadLimpio = String(texto || "").trim();
    if (payloadLimpio.includes("data=")) {
      try {
        payloadLimpio = decodeURIComponent(payloadLimpio.split("data=")[1].split("&")[0]);
      } catch {
        // conservar original
      }
    }
    const urlData = await QRCode.toDataURL(payloadLimpio, {
      width: tamano * 2,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" }
    });
    return await CargarImagen(urlData);
  } catch {
    return null;
  }
};

const RectanguloRedondeado = (ctx, x, y, ancho, alto, radio) => {
  ctx.beginPath();
  ctx.moveTo(x + radio, y);
  ctx.lineTo(x + ancho - radio, y);
  ctx.arcTo(x + ancho, y, x + ancho, y + radio, radio);
  ctx.lineTo(x + ancho, y + alto - radio);
  ctx.arcTo(x + ancho, y + alto, x + ancho - radio, y + alto, radio);
  ctx.lineTo(x + radio, y + alto);
  ctx.arcTo(x, y + alto, x, y + alto - radio, radio);
  ctx.lineTo(x, y + radio);
  ctx.arcTo(x, y, x + radio, y, radio);
  ctx.closePath();
};

const HORARIOS_COMIDA = {
  Desayuno: "06:00 AM – 07:00 AM",
  Almuerzo: "11:30 AM – 01:30 PM",
  Cena: "06:00 PM – 07:00 PM"
};

const FormatearFechaCorta = (fechaStr) => {
  if (!fechaStr) return "—";
  const f = String(fechaStr).slice(0, 10);
  const d = new Date(`${f}T12:00:00`);
  if (isNaN(d.getTime())) return f;
  return d.toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

export const GenerarTicketQR = async ({ reserva, usuario, qrUrl }) => {
  const SCALE = 2; // Alta resolucion 2x Retina para evitar pixelado al hacer zoom
  const ANCHO = 420;
  const PAD = 24;
  const ANCHO_INT = ANCHO - PAD * 2;

  // Extraer datos consolidados de usuario, ficha y reserva
  const usrStorage = JSON.parse(localStorage.getItem("usuario") || "null") || {};
  const rolActivo = localStorage.getItem("rolActivo") || reserva?.Rol_Usuario || "Aprendiz";

  const nombreUsuario =
    usuario?.nombre ||
    `${reserva?.usuario?.Nom_Usuario || usrStorage.Nom_Usuario || ""} ${reserva?.usuario?.Ape_Usuario || usrStorage.Ape_Usuario || ""}`.trim() ||
    "Usuario Foodsys";

  const docUsuario =
    usuario?.documento ||
    reserva?.usuario?.NumDoc_Usuario ||
    usrStorage.NumDoc_Usuario ||
    "—";

  const tipDoc = reserva?.usuario?.TipDoc_Usuario || usrStorage.TipDoc_Usuario || "CC";
  const numFicha =
    reserva?.usuario?.ficha?.Num_Ficha ||
    usrStorage?.ficha?.Num_Ficha ||
    usrStorage?.Num_Ficha ||
    reserva?.Num_Ficha ||
    "General";

  const nomPrograma =
    reserva?.usuario?.ficha?.programa?.Nom_Programa ||
    usrStorage?.ficha?.programa?.Nom_Programa ||
    reserva?.Nom_Programa ||
    "Centro Agropecuario La Granja";

  const tipoComida = reserva?.Tip_Reserva || "Almuerzo";
  const horarioTexto = reserva?.Es_Guardado_Campo
    ? "11:30 AM – 02:30 PM (Apartado SENA Empresa)"
    : HORARIOS_COMIDA[tipoComida] || "Horario Oficial";

  const nombrePlato = reserva?.plato?.Nom_Plato || reserva?.Nom_Plato || "Plato de la Minuta Oficial";

  // Preferencia de bebida
  const tipoBebidaRaw = String(reserva?.Tipo_Bebida || reserva?.bebida?.Subtipo_Bebida || "FRIA").toUpperCase();
  const nombreBebida = reserva?.bebida?.Nom_Plato || "";
  let textoBebida = "Bebida Fría";
  if (tipoBebidaRaw === "CALIENTE") {
    textoBebida = nombreBebida ? `Bebida Caliente (${nombreBebida})` : "Bebida Caliente";
  } else if (tipoBebidaRaw === "NINGUNA") {
    textoBebida = "Sin bebida";
  } else if (nombreBebida) {
    textoBebida = `Bebida Fría (${nombreBebida})`;
  }

  // Sopa / Caldo incluido
  const llevaSopa = reserva?.Lleva_Sopa !== undefined ? Boolean(Number(reserva.Lleva_Sopa)) : true;
  const textoSopa =
    tipoComida === "Desayuno"
      ? llevaSopa
        ? "Sí, con caldo incluido"
        : "No, sin caldo"
      : llevaSopa
      ? "Sí, con sopa incluida"
      : "No, sin sopa";

  const contenidoQr = qrUrl || reserva?.Qr_Reserva || JSON.stringify({ r: Number(reserva?.Id_Reserva || 0) });

  const [imgQR, imgLogo] = await Promise.all([
    GenerarImagenQR(contenidoQr, 200),
    CargarImagen("/LogoFoodsys.png")
  ]);

  // Medicion previa para calcular alto exacto sin desbordamientos
  const canvasMed = document.createElement("canvas");
  const ctxMed = canvasMed.getContext("2d");

  ctxMed.font = "bold 14px system-ui, -apple-system, sans-serif";
  const lineasNombre = DividirLineas(ctxMed, nombreUsuario.toUpperCase(), ANCHO_INT - 24);
  const lineasPlato = DividirLineas(ctxMed, nombrePlato, ANCHO_INT - 28);

  ctxMed.font = "600 11px system-ui, -apple-system, sans-serif";
  const lineasPrograma = DividirLineas(ctxMed, `${numFicha} — ${nomPrograma}`, ANCHO_INT - 24);

  const ALTO_HEADER = 76;
  const ALTO_QR_SECTION = 248;
  const ALTO_BLOQUE_USUARIO = 74 + (lineasNombre.length - 1) * 16 + (lineasPrograma.length - 1) * 14;
  const ALTO_BLOQUE_COMIDA = 148 + (lineasPlato.length - 1) * 18;
  const ALTO_FOOTER = 54;
  const ALTO_TOTAL = ALTO_HEADER + ALTO_QR_SECTION + ALTO_BLOQUE_USUARIO + ALTO_BLOQUE_COMIDA + ALTO_FOOTER + 36;

  const canvas = document.createElement("canvas");
  canvas.width = ANCHO * SCALE;
  canvas.height = ALTO_TOTAL * SCALE;
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);

  // 1. Fondo general tipo comprobante compacto
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, ANCHO, ALTO_TOTAL);

  // Borde exterior tipo factura
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.5;
  RectanguloRedondeado(ctx, 6, 6, ANCHO - 12, ALTO_TOTAL - 12, 16);
  ctx.stroke();

  // 2. Marca de agua institucional de Foodsys en el fondo
  if (imgLogo) {
    ctx.save();
    ctx.globalAlpha = 0.045;
    const wmSize = 240;
    ctx.drawImage(imgLogo, (ANCHO - wmSize) / 2, (ALTO_TOTAL - wmSize) / 2, wmSize, wmSize);
    ctx.restore();
  }

  let Y = 12;

  // 3. Encabezado Institucional Compacto
  ctx.save();
  RectanguloRedondeado(ctx, 12, Y, ANCHO - 24, ALTO_HEADER - 8, 12);
  const gradHeader = ctx.createLinearGradient(12, Y, ANCHO - 12, Y);
  gradHeader.addColorStop(0, "#065f46");
  gradHeader.addColorStop(1, "#0f766e");
  ctx.fillStyle = gradHeader;
  ctx.fill();

  if (imgLogo) {
    ctx.fillStyle = "#ffffff";
    RectanguloRedondeado(ctx, 22, Y + 12, 42, 42, 10);
    ctx.fill();
    ctx.drawImage(imgLogo, 25, Y + 15, 36, 36);
  }

  const xTit = imgLogo ? 74 : 24;
  ctx.fillStyle = "#a7f3d0";
  ctx.font = "bold 9px system-ui, -apple-system, sans-serif";
  ctx.fillText("SENA • CENTRO AGROPECUARIO LA GRANJA", xTit, Y + 22);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 17px system-ui, -apple-system, sans-serif";
  ctx.fillText("COMPROBANTE DE RESERVA", xTit, Y + 41);

  ctx.fillStyle = "#d1fae5";
  ctx.font = "600 10px system-ui, -apple-system, sans-serif";
  ctx.fillText(`Ticket #${reserva?.Id_Reserva || "—"}  •  ${rolActivo}`, xTit, Y + 56);
  ctx.restore();

  Y += ALTO_HEADER + 4;

  // 4. Codigo QR Central y Sello RESERVADO
  const qrBoxSize = 198;
  const qrBoxX = (ANCHO - qrBoxSize) / 2;

  RectanguloRedondeado(ctx, qrBoxX, Y, qrBoxSize, qrBoxSize, 14);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 2;
  ctx.stroke();

  if (imgQR) {
    const qrDraw = 178;
    ctx.drawImage(
      imgQR,
      qrBoxX + (qrBoxSize - qrDraw) / 2,
      Y + (qrBoxSize - qrDraw) / 2,
      qrDraw,
      qrDraw
    );
  }

  // Sello "RESERVADO" claro debajo del QR
  const selloY = Y + qrBoxSize + 8;
  const selloAncho = 156;
  const selloX = (ANCHO - selloAncho) / 2;
  RectanguloRedondeado(ctx, selloX, selloY, selloAncho, 24, 12);
  ctx.fillStyle = "#ecfdf5";
  ctx.fill();
  ctx.strokeStyle = "#059669";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = "#047857";
  ctx.font = "900 11px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  const textoSello = (reserva?.Est_Reserva || "RESERVADO").toUpperCase() === "GENERADO"
    ? "✓ RESERVADO"
    : `✓ ${(reserva?.Est_Reserva || "RESERVADO").toUpperCase()}`;
  ctx.fillText(textoSello, ANCHO / 2, selloY + 16);
  ctx.textAlign = "left";

  Y += ALTO_QR_SECTION - 4;

  // Linea punteada estilo factura
  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = "#cbd5e1";
  ctx.beginPath();
  ctx.moveTo(PAD, Y);
  ctx.lineTo(ANCHO - PAD, Y);
  ctx.stroke();
  ctx.restore();
  Y += 10;

  // 5. Datos del Aprendiz / Usuario y Ficha
  RectanguloRedondeado(ctx, PAD, Y, ANCHO_INT, ALTO_BLOQUE_USUARIO - 8, 12);
  ctx.fillStyle = "#f8fafc";
  ctx.fill();
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.stroke();

  let yU = Y + 16;
  ctx.fillStyle = "#64748b";
  ctx.font = "bold 9px system-ui, -apple-system, sans-serif";
  ctx.fillText("TITULAR DE LA RESERVA", PAD + 12, yU);

  ctx.textAlign = "right";
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
  ctx.fillText(`${tipDoc}: ${docUsuario}`, ANCHO - PAD - 12, yU);
  ctx.textAlign = "left";

  yU += 16;
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
  for (const lin of lineasNombre) {
    ctx.fillText(lin, PAD + 12, yU);
    yU += 16;
  }

  ctx.fillStyle = "#475569";
  ctx.font = "600 10.5px system-ui, -apple-system, sans-serif";
  for (const linP of lineasPrograma) {
    ctx.fillText(`Ficha: ${linP}`, PAD + 12, yU);
    yU += 14;
  }

  Y += ALTO_BLOQUE_USUARIO;

  // 6. Detalles de Comida, Fecha, Plato, Bebida y Sopa/Caldo
  RectanguloRedondeado(ctx, PAD, Y, ANCHO_INT, ALTO_BLOQUE_COMIDA - 6, 12);
  ctx.fillStyle = "#f0fdf4";
  ctx.fill();
  ctx.strokeStyle = "#bbf7d0";
  ctx.lineWidth = 1;
  ctx.stroke();

  let yC = Y + 18;
  // Fila Servicio + Fecha
  ctx.fillStyle = "#065f46";
  ctx.font = "900 12px system-ui, -apple-system, sans-serif";
  ctx.fillText(`SERVICIO: ${tipoComida.toUpperCase()}`, PAD + 12, yC);

  ctx.textAlign = "right";
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
  ctx.fillText(FormatearFechaCorta(reserva?.Fec_Reserva), ANCHO - PAD - 12, yC);
  ctx.textAlign = "left";

  yC += 16;
  ctx.fillStyle = "#047857";
  ctx.font = "600 10px system-ui, -apple-system, sans-serif";
  ctx.fillText(`Horario límite de consumo: ${horarioTexto}`, PAD + 12, yC);

  // Separador interno
  yC += 8;
  ctx.strokeStyle = "#bbf7d0";
  ctx.beginPath();
  ctx.moveTo(PAD + 12, yC);
  ctx.lineTo(ANCHO - PAD - 12, yC);
  ctx.stroke();

  // Plato fuerte
  yC += 15;
  ctx.fillStyle = "#64748b";
  ctx.font = "bold 9px system-ui, -apple-system, sans-serif";
  ctx.fillText("PLATO FUERTE SELECCIONADO", PAD + 12, yC);

  yC += 15;
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
  for (const linPl of lineasPlato) {
    ctx.fillText(linPl, PAD + 12, yC);
    yC += 17;
  }

  // Preferencia de Bebida y Sopa/Caldo en 2 columnas limpias
  yC += 4;
  const colW = (ANCHO_INT - 30) / 2;

  // Caja Bebida
  RectanguloRedondeado(ctx, PAD + 10, yC - 10, colW, 34, 8);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.fillStyle = "#64748b";
  ctx.font = "bold 8.5px system-ui, -apple-system, sans-serif";
  ctx.fillText("PREFERENCIA BEBIDA", PAD + 18, yC + 1);
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 10.5px system-ui, -apple-system, sans-serif";
  ctx.fillText(textoBebida.slice(0, 26), PAD + 18, yC + 16);

  // Caja Sopa/Caldo
  const xSopa = PAD + 20 + colW;
  RectanguloRedondeado(ctx, xSopa, yC - 10, colW, 34, 8);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.fillStyle = "#64748b";
  ctx.font = "bold 8.5px system-ui, -apple-system, sans-serif";
  ctx.fillText("SOPA / CALDO", xSopa + 8, yC + 1);
  ctx.fillStyle = llevaSopa ? "#047857" : "#64748b";
  ctx.font = "bold 10.5px system-ui, -apple-system, sans-serif";
  ctx.fillText(textoSopa, xSopa + 8, yC + 16);

  Y += ALTO_BLOQUE_COMIDA;

  // 7. Pie de comprobante
  const fechaEmision = new Date().toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  ctx.fillStyle = "#64748b";
  ctx.font = "600 9.5px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Presenta este comprobante digital en la fila correspondiente.", ANCHO / 2, Y + 16);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "9px system-ui, -apple-system, sans-serif";
  ctx.fillText(`Emitido: ${fechaEmision} (America/Bogota) • Foodsys SENA`, ANCHO / 2, Y + 31);
  ctx.textAlign = "left";

  // Descargar PNG de alta nitidez
  const link = document.createElement("a");
  link.download = `Ticket_Foodsys_${tipoComida}_${reserva?.Id_Reserva || "Reserva"}.png`;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast.success("Ticket de reserva descargado en alta resolución.");
};

export default GenerarTicketQR;
