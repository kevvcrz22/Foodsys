import { useState, useCallback, useRef } from "react";
import apiAxios from "../../api/axiosConfig";

const horaActual = () =>
  new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

export const ESTADO_IDLE = "idle";
export const ESTADO_OK   = "ok";
export const ESTADO_ERR  = "error";

export function useRegistro() {
  const procesandoRef = useRef(false);

  const [estadoEscaneo, setEstadoEscaneo] = useState(ESTADO_IDLE);
  const [mensajeEstado, setMensajeEstado] = useState("");
  const [ultimoRegistro, setUltimoRegistro] = useState(null);
  const [registros, setRegistros] = useState([]);

  const [documentoManual, setDocumentoManual] = useState("");
  const [cargandoManual, setCargandoManual] = useState(false);

  /* ── Feedback visual ── */
  const mostrarOk = useCallback((reservaData) => {
    const { usuario, Tipo } = reservaData;
    const nombre = `${usuario?.Nom_Usuario ?? ""} ${usuario?.Ape_Usuario ?? ""}`.trim();
    const doc    = usuario?.NumDoc_Usuario ?? "—";
    const hora   = horaActual();

    const reg = { nombre, doc, tipo: Tipo, hora };
    setRegistros((prev) => [reg, ...prev]);
    setUltimoRegistro(reg);
    setEstadoEscaneo(ESTADO_OK);
    setMensajeEstado(`${nombre} · ${Tipo}`);
    setTimeout(() => {
      setEstadoEscaneo(ESTADO_IDLE);
      setMensajeEstado("");
      setUltimoRegistro(null);
    }, 4000);
  }, []);

  const mostrarError = useCallback((msg) => {
    setEstadoEscaneo(ESTADO_ERR);
    setMensajeEstado(msg);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    setTimeout(() => {
      setEstadoEscaneo(ESTADO_IDLE);
      setMensajeEstado("");
    }, 4000);
  }, []);

  /* ── Procesar QR ── */
  const procesarQR = useCallback(async (textoQR) => {
    if (procesandoRef.current) return;
    procesandoRef.current = true;
    try {
      const { data } = await apiAxios.post("/api/Reservas/escanear", { textoQR });
      if (data.valido) {
        mostrarOk(data.reserva);
      } else {
        mostrarError(data.message ?? "Código inválido");
      }
    } catch (err) {
      mostrarError(err?.response?.data?.message ?? "Error al procesar el código QR");
    } finally {
      setTimeout(() => { procesandoRef.current = false; }, 3000);
    }
  }, [mostrarOk, mostrarError]);

  /* ── Procesar documento manual ── */
  const procesarDocumento = useCallback(async () => {
    const doc = documentoManual.trim();
    if (!doc) return;
    setCargandoManual(true);
    try {
      const { data } = await apiAxios.get(`/api/Reservas/documento/${encodeURIComponent(doc)}`);
      if (data.valido) {
        mostrarOk(data.reserva);
        setDocumentoManual("");
      } else {
        mostrarError(data.message ?? "No se encontró reserva activa");
      }
    } catch (err) {
      mostrarError(
        err?.response?.data?.message ?? "No se encontró reserva activa para este documento"
      );
    } finally {
      setCargandoManual(false);
    }
  }, [documentoManual, mostrarOk, mostrarError]);

  return {
    estadoEscaneo,
    mensajeEstado,
    ultimoRegistro,
    registros,
    documentoManual,
    setDocumentoManual,
    cargandoManual,
    procesarQR,
    procesarDocumento,
    mostrarError,
  };
}