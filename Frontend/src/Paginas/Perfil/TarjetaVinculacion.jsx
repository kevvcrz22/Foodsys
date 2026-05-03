// Paginas/Perfil/TarjetaVinculacion.jsx
// Tarjeta de datos de vinculacion para aprendices
// Solo visible para roles de aprendiz o pasante

import { BookOpen, Building2, Shield } from "lucide-react";
import CampoEntrada from "./CampoEntrada";
import CabeceraTarjeta from "./CabeceraTarjeta";

const TarjetaVinculacion = ({ Usuario }) => (
  <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6">
    <CabeceraTarjeta
      Color="bg-violet-600"
      Icono={BookOpen}
      Titulo="Datos de Vinculacion"
    />
    <div className="space-y-3">
      <CampoEntrada
        Icono={Building2}
        Etiqueta="Centro de Convivencia"
        Valor={Usuario.CenCon_Usuario === "Si" ? "Si" : "No"}
        Deshabilitado
      />
      <CampoEntrada
        Icono={Shield}
        Etiqueta="Estado del Usuario"
        Valor={Usuario.Est_Usuario || "Sin estado registrado"}
        Deshabilitado
      />
    </div>
  </div>
);

export default TarjetaVinculacion;
