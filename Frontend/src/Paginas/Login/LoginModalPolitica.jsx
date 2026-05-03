// ─────────────────────────────────────────────────────────────────────────────
// LoginModalPolitica.jsx
// Componente modal que muestra la politica de tratamiento de datos del SENA.
// Se presenta cuando el usuario inicia sesion por primera vez y aun no ha
// aceptado la politica. Recibe dos funciones como props: una para aceptar
// y otra para rechazar la politica.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';

// ─── Contenido de la politica dividido por secciones ─────────────────────────
// Separar los datos del JSX facilita modificar el texto sin tocar la estructura.
const Sec_Politica = [
  {
    Tit_Seccion: '1. Politica de tratamiento',
    Tex_Seccion: 'El SENA se compromete a garantizar la proteccion de los derechos fundamentales referidos al buen nombre y al derecho de informacion, en el tratamiento de los datos personales capturados a traves de los sistemas digitales ubicados en las sedes del SENA, unicamente para los fines autorizados y conforme a la normatividad vigente.',
  },
  {
    Tit_Seccion: '2. Marco Legal',
    Tex_Seccion: 'Constitucion Politica Art. 15 · Ley 1581 de 2012 · Ley 1712 de 2014 · Decreto 1377 de 2013.',
  },
  {
    Tit_Seccion: '3. Responsable',
    Tex_Seccion: 'Servicio Nacional de Aprendizaje – SENA. Direccion: Calle 57 No. 8-69, Bogota D.C. PBX: (57+1) 5461500. Linea gratuita: 018000 910270. Web: www.sena.edu.co',
  },
  {
    Tit_Seccion: '4. Finalidad',
    Tex_Seccion: 'Los datos seran usados para fines administrativos propios de la entidad, caracterizacion de usuarios, gestion de servicios de bienestar y alimentacion, encuestas de satisfaccion, y conformacion de la base de datos del SENA.',
  },
  {
    Tit_Seccion: '5. Tus derechos',
    Tex_Seccion: 'Usted tiene derecho a: conocer, actualizar y rectificar sus datos personales; solicitar prueba de la autorizacion otorgada; ser informado sobre el uso dado a sus datos; presentar quejas ante la Superintendencia de Industria y Comercio; revocar la autorizacion y solicitar supresion de datos.',
  },
  {
    Tit_Seccion: '6. Reclamaciones',
    Tex_Seccion: 'Para ejercer sus derechos puede escribir a: http://sciudadanos.sena.edu.co/SolicitudIndex.aspx o dirigirse a la Coordinacion Nacional de Servicio al Cliente del SENA.',
  },
];

// ─── Componente principal del modal ──────────────────────────────────────────
// Props:
//   Fn_Aceptar  -> funcion que se ejecuta cuando el usuario acepta la politica
//   Fn_Rechazar -> funcion que se ejecuta cuando el usuario rechaza la politica
const LoginModalPolitica = ({ Fn_Aceptar, Fn_Rechazar }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

      {/* Encabezado del modal con degradado institucional */}
      <div className="bg-gradient-to-r from-[#1861c1] to-[#1a4f9e] px-6 py-5 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <i className="fas fa-shield-alt text-white text-lg"></i>
        </div>
        <div>
          <h3 className="text-white font-bold text-lg leading-tight">
            Politica de Proteccion de Datos
          </h3>
          <p className="text-blue-200 text-xs">SENA — GC-F-005 V.01</p>
        </div>
      </div>

      {/* Cuerpo con el contenido desplazable de la politica */}
      <div className="px-6 pt-4 pb-2">
        <p className="text-[#555] text-sm mb-3">
          Antes de continuar, lee y acepta nuestra politica de tratamiento de datos personales.
        </p>
        <div className="h-52 overflow-y-auto rounded-2xl bg-[#f6f8fc] border border-[#e2e8f0] p-4 text-sm text-[#444] leading-relaxed space-y-3">
          {/* Renderiza cada seccion de la politica de forma dinamica */}
          {Sec_Politica.map(({ Tit_Seccion, Tex_Seccion }) => (
            <div key={Tit_Seccion}>
              <p className="font-semibold text-[#1861c1] mb-1">{Tit_Seccion}</p>
              <p>{Tex_Seccion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pie con los botones de accion */}
      <div className="px-6 py-4 flex flex-col gap-2">
        <button
          onClick={Fn_Aceptar}
          className="w-full py-3 rounded-2xl font-semibold text-sm bg-[#42b72a] text-white hover:bg-[#38a024] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200"
        >
          <i className="fas fa-check-circle"></i>
          Acepto la politica de tratamiento de datos
        </button>
        <button
          onClick={Fn_Rechazar}
          className="w-full py-2 rounded-2xl font-medium text-sm text-[#999] hover:text-[#e74c3c] hover:bg-red-50 active:scale-95 transition-all"
        >
          No Acepto
        </button>
      </div>

    </div>
  </div>
);

export default LoginModalPolitica;