// Paginas/Perfil/TarjetaSeguridad.jsx
// Tarjeta de cambio de contrasena con flujo de 3 pasos
// Paso 1: verificar actual, Paso 2: nueva, Paso 3: exito

import { Lock, CheckCircle } from "lucide-react";
import CampoContrasena from "./CampoContrasena";
import CabeceraTarjeta from "./CabeceraTarjeta";
import AlertaMensaje from "./AlertaMensaje";

// Configuracion de pasos del indicador de progreso
const CONFIG_PASOS = [
  { Numero: 1, Titulo: "Verificar" },
  { Numero: 2, Titulo: "Nueva clave" },
  { Numero: 3, Titulo: "Completado" },
];

// Indicador visual del paso actual
const IndicadorPasos = ({ Paso_Actual }) => (
  <div className="flex items-center gap-1.5 mb-5">
    {CONFIG_PASOS.map(({ Numero, Titulo }, Idx) => {
      const Es_Activo = Paso_Actual === Numero;
      const Es_Completado = Paso_Actual > Numero;
      return (
        <div key={Numero} className="flex items-center gap-1.5">
          <div className={[
            "w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-all duration-200",
            Es_Completado ? "bg-green-500 text-white" : Es_Activo ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400",
          ].join(" ")}>
            {Es_Completado ? <CheckCircle size={12} /> : Numero}
          </div>
          <span className={["text-[11px] font-medium hidden sm:block", Es_Activo ? "text-blue-600" : "text-slate-400"].join(" ")}>
            {Titulo}
          </span>
          {Idx < 2 && <div className="w-5 h-px bg-slate-200 mx-0.5" />}
        </div>
      );
    })}
  </div>
);

const TarjetaSeguridad = ({
  Paso, Guardando, Mensaje,
  Contrasena_Actual, Set_ContrasenaActual,
  Contrasena_Nueva, Set_ContrasenaNueva,
  Contrasena_Confirmar, Set_ContrasenaConfirmar,
  Vis_Actual, Toggle_VisActual,
  Vis_Nueva, Toggle_VisNueva,
  Vis_Confirmar, Toggle_VisConfirmar,
  Validar, Guardar, Reiniciar,
}) => (
  <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6">
    <CabeceraTarjeta Color="bg-slate-700" Icono={Lock} Titulo="Seguridad" />
    <IndicadorPasos Paso_Actual={Paso} />
    <div className="space-y-3">
      {Paso === 1 && (<>
        <CampoContrasena Etiqueta="Contrasena Actual" Valor={Contrasena_Actual} onChange={E => Set_ContrasenaActual(E.target.value)} Visible={Vis_Actual} OnToggle={Toggle_VisActual} Placeholder="Ingrese su contrasena actual" />
        <AlertaMensaje Mensaje={Mensaje.Texto} Tipo={Mensaje.Tipo} />
        <button onClick={Validar} disabled={Guardando} className={["w-full py-2.5 rounded-xl text-sm font-semibold text-white border-0 transition-all duration-150", Guardando ? "bg-slate-400 cursor-wait" : "bg-slate-700 hover:bg-slate-800 cursor-pointer"].join(" ")}>
          {Guardando ? "Verificando..." : "Verificar Contrasena"}
        </button>
      </>)}
      {Paso === 2 && (<>
        <CampoContrasena Etiqueta="Nueva Contrasena" Valor={Contrasena_Nueva} onChange={E => Set_ContrasenaNueva(E.target.value)} Visible={Vis_Nueva} OnToggle={Toggle_VisNueva} Placeholder="Minimo 8 caracteres" />
        <CampoContrasena Etiqueta="Confirmar Contrasena" Valor={Contrasena_Confirmar} onChange={E => Set_ContrasenaConfirmar(E.target.value)} Visible={Vis_Confirmar} OnToggle={Toggle_VisConfirmar} Placeholder="Repita la nueva contrasena" />
        <AlertaMensaje Mensaje={Mensaje.Texto} Tipo={Mensaje.Tipo} />
        <div className="flex gap-2 pt-1">
          <button onClick={Reiniciar} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all duration-150">Cancelar</button>
          <button onClick={Guardar} disabled={Guardando} className={["flex-[2] py-2.5 rounded-xl text-sm font-semibold text-white border-0 transition-all duration-150", Guardando ? "bg-slate-400 cursor-wait" : "bg-slate-700 hover:bg-slate-800 cursor-pointer"].join(" ")}>
            {Guardando ? "Guardando..." : "Guardar Contrasena"}
          </button>
        </div>
      </>)}
      {Paso === 3 && (
        <div className="text-center py-5">
          <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">Contrasena Actualizada</p>
          <p className="text-xs text-slate-500 mb-4">La contrasena fue cambiada correctamente</p>
          <button onClick={Reiniciar} className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer bg-transparent border-0 underline transition-colors">Cambiar nuevamente</button>
        </div>
      )}
    </div>
  </div>
);

export default TarjetaSeguridad;
