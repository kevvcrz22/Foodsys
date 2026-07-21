// ─────────────────────────────────────────────────────────────────────────────
// LoginFormulario.jsx
// Formulario de inicio de sesión con estilo Liquid Glass + Claymorfismo.
// Lógica gestionada a través de props (elevación de estado).
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { LogIn, FileText, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── Componente para Mensaje de Error ────────────────────────────────────────
const Msj_Error = ({ Tex_Error }) =>
  Tex_Error ? (
    <p className="error-texto animar-entrada">
      <AlertCircle size={14} />
      {Tex_Error}
    </p>
  ) : null;

// ─── Opciones para tipo de documento ─────────────────────────────────────────
const Opc_TipoDocumento = [
  { Val_Opcion: 'CC',  Tex_Opcion: 'Cédula de Ciudadanía' },
  { Val_Opcion: 'CE',  Tex_Opcion: 'Cédula de Extranjería' },
  { Val_Opcion: 'PEP', Tex_Opcion: 'Permiso Especial de Permanencia' },
  { Val_Opcion: 'TI',  Tex_Opcion: 'Tarjeta de Identidad' },
  { Val_Opcion: 'PPT', Tex_Opcion: 'Permiso por Protección Temporal' },
];

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
}) => {
  return (
    <aside className="tarjeta-clay w-full lg:w-[420px] shrink-0 p-8 animar-entrada">
      
      {/* ── Encabezado ── */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-primario to-primario-oscuro rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-primario/30">
          <LogIn size={28} className="text-white" />
        </div>
        <h2 className="text-2xl font-extrabold text-texto-principal">
          Iniciar sesión en <span className="texto-gradiente">Foodsys</span>
        </h2>
        <p className="text-texto-secundario text-sm mt-1">
          Gestión inteligente del comedor institucional
        </p>
      </div>

      {/* ── Error Global ── */}
      {Tex_ErrorGeneral && (
        <div className="mb-5 p-4 rounded-2xl bg-error/10 border border-error/20 flex items-center gap-3 text-error text-sm font-semibold animar-entrada">
          <AlertCircle size={18} className="shrink-0" />
          <span>{Tex_ErrorGeneral}</span>
        </div>
      )}

      {/* ── Formulario ── */}
      <form ref={Ref_Formulario} onSubmit={Fn_Submit} noValidate className="space-y-5">
        
        {/* Tipo de Documento */}
        <div>
          <label className="etiqueta-campo flex items-center gap-2">
            <FileText size={14} />
            Tipo de documento
          </label>
          <select
            name="TipDoc_Usuario"
            value={Dat_Formulario.TipDoc_Usuario}
            onChange={Fn_Cambio}
            onBlur={Fn_Blur}
            className={`campo-glass w-full ${Est_Tocado.TipDoc_Usuario && Err_Campos.TipDoc_Usuario ? 'campo-error' : ''}`}
          >
            <option value="">Seleccione su documento</option>
            {Opc_TipoDocumento.map(({ Val_Opcion, Tex_Opcion }) => (
              <option key={Val_Opcion} value={Val_Opcion}>
                {Tex_Opcion}
              </option>
            ))}
          </select>
          <Msj_Error Tex_Error={Est_Tocado.TipDoc_Usuario && Err_Campos.TipDoc_Usuario} />
        </div>

        {/* Número de Documento */}
        <div>
          <label className="etiqueta-campo">Número de documento</label>
          <input
            name="NumDoc_Usuario"
            type="text"
            placeholder="Ej: 1234567890"
            value={Dat_Formulario.NumDoc_Usuario}
            onChange={Fn_Cambio}
            onBlur={Fn_Blur}
            className={`campo-glass w-full ${Est_Tocado.NumDoc_Usuario && Err_Campos.NumDoc_Usuario ? 'campo-error' : ''}`}
          />
          <Msj_Error Tex_Error={Est_Tocado.NumDoc_Usuario && Err_Campos.NumDoc_Usuario} />
        </div>

        {/* Contraseña */}
        <div>
          <label className="etiqueta-campo flex items-center gap-2">
            <Lock size={14} />
            Contraseña
          </label>
          <div className="relative">
            <input
              name="contrasena"
              type={Mst_Password ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
              value={Dat_Formulario.contrasena}
              onChange={Fn_Cambio}
              onBlur={Fn_Blur}
              className={`campo-glass w-full pr-12 ${Est_Tocado.contrasena && Err_Campos.contrasena ? 'campo-error' : ''}`}
            />
            <button
              type="button"
              onClick={Fn_TogglePass}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-texto-secundario hover:text-primario transition-colors focus:outline-none"
              aria-label={Mst_Password ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {Mst_Password ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <Msj_Error Tex_Error={Est_Tocado.contrasena && Err_Campos.contrasena} />
        </div>

        {/* Enlace: Olvidé mi contraseña */}
        <div className="flex justify-end">
          <Link
            to="/recuperar"
            className="text-sm font-bold text-acento-oscuro hover:text-acento transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {/* Botón de Enviar */}
        <button
          type="submit"
          disabled={Est_Cargando}
          className="boton-primario w-full py-3.5 mt-2 text-[0.95rem]"
        >
          {Est_Cargando ? (
            <>
              <div className="spinner" />
              Verificando...
            </>
          ) : (
            'Iniciar sesión'
          )}
        </button>

      </form>

      {/* ── Pie Institucional ── */}
      <div className="mt-8 text-center">
        <p className="text-xs font-semibold tracking-widest text-texto-secundario/60 uppercase">
          Centro Agropecuario La Granja © {new Date().getFullYear()}
        </p>
      </div>

    </aside>
  );
};

export default LoginFormulario;