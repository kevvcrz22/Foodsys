// Utils/GenerarTicketQR.js
//
// Genera una imagen PNG con el ticket completo de la reserva usando Canvas 2D.
// Incluye: informacion del usuario, imagen del plato, descripcion del plato,
//          detalles de la reserva y el codigo QR.
//
// USO:
//   import { GenerarTicketQR } from "../../Utils/GenerarTicketQR";
//   await GenerarTicketQR({ reserva, usuario, qrUrl, urlImagen });
//
// PARAMETROS:
//   reserva   -> objeto de la reserva (del historial)
//   usuario   -> { nombre: string, documento: string }
//   qrUrl     -> string con la URL completa que va en el QR
//   urlImagen -> funcion(nombreArchivo) => URL de la imagen del plato

// ─── Helpers de Canvas ───────────────────────────────────────────────────────

// Carga una imagen desde una URL y la retorna como HTMLImageElement.
// Usa crossOrigin anonimo para poder dibujar imagenes del backend en el canvas.
const CargarImagen = (url) =>
    new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null); // Si falla, continuar sin imagen
        img.src = url;
    });

// Dibuja texto con salto de linea automatico dentro de un ancho maximo.
// Retorna la coordenada Y final para saber donde continuar dibujando.
const DibujarTextoMultilinea = (ctx, texto, x, y, anchoMax, alturaLinea) => {
    if (!texto) return y;
    const palabras = texto.split(" ");
    let lineaActual = "";
    let yActual = y;

    for (const palabra of palabras) {
        const lineaPrueba = lineaActual ? `${lineaActual} ${palabra}` : palabra;
        const medida = ctx.measureText(lineaPrueba);

        if (medida.width > anchoMax && lineaActual) {
            ctx.fillText(lineaActual, x, yActual);
            lineaActual = palabra;
            yActual += alturaLinea;
        } else {
            lineaActual = lineaPrueba;
        }
    }

    if (lineaActual) {
        ctx.fillText(lineaActual, x, yActual);
        yActual += alturaLinea;
    }

    return yActual;
};

// Genera el SVG del codigo QR usando la libreria qrcode
// y lo convierte a una imagen que puede dibujarse en el canvas.
const GenerarImagenQR = async (texto, tamano) => {
    try {
        // Importar dinamicamente qrcode para no aumentar el bundle base
        const QRCode = (await import("qrcode")).default;
        const urlData = await QRCode.toDataURL(texto, {
            width: tamano,
            margin: 2,
            errorCorrectionLevel: "H",
            color: { dark: "#0f172a", light: "#ffffff" },
        });
        return await CargarImagen(urlData);
    } catch {
        return null;
    }
};

// Dibuja un rectangulo con esquinas redondeadas
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

// ─── Configuracion visual por estado ─────────────────────────────────────────

const COLORES_ESTADO = {
    Generado: { texto: "Pendiente", fondo: "#fffbeb", color: "#b45309", punto: "#f59e0b" },
    Verificado: { texto: "Verificado", fondo: "#eff6ff", color: "#1d4ed8", punto: "#3b82f6" },
    Consumido: { texto: "Consumido", fondo: "#f0fdf4", color: "#15803d", punto: "#22c55e" },
    Cancelado: { texto: "Cancelado", fondo: "#f8fafc", color: "#64748b", punto: "#94a3b8" },
};

const COLORES_TIPO = {
    Desayuno: "#ea580c",
    Almuerzo: "#4f46e5",
    Cena: "#7c3aed",
};

