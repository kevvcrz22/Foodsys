// ─────────────────────────────────────────────────────────────────────────────
// LoginModalPolitica.jsx
// Modal corporativo institucional para la aceptación de política de tratamiento
// de datos personales según la Ley 1581 de 2012 del SENA.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { ShieldCheck, Check, X, AlertCircle, ExternalLink } from 'lucide-react';

const Sec_Politica = [
  {
    num: '01',
    Tit_Seccion: 'Política de Tratamiento',
    Tex_Seccion: (
      <span>
        El SENA se compromete a garantizar la protección de los derechos fundamentales referidos al buen nombre y al derecho de información, en el tratamiento de los datos personales capturados a través de los sistemas digitales ubicados en las sedes del SENA, únicamente para los fines autorizados y conforme a la normatividad vigente.
      </span>
    ),
  },
  {
    num: '02',
    Tit_Seccion: 'Marco Legal',
    Tex_Seccion: (
      <span>
        Constitución Política Art. 15 · Ley Estatutaria 1581 de 2012 · Ley 1712 de 2014 · Decreto Reglamentario 1377 de 2013.
      </span>
    ),
  },
  {
    num: '03',
    Tit_Seccion: 'Responsable del Tratamiento',
    Tex_Seccion: (
      <span>
        Servicio Nacional de Aprendizaje – SENA. Dirección general: Calle 57 No. 8-69, Bogotá D.C. PBX: (57+1) 5461500 · Línea gratuita nacional: 018000 910270 · Portal web:{' '}
        <a
          href="https://www.sena.edu.co"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 font-medium underline inline-flex items-center gap-1"
        >
          www.sena.edu.co
          <ExternalLink size={12} className="inline" />
        </a>
      </span>
    ),
  },
  {
    num: '04',
    Tit_Seccion: 'Finalidades del Uso de Datos',
    Tex_Seccion: (
      <span>
        Los datos serán tratados con propósitos administrativos institucionales, identificación y caracterización de usuarios, control de acceso y gestión de servicios de bienestar y alimentación (FoodSys), encuestas de satisfacción y conformación del registro general del SENA.
      </span>
    ),
  },
  {
    num: '05',
    Tit_Seccion: 'Derechos del Titular',
    Tex_Seccion: (
      <span>
        Usted tiene derecho a conocer, actualizar y rectificar sus datos personales; solicitar prueba de la autorización otorgada; ser informado sobre el uso dado a sus datos; presentar quejas ante la Superintendencia de Industria y Comercio; y revocar la autorización o solicitar la supresión de datos.
      </span>
    ),
  },
  {
    num: '06',
    Tit_Seccion: 'Canales de Atención y Reclamaciones',
    Tex_Seccion: (
      <span>
        Para ejercer sus derechos de hábeas data puede ingresar a:{' '}
        <a
          href="http://sciudadanos.sena.edu.co"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 font-medium underline inline-flex items-center gap-1"
        >
          sciudadanos.sena.edu.co
          <ExternalLink size={12} className="inline" />
        </a>{' '}
        o dirigirse formalmente a la Coordinación Nacional de Servicio al Cliente del SENA.
      </span>
    ),
  },
];

const LoginModalPolitica = ({ Fn_Aceptar, Fn_Rechazar }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6">
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

      {/* ── Encabezado Institucional ── */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-[#1861c1]">
            <ShieldCheck size={20} className="text-[#1861c1]" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
            Tratamiento de Datos Personales
          </h3>
        </div>
        <button
          type="button"
          onClick={Fn_Rechazar}
          aria-label="Cerrar modal"
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Aviso Informativo ── */}
      <div className="px-5 pt-3.5 pb-1">
        <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100/80 text-blue-900 text-xs flex items-center gap-2 leading-relaxed">
          <AlertCircle size={15} className="text-blue-600 shrink-0" />
          <span>
            Autoriza el tratamiento de tus datos personales para continuar en <strong>FoodSys</strong>.
          </span>
        </div>
      </div>

      {/* ── Cuerpo con scroll de las secciones ── */}
      <div className="px-6 py-3 flex-1 overflow-y-auto">
        <div className="divide-y divide-slate-100 border border-slate-200/70 rounded-xl bg-slate-50/40 p-1 text-slate-700">
          {Sec_Politica.map(({ num, Tit_Seccion, Tex_Seccion }) => (
            <div key={Tit_Seccion} className="p-3.5 first:pt-3 last:pb-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-blue-100/70 text-blue-700">
                  {num}
                </span>
                <h4 className="text-xs font-semibold text-slate-900">
                  {Tit_Seccion}
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-6">
                {Tex_Seccion}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pie con Acciones ── */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/40 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={Fn_Rechazar}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50/70 border border-slate-200 hover:border-red-200 transition-colors cursor-pointer"
        >
          No Acepto
        </button>
        <button
          type="button"
          onClick={Fn_Aceptar}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-green-600 hover:bg-green-700 shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Check size={16} />
          <span>Acepto la política de datos</span>
        </button>
      </div>

    </div>
  </div>
);

export default LoginModalPolitica;