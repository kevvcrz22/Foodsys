///////////////// RESERVAS FORM //////////////////////////
// Campos BD: Id_Reserva, Fec_Reserva, Vencimiento, Est_Reserva,
//            Id_Usuario, Tipo, Tex_Qr, createdat, updatedat

import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig.js";

/* ─────────────────────────────────────────────────────────
   Devuelve la fecha de MAÑANA en formato "YYYY-MM-DD"
───────────────────────────────────────────────────────── */
const getFechaMañana = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/* ─────────────────────────────────────────────────────────
   Calcula el vencimiento (datetime-local) según tipo y fecha
   Desayuno → 07:00 | Almuerzo → 14:00 | Cena → 19:00
───────────────────────────────────────────────────────── */
const calcularVencimiento = (fechaStr, tipo) => {
  if (!fechaStr || !tipo) return "";

  const horas = { Desayuno: 7, Almuerzo: 14, Cena: 19 };
  const h = horas[tipo];
  if (h === undefined) return "";

  const fecha = new Date(`${fechaStr}T00:00:00`);
  fecha.setHours(h, 0, 0, 0);

  const pad = (n) => n.toString().padStart(2, "0");
  return (
    `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}` +
    `T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`
  );
};

/* ─────────────────────────────────────────────────────────
   Genera el texto del QR:  "nombre apellido // tipo // fecha"
   Intenta obtener el nombre desde la API; si falla, usa el
   nombre que ya tiene en estado local.
───────────────────────────────────────────────────────── */
const generarTextoQR = async (idUsuario, nomUsuario, apeUsuario, tipo, fecha) => {
  try {
    const { data } = await apiAxios.get(`/api/Usuarios/${idUsuario}`);
    const nombre = `${data.Nom_Usuario || nomUsuario} ${data.Ape_Usuario || apeUsuario}`.trim();
    return `${nombre} // ${tipo} // ${fecha}`;
  } catch {
    return `${nomUsuario} ${apeUsuario} // ${tipo} // ${fecha}`.trim();
  }
};

/* ═══════════════════════════════════════════════════════════
   COMPONENTE
═══════════════════════════════════════════════════════════ */
const ReservasForm = ({
  hideModal,
  reload,
  Edit = false,
  mostrarQR = () => {},
  usuario,
  platoSeleccionado,
  fechaInicial,
  tipoInicial,
}) => {
  /* ── Estado del formulario ── */
  const [Fec_Reserva, setFec_Reserva] = useState(fechaInicial || getFechaMañana());
  const [Vencimiento, setVencimiento] = useState("");
  const [Est_Reserva]                 = useState("Generada");
  const [Id_Usuario,  setId_Usuario]  = useState("");
  const [Nom_Usuario, setNom_Usuario] = useState("");
  const [Ape_Usuario, setApe_Usuario] = useState("");
  const [Tipo,        setTipo]        = useState(tipoInicial || "Almuerzo");
  const [Id_Plato,    setId_Plato]    = useState(platoSeleccionado || "");
  const [enviando,    setEnviando]    = useState(false);

  /* ── Cargar datos del usuario logueado ── */
  useEffect(() => {
    if (!usuario) return;
    setId_Usuario(usuario.Id_Usuario || usuario.id || usuario.Id || "");
    setNom_Usuario(usuario.Nom_Usuario || usuario.nombre || "");
    setApe_Usuario(usuario.Ape_Usuario || "");
  }, [usuario]);

  /* ── Sincronizar props externas ── */
  useEffect(() => {
    if (fechaInicial) setFec_Reserva(fechaInicial);
  }, [fechaInicial]);

  useEffect(() => {
    if (tipoInicial) setTipo(tipoInicial);
  }, [tipoInicial]);

  useEffect(() => {
    if (platoSeleccionado !== undefined) setId_Plato(platoSeleccionado || "");
  }, [platoSeleccionado]);

  /* ── Recalcular vencimiento cada vez que cambie fecha o tipo ── */
  useEffect(() => {
    setVencimiento(calcularVencimiento(Fec_Reserva, Tipo));
  }, [Fec_Reserva, Tipo]);

  /* ── Mostrar vencimiento en formato legible (dd/mm/aaaa HH:MM) ── */
  const vencimientoLegible = (() => {
    if (!Vencimiento) return "–";
    const d = new Date(Vencimiento);
    const pad = (n) => n.toString().padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();

  /* ── Submit ── */
  const gestionarForm = async (e) => {
    e.preventDefault();

    if (!Id_Plato) {
      alert("Debes seleccionar un plato antes de reservar.");
      return;
    }

    if (!Tipo) {
      alert("Selecciona el tipo de comida.");
      return;
    }

    setEnviando(true);
    try {
      /* Generar texto QR antes de crear la reserva */
      const texQR = await generarTextoQR(
        Id_Usuario, Nom_Usuario, Ape_Usuario, Tipo, Fec_Reserva
      );

      /* Payload — solo campos que existen en la BD */
      const payload = {
        Fec_Reserva,
        Vencimiento,   // formato: "YYYY-MM-DDTHH:MM" — el backend lo convierte a date
        Est_Reserva,   // "Generada"
        Tipo,
        Id_Plato,
        Id_Usuario,
        Tex_Qr: texQR,
      };

      await apiAxios.post("/api/Reservas/", payload);

      alert("¡Reserva creada correctamente!");
      reload?.();
      mostrarQR(texQR);
      setId_Plato("");
    } catch (error) {
      console.error("Error creando reserva:", error);
      alert(error?.response?.data?.message || "Error al crear la reserva.");
    } finally {
      setEnviando(false);
    }
  };

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  return (
    <form onSubmit={gestionarForm} className="space-y-4">

      {/* Vencimiento (solo lectura, formato legible) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vencimiento de la reserva
        </label>
        <div className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm">
          {vencimientoLegible}
        </div>
      </div>

      {/* Usuario (solo lectura) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Usuario
        </label>
        <div className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm">
          {Nom_Usuario} {Ape_Usuario}
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={hideModal}
          className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={enviando}
          className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors"
        >
          {enviando ? "Enviando…" : "Reservar"}
        </button>
      </div>
    </form>
  );
};

export default ReservasForm;