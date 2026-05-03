// Paginas/Perfil/AlertaMensaje.jsx
// Mensaje de retroalimentacion con estilo segun tipo
// Tipo "exito" = verde, Tipo "error" = rojo

const AlertaMensaje = ({ Mensaje, Tipo }) => {
  if (!Mensaje) return null;
  return (
    <p
      className={[
        "text-xs px-3 py-2 rounded-lg border",
        Tipo === "exito"
          ? "bg-green-50 border-green-200 text-green-700"
          : "bg-red-50 border-red-200 text-red-700",
      ].join(" ")}
    >
      {Mensaje}
    </p>
  );
};

export default AlertaMensaje;
