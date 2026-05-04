// ─────────────────────────────────────────────────────────────────────────────
// LoginFormulario.jsx
// Componente del formulario de inicio de sesion.
// Renderiza todos los campos de entrada, sus mensajes de error y los botones.
// No contiene logica de negocio: todo el estado y los manejadores de eventos
// son recibidos desde el componente padre (Login.jsx) a traves de props.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';

// ─── Funcion auxiliar: clases del campo segun su estado de validacion ─────────
// Determina el color del borde del input dependiendo de si fue tocado,
// si tiene errores, o si esta correcto. Evita repetir esta logica en cada campo.
const Cls_Campo = (Est_Tocado, Tex_Error) => {
  if (!Est_Tocado)    return 'border-[#2a2a2a]';    // Sin interaccion: borde oscuro
  if (Tex_Error)      return 'border-red-500';        // Con error: borde rojo
  return 'border-[#42b72a]';                          // Correcto: borde verde
};

// ─── Opciones disponibles para el selector de tipo de documento ──────────────
const Opc_TipoDocumento = [
  { Val_Opcion: 'CC',  Tex_Opcion: 'Cedula de Ciudadania'          },
  { Val_Opcion: 'CE',  Tex_Opcion: 'Cedula de Extranjeria'         },
  { Val_Opcion: 'PEP', Tex_Opcion: 'Permiso Especial de Permanencia' },
  { Val_Opcion: 'TI',  Tex_Opcion: 'Tarjeta de Identidad'          },
  { Val_Opcion: 'PPT', Tex_Opcion: 'Permiso por Proteccion Temporal' },
];

// ─── Componente reutilizable para mostrar un mensaje de error debajo del campo
const Msj_Error = ({ Tex_Error }) =>
  Tex_Error
    ? <p className="text-red-400 text-xs mt-1">{Tex_Error}</p>
    : null;

