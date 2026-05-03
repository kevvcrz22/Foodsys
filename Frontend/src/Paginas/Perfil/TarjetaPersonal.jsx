// Paginas/Perfil/TarjetaPersonal.jsx
// Tarjeta de informacion personal del usuario
// Todos los campos son de solo lectura

import { User, CreditCard } from "lucide-react";
import CampoEntrada from "./CampoEntrada";
import CabeceraTarjeta from "./CabeceraTarjeta";

const TarjetaPersonal = ({ Usuario }) => {
  // Convierte el codigo de genero a texto legible
  const Texto_Genero =
    Usuario.Gen_Usuario === "M"
      ? "Masculino"
      : Usuario.Gen_Usuario === "F"
        ? "Femenino"
        : "Prefiero no decirlo";

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6">
      <CabeceraTarjeta Color="bg-blue-600" Icono={User} Titulo="Informacion Personal" />
      <div className="space-y-3">
        <CampoEntrada Icono={User} Etiqueta="Nombres" Valor={Usuario.Nom_Usuario || ""} Deshabilitado />
        <CampoEntrada Icono={User} Etiqueta="Apellidos" Valor={Usuario.Ape_Usuario || ""} Deshabilitado />
        <div className="grid grid-cols-2 gap-3">
          <CampoEntrada Icono={CreditCard} Etiqueta="Tipo Doc." Valor={Usuario.TipDoc_Usuario || ""} Deshabilitado />
          <CampoEntrada Icono={CreditCard} Etiqueta="Num. Doc." Valor={String(Usuario.NumDoc_Usuario || "")} Deshabilitado />
        </div>
        <CampoEntrada Icono={User} Etiqueta="Genero" Valor={Texto_Genero} Deshabilitado />
      </div>
    </div>
  );
};

export default TarjetaPersonal;
