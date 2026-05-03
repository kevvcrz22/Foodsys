// Paginas/Perfil/TarjetaContacto.jsx
// Tarjeta de informacion de contacto editable
// Permite actualizar correo y telefono

import { Mail, Phone } from "lucide-react";
import CampoEntrada from "./CampoEntrada";
import CabeceraTarjeta from "./CabeceraTarjeta";
import AlertaMensaje from "./AlertaMensaje";

const TarjetaContacto = ({
  Correo, Set_Correo,
  Telefono, Set_Telefono,
  Guardando, Mensaje, Guardar,
}) => (
  <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6">
    <CabeceraTarjeta Color="bg-indigo-600" Icono={Mail} Titulo="Informacion de Contacto" />
    <div className="space-y-3">
      <CampoEntrada
        Icono={Mail} Etiqueta="Correo Electronico"
        Valor={Correo} Tipo="email"
        onChange={E => Set_Correo(E.target.value)}
        Placeholder="correo@ejemplo.com"
      />
      <CampoEntrada
        Icono={Phone} Etiqueta="Telefono"
        Valor={Telefono}
        onChange={E => Set_Telefono(E.target.value)}
        Placeholder="Ej. 3247433621"
      />
      <AlertaMensaje Mensaje={Mensaje.Texto} Tipo={Mensaje.Tipo} />
      <button
        onClick={Guardar}
        disabled={Guardando}
        className={[
          "w-full py-2.5 rounded-xl text-sm font-semibold text-white border-0 transition-all duration-150",
          Guardando
            ? "bg-blue-400 cursor-wait"
            : "bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-sm",
        ].join(" ")}
      >
        {Guardando ? "Guardando..." : "Guardar Cambios"}
      </button>
    </div>
  </div>
);

export default TarjetaContacto;