const FormatearFechaLarga = (fechaStr) => {
    if (!fechaStr) return "—";
    return new Date(`${fechaStr}T12:00:00`).toLocaleDateString("es-CO", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
};

const FormatearHora = (isoStr) => {
    if (!isoStr) return "—";
    return new Date(isoStr).toLocaleTimeString("es-CO", {
        hour: "2-digit", minute: "2-digit",
    });
};

// ─── Funcion principal ────────────────────────────────────────────────────────

export const GenerarTicketQR = async ({ reserva, usuario, qrUrl, urlImagen }) => {

    // ── Constantes de layout ──────────────────────────────────────────────────
    const ANCHO = 600;
    const PADDING = 32;
    const ANCHO_INTERNO = ANCHO - PADDING * 2;
    const RADIO = 16;

    // ── Preparar datos ────────────────────────────────────────────────────────
    const estadoConfig = COLORES_ESTADO[reserva.Est_Reserva] ?? COLORES_ESTADO.Cancelado;
    const colorTipo = COLORES_TIPO[reserva.Tip_Reserva] ?? "#64748b";
    const imgPlatoUrl = urlImagen(reserva.plato?.Img_Plato);
    const esActiva = reserva.Est_Reserva === "Generado" || reserva.Est_Reserva === "Verificado";

    // ── Cargar recursos en paralelo ───────────────────────────────────────────
    const [imgPlato, imgQR] = await Promise.all([
        imgPlatoUrl ? CargarImagen(imgPlatoUrl) : Promise.resolve(null),
        qrUrl ? GenerarImagenQR(qrUrl, 240) : Promise.resolve(null),
    ]);

    // ── Medir el alto total del canvas (se calcula antes de crear el canvas) ──
    // Cada seccion contribuye una altura fija o dinamica
    const ALTO_BARRA_TOP = 8;
    const ALTO_HEADER = 64;
    const ALTO_IMG_PLATO = imgPlato ? 240 : 0;
    const ALTO_SECCION_USUARIO = 80;

    // Para Des_Plato necesitamos un canvas temporal para medir el texto
    const canvasMedicion = document.createElement("canvas");
    const ctxMedicion = canvasMedicion.getContext("2d");
    ctxMedicion.font = "16px sans-serif";
    const descTexto = reserva.plato?.Des_Plato ?? "";
    let alturaDesc = 0;
    if (descTexto) {
        const palabras = descTexto.split(" ");
        let linea = "";
        let lineas = 1;
        for (const p of palabras) {
            const prueba = linea ? `${linea} ${p}` : p;
            if (ctxMedicion.measureText(prueba).width > ANCHO_INTERNO - 32) {
                linea = p;
                lineas++;
            } else {
                linea = prueba;
            }
        }
        alturaDesc = 32 + lineas * 24 + 16; // label + lineas + padding
    }

    const ALTO_NOMBRE_PLATO = 80;
    const ALTO_DETALLES = 180;
    const ALTO_QR = imgQR ? 300 : 0;
    const ALTO_FOOTER = 60;
    const SEPARADORES = 8 * 16; // gaps entre secciones

    const ALTO_TOTAL =
        ALTO_BARRA_TOP + ALTO_HEADER + ALTO_IMG_PLATO + ALTO_SECCION_USUARIO +
        ALTO_NOMBRE_PLATO + alturaDesc + ALTO_DETALLES + ALTO_QR +
        ALTO_FOOTER + SEPARADORES;

    // ── Crear canvas real ─────────────────────────────────────────────────────
    const canvas = document.createElement("canvas");
    canvas.width = ANCHO;
    canvas.height = ALTO_TOTAL;
    const ctx = canvas.getContext("2d");

    let Y = 0; // Cursor vertical

    // ── 1. Fondo blanco ───────────────────────────────────────────────────────
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, ANCHO, ALTO_TOTAL);

    // ── 2. Barra superior de color segun estado ───────────────────────────────
    const gradienteTop = ctx.createLinearGradient(0, 0, ANCHO, 0);
    gradienteTop.addColorStop(0, estadoConfig.punto);
    gradienteTop.addColorStop(1, colorTipo);
    ctx.fillStyle = gradienteTop;
    ctx.fillRect(0, 0, ANCHO, ALTO_BARRA_TOP);
    Y += ALTO_BARRA_TOP;

    // ── 3. Header: logo + titulo ──────────────────────────────────────────────
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, Y, ANCHO, ALTO_HEADER);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 22px system-ui, sans-serif";
    ctx.fillText("Foodsys", PADDING, Y + 38);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "13px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Ticket de Reserva", ANCHO - PADDING, Y + 38);
    ctx.textAlign = "left";
    Y += ALTO_HEADER;

    // ── 4. Imagen del plato ───────────────────────────────────────────────────
    if (imgPlato) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, Y, ANCHO, ALTO_IMG_PLATO);
        ctx.clip();
        ctx.drawImage(imgPlato, 0, Y, ANCHO, ALTO_IMG_PLATO);
        ctx.restore();

        // Gradiente oscuro en la parte inferior de la imagen para legibilidad
        const gradImg = ctx.createLinearGradient(0, Y + ALTO_IMG_PLATO * 0.5, 0, Y + ALTO_IMG_PLATO);
        gradImg.addColorStop(0, "rgba(0,0,0,0)");
        gradImg.addColorStop(1, "rgba(0,0,0,0.6)");
        ctx.fillStyle = gradImg;
        ctx.fillRect(0, Y, ANCHO, ALTO_IMG_PLATO);
        Y += ALTO_IMG_PLATO;
    }

    // ── 5. Seccion usuario ────────────────────────────────────────────────────
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, Y, ANCHO, ALTO_SECCION_USUARIO);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText("APRENDIZ", PADDING, Y + 24);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px system-ui, sans-serif";
    ctx.fillText(usuario?.nombre ?? "Usuario", PADDING, Y + 46);

    ctx.fillStyle = "#64748b";
    ctx.font = "13px system-ui, sans-serif";
    ctx.fillText(`Doc. ${usuario?.documento ?? "—"}`, PADDING, Y + 65);
    Y += ALTO_SECCION_USUARIO + 16;

    // ── 6. Nombre del plato + badges ─────────────────────────────────────────
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 26px system-ui, sans-serif";
    ctx.fillText(reserva.plato?.Nom_Plato ?? "Plato no disponible", PADDING, Y + 32);

    // Badge tipo de comida
    const textoBadgeTipo = reserva.Tip_Reserva ?? "";
    ctx.font = "bold 12px system-ui, sans-serif";
    const anchoBadge = ctx.measureText(textoBadgeTipo).width + 24;
    const xBadgeTipo = ANCHO - PADDING - anchoBadge;
    const yBadgeTipo = Y + 10;

    RectanguloRedondeado(ctx, xBadgeTipo, yBadgeTipo, anchoBadge, 26, 8);
    ctx.fillStyle = colorTipo + "22";
    ctx.fill();
    ctx.strokeStyle = colorTipo + "88";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = colorTipo;
    ctx.fillText(textoBadgeTipo, xBadgeTipo + 12, yBadgeTipo + 17);

    // Badge estado
    const textoBadgeEstado = estadoConfig.texto;
    const anchoBadgeE = ctx.measureText(textoBadgeEstado).width + 28;
    const xBadgeE = ANCHO - PADDING - anchoBadgeE;
    const yBadgeE = yBadgeTipo + 32;

    RectanguloRedondeado(ctx, xBadgeE, yBadgeE, anchoBadgeE, 26, 13);
    ctx.fillStyle = estadoConfig.fondo;
    ctx.fill();
    ctx.strokeStyle = estadoConfig.punto + "88";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Punto de estado
    ctx.beginPath();
    ctx.arc(xBadgeE + 14, yBadgeE + 13, 4, 0, Math.PI * 2);
    ctx.fillStyle = estadoConfig.punto;
    ctx.fill();

    ctx.fillStyle = estadoConfig.color;
    ctx.fillText(textoBadgeEstado, xBadgeE + 22, yBadgeE + 17);

    ctx.fillStyle = "#64748b";
    ctx.font = "13px system-ui, sans-serif";
    ctx.fillText(`Reserva #${reserva.Id_Reserva}`, PADDING, Y + 56);
    Y += ALTO_NOMBRE_PLATO;

    // ── 7. Descripcion del plato ──────────────────────────────────────────────
    if (descTexto) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 10px system-ui, sans-serif";
        ctx.fillText("DESCRIPCIÓN DEL PLATO", PADDING, Y + 4);

        ctx.fillStyle = "#475569";
        ctx.font = "15px system-ui, sans-serif";
        const yFinalDesc = DibujarTextoMultilinea(
            ctx, descTexto, PADDING, Y + 24, ANCHO_INTERNO - 16, 24
        );
        Y = yFinalDesc + 16;
    }

    // ── 8. Detalles de la reserva ─────────────────────────────────────────────
    // Fondo de la seccion de detalles
    RectanguloRedondeado(ctx, PADDING, Y, ANCHO_INTERNO, ALTO_DETALLES - 16, RADIO);
    ctx.fillStyle = "#f1f5f9";
    ctx.fill();

    const filas = [
        { icono: "📅", label: "Fecha de reserva", valor: FormatearFechaLarga(reserva.Fec_Reserva) },
        { icono: "⏰", label: "Vence a las", valor: FormatearHora(reserva.Vec_Reserva) },
        { icono: "📋", label: "Tipo de reserva", valor: reserva.Exc_Reserva === "Si" ? "Novedad del dia" : "Reserva normal" },
    ];

    if (reserva.Exc_Reserva === "Si" && reserva.Jus_Reserva) {
        filas.push({ icono: "💬", label: "Justificacion", valor: reserva.Jus_Reserva });
    }

    let yFila = Y + 20;
    for (const fila of filas) {
        // Icono
        ctx.font = "16px system-ui, sans-serif";
        ctx.fillText(fila.icono, PADDING + 16, yFila + 16);

        // Label
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 10px system-ui, sans-serif";
        ctx.fillText(fila.label.toUpperCase(), PADDING + 44, yFila + 12);

        // Valor
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 14px system-ui, sans-serif";
        ctx.fillText(fila.valor, PADDING + 44, yFila + 28);

        // Linea separadora (excepto la ultima)
        if (fila !== filas[filas.length - 1]) {
            ctx.strokeStyle = "#e2e8f0";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(PADDING + 44, yFila + 38);
            ctx.lineTo(PADDING + ANCHO_INTERNO - 16, yFila + 38);
            ctx.stroke();
        }

        yFila += 44;
    }
    Y += ALTO_DETALLES;

    // ── 9. Codigo QR ─────────────────────────────────────────────────────────
    if (imgQR) {
        Y += 16;

        // Contenedor del QR
        const qrContWidth = 280;
        const qrContHeight = 280;
        const qrX = (ANCHO - qrContWidth) / 2;

        RectanguloRedondeado(ctx, qrX, Y, qrContWidth, qrContHeight, RADIO);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = esActiva ? "#c7d2fe" : "#e2e8f0";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Dibujar el QR centrado dentro del contenedor
        const qrSize = 240;
        const qrDrawX = qrX + (qrContWidth - qrSize) / 2;
        const qrDrawY = Y + (qrContHeight - qrSize) / 2;

        if (!esActiva) {
            ctx.globalAlpha = 0.4;
        }
        ctx.drawImage(imgQR, qrDrawX, qrDrawY, qrSize, qrSize);
        ctx.globalAlpha = 1;

        Y += qrContHeight + 12;

        // Texto debajo del QR
        ctx.textAlign = "center";
        if (!esActiva) {
            ctx.fillStyle = "#ef4444";
            ctx.font = "bold 13px system-ui, sans-serif";
            ctx.fillText(`Este QR ya no es valido (${estadoConfig.texto})`, ANCHO / 2, Y);
        } else {
            ctx.fillStyle = "#64748b";
            ctx.font = "13px system-ui, sans-serif";
            ctx.fillText("Presenta este codigo al supervisor para registrar tu consumo", ANCHO / 2, Y);
        }
        ctx.textAlign = "left";
        Y += 20;
    }

    // ── 10. Footer ────────────────────────────────────────────────────────────
    Y += 16;
    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(0, Y, ANCHO, ALTO_FOOTER);

    const fechaGeneracion = new Date().toLocaleString("es-CO", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Generado el ${fechaGeneracion} · Foodsys`, ANCHO / 2, Y + 26);
    ctx.fillText("Documento valido solo para la fecha indicada", ANCHO / 2, Y + 42);
    ctx.textAlign = "left";

    // ── Exportar como PNG ─────────────────────────────────────────────────────
    const link = document.createElement("a");
    link.download = `ticket-reserva-${reserva.Id_Reserva}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
};