// ─── Componente principal del formulario ─────────────────────────────────────
// Props recibidas desde Login.jsx:
//   Dat_Formulario   -> objeto con los valores actuales de los campos
//   Err_Campos       -> objeto con los mensajes de error por campo
//   Est_Tocado       -> objeto que indica si cada campo fue interactuado
//   Tex_ErrorGeneral -> mensaje de error global (ej. credenciales invalidas)
//   Est_Cargando     -> booleano que controla el estado del boton de envio
//   Mst_Password     -> booleano que controla si la contrasena es visible
//   Fn_Cambio        -> manejador para el evento onChange de los campos
//   Fn_Blur          -> manejador para el evento onBlur de los campos
//   Fn_Submit        -> manejador para el evento onSubmit del formulario
//   Fn_TogglePass    -> funcion para mostrar u ocultar la contrasena
//   Ref_Formulario   -> referencia React del elemento form (para acceso directo al DOM)
const LoginFormulario = ({
  Dat_Formulario,
  Err_Campos,
  Est_Tocado,
  Tex_ErrorGeneral,
  Est_Cargando,
  Mst_Password,
  Fn_Cambio,
  Fn_Blur,
  Fn_Submit,
  Fn_TogglePass,
  Ref_Formulario,
}) => (
  /*
   * Tarjeta blanca del formulario con borde superior verde institucional.
   * Ocupa todo el ancho en moviles y un ancho fijo en pantallas grandes.
   */
  <aside className="bg-white rounded-2xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.10)] w-full lg:w-[420px] shrink-0">

    {/* Titulo y subtitulo del formulario */}
    <div className="text-center mb-6">
      <h2 className="text-[#1a1a2e] text-2xl font-extrabold">
        Iniciar sesion en{' '}
        <span className="text-[#42b72a]">Foodsys</span>
      </h2>
      <p className="text-[#888] text-sm mt-1">Todo lo bueno comienza aqui</p>
    </div>

    {/* Mensaje de error global: visible solo cuando hay un error de autenticacion */}
    {Tex_ErrorGeneral && (
      <div className="mb-5 px-4 py-3 bg-red-950/10 border border-red-400/30 text-red-500 rounded-xl text-sm flex items-center gap-2">
        <i className="fas fa-exclamation-circle"></i>
        <span>{Tex_ErrorGeneral}</span>
      </div>
    )}

    {/* Formulario: noValidate desactiva la validacion nativa del navegador */}
    <form ref={Ref_Formulario} onSubmit={Fn_Submit} noValidate className="space-y-4">

      {/* ─── Campo: Tipo de documento ─── */}
      <div>
        <label className="block text-sm font-bold text-[#1a1a2e] mb-1">
          Tipo de documento
        </label>
        <select
          name="TipDoc_Usuario"
          value={Dat_Formulario.TipDoc_Usuario}
          onChange={Fn_Cambio}
          onBlur={Fn_Blur}
          className={`w-full px-4 py-3 rounded-xl border-2 text-sm bg-[#1a1a2e] text-white focus:outline-none focus:border-[#1861c1] transition-colors ${Cls_Campo(Est_Tocado.TipDoc_Usuario, Err_Campos.TipDoc_Usuario)}`}
        >
          <option value="" className="bg-[#1a1a2e]">Seleccione su documento</option>
          {Opc_TipoDocumento.map(({ Val_Opcion, Tex_Opcion }) => (
            <option key={Val_Opcion} value={Val_Opcion} className="bg-[#1a1a2e]">
              {Tex_Opcion}
            </option>
          ))}
        </select>
        <Msj_Error Tex_Error={Est_Tocado.TipDoc_Usuario && Err_Campos.TipDoc_Usuario} />
      </div>

      {/* ─── Campo: Numero de documento ─── */}
      <div>
        <label className="block text-sm font-bold text-[#1a1a2e] mb-1">
          Numero de documento
        </label>
        <input
          name="NumDoc_Usuario"
          type="text"
          placeholder="Ej: 1234567890"
          value={Dat_Formulario.NumDoc_Usuario}
          onChange={Fn_Cambio}
          onBlur={Fn_Blur}
          className={`w-full px-4 py-3 rounded-xl border-2 text-sm bg-[#1a1a2e] text-white placeholder-gray-500 focus:outline-none focus:border-[#1861c1] transition-colors ${Cls_Campo(Est_Tocado.NumDoc_Usuario, Err_Campos.NumDoc_Usuario)}`}
        />
        <Msj_Error Tex_Error={Est_Tocado.NumDoc_Usuario && Err_Campos.NumDoc_Usuario} />
      </div>

      {/* ─── Campo: Contrasena con toggle de visibilidad ─── */}
      <div>
        <label className="block text-sm font-bold text-[#1a1a2e] mb-1">
          Contrasena
        </label>
        <div className="relative">
          <input
            name="password"
            type={Mst_Password ? 'text' : 'password'}
            placeholder="Minimo 8 caracteres"
            value={Dat_Formulario.password}
            onChange={Fn_Cambio}
            onBlur={Fn_Blur}
            className={`w-full px-4 py-3 pr-11 rounded-xl border-2 text-sm bg-[#1a1a2e] text-white placeholder-gray-500 focus:outline-none focus:border-[#1861c1] transition-colors ${Cls_Campo(Est_Tocado.password, Err_Campos.password)}`}
          />
          {/* Boton para alternar visibilidad de la contrasena */}
          <button
            type="button"
            onClick={Fn_TogglePass}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#42b72a] transition-colors"
            aria-label={Mst_Password ? 'Ocultar contrasena' : 'Mostrar contrasena'}
          >
            <i className={Mst_Password ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
          </button>
        </div>
        <Msj_Error Tex_Error={Est_Tocado.password && Err_Campos.password} />
      </div>

      {/* ─── Boton de envio ─── */}
      <button
        type="submit"
        disabled={Est_Cargando}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-[#42b72a] text-white hover:bg-[#38a024] active:scale-[0.98] disabled:opacity-60 transition-all mt-2"
      >
        {Est_Cargando ? 'Iniciando sesion...' : 'Iniciar sesion'}
        {/* Spinner de carga visible solo mientras se procesa la solicitud */}
        {Est_Cargando && (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
      </button>

      {/* Separador visual entre las dos acciones principales */}
      <div className="flex items-center gap-3 my-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">||</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

    </form>

    {/* Pie del formulario con marca institucional */}
    <p className="text-center text-[11px] text-gray-400 mt-6 tracking-widest font-semibold ">
      Centro Agropecuario La Granja &copy; {new Date().getFullYear()}
    </p>

  </aside>
);

export default LoginFormulario;