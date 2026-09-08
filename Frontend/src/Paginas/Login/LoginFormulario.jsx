// ─────────────────────────────────────────────────────────────────────────────
// LoginFormulario.jsx
// Formulario de inicio de sesión con diseño moderno estilo Enterprise.
// Limpio, sin fondos oscuros ni colores estridentes en la tipografía,
// manteniendo intacta la lógica de validación y eventos.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Lock, User, FileText } from 'lucide-react';
import logoFoodsys from '../../Components/Img/LogoFoodsys.png';

// ─── Función auxiliar: estados del borde según validación ────────────────────
const Cls_Campo = (Est_Tocado, Tex_Error) => {
  if (!Est_Tocado) return 'border-slate-300 focus:border-[#2E5792] focus:ring-2 focus:ring-[#2E5792]/15';
  if (Tex_Error) return 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-red-50/20';
  return 'border-slate-300 focus:border-[#2E5792] focus:ring-2 focus:ring-[#2E5792]/15';
};

// ─── Opciones de tipos de documento ──────────────────────────────────────────
const Opc_TipoDocumento = [
  { Val_Opcion: 'CC', Tex_Opcion: 'Cédula de Ciudadanía' },
  { Val_Opcion: 'CE', Tex_Opcion: 'Cédula de Extranjería' },
  { Val_Opcion: 'PEP', Tex_Opcion: 'Permiso Especial de Permanencia' },
  { Val_Opcion: 'TI', Tex_Opcion: 'Tarjeta de Identidad' },
  { Val_Opcion: 'PPT', Tex_Opcion: 'Permiso por Protección Temporal' },
];

// ─── Mensaje de error por campo ──────────────────────────────────────────────
const Msj_Error = ({ Tex_Error }) =>
  Tex_Error ? (
    <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1">
      <span>•</span> {Tex_Error}
    </p>
  ) : null;

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
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 w-full">
    {/* Encabezado del Formulario */}
    <div className="text-center mb-6">
      <div className="flex justify-center mb-3">
        <img
          src={logoFoodsys}
          alt="Logo Foodsys"
          className="h-14 sm:h-16 w-auto object-contain"
        />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
        Iniciar sesión
      </h2>
      <p className="text-xs sm:text-sm text-slate-500 mt-1">
        Ingresa tus credenciales para acceder a Foodsys
      </p>
    </div>

    {/* Mensaje de Error General */}
    {Tex_ErrorGeneral && (
      <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
        <AlertCircle size={17} className="text-red-600 shrink-0 mt-0.5" />
        <span className="leading-snug">{Tex_ErrorGeneral}</span>
      </div>
    )}

    {/* Formulario */}
    <form ref={Ref_Formulario} onSubmit={Fn_Submit} noValidate className="space-y-4">
      {/* Tipo de Documento */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Tipo de documento
        </label>
        <div className="relative">
          <select
            name="TipDoc_Usuario"
            value={Dat_Formulario.TipDoc_Usuario}
            onChange={Fn_Cambio}
            onBlur={Fn_Blur}
            className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white text-slate-900 outline-none transition-all cursor-pointer ${Cls_Campo(
              Est_Tocado.TipDoc_Usuario,
              Err_Campos.TipDoc_Usuario
            )}`}
          >
            <option value="" className="text-slate-400">
              Seleccione su tipo de documento
            </option>
            {Opc_TipoDocumento.map(({ Val_Opcion, Tex_Opcion }) => (
              <option key={Val_Opcion} value={Val_Opcion} className="text-slate-900">
                {Tex_Opcion}
              </option>
            ))}
          </select>
        </div>
        <Msj_Error Tex_Error={Est_Tocado.TipDoc_Usuario && Err_Campos.TipDoc_Usuario} />
      </div>

      {/* Número de Documento */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Número de documento
        </label>
        <div className="relative">
          <input
            name="NumDoc_Usuario"
            type="text"
            placeholder="Ej: 1234567890"
            value={Dat_Formulario.NumDoc_Usuario}
            onChange={Fn_Cambio}
            onBlur={Fn_Blur}
            className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white text-slate-900 placeholder:text-slate-400 outline-none transition-all ${Cls_Campo(
              Est_Tocado.NumDoc_Usuario,
              Err_Campos.NumDoc_Usuario
            )}`}
          />
        </div>
        <Msj_Error Tex_Error={Est_Tocado.NumDoc_Usuario && Err_Campos.NumDoc_Usuario} />
      </div>

      {/* Contraseña */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Contraseña
        </label>
        <div className="relative">
          <input
            name="contraseña"
            type={Mst_Password ? 'text' : 'password'}
            placeholder="Ingresa tu contraseña"
            value={Dat_Formulario.contraseña}
            onChange={Fn_Cambio}
            onBlur={Fn_Blur}
            className={`w-full px-3.5 py-2.5 pr-10 rounded-lg border text-sm bg-white text-slate-900 placeholder:text-slate-400 outline-none transition-all ${Cls_Campo(
              Est_Tocado.contraseña,
              Err_Campos.contraseña
            )}`}
          />
          <button
            type="button"
            onClick={Fn_TogglePass}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
            aria-label={Mst_Password ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {Mst_Password ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <Msj_Error Tex_Error={Est_Tocado.contraseña && Err_Campos.contraseña} />
      </div>

      {/* Botón Iniciar Sesión */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={Est_Cargando}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm bg-green-600 hover:bg-green-700 text-white shadow-xs disabled:opacity-60 transition-colors cursor-pointer"
        >
          {Est_Cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
          {Est_Cargando && (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
        </button>
      </div>

      {/* Enlaces de Navegación y Recuperación */}
      <div className="flex justify-between items-center text-xs pt-2">
        <Link
          to="/"
          className="text-slate-500 hover:text-slate-800 font-medium transition-colors"
        >
          ← Volver al inicio
        </Link>
        <Link
          to="/forgotPassword"
          className="text-slate-600 hover:text-slate-900 font-medium hover:underline transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
    </form>
  </div>
);

export default LoginFormulario;