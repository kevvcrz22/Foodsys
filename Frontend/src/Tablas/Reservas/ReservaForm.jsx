///////////////// RESERVAS FORM //////////////////////////

import { useState, useEffect, useMemo } from "react";
import apiAxios from "../../api/axiosConfig.js";

const ReservasForm = ({
  hideModal,
  reserva,
  reload,
  Edit,
  mostrarQR = () => {},
  usuario,
  platoSeleccionado,
  fechaInicial,
  tipoInicial
}) => {

  const [Id_Reserva, setId_Reserva] = useState("");
  const [Fec_Reserva, setFec_Reserva] = useState(fechaInicial || "");
  const [Vencimiento, setVencimiento] = useState("");
  const [Est_Reserva, setEst_Reserva] = useState("Generada");
  const [Id_Usuario, setId_Usuario] = useState("");
  const [Nom_Usuario, setNom_Usuario] = useState("");
  const [Ape_Usuario, setApe_Usuario] = useState("");
  const [Tipo, setTipo] = useState(tipoInicial || "");
  const [Id_Plato, setId_Plato] = useState(platoSeleccionado || "");

  const [textFormButton, setTextFormButton] = useState("Enviar");

  /* ─────────────────────────────
     Cargar usuario logueado
  ───────────────────────────── */
  useEffect(() => {
    if (usuario) {
      const id = usuario.Id_Usuario || usuario.id || usuario.Id;
      const nombre = usuario.Nom_Usuario || usuario.nombre || "Usuario";
      const apellido = usuario.Ape_Usuario || "";

      setId_Usuario(id);
      setNom_Usuario(nombre);
      setApe_Usuario(apellido);
    }
  }, [usuario]);

  /* ─────────────────────────────
     Recibir datos del selector superior
  ───────────────────────────── */
  useEffect(() => {
    if (fechaInicial) setFec_Reserva(fechaInicial);
  }, [fechaInicial]);

  useEffect(() => {
    if (tipoInicial) setTipo(tipoInicial);
  }, [tipoInicial]);

  useEffect(() => {
    if (platoSeleccionado) setId_Plato(platoSeleccionado);
  }, [platoSeleccionado]);

  /* ─────────────────────────────
     Vencimiento automático
  ───────────────────────────── */
  useEffect(() => {
    if (Tipo && Fec_Reserva) {

      const fecha = new Date(Fec_Reserva + "T00:00:00");

      switch (Tipo) {
        case "Desayuno":
          fecha.setHours(7, 0, 0);
          break;

        case "Almuerzo":
          fecha.setHours(14, 0, 0);
          break;

        case "Cena":
          fecha.setHours(19, 0, 0);
          break;

        default:
          return;
      }

      const pad = (n) => n.toString().padStart(2, "0");

      setVencimiento(
        `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(
          fecha.getDate()
        )}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`
      );
    }
  }, [Tipo, Fec_Reserva]);

  /* ─────────────────────────────
     Datos QR
  ───────────────────────────── */
  const qrData = useMemo(
    () => ({
      fecha: Fec_Reserva || "-",
      vencimiento: Vencimiento || "-",
      estado: Est_Reserva || "-",
      tipo: Tipo || "-",
      usuario: Id_Usuario || "-"
    }),
    [Fec_Reserva, Vencimiento, Est_Reserva, Tipo, Id_Usuario]
  );

  const generarQRFinal = async () => {
    if (!Id_Usuario || !Vencimiento) return null;

    try {
      const response = await apiAxios.get(`/api/Usuarios/${Id_Usuario}`);
      const usuario = response.data;

      return `${Id_Reserva} // ${usuario.Nom_Usuario} // ${Tipo} //`;

    } catch {
      return `${Id_Reserva} // ${Nom_Usuario} // ${Tipo} //`;
    }
  };

  /* ─────────────────────────────
     Enviar formulario
  ───────────────────────────── */
  const gestionarForm = async (e) => {
    e.preventDefault();

    if (!Id_Plato) {
      alert("Debes seleccionar un plato");
      return;
    }

    try {

      const QRFinal = await generarQRFinal();

      await apiAxios.post("/api/Reservas/", {
        Fec_Reserva,
        Vencimiento,
        Est_Reserva,
        Tipo,
        Id_Plato,
        Tex_Qr: JSON.stringify(qrData),
        Id_Usuario
      });

      alert("Reserva creada correctamente");

      reload();
      mostrarQR(QRFinal);

      setId_Plato("");

    } catch (error) {

      console.error("Error creando reserva", error);

      alert(
        error?.response?.data?.message ||
        "Error creando reserva"
      );
    }
  };

  return (
    <form onSubmit={gestionarForm} className="space-y-4">

      {/* Vencimiento */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vencimiento
        </label>

        <input
          type="datetime-local"
          value={Vencimiento}
          readOnly
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
        />
      </div>

      {/* Usuario */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Usuario
        </label>

        <div className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
          {Nom_Usuario} {Ape_Usuario}
        </div>
      </div>

      {/* QR */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Código QR
        </label>

        <input
          type="text"
          readOnly
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-xs"
        />
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">

        <button
          type="button"
          onClick={hideModal}
          className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg"
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
        >
          {textFormButton}
        </button>

      </div>

    </form>
  );
};

export default ReservasForm;