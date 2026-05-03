import { useState, useEffect, useCallback, useRef } from "react";
import apiAxios from "../../api/axiosConfig";

const horaActual = () =>
  new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

const fechaHoy = () => new Date().toISOString().split("T")[0];

export function useCanceladas() {
  const [reservasCanceladas, setReservasCanceladas] = useState(0);
  const [cancelFlash, setCancelFlash] = useState(false);
  const [horaDisplay, setHoraDisplay] = useState(horaActual());
  const prevCanceladasRef = useRef(0);

  /* Reloj en tiempo real */
  useEffect(() => {
    const t = setInterval(() => setHoraDisplay(horaActual()), 30_000);
    return () => clearInterval(t);
  }, []);

  /* Polling canceladas filtradas por hoy */
  const fetchCanceladas = useCallback(async () => {
    try {
      const { data } = await apiAxios.get("/api/Reservas/canceladas/count", {
        params: { fecha: fechaHoy() },
      });
      const nuevo = data.total ?? 0;
      if (nuevo > prevCanceladasRef.current) {
        setCancelFlash(true);
        setTimeout(() => setCancelFlash(false), 800);
      }
      prevCanceladasRef.current = nuevo;
      setReservasCanceladas(nuevo);
    } catch {
      /* silencioso */
    }
  }, []);

  useEffect(() => {
    fetchCanceladas();
    const iv = setInterval(fetchCanceladas, 10_000);
    return () => clearInterval(iv);
  }, [fetchCanceladas]);

  return { reservasCanceladas, cancelFlash, horaDisplay };
